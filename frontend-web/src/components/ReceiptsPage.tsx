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
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useProjectFilter, useCurrentProject } from '@/context/ProjectContext';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

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
  const matchesProject = useProjectFilter(categoryKey);
  const currentProject = useCurrentProject(categoryKey);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

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
    if (statusFilter === '全部') return scopedItems;
    return scopedItems.filter((it) => it.status === statusFilter);
  }, [scopedItems, statusFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [filtered]);

  const statusOptions = ['待验收', '验收合格', '部分合格', '拒收'];
  const totalQty = scopedItems.reduce((s, it) => s + (Number(it.quantity) || 0), 0);
  const totalQualified = scopedItems.reduce((s, it) => s + (Number(it.qualified) || 0), 0);
  const totalUnqualified = scopedItems.reduce((s, it) => s + (Number(it.unqualified) || 0), 0);
  const pendingCount = scopedItems.filter((it) => it.status === '待验收').length;
  const rejectCount = scopedItems.filter((it) => it.status === '拒收').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ status: '待验收', quantity: 0, qualified: 0, unqualified: 0 });
    for (const f of feature.fields) if (f.type === 'number') setForm((prev) => ({ ...prev, [f.key]: 0 }));
    setForm((prev) => ({ ...prev, status: '待验收' }));
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
    if (!confirm(`${t('confirmDelete')}${isZh ? '验收单「' : ' receipt "'}${item.receiptNo || item.id}${isZh ? '」吗？' : '"?'}`)) return;
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
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? '订单到货质检 · 合格入库' : 'Incoming inspection · qualified goods into warehouse'}</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新建验收单' : 'New Receipt'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: ClipboardCheck, label: isZh ? '验收单总数' : 'Total Receipts', value: scopedItems.length, tone: 'blue' },
          { icon: Truck, label: isZh ? '累计到货' : 'Total Received', value: `${totalQty.toLocaleString()} ${isZh ? '件' : 'pcs'}`, tone: 'cyan' },
          { icon: CheckCircle2, label: isZh ? '合格数量' : 'Qualified', value: totalQualified.toLocaleString(), tone: 'emerald' },
          { icon: XCircle, label: isZh ? '不合格/拒收' : 'Unqualified/Rejected', value: `${totalUnqualified.toLocaleString()} / ${rejectCount}${isZh ? '单' : ' orders'}`, tone: 'red' },

        ].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">{isZh ? '到货验收单' : 'Goods Receiving'}</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setStatusFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t('all')}</button>
            {statusOptions.map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
            ))}
          </div>
          <Badge variant="secondary" className="text-xs ml-auto">{pendingCount} {isZh ? '单待验收' : 'pending'}</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{isZh ? '暂无验收单' : 'No receipts'}</p>
              {allowCreate && <p className="text-sm mt-1">{isZh ? '点击右上角「新建验收单」登记到货' : 'Click "New Receipt" at the top right to register arrivals'}</p>}
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
                        <span className="text-xs text-gray-400">{isZh ? '合格率' : 'Rate'} {rate}%</span>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {it.receiptNo} · {it.supplier} · {it.orderCode || '-'} · {it.date || '-'}
                      </p>
                      {it.remark && it.status !== '验收合格' && <p className="text-[10px] text-amber-600 mt-0.5 truncate">{it.remark}</p>}
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-gray-900 tabular-nums">{it.quantity}{it.unit}</p>
                      <p className="text-[10px] text-gray-400">{isZh ? '合格' : 'Qualified'} {qd} · {isZh ? '不合格' : 'Unqualified'} {Number(it.unqualified) || 0}</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title={t('edit')}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                      {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title={t('delete')}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
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
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('add')}{tFeat(categoryKey, feature.key)}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {feature.fields.map((f) => (
              <div key={f.key}>
                <Label>{tField(f.key, f.label)}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">{t('pleaseSelect')}</option>
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
                    placeholder={`${t('inputPlaceholder')}${tField(f.key, f.label)}`}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? t('save') : t('confirmAdd')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}