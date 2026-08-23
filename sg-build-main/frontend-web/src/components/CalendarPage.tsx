'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ChevronLeft, ChevronRight, Plus, Pencil, Trash2, Eye, CalendarDays, MapPin, User2 } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

function toDateStr(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function CalendarPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const [anchor, setAnchor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
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
  const WEEKDAY_LABEL = isZh ? WEEKDAYS : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const dateField = feature.fields.find((f) => f.key === 'date');
  const titleField = feature.fields.find((f) => f.key === 'title' || f.key === 'name' || f.key === 'theme');

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

  const today = new Date();
  const todayStr = toDateStr(today);
  const year = anchor.getFullYear();
  const m = anchor.getMonth();

  const itemsByDate = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const it of items) {
      const d = dateField ? String(it[dateField.key] || '').slice(0, 10) : '';
      if (!d) continue;
      if (!map.has(d)) map.set(d, []);
      map.get(d)!.push(it);
    }
    return map;
  }, [items, dateField]);

  const monthCells = useMemo(() => {
    const firstDay = new Date(year, m, 1);
    const daysInMonth = new Date(year, m + 1, 0).getDate();
    const startWeekday = firstDay.getDay();
    const cells: (number | null)[] = [
      ...Array.from({ length: startWeekday }, () => null),
      ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    return cells;
  }, [year, m]);

  const weekDays = useMemo(() => {
    const first = new Date(year, m, 1);
    const startOfWeek = new Date(anchor);
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(startOfWeek);
      d.setDate(startOfWeek.getDate() + i);
      return d;
    });
  }, [anchor]);

  const navigate = (delta: number) => {
    if (view === 'month') setAnchor(new Date(year, m + delta, 1));
    else if (view === 'week') setAnchor(new Date(anchor.getFullYear(), anchor.getMonth(), anchor.getDate() + delta * 7));
    else setAnchor(new Date(year, m, anchor.getDate() + delta));
  };

  const goToday = () => {
    const now = new Date();
    setAnchor(new Date(now.getFullYear(), now.getMonth(), 1));
    setSelectedDay(todayStr);
  };

  const openCreate = (day?: string) => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    if (day && dateField) f[dateField.key] = day;
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
    if (!confirm(`${t('confirmDelete')}${isZh ? '日程「' : ' schedule "'}${item.title || item.id}${isZh ? '」吗？' : '"?'}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const renderDateCell = (day: number | null) => {
    if (day === null) return <div className="min-h-24 bg-gray-50 p-2" />;
    const ds = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const list = itemsByDate.get(ds) || [];
    const isToday = ds === todayStr;
    const dow = new Date(year, m, day).getDay();
    const isWeekend = dow === 0 || dow === 6;
    return (
      <div className={`min-h-24 bg-white p-2 flex flex-col ${selectedDay === ds ? 'ring-2 ring-blue-300' : ''}`} onClick={() => setSelectedDay(ds)}>
        <div className="flex items-center justify-between mb-1">
          <span className={`text-xs font-medium ${isToday ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center' : isWeekend ? 'text-red-500' : 'text-gray-600'}`}>{day}</span>
          {allowCreate && (
            <button onClick={(e) => { e.stopPropagation(); openCreate(ds); }} className="text-[10px] text-gray-300 hover:text-blue-500 opacity-0 group-hover:opacity-100 transition-opacity">+</button>
          )}
        </div>
        <div className="space-y-1 flex-1 overflow-hidden">
          {list.slice(0, 3).map((it) => (
            <div key={it.id} className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate cursor-pointer hover:bg-blue-100" title={titleField ? it[titleField.key] : it.id} onClick={(e) => { e.stopPropagation(); openEdit(it); }}>
              {titleField ? it[titleField.key] : it.id}
            </div>
          ))}
          {list.length > 3 && <div className="text-[11px] text-gray-400 px-1">+{list.length - 3} {isZh ? '更多' : 'more'}</div>}
        </div>
      </div>
    );
  };

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
      {weekDays.map((d, i) => {
        const ds = toDateStr(d);
        const list = itemsByDate.get(ds) || [];
        const isToday = ds === todayStr;
        return (
          <div key={ds} className="min-h-28 bg-white">
            <div className={`px-3 py-2 text-xs font-medium border-b ${isToday ? 'text-blue-600' : i === 0 || i === 6 ? 'text-red-500' : 'text-gray-600'}`}>
              {isZh ? `周${WEEKDAY_LABEL[i]}` : WEEKDAY_LABEL[i]} {d.getMonth() + 1}/{d.getDate()}
              {isToday && <Badge className="ml-1 bg-blue-600 text-[9px]">{isZh ? '今' : 'T'}</Badge>}
            </div>
            <div className="space-y-1 p-1.5">
              {list.slice(0, 4).map((it) => (
                <div key={it.id} className="text-[11px] px-1.5 py-1 rounded bg-blue-50 text-blue-700 truncate cursor-pointer hover:bg-blue-100" title={titleField ? it[titleField.key] : it.id} onClick={() => openEdit(it)}>
                  {titleField ? it[titleField.key] : it.id}
                </div>
              ))}
              {allowCreate && (
                <button onClick={() => openCreate(ds)} className="w-full text-center text-[10px] text-gray-300 hover:text-blue-500 py-0.5 rounded hover:bg-gray-50">+ {t('add')}</button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const ds = selectedDay || todayStr;
    const list = itemsByDate.get(ds) || [];
    return (
      <div>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-semibold text-gray-700">{ds} {ds === todayStr && <Badge className="ml-1 bg-blue-600">{t('today')}</Badge>}</p>
          {allowCreate && <Button variant="outline" size="sm" onClick={() => openCreate(ds)}><Plus className="w-3.5 h-3.5 mr-1" />{isZh ? '新增日程' : 'New Schedule'}</Button>}
        </div>
        {list.length === 0 ? (
          <div className="text-center py-16 text-gray-400 text-sm">{isZh ? '当日暂无日程' : 'No schedules for this day'}</div>
        ) : (
          <div className="space-y-3">
            {list.map((it) => (
              <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="w-1 h-8 rounded-full bg-blue-500 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{titleField ? it[titleField.key] : it.id}</p>
                  <p className="text-xs text-gray-500 mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5">
                    {it.location && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{it.location}</span>}
                    {it.owner && <span className="flex items-center gap-1"><User2 className="w-3 h-3" />{it.owner}</span>}
                  </p>
                  {it.content && <p className="text-xs text-gray-400 mt-1">{it.content}</p>}
                </div>
                <div className="flex gap-1 flex-shrink-0">
                  {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>}
                  {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const viewLabel = view === 'month' ? `${year}${isZh ? '年' : '/'}${m + 1}${isZh ? '月' : ''}` : view === 'week' ? `${weekDays[0].getFullYear()}${isZh ? '年' : '/'}${weekDays[0].getMonth() + 1}${isZh ? '月' : ''}${weekDays[0].getDate()}${isZh ? '日' : ''} - ${weekDays[6].getMonth() + 1}${isZh ? '月' : '/'}${weekDays[6].getDate()}${isZh ? '日' : ''}` : `${selectedDay || todayStr}`;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={() => openCreate()} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新建日程' : 'New Schedule'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
              {(['month', 'week', 'day'] as const).map((v) => (
                <button key={v} onClick={() => setView(v)}
                  className={`px-3 py-1.5 rounded-md text-sm transition-all ${view === v ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                  {v === 'month' ? (isZh ? '月' : 'Month') : v === 'week' ? (isZh ? '周' : 'Week') : (isZh ? '日' : 'Day')}
                </button>
              ))}
            </div>
            <CardTitle className="text-base font-semibold ml-1">{viewLabel}</CardTitle>
          </div>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={goToday}>{t('today')}</Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : view === 'month' ? (
            <>
              <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden group">
                {WEEKDAY_LABEL.map((w, i) => (
                  <div key={w} className={`bg-gray-50 px-3 py-2 text-xs font-medium ${i === 0 || i === 6 ? 'text-red-500' : 'text-gray-500'}`}>{w}</div>
                ))}
                {monthCells.map((day, i) => <div key={i}>{renderDateCell(day)}</div>)}
              </div>
              <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
                <span><b className="text-gray-600">{items.length}</b> {t('count')} {isZh ? '日程' : 'schedules'}</span>
                <span><b className="text-gray-600">{selectedDay ? (itemsByDate.get(selectedDay) || []).length : 0}</b> {t('count')} {isZh ? '选中日' : 'selected'}</span>
                {selectedDay && allowCreate && (
                  <Button variant="outline" size="sm" onClick={() => openCreate(selectedDay)} className="text-xs"><Plus className="w-3 h-3 mr-1" />{isZh ? `在 ${selectedDay} 新增` : `Add on ${selectedDay}`}</Button>
                )}
              </div>
            </>
          ) : view === 'week' ? (
            renderWeekView()
          ) : (
            renderDayView()
          )}
        </CardContent>
      </Card>

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