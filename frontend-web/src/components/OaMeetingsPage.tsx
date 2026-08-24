'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Users, CalendarDays, MapPin, User2, Search, CheckCircle2, Clock, TrendingUp } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

export function OaMeetingsPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [view, setView] = useState<'cards' | 'list'>('cards');
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

  const today = new Date().toISOString().slice(0, 10);

  const filtered = useMemo(() => {
    let list = items;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return [...list].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  }, [items, search]);

  const upcoming = filtered.filter((m) => String(m.date || '') >= today);
  const past = filtered.filter((m) => String(m.date || '') < today);
  const todayCount = items.filter((m) => String(m.date || '').startsWith(today)).length;
  const hosts = useMemo(() => Array.from(new Set(items.map((m) => m.host).filter(Boolean))), [items]);

  const fmtDate = (d: string) => {
    if (!d) return '';
    const dt = new Date(d);
    const wds = isZh ? ['日', '一', '二', '三', '四', '五', '六'] : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const wd = wds[dt.getDay()];
    const mark = d.startsWith(today) ? (isZh ? '·今天' : ' ·Today') : '';
    return isZh ? `${d} 周${wd} ${mark}` : `${d} ${wd} ${mark}`;
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
    if (!confirm(`${t('confirmDelete')}${isZh ? '会议「' : ' meeting "'}${item.title || item.id}${isZh ? '」吗？' : '"?'}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const renderCards = (list: any[]) => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {list.map((m) => (
        <Card key={m.id} className="hover:shadow-md transition-shadow">
          <CardContent className="p-5">
            <div className="flex items-start gap-4">
              <div className="w-12 h-14 rounded-xl bg-purple-50 flex flex-col items-center justify-center flex-shrink-0">
                <span className="text-[9px] text-purple-400 leading-none">{fmtDate(m.date).slice(5, 7)}{isZh ? '月' : '/'}</span>
                <span className="text-lg font-bold text-purple-600 leading-tight">{fmtDate(m.date).slice(8, 10)}</span>
                <span className="text-[9px] text-purple-400 leading-none">周{fmtDate(m.date).split('周')[1]?.split(' ')[0]}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-gray-900 truncate">{m.title}</p>
                  {String(m.date || '').startsWith(today) && <Badge className="bg-purple-500 text-[10px]">{t('today')}</Badge>}
                </div>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-gray-500">
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{m.location || '未指定'}</span>
                  <span className="flex items-center gap-1"><User2 className="w-3 h-3 text-gray-400" />{m.host || '-'}</span>
                  {m.participants && <span className="flex items-center gap-1"><Users className="w-3 h-3 text-gray-400" />{m.participants}</span>}
                </div>
                {m.content && <p className="text-sm text-gray-600 mt-2 leading-relaxed line-clamp-2">{m.content}</p>}
              </div>
              <div className="flex gap-1 flex-shrink-0">
                {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)} title={t('edit')}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>}
                {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(m)} title={t('delete')}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const stats = [
    { icon: Users, label: isZh ? '会议总数' : 'Total Meetings', value: items.length, tone: 'blue' },
    { icon: CalendarDays, label: isZh ? '今日会议' : 'Today', value: todayCount, tone: 'purple' },
    { icon: TrendingUp, label: isZh ? '待开会议' : 'Upcoming', value: upcoming.length, tone: 'emerald' },
    { icon: CheckCircle2, label: isZh ? '已开会议' : 'Past', value: past.length, tone: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '预约会议' : 'Schedule Meeting'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      {hosts.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-gray-500">{isZh ? '主持人：' : 'Hosts: '}</span>
          {hosts.map((h) => (
            <Badge key={h} variant="secondary" className="text-xs">{h}</Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          <button onClick={() => setView('cards')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${view === 'cards' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <CalendarDays className="w-3.5 h-3.5" />{isZh ? '卡片' : 'Cards'}
          </button>
          <button onClick={() => setView('list')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${view === 'list' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
            <Clock className="w-3.5 h-3.5" />{isZh ? '列表' : 'List'}
          </button>
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400"><p>{isZh ? '暂无会议' : 'No meetings'}</p><p className="text-sm mt-1">{isZh ? '点击右上角「预约会议」安排日程' : 'Click "Schedule Meeting" at the top right'}</p></CardContent></Card>
      ) : view === 'cards' ? (
        <div className="space-y-6">
          <div>
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CalendarDays className="w-4 h-4 text-emerald-500" />{isZh ? '待开会议' : 'Upcoming Meetings'} ({upcoming.length})</h2>
            {upcoming.length ? renderCards(upcoming) : <p className="text-sm text-gray-400 text-center py-8">{isZh ? '暂无待开会议' : 'No upcoming meetings'}</p>}
          </div>
          {past.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-gray-400" />{isZh ? '历史会议' : 'Past Meetings'} ({past.length})</h2>
              {renderCards(past)}
            </div>
          )}
        </div>
      ) : (
        <Card>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 pr-4 font-medium">{isZh ? '会议主题' : 'Topic'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '日期' : 'Date'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '会议室' : 'Room'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '主持人' : 'Host'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '参会人' : 'Participants'}</th>
                    <th className="py-2 font-medium text-right">{t('operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((m) => (
                    <tr key={m.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-800 font-medium">{m.title}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{fmtDate(m.date)}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{m.location || '-'}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{m.host || '-'}</td>
                      <td className="py-2.5 pr-4 text-gray-500 max-w-[200px] truncate">{m.participants || '-'}</td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(m)} title={t('edit')}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>}
                          {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(m)} title={t('delete')}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

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