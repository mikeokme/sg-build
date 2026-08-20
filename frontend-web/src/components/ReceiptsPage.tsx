'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, Eye, Truck, CheckCircle2, XCircle, MinusCircle, ClipboardCheck } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const STATUS_STYLE: Record<string, string> = {
  待验收: 'bg-amber-100 text-amber-700 border-amber-200',
  验收合格: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  部分合格: 'bg-orange-100 text-orange-700 border-orange-200',
  拒收: 'bg-red-100 text-red-700 border-red-200',
};

export function ReceiptsPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('全部');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);

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
    if (statusFilter === '全部') return items;
    return items.filter((it) => it.status === statusFilter);
  }, [items, statusFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [filtered]);

  const statusOptions = ['待验收', '验收合格', '部分合格', '拒收'];
  const totalQty = items.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalQualified = items.reduce((s, it) => s + (Number(it.qualified) || 0), 0);
  const totalUnqualified = items.reduce((s, it) => s + (Number(it.unqualified) || 0), 0);
  const pendingCount = items.filter((it) => it.status === '待验收').length;
  const rejectCount = items.filter((it) => it.status === '拒收').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ status: '待验收', quantity: 0, qualified: 0, unqualified: 0 });
    for (const f of feature.fields) if (f.type === 'number') setForm((prev) => ({ ...prev, [f.key]: 0 }));
    setForm((prev) => ({ ...prev, status: '待验收' }));
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
    if (!confirm(`确认删除验收单「${item.receiptNo || item.id}」吗？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
          <p className="text-sm text-gray-500 mt-1">订单到货质检 · 合格入库</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新建验收单</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />只读</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ClipboardCheck, label: '验收单总数', value: items.length, tone: 'text-blue-600 bg-blue-50' },
          { icon: Truck, label: '累计到货', value: `${totalQty.toLocaleString()} 件`, tone: 'text-cyan-600 bg-cyan-50' },
          { icon: CheckCircle2, label: '合格数量', value: totalQualified.toLocaleString(), tone: 'text-emerald-600 bg-emerald-50' },
          { icon: XCircle, label: '不合格/拒收', value: `${totalUnqualified.toLocaleString()} / ${rejectCount}单`, tone: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.tone}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">到货验收单</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>全部</button>
            {statusOptions.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
          <Badge variant="secondary" className="text-xs ml-auto">{pendingCount} 单待验收</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>暂无验收单</p>
              {allowCreate && <p className="text-sm mt-1">点击右上角「新建验收单」登记到货</p>}
            </div>
          ) : (
            <div className="space-y-2">
              {sorted.map((it) => {
                const q = Number(it.quantity) || 0;
                const qd = Number(it.qualified) || 0;
                const rate = q ? Math.round((qd / q) * 100) : 0;
                const Icon = it.status === '验收合格' ? CheckCircle2 : it.status === '拒收' ? XCircle : it.status === '部分合格' ? MinusCircle : Truck;
                const iconCls = it.status === '验收合格' ? 'text-emerald-500' : it.status === '拒收' ? 'text-red-500' : it.status === '部分合格' ? 'text-orange-500' : 'text-amber-500';
                return (
                  <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className={`w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 ${iconCls}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-900 truncate">{it.material || it.receiptNo}</p>
                        <Badge variant="outline" className={`${STATUS_STYLE[it.status] || ''} text-[10px] px-1.5 py-0 border-0`}>{it.status}</Badge>
                        <span className="text-xs text-gray-400">合格率 {rate}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {it.receiptNo} · {it.supplier} · {it.orderCode || '-'} · {it.date || '-'}
                      </p>
                      {it.remark && it.status !== '验收合格' && <p className="text-[10px] text-amber-600 mt-0.5 truncate">{it.remark}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">{it.quantity}{it.unit}</p>
                      <p className="text-[10px] text-gray-400">合格 {qd} · 不合格 {Number(it.unqualified) || 0}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title="编辑"><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                      {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title="删除"><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑' : '新建'}验收单</DialogTitle></DialogHeader>
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