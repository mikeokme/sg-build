'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Trash2, Loader2, Eye, Wallet, Clock, CheckCircle2, XCircle, FileText } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, canViewField, canEditField, getCurrentRole } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const STATUS_STYLE: Record<string, string> = {
  待审批: 'bg-amber-100 text-amber-700 border-amber-200',
  已批准: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  已驳回: 'bg-red-100 text-red-700 border-red-200',
  已执行: 'bg-blue-100 text-blue-700 border-blue-200',
  已归还: 'bg-slate-100 text-slate-600 border-slate-200',
  履约中: 'bg-blue-100 text-blue-700 border-blue-200',
  编制中: 'bg-amber-100 text-amber-700 border-amber-200',
  已审定: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  已封顶: 'bg-purple-100 text-purple-700 border-purple-200',
  办理中: 'bg-sky-100 text-sky-700 border-sky-200',
  已完成: 'bg-emerald-100 text-emerald-700 border-emerald-200',
};

const DEFAULTS: Record<string, { title: string; amountLabel: string; unit?: string }> = {
  plans: { title: '物资需用计划', amountLabel: '数量' },
  budgets: { title: '施工预算', amountLabel: '预算金额' },
  rentalPlans: { title: '设备租赁计划', amountLabel: '数量' },
  subcontractPlans: { title: '分包计划', amountLabel: '分包金额' },
  changes: { title: '变更签证', amountLabel: '变更金额' },
  completions: { title: '竣工结算', amountLabel: '结算金额' },
};

function fmtMoney(v: number | string): string {
  const n = Number(v);
  if (!n) return '-';
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function EngineeringModulePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const meta = DEFAULTS[feature.collection] || { title: feature.title, amountLabel: '金额' };

  const statusField = feature.fields.find((f) => f.key === 'status');
  const amountField = feature.fields.find((f) => f.key === 'amount' || f.key === 'settleAmount');
  const quantityField = feature.fields.find((f) => f.key === 'quantity');
  const statusOptions = statusField?.options?.map((o) => o.value) || [];

  const visibleFields = useMemo(
    () => feature.fields.filter((f) => canViewField(feature.collection, f.key, role)),
    [feature, role],
  );
  const isFieldEditable = (f: (typeof feature.fields)[0]) =>
    canEditField(feature.collection, f.key, allowEdit, role);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature.collection]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== '全部') list = list.filter((it) => it.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [items, search, statusFilter]);

  const statusCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of items) map.set(it.status || '未设置', (map.get(it.status || '未设置') || 0) + 1);
    return map;
  }, [items]);

  const pendingCount = statusOptions.includes('待审批')
    ? items.filter((it) => it.status === '待审批').length
    : statusOptions.includes('编制中')
      ? items.filter((it) => it.status === '编制中').length
      : 0;
  const doneCount = statusOptions.includes('已完成')
    ? items.filter((it) => it.status === '已完成').length
    : statusOptions.includes('已执行')
      ? items.filter((it) => it.status === '已执行').length
      : 0;
  const totalAmount = items.reduce((s, it) => s + (Number(it[amountField?.key || 'amount']) || 0), 0);

  const summaryCards = [
    { icon: FileText, label: '记录总数', value: items.length, tone: 'blue' },
    { icon: Clock, label: '待办', value: pendingCount, tone: 'amber' },
    { icon: CheckCircle2, label: '已完成', value: doneCount, tone: 'emerald' },
    { icon: Wallet, label: meta.amountLabel, value: fmtMoney(totalAmount), tone: 'purple' },
  ];

  const openCreate = () => {
    setEditing(null);
    const form: Record<string, any> = {};
    for (const f of visibleFields) form[f.key] = f.type === 'number' ? 0 : '';
    setForm(form);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of visibleFields) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
    setForm(next);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/collections/${feature.collection}${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`确认删除「${Object.values(item)[1] || item.id}」吗？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const renderValue = (item: any, key: string) => {
    const field = feature.fields.find((f) => f.key === key);
    const v = item[key];
    if (v === undefined || v === null || v === '') return <span className="text-gray-400">-</span>;
    if (field?.type === 'select') {
      const s = STATUS_STYLE[v] || 'bg-gray-100 text-gray-600 border-gray-200';
      return <Badge variant="outline" className={`${s} border-0 text-xs`}>{v}</Badge>;
    }
    if (field?.type === 'number') {
      const n = Number(v);
      if (key === 'amount' || key === 'settleAmount') return <span className="tabular-nums font-medium">{fmtMoney(n)}</span>;
      return <span className="tabular-nums">{n.toLocaleString()}</span>;
    }
    return <span className="truncate max-w-[220px] inline-block align-bottom">{String(v)}</span>;
  };

  const toneCls: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
          <p className="text-sm text-gray-500 mt-1">{meta.title}业务管理</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新增</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />只读</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {summaryCards.map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${toneCls[s.tone]}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-lg font-bold text-gray-900 truncate">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">{feature.title}列表</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              全部{items.length ? ` (${items.length})` : ''}
            </button>
            {statusOptions.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                {s}{statusCount.get(s) ? ` (${statusCount.get(s)})` : ''}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>暂无数据</p>
              {allowCreate && <p className="text-sm mt-1">点击右上角「新增」添加第一条记录</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleFields.map((f) => <TableHead key={f.key}>{f.label}</TableHead>)}
                  <TableHead className="w-20 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    {visibleFields.map((f) => <TableCell key={f.key}>{renderValue(item, f.key)}</TableCell>)}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)} title="编辑"><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                        {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item)} title="删除"><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                        {!allowEdit && !allowDelete && <span className="text-xs text-gray-300">-</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑' : '新增'}{feature.title}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {visibleFields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    disabled={!isFieldEditable(f)}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    disabled={!isFieldEditable(f)}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="mt-1"
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    disabled={!isFieldEditable(f)}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    placeholder={`请输入${f.label}`}
                  />
                )}
                {!isFieldEditable(f) && <span className="text-[10px] text-gray-400 mt-0.5 block">不可编辑（权限不足）</span>}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? '保存修改' : '确认新增'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}