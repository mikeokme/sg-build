'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Trash2, Loader2, Eye, FileText, CheckCircle2, XCircle, Clock, Check } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, canApprove, getCurrentRole } from '@/config/roles';
import { useProjectFilter, useCurrentProject } from '@/context/ProjectContext';

const API_BASE = 'http://localhost:3000';

const STATUS_STYLE: Record<string, string> = {
  草稿: 'bg-slate-100 text-slate-600 border-slate-200',
  待审批: 'bg-amber-100 text-amber-700 border-amber-200',
  已批准: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  已驳回: 'bg-red-100 text-red-700 border-red-200',
};

function fmtMoney(v: number | string): string {
  const n = Number(v);
  if (!n) return '-';
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function ProcurementPlanPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
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
  const allowApprove = canApprove(role);
  const matchesProject = useProjectFilter(categoryKey);
  const currentProject = useCurrentProject(categoryKey);

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

  const scopedItems = useMemo(() => items.filter(matchesProject), [items, matchesProject]);

  const filtered = useMemo(() => {
    let list = scopedItems;
    if (statusFilter !== '全部') list = list.filter((it) => it.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [scopedItems, search, statusFilter]);

  const statusOptions = ['草稿', '待审批', '已批准', '已驳回'];
  const statusCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of scopedItems) map.set(it.status || '未设置', (map.get(it.status || '未设置') || 0) + 1);
    return map;
  }, [scopedItems]);

  const totalBudget = scopedItems.reduce((s, it) => s + (Number(it.budget) || 0), 0);
  const pendingCount = scopedItems.filter((it) => it.status === '待审批').length;
  const approvedCount = scopedItems.filter((it) => it.status === '已批准').length;
  const totalQty = scopedItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);

  const summaryCards = [
    { icon: FileText, label: '计划总数', value: scopedItems.length, tone: 'blue' },
    { icon: Clock, label: '待审批', value: pendingCount, tone: 'amber' },
    { icon: CheckCircle2, label: '已批准', value: approvedCount, tone: 'emerald' },
    { icon: Check, label: '预算总额', value: fmtMoney(totalBudget), tone: 'purple' },
  ];

  const openCreate = () => {
    setEditing(null);
    setForm({ status: '草稿', quantity: 0, budget: 0 });
    for (const f of feature.fields) if (f.type === 'number') setForm((prev) => ({ ...prev, [f.key]: 0 }));
    setForm((prev) => ({ ...prev, status: '草稿' }));
    if (currentProject && feature.fields.some((f) => f.key === 'project')) {
      setForm((prev) => ({ ...prev, project: currentProject.name }));
    }
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of feature.fields) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
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
    if (!confirm(`确认删除计划「${item.name || item.id}」吗？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const handleApprove = async (item: any, status: string) => {
    if (!confirm(`确认将「${item.name || item.id}」标记为${status}？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, status }),
    });
    fetchItems();
  };

  const toneCls: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50', amber: 'text-amber-600 bg-amber-50',
    emerald: 'text-emerald-600 bg-emerald-50', purple: 'text-purple-600 bg-purple-50',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
          <p className="text-sm text-gray-500 mt-1">依据需用计划编制 · 审批后转采购订单</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />编制计划</Button>
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
          <CardTitle className="text-base font-semibold">采购计划列表</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              全部{scopedItems.length ? ` (${scopedItems.length})` : ''}
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
            <Input placeholder="搜索计划..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>暂无采购计划</p>
              {allowCreate && <p className="text-sm mt-1">点击右上角「编制计划」创建</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-900 truncate">{it.name}</p>
                      <Badge variant="outline" className={`${STATUS_STYLE[it.status] || ''} text-[10px] px-1.5 py-0 border-0`}>{it.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {it.project} · {it.material}{it.spec ? ` ${it.spec}` : ''} · {it.quantity}{it.unit} · {it.planDate || '-'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900 tabular-nums">{fmtMoney(it.budget)}</p>
                    <p className="text-[10px] text-gray-400">{it.owner || '-'}</p>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {allowEdit && it.status !== '已批准' && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title="编辑"><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                    {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title="删除"><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                    {allowApprove && it.status === '待审批' && (
                      <>
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(it, '已批准')} className="text-emerald-600 text-xs h-8 px-2">
                          <CheckCircle2 className="w-3.5 h-3.5 mr-1" />批准
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleApprove(it, '已驳回')} className="text-red-500 text-xs h-8 px-2">
                          <XCircle className="w-3.5 h-3.5 mr-1" />驳回
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑' : '编制'}采购计划</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {feature.fields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">请选择</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="mt-1"
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    placeholder={`请输入${f.label}`}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? '保存修改' : '确认提交'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}