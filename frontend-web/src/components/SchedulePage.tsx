'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, Pencil, Trash2, Eye, CalendarDays, TrendingUp, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const BAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500'];

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function SchedulePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);

  const startField = feature.fields.find((f) => f.key === 'startDate');
  const endField = feature.fields.find((f) => f.key === 'endDate');
  const taskField = feature.fields.find((f) => f.key === 'task' || f.key === 'title');
  const projectField = feature.fields.find((f) => f.key === 'project');
  const progressField = feature.fields.find((f) => f.key === 'progress');

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
    let list = items;
    if (projectFilter !== '全部') list = list.filter((it) => it.project === projectFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [items, projectFilter, search]);

  const withDates = filtered.filter((it) => startField && it[startField.key]);
  const avgProgress = withDates.length ? Math.round(withDates.reduce((s, it) => s + Number(it[progressField?.key || 'progress'] || 0), 0) / withDates.length) : 0;
  const finishedCount = withDates.filter((it) => Number(it[progressField?.key || 'progress'] || 0) >= 100).length;
  const activeCount = withDates.filter((it) => Number(it[progressField?.key || 'progress'] || 0) > 0 && Number(it[progressField?.key || 'progress'] || 0) < 100).length;
  const notStarted = withDates.filter((it) => Number(it[progressField?.key || 'progress'] || 0) === 0).length;

  const minDate = withDates.length && startField ? new Date(Math.min(...withDates.map((it) => new Date(it[startField.key]).getTime()))) : new Date();
  const maxDate = withDates.length && startField ? new Date(Math.max(...withDates.map((it) => new Date(it[endField?.key || startField.key]).getTime()))) : new Date(new Date().getTime() + 30 * 86400000);
  const totalDays = Math.max(1, daysBetween(minDate.toISOString(), maxDate.toISOString()));

  const months: { key: string; label: string; days: number }[] = [];
  {
    let cursor = new Date(minDate);
    cursor.setDate(1);
    while (cursor <= maxDate) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const days = Math.min(daysBetween(cursor.toISOString(), next.toISOString()), daysBetween(cursor.toISOString(), maxDate.toISOString()) + 1);
      months.push({ key: cursor.toISOString(), label: `${cursor.getMonth() + 1}月`, days: Math.max(1, days) });
      cursor = next;
    }
  }

  const openCreate = () => {
    setEditing(null);
    const form: Record<string, any> = {};
    for (const f of feature.fields) form[f.key] = f.type === 'number' ? 0 : '';
    if (projectFilter !== '全部') form.project = projectFilter;
    setForm(form);
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
    if (!confirm(`确认删除「${taskField ? item[taskField.key] : item.id}」吗？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const stats = [
    { icon: CalendarDays, label: '工作项', value: withDates.length, tone: 'text-blue-600 bg-blue-50' },
    { icon: TrendingUp, label: '平均完成度', value: `${avgProgress}%`, tone: 'text-purple-600 bg-purple-50' },
    { icon: CheckCircle2, label: '已完成', value: finishedCount, tone: 'text-emerald-600 bg-emerald-50' },
    { icon: AlertTriangle, label: '未开始', value: notStarted, tone: 'text-amber-600 bg-amber-50' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新增进度</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />只读</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
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
          <CardTitle className="text-base font-semibold">进度甘特图</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setProjectFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>全部</button>
            {projects.map((p) => (
              <button key={p} onClick={() => setProjectFilter(p)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : withDates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>暂无进度数据</p>
              {allowCreate && <p className="text-sm mt-1">点击右上角「新增进度」添加带开始/结束日期的工作项</p>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 640 }}>
                  <div className="flex border-b border-gray-200 pb-2 mb-2">
                    <div className="w-52 flex-shrink-0 text-xs text-gray-500 font-medium">{projectField?.label || '项目 / 工作项'}</div>
                    <div className="flex-1 relative" style={{ height: 20 }}>
                      <div className="absolute inset-0 flex">
                        {months.map((m) => (
                          <div key={m.key} className="flex-shrink-0 border-l border-gray-100" style={{ width: `${(m.days / totalDays) * 100}%` }}>
                            <span className="text-xs text-gray-400 pl-1">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {withDates.map((it, idx) => {
                      const start = new Date(it[startField!.key]).getTime();
                      const end = new Date(it[endField?.key || startField!.key]).getTime();
                      const offset = ((start - minDate.getTime()) / (totalDays * 86400000)) * 100;
                      const width = Math.max(((end - start) / (totalDays * 86400000)) * 100, 1.5);
                      const progress = progressField ? Number(it[progressField.key] || 0) : 0;
                      return (
                        <div key={it.id} className="flex items-center">
                          <div className="w-52 flex-shrink-0 pr-3">
                            <p className="text-sm text-gray-800 font-medium truncate">{taskField ? it[taskField.key] : it.id}</p>
                            <p className="text-xs text-gray-400 truncate">{projectField ? it[projectField.key] : ''}</p>
                          </div>
                          <div className="flex-1 relative h-7 rounded-md bg-gray-50" style={{ marginLeft: `${offset}%`, marginRight: `${100 - offset - width}%` }}>
                            <div className={`absolute inset-y-0 left-0 rounded-md ${BAR_COLORS[idx % BAR_COLORS.length]} opacity-90`} style={{ width: `${width}%` }}>
                              <div className="absolute inset-y-0 left-0 rounded-md bg-black/25" style={{ width: `${progress}%` }} />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{progressField ? `${progress}%` : ''}</span>
                            </div>
                          </div>
                          <div className="w-16 flex-shrink-0 flex justify-end pl-2">
                            {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title="编辑"><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>}
                            {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title="删除"><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400"><b>{activeCount}</b> 进行中</span>
                <span className="text-xs text-gray-400"><b>{finishedCount}</b> 已完成</span>
                <span className="text-xs text-gray-400"><b>{notStarted}</b> 未开始</span>
                <span className="text-xs text-gray-400"><b>{avgProgress}%</b> 平均完成度</span>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑' : '新增'}进度</DialogTitle></DialogHeader>
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
            {editing ? '保存修改' : '确认新增'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}