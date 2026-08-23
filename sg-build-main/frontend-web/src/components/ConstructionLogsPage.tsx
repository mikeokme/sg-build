'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Sun, Cloud, CloudRain, AlertCircle, Wrench, Users } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const WEATHER_ICON: Record<string, any> = {
  晴: Sun, 多云: Cloud, 阴: Cloud, 小雨: CloudRain, 大雨: CloudRain, 雷雨: CloudRain,
};

const WEATHER_COLOR: Record<string, string> = {
  晴: 'text-amber-500 bg-amber-50',
  多云: 'text-slate-500 bg-slate-100',
  阴: 'text-slate-400 bg-slate-100',
  小雨: 'text-blue-500 bg-blue-50',
  大雨: 'text-blue-600 bg-blue-50',
  雷雨: 'text-indigo-600 bg-indigo-50',
};

export function ConstructionLogsPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('全部');
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

  const projects = useMemo(() => Array.from(new Set(items.map((it) => it.project).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    if (projectFilter === '全部') return items;
    return items.filter((it) => it.project === projectFilter);
  }, [items, projectFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (b.date || '').localeCompare(a.date || '')), [filtered]);

  const totalLabor = items.reduce((s, it) => s + Number(it.labor || 0), 0);
  const hasIssues = items.filter((it) => it.issues && it.issues !== '无').length;

  const openCreate = () => {
    setEditing(null);
    setForm({ project: projectFilter === '全部' ? '' : projectFilter, date: new Date().toISOString().slice(0, 10), weather: '晴', labor: 0 });
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
    if (!confirm(`${t('confirmDelete')}${isZh ? ` ${item.date || ''} 的日志吗？` : ` log for ${item.date || ''}?`}`)) return;
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
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '填写日志' : 'Fill Log'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: isZh ? '日志总数' : 'Total Logs', value: items.length, tone: 'blue' },
          { label: isZh ? '累计出勤（人次）' : 'Total Attendance', value: totalLabor.toLocaleString(), tone: 'emerald' },
          { label: isZh ? '涉及项目' : 'Projects', value: projects.length, tone: 'purple' },
          { label: isZh ? '记录问题' : 'Issues', value: hasIssues, tone: 'amber' },

        ].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">{isZh ? '施工日志流水' : 'Construction Logs'}</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setProjectFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t('all')}</button>
            {projects.map((p) => (
              <button key={p} onClick={() => setProjectFilter(p)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
            ))}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{isZh ? '暂无日志' : 'No logs'}</p>
              {allowCreate && <p className="text-sm mt-1">{isZh ? '点击右上角「填写日志」记录今日施工情况' : 'Click "Fill Log" at the top right to record today\'s work'}</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((it) => {
                const WI = WEATHER_ICON[it.weather] || Sun;
                const wc = WEATHER_COLOR[it.weather] || WEATHER_COLOR['晴'];
                return (
                  <div key={it.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 hover:shadow-sm transition-all">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                          <span className="text-[10px] font-bold text-blue-600 leading-tight text-center">
                            {(it.date || '').slice(8, 10)}<br />{(it.date || '').slice(5, 7)}{isZh ? '月' : '/'}
                          </span>
                        </span>
                        <div className="min-w-0">
                          <p className="font-medium text-sm text-gray-900 truncate">{it.project}</p>
                          <p className="text-xs text-gray-400">{it.date}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <Badge variant="outline" className={`gap-1 border-0 text-xs ${wc}`}><WI className="w-3 h-3" />{it.weather}</Badge>
                        <Badge variant="outline" className="gap-1 border-0 text-xs bg-gray-100 text-gray-600"><Users className="w-3 h-3" />{it.labor || 0}{isZh ? '人' : ' ppl'}</Badge>
                        <div className="flex gap-1">
                          {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title={t('edit')}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                          {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title={t('delete')}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                        </div>
                      </div>
                    </div>
                    <div className="mt-3 space-y-2">
                      <p className="text-sm text-gray-700 leading-relaxed">{it.workContent || '-'}</p>
                      {it.equipment && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5">
                          <Wrench className="w-3 h-3 text-gray-400 flex-shrink-0" />
                          {it.equipment}
                        </p>
                      )}
                      {it.issues && it.issues !== '无' ? (
                        <p className="text-xs text-amber-600 flex items-start gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5">
                          <AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          {it.issues}
                        </p>
                      ) : (
                        <p className="text-xs text-emerald-600 flex items-center gap-1.5">
                          <AlertCircle className="w-3 h-3" />{isZh ? '当日无问题' : 'No issues today'}
                        </p>
                      )}
                    </div>
                    {it.recorder && (
                      <p className="mt-2 text-[10px] text-gray-400">{isZh ? '记录人' : 'Recorder'}：{it.recorder}</p>
                    )}
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