'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Search, Plane, FileText, Coffee, Wifi, Bus, MoreHorizontal, User2, CalendarDays } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, canApprove, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const TYPE_ICONS: Record<string, any> = {
  差旅费: Plane, 办公费: FileText, 交通费: Bus, 招待费: Coffee, 通讯费: Wifi, 其他: MoreHorizontal,
};
const TYPE_TONES: Record<string, string> = {
  差旅费: 'bg-blue-100 text-blue-700', 办公费: 'bg-purple-100 text-purple-700', 交通费: 'bg-cyan-100 text-cyan-700',
  招待费: 'bg-orange-100 text-orange-700', 通讯费: 'bg-emerald-100 text-emerald-700', 其他: 'bg-gray-100 text-gray-500',
};
const STATUS_TONES: Record<string, string> = {
  待审批: 'bg-amber-100 text-amber-700', 已批准: 'bg-emerald-100 text-emerald-700', 已驳回: 'bg-red-100 text-red-700',
};

function fmtMoney(n: number | undefined) {
  if (n == null || isNaN(n)) return '¥0';
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n}`;
}

export function FinanceReimbursePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const canApproveFlag = canApprove(role);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/reimbursements`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const d = await res.json();
      setItems(Array.isArray(d) ? d : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const types = useMemo(() => Array.from(new Set(items.map((i) => i.type).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (typeFilter !== '全部') list = list.filter((i) => i.type === typeFilter);
    if (statusFilter !== '全部') list = list.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((i) => Object.values(i).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [items, typeFilter, statusFilter, search]);

  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pendingCount = items.filter((i) => i.status === '待审批').length;

  const actStatus = async (item: any, status: string) => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/reimbursements/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, status }),
    });
    if (res.ok) fetchItems();
  };

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    const saved = localStorage.getItem('user');
    if (saved) { try { const u = JSON.parse(saved); f.applicant = u.username || u.name || ''; } catch {} }
    setForm(f);
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
    const url = `${API_BASE}/collections/reimbursements${editing ? `/${editing.id}` : ''}`;
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
    if (!confirm(`${t('confirmDelete')}${isZh ? `报销单「${item.title}」吗？` : ` reimbursement "${item.title}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/reimbursements/${item.id}`, {
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
          <p className="text-sm text-gray-500 mt-1">{isZh ? '员工差旅、办公、交通等费用报销与审批' : 'Employee reimbursement and approval for travel, office and transport expenses'}</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '发起报销' : 'New Reimbursement'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4"><p className="text-lg font-bold text-gray-900">{items.length}</p><p className="text-xs text-gray-500">{isZh ? '报销单数' : 'Total Forms'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-lg font-bold text-gray-900">{fmtMoney(totalAmount)}</p><p className="text-xs text-gray-500">{isZh ? '报销总额' : 'Total Amount'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-lg font-bold text-amber-600">{pendingCount}</p><p className="text-xs text-gray-500">{isZh ? '待审批' : 'Pending'}</p></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-lg font-bold text-emerald-600">{items.filter((i) => i.status === '已批准').length}</p><p className="text-xs text-gray-500">{isZh ? '已批准' : 'Approved'}</p></CardContent></Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={() => setTypeFilter('全部')}
            className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${typeFilter === '全部' ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
            {t('all')}{isZh ? '类型' : ' Types'}
          </button>
          {types.map((t) => (
            <button key={t} onClick={() => setTypeFilter(t)}
              className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${typeFilter === t ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
              {t}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <select className="h-9 px-2 rounded-lg border border-gray-200 bg-white text-sm text-gray-600" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="全部">{isZh ? '全部状态' : 'All Statuses'}</option>
            <option value="待审批">待审批</option>
            <option value="已批准">已批准</option>
            <option value="已驳回">已驳回</option>
          </select>
          <div className="relative flex-1 max-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9 bg-white border-gray-200" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400"><p>{isZh ? '暂无报销单' : 'No reimbursements'}</p><p className="text-sm mt-1">{isZh ? '点击右上角「发起报销」' : 'Click "New Reimbursement" at the top right'}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((it) => {
            const Icon = TYPE_ICONS[it.type] || MoreHorizontal;
            const typeTone = TYPE_TONES[it.type] || TYPE_TONES['其他'];
            const isPending = it.status === '待审批';
            return (
              <Card key={it.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${typeTone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-800 truncate">{it.title}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {it.type && <Badge className={`text-[10px] ${typeTone}`}>{it.type}</Badge>}
                        <Badge className={`text-[10px] ${STATUS_TONES[it.status] || 'bg-gray-100 text-gray-500'}`}>{it.status}</Badge>
                      </div>
                    </div>
                    <div className="text-base font-bold text-gray-900 flex-shrink-0">{fmtMoney(it.amount)}</div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{it.applicant || '-'}</span>
                      {it.date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{it.date}</span>}
                    </div>
                    <div className="flex items-center gap-1">
                      {isPending && canApproveFlag && (
                        <>
                          <Button size="sm" className="h-7 bg-emerald-600 hover:bg-emerald-700 text-[11px] px-2" onClick={() => actStatus(it, '已批准')}>{isZh ? '批准' : 'Approve'}</Button>
                          <Button size="sm" variant="outline" className="h-7 text-red-600 border-red-200 hover:bg-red-50 text-[11px] px-2" onClick={() => actStatus(it, '已驳回')}>{t('reject')}</Button>
                        </>
                      )}
                      {allowEdit && isPending && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title={t('edit')}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>}
                      {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title={t('delete')}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
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