'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Search, User2, CalendarDays, TrendingUp, Target } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const STAGES = ['初步接触', '方案沟通', '报价谈判', '投标', '中标', '流失'];
const STAGE_TONES: Record<string, string> = {
  初步接触: 'border-blue-300 bg-blue-50', 方案沟通: 'border-cyan-300 bg-cyan-50',
  报价谈判: 'border-amber-300 bg-amber-50', 投标: 'border-orange-300 bg-orange-50',
  中标: 'border-emerald-300 bg-emerald-50', 流失: 'border-gray-300 bg-gray-100',
};
const BADGE_TONES: Record<string, string> = {
  初步接触: 'bg-blue-100 text-blue-700', 方案沟通: 'bg-cyan-100 text-cyan-700',
  报价谈判: 'bg-amber-100 text-amber-700', 投标: 'bg-orange-100 text-orange-700',
  中标: 'bg-emerald-100 text-emerald-700', 流失: 'bg-gray-200 text-gray-500',
};

function fmtMoney(n: number | undefined) {
  if (n == null || isNaN(n)) return '¥0';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(0)}万`;
  return `¥${n}`;
}

export function MarketPipelinePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
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

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [items, search]);

  const stageMap = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const s of STAGES) map.set(s, []);
    for (const it of filtered) {
      if (map.has(it.stage)) map.get(it.stage)!.push(it);
      else if (!map.has('初步接触') && false) {}
    }
    for (const list of map.values()) list.sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0));
    return map;
  }, [filtered]);

  const stageTotals = useMemo(() => {
    const totals: Record<string, number> = {};
    for (const s of STAGES) {
      const list = stageMap.get(s) || [];
      totals[s] = list.reduce((sum, o) => sum + (Number(o.amount) || 0), 0);
    }
    return totals;
  }, [stageMap]);

  const totalAmount = items.reduce((s, o) => s + (Number(o.amount) || 0), 0);
  const wonAmount = items.filter((o) => o.stage === '中标').reduce((s, o) => s + (Number(o.amount) || 0), 0);

  const openCreate = (stage?: string) => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    if (stage) f.stage = stage;
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
    if (!confirm(`${t('confirmDelete')}${isZh ? `商机「${item.name || item.id}」吗？` : ` opportunity "${item.name || item.id}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const moveStage = async (item: any, dir: 1 | -1) => {
    const idx = STAGES.indexOf(item.stage);
    const next = STAGES[idx + dir];
    if (!next) return;
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, stage: next }),
    });
    if (res.ok) fetchItems();
  };

  const stats = [
    { icon: TrendingUp, label: isZh ? '商机总额' : 'Total Pipeline', value: fmtMoney(totalAmount), tone: 'purple' },
    { icon: Target, label: isZh ? '进行中商机' : 'Active Deals', value: String(items.filter((o) => o.stage !== '中标' && o.stage !== '流失').length), tone: 'blue' },
    { icon: Plus, label: isZh ? '已中标金额' : 'Won Amount', value: fmtMoney(wonAmount), tone: 'emerald' },
    { icon: Search, label: isZh ? '流失商机' : 'Lost Deals', value: String(items.filter((o) => o.stage === '流失').length), tone: 'slate' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={() => openCreate()} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新建商机' : 'New Opportunity'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder={`${t('search')}${isZh ? ' 商机 / 客户 / 跟进人' : ' opportunities / customers / owners'}`} className="pl-9 h-9 bg-white border-gray-200" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {STAGES.map((stage) => {
            const list = stageMap.get(stage) || [];
            return (
              <div key={stage} className={`rounded-xl border ${STAGE_TONES[stage]} p-3`}>
                <div className="flex items-center justify-between mb-3 px-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-gray-700">{stage}</span>
                    <span className="text-[11px] text-gray-500">{list.length} {t('count')}</span>
                  </div>
                  <span className="text-xs font-semibold text-gray-600">{fmtMoney(stageTotals[stage])}</span>
                </div>
                <div className="space-y-2">
                  {list.length === 0 && <div className="text-center text-xs text-gray-400 py-6">{isZh ? '暂无商机' : 'No opportunities'}</div>}
                  {list.map((o) => (
                    <Card key={o.id} className="bg-white border-gray-100 shadow-sm">
                      <CardContent className="p-3">
                        <div className="flex items-start justify-between gap-2">
                          <p className="text-sm font-medium text-gray-800 truncate">{o.name}</p>
                          <Badge className={`text-[10px] flex-shrink-0 ${BADGE_TONES[stage]}`}>{stage}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{o.customer}</p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                          <span className="font-semibold text-purple-600">{fmtMoney(o.amount)}</span>
                          {o.owner && <span className="flex items-center gap-1"><User2 className="w-3 h-3 text-gray-400" />{o.owner}</span>}
                          {o.date && <span className="flex items-center gap-1 ml-auto"><CalendarDays className="w-3 h-3 text-gray-400" />{o.date}</span>}
                        </div>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
                          <div className="flex gap-1">
                            {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(o)} title={t('edit')}><Pencil className="w-3 h-3 text-blue-600" /></Button>}
                            {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(o)} title={t('delete')}><Trash2 className="w-3 h-3 text-red-600" /></Button>}
                          </div>
                          <div className="flex gap-1">
                            {allowEdit && stage !== '初步接触' && (
                              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-gray-500 hover:text-gray-700" onClick={() => moveStage(o, -1)}>← {isZh ? '上阶段' : 'Previous'}</Button>
                            )}
                            {allowEdit && stage !== '中标' && stage !== '流失' && (
                              <Button variant="ghost" size="sm" className="h-6 px-1.5 text-[10px] text-blue-600 hover:bg-blue-50" onClick={() => moveStage(o, 1)}>{isZh ? '下阶段' : 'Next'} →</Button>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {allowCreate && (
                    <button onClick={() => openCreate(stage)} className="w-full text-center text-xs text-gray-400 hover:text-blue-600 py-1.5 rounded-lg hover:bg-white/70 transition-colors">+ {isZh ? '在此阶段新建' : 'New in this stage'}</button>
                  )}
                </div>
              </div>
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