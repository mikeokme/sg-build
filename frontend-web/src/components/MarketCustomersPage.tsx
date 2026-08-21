'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Search, Phone, MapPin, User2, Target, FileSignature } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const LEVEL_TONES: Record<string, string> = {
  战略: 'bg-red-100 text-red-700',
  重要: 'bg-amber-100 text-amber-700',
  一般: 'bg-gray-100 text-gray-500',
};

function fmtMoney(n: number | undefined) {
  if (n == null || isNaN(n)) return '¥0';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(0)}万`;
  return `¥${n}`;
}

export function MarketCustomersPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [contracts, setContracts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
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

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const [cr, or, kr] = await Promise.all([
      fetch(`${API_BASE}/collections/customers`, { headers }),
      fetch(`${API_BASE}/collections/opportunities`, { headers }),
      fetch(`${API_BASE}/collections/contracts`, { headers }),
    ]);
    if (cr.ok) setCustomers(await cr.json());
    if (or.ok) setOpportunities(await or.json());
    if (kr.ok) setContracts(await kr.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const filtered = useMemo(() => {
    let list = customers;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [customers, search]);

  const relOf = (c: any) => {
    const opps = opportunities.filter((o) => o.customer === c.name);
    const cts = contracts.filter((k) => k.party === c.name);
    const oppAmount = opps.reduce((s, o) => s + (Number(o.amount) || 0), 0);
    const ctAmount = cts.reduce((s, k) => s + (Number(k.amount) || 0), 0);
    return { opps, cts, oppAmount, ctAmount };
  };

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
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
    const url = `${API_BASE}/collections/customers${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchAll();
    }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}${isZh ? `客户「${item.name}」吗？` : ` customer "${item.name}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/customers/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchAll();
  };

  const detail = selected ? relOf(selected) : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新增客户' : 'Add Customer'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder={`${t('search')}${isZh ? ' 客户 / 联系人 / 电话' : ' customers / contacts / phones'}`} className="pl-9 h-9 bg-white border-gray-200" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {['战略', '重要', '一般'].map((lv) => (
          <Badge key={lv} className={`${LEVEL_TONES[lv]} text-xs`}>{lv} {customers.filter((c) => c.level === lv).length}</Badge>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400"><p>{isZh ? '暂无客户' : 'No customers'}</p><p className="text-sm mt-1">{isZh ? '点击右上角「新增客户」建立档案' : 'Click "Add Customer" at the top right'}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const rel = relOf(c);
            return (
              <Card key={c.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(c)}>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600 flex-shrink-0">{c.name.slice(0, 1)}</div>
                      <div>
                        <p className="font-semibold text-gray-900">{c.name}</p>
                        <p className="text-xs text-gray-400">{c.contact} · {c.phone}</p>
                      </div>
                    </div>
                    {c.level && <Badge className={`text-[10px] flex-shrink-0 ${LEVEL_TONES[c.level]}`}>{c.level}</Badge>}
                  </div>
                  {c.address && <p className="text-xs text-gray-400 flex items-center gap-1 mb-3"><MapPin className="w-3 h-3" />{c.address}</p>}
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="rounded-lg bg-purple-50 px-3 py-2">
                      <p className="text-[10px] text-purple-400 flex items-center gap-1"><Target className="w-3 h-3" />{isZh ? '商机' : 'Deals'} {rel.opps.length} {t('count')}</p>
                      <p className="text-sm font-semibold text-purple-700">{fmtMoney(rel.oppAmount)}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 px-3 py-2">
                      <p className="text-[10px] text-amber-400 flex items-center gap-1"><FileSignature className="w-3 h-3" />{isZh ? '合同' : 'Contracts'} {rel.cts.length} {isZh ? '份' : ''}</p>
                      <p className="text-sm font-semibold text-amber-700">{fmtMoney(rel.ctAmount)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && detail && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center font-bold text-blue-600">{selected.name.slice(0, 1)}</span>
                  <span>{selected.name}</span>
                  {selected.level && <Badge className={`text-[10px] ${LEVEL_TONES[selected.level]}`}>{selected.level}</Badge>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-1 text-sm text-gray-600">
                <p className="flex items-center gap-2"><User2 className="w-3.5 h-3.5 text-gray-400" />{selected.contact || '-'} {selected.phone && <span className="text-gray-400">· {selected.phone}</span>}</p>
                {selected.address && <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-gray-400" />{selected.address}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-xl bg-purple-50 p-3">
                  <p className="text-xs text-purple-500">{isZh ? '商机跟单' : 'Deal Tracking'}（{detail.opps.length}）</p>
                  <p className="text-lg font-bold text-purple-700">{fmtMoney(detail.oppAmount)}</p>
                </div>
                <div className="rounded-xl bg-amber-50 p-3">
                  <p className="text-xs text-amber-500">{isZh ? '合同金额' : 'Contract Amount'}（{detail.cts.length}）</p>
                  <p className="text-lg font-bold text-amber-700">{fmtMoney(detail.ctAmount)}</p>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-2">{isZh ? '进行中商机' : 'Active Deals'}</h3>
                {detail.opps.length === 0 ? <p className="text-xs text-gray-400">{isZh ? '暂无商机' : 'No opportunities'}</p> : (
                  <div className="space-y-1.5">
                    {detail.opps.map((o) => (
                      <div key={o.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{o.name}</p>
                          <p className="text-[11px] text-gray-400">{o.stage} · {o.owner || '-'}</p>
                        </div>
                        <span className="text-xs font-semibold text-purple-600 flex-shrink-0">{fmtMoney(o.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-2 mt-3">{isZh ? '合同记录' : 'Contracts'}</h3>
                {detail.cts.length === 0 ? <p className="text-xs text-gray-400">{isZh ? '暂无合同' : 'No contracts'}</p> : (
                  <div className="space-y-1.5">
                    {detail.cts.map((k) => (
                      <div key={k.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{k.name}</p>
                          <p className="text-[11px] text-gray-400">{k.code} · {k.signDate}</p>
                        </div>
                        <span className="text-xs font-semibold text-amber-600 flex-shrink-0">{fmtMoney(k.amount)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex gap-2 justify-end pt-2">
                {allowEdit && <Button variant="outline" size="sm" onClick={() => { openEdit(selected); setSelected(null); }}><Pencil className="w-3.5 h-3.5 mr-1" />{t('edit')}</Button>}
                {allowDelete && <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => { handleDelete(selected); setSelected(null); }}><Trash2 className="w-3.5 h-3.5 mr-1" />{t('delete')}</Button>}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

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