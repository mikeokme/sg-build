'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, ListTodo, CheckCircle2, AlertTriangle, Clock, Search, CalendarDays, User2, KanbanSquare, LayoutList } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const STATUS_STYLE: Record<string, string> = {
  未开始: 'bg-slate-100 text-slate-600',
  进行中: 'bg-blue-100 text-blue-700',
  已完成: 'bg-emerald-100 text-emerald-700',
  已逾期: 'bg-red-100 text-red-700',
};

const PRIORITY_STYLE: Record<string, string> = {
  紧急: 'bg-red-100 text-red-700',
  高: 'bg-orange-100 text-orange-700',
  中: 'bg-blue-100 text-blue-700',
  低: 'bg-gray-100 text-gray-600',
};

const STATUS_ORDER = ['未开始', '进行中', '已完成', '已逾期'];

export function OaTasksPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'board' | 'list'>('board');
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

  const today = new Date().toISOString().slice(0, 10);
  const overdueCount = items.filter((t) => t.status !== '已完成' && t.dueDate && String(t.dueDate) < today).length;
  const doingCount = items.filter((t) => t.status === '进行中').length;
  const doneCount = items.filter((t) => t.status === '已完成').length;
  const totalCount = items.length;

  const columns = useMemo(() => {
    return STATUS_ORDER.map((status) => {
      const list = status === '已逾期'
        ? filtered.filter((t) => t.status !== '已完成' && t.dueDate && String(t.dueDate) < today)
        : filtered.filter((t) => (t.status || '未开始') === status);
      return { status, list };
    });
  }, [filtered, today]);

  const changeStatus = async (item: any, status: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, status }),
    });
    fetchItems();
  };

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    setForm({ ...f, status: '未开始', priority: '中' });
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
    if (!confirm(`${t('confirmDelete')}${isZh ? '任务「' : ' task "'}${item.title || item.id}${isZh ? '」吗？' : '"?'}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const fmtDue = (d: string) => {
    if (!d) return '';
    return d < today ? `${d}${isZh ? '（逾期）' : ' (overdue)'}` : d;
  };

  const stats = [
    { icon: ListTodo, label: isZh ? '全部任务' : 'All Tasks', value: totalCount, tone: 'blue' },
    { icon: Clock, label: isZh ? '进行中' : 'In Progress', value: doingCount, tone: 'purple' },
    { icon: CheckCircle2, label: isZh ? '已完成' : 'Completed', value: doneCount, tone: 'emerald' },
    { icon: AlertTriangle, label: isZh ? '已逾期' : 'Overdue', value: overdueCount, tone: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新建任务' : 'New Task'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button onClick={() => setView('board')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${view === 'board' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              <KanbanSquare className="w-3.5 h-3.5" />{isZh ? '看板' : 'Board'}
            </button>
            <button onClick={() => setView('list')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${view === 'list' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              <LayoutList className="w-3.5 h-3.5" />{isZh ? '列表' : 'List'}
            </button>
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{isZh ? '暂无任务' : 'No tasks'}</p>
              {allowCreate && <p className="text-sm mt-1">{isZh ? '点击右上角「新建任务」创建协作任务' : 'Click "New Task" at the top right to create tasks'}</p>}
            </div>
          ) : view === 'board' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
              {columns.map((col) => (
                <div key={col.status} className="rounded-xl bg-gray-50 p-3 min-h-[200px]">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-2 h-2 rounded-full ${col.status === '已完成' ? 'bg-emerald-500' : col.status === '已逾期' ? 'bg-red-500' : col.status === '进行中' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                    <span className="text-sm font-medium text-gray-700">{col.status}</span>
                    <span className="ml-auto text-xs text-gray-400 bg-white rounded-full px-2 py-0.5">{col.list.length}</span>
                  </div>
                  <div className="space-y-2">
                    {col.list.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl p-3 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group">
                        <p className="text-sm text-gray-800 font-medium leading-snug">{t.title}</p>
                        {t.project && <p className="text-xs text-gray-400 mt-1 truncate">🏗 {t.project}</p>}
                        <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${PRIORITY_STYLE[t.priority] || ''}`}>{t.priority || '中'}</Badge>
                          {t.dueDate && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><CalendarDays className="w-3 h-3" />{fmtDue(t.dueDate)}</span>}
                          {t.assignee && <span className="text-[10px] text-gray-400 flex items-center gap-0.5 ml-auto"><User2 className="w-3 h-3" />{t.assignee}</span>}
                        </div>
                        {t.status !== '已完成' && (
                          <div className="flex gap-1 mt-2 pt-2 border-t border-gray-50 opacity-0 group-hover:opacity-100 transition-opacity">
                            {STATUS_ORDER.filter((s) => s !== '已逾期' && s !== t.status).map((s) => (
                              <button key={s} onClick={() => changeStatus(t, s)} className="text-[10px] px-2 py-0.5 rounded-md bg-gray-100 text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                                → {s}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {col.list.length === 0 && <p className="text-center text-xs text-gray-300 py-6">{isZh ? '暂无任务' : 'No tasks'}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 pr-4 font-medium">{isZh ? '任务' : 'Task'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '关联项目' : 'Project'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '负责人' : 'Assignee'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '优先级' : 'Priority'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '截止日期' : 'Due Date'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '状态' : 'Status'}</th>
                    <th className="py-2 font-medium text-right">{t('operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((t) => (
                    <tr key={t.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2.5 pr-4 text-gray-800 font-medium">{t.title}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{t.project || '-'}</td>
                      <td className="py-2.5 pr-4 text-gray-500">{t.assignee || '-'}</td>
                      <td className="py-2.5 pr-4"><Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${PRIORITY_STYLE[t.priority] || ''}`}>{t.priority || '中'}</Badge></td>
                      <td className="py-2.5 pr-4 text-gray-500">{fmtDue(t.dueDate)}</td>
                      <td className="py-2.5 pr-4"><Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${STATUS_STYLE[t.status] || ''}`}>{t.status || '未开始'}</Badge></td>
                      <td className="py-2.5 text-right">
                        <div className="flex justify-end gap-1">
                          {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(t)} title={t('edit')}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>}
                          {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(t)} title={t('delete')}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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