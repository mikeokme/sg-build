'use client';

import { useEffect, useMemo, useState, useRef, useLayoutEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, Pencil, Trash2, Eye, CalendarDays, TrendingUp, CheckCircle2, AlertTriangle, GitBranch, Link2, Flag } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const BAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500'];

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

function dayMs(d: string | Date) {
  return Math.round(new Date(d).getTime() / 86400000) * 86400000;
}

// 计算关键路径：按项目分组，各自做前推后推
function computeCPM(items: any[], idSet: Set<string>) {
  const map = new Map<string, any>();
  const groups = new Map<string, any[]>();
  for (const it of items) {
    const dur = it.startDate && it.endDate ? daysBetween(it.startDate, it.endDate) : 0;
    const node = { item: it, dur: Math.max(1, dur), es: 0, ef: 0, ls: 0, lf: 0, pred: (it.predecessors || []).filter((x: string) => idSet.has(x)), succ: [] as string[], slack: 0 };
    map.set(it.id, node);
    const g = it.project || '__other__';
    if (!groups.has(g)) groups.set(g, []);
    groups.get(g)!.push(node);
  }
  for (const g of groups.values()) {
    for (const n of g) for (const p of n.pred) map.get(p)?.succ.push(n.item.id);
    const order: any[] = [];
    const visited = new Set<string>();
    const dfs = (id: string) => {
      if (visited.has(id)) return;
      visited.add(id);
      const n = map.get(id);
      if (!n) return;
      for (const p of n.pred) dfs(p);
      order.push(n);
    };
    for (const n of g) dfs(n.item.id);
    for (const n of order) {
      let es = 0;
      for (const p of n.pred) es = Math.max(es, map.get(p)!.ef);
      n.es = es;
      n.ef = es + n.dur;
    }
    const end = Math.max(...g.map((n) => n.ef), 0);
    for (const n of [...order].reverse()) {
      let lf = end;
      for (const s of n.succ) lf = Math.min(lf, map.get(s)!.ls);
      n.lf = lf;
      n.ls = lf - n.dur;
    }
    for (const n of g) n.slack = n.ls - n.es;
  }
  return map;
}

export function SchedulePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('全部');
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const chartRef = useRef<HTMLDivElement>(null);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

  const startField = feature.fields.find((f) => f.key === 'startDate');
  const endField = feature.fields.find((f) => f.key === 'endDate');
  const taskField = feature.fields.find((f) => f.key === 'task' || f.key === 'title');
  const projectField = feature.fields.find((f) => f.key === 'project');
  const progressField = feature.fields.find((f) => f.key === 'progress');
  const plannedField = feature.fields.find((f) => f.key === 'plannedProgress');

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const [pr, ms] = await Promise.all([
      fetch(`${API_BASE}/collections/${feature.collection}`, { headers }),
      fetch(`${API_BASE}/collections/milestones`, { headers }),
    ]);
    if (pr.ok) {
      const data = await pr.json();
      setItems(Array.isArray(data) ? data : []);
    }
    if (ms.ok) {
      const data = await ms.json();
      setMilestones(Array.isArray(data) ? data : []);
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

  // 排序：项目分组内按开始日期
  const sorted = useMemo(() => {
    return [...withDates].sort((a, b) => {
      if (a.project !== b.project) return (a.project || '').localeCompare(b.project || '');
      return (a.startDate || '').localeCompare(b.startDate || '');
    });
  }, [withDates]);

  const idSet = useMemo(() => new Set(sorted.map((it) => it.id)), [sorted]);
  const cpm = useMemo(() => computeCPM(sorted, idSet), [sorted, idSet]);
  const criticalIds = useMemo(() => {
    const set = new Set<string>();
    for (const n of cpm.values()) if (n.slack === 0) set.add(n.item.id);
    return set;
  }, [cpm]);

  const avgProgress = sorted.length ? Math.round(sorted.reduce((s, it) => s + Number(it[progressField?.key || 'progress'] || 0), 0) / sorted.length) : 0;
  const finishedCount = sorted.filter((it) => Number(it[progressField?.key || 'progress'] || 0) >= 100).length;
  const activeCount = sorted.filter((it) => Number(it[progressField?.key || 'progress'] || 0) > 0 && Number(it[progressField?.key || 'progress'] || 0) < 100).length;
  const notStarted = sorted.filter((it) => Number(it[progressField?.key || 'progress'] || 0) === 0).length;
  const lagging = sorted.filter((it) => {
    const actual = Number(it[progressField?.key || 'progress'] || 0);
    const planned = Number(it[plannedField?.key || 0] || 0);
    return actual < planned && actual < 100;
  }).length;

  const today = new Date();
  const minDate = sorted.length && startField ? new Date(Math.min(...sorted.map((it) => new Date(it[startField.key]).getTime()))) : new Date(today.getTime() - 30 * 86400000);
  const maxDate = sorted.length && startField ? new Date(Math.max(...sorted.map((it) => new Date(it[endField?.key || startField.key]).getTime()))) : new Date(today.getTime() + 30 * 86400000);
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

  const todayPct = ((dayMs(today) - minDate.getTime()) / (totalDays * 86400000)) * 100;
  const todayInRange = dayMs(today) >= dayMs(minDate) && dayMs(today) <= dayMs(maxDate) + 86400000;

  // 里程碑（按项目过滤）
  const filteredMilestones = useMemo(() => {
    const list = milestones.filter((m) => m.planDate);
    if (projectFilter !== '全部') return list.filter((m) => m.project === projectFilter);
    return list;
  }, [milestones, projectFilter]);

  const milestonePcts = useMemo(() => {
    return filteredMilestones.map((m) => {
      const pct = ((dayMs(m.planDate) - minDate.getTime()) / (totalDays * 86400000)) * 100;
      return { ...m, pct };
    }).filter((m) => m.pct >= 0 && m.pct <= 100);
  }, [filteredMilestones, minDate, totalDays]);

  // 依赖连线：基于排序后的行号计算像素坐标
  const [chartSize, setChartSize] = useState({ w: 0, h: 0 });
  const rowH = 44;
  useLayoutEffect(() => {
    const el = chartRef.current;
    if (!el) return;
    const measure = () => setChartSize({ w: el.clientWidth, h: el.clientHeight });
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    return () => ro.disconnect();
  }, [loading]);

  const rowIndex = useMemo(() => {
    const m = new Map<string, number>();
    sorted.forEach((it, i) => m.set(it.id, i));
    return m;
  }, [sorted]);

  const arrows = useMemo(() => {
    if (chartSize.w === 0) return [];
    const G = totalDays * 86400000;
    const out: any[] = [];
    sorted.forEach((it, i) => {
      const preds = (it.predecessors || []).filter((p: string) => rowIndex.has(p));
      if (!preds.length) return;
      const start = new Date(it[startField!.key]).getTime();
      const y2 = i * rowH + rowH / 2;
      const x2 = ((start - minDate.getTime()) / G) * chartSize.w;
      for (const p of preds) {
        const pi = rowIndex.get(p)!;
        const pit = sorted[pi];
        const pend = new Date(pit[endField?.key || startField!.key]).getTime();
        const x1 = ((pend - minDate.getTime()) / G) * chartSize.w;
        const y1 = pi * rowH + rowH / 2;
        out.push({ key: `${p}->${it.id}`, x1, y1, x2, y2 });
      }
    });
    return out;
  }, [sorted, chartSize.w, rowIndex, minDate, totalDays, startField, endField]);

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    if (projectFilter !== '全部') f.project = projectFilter;
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
    const body: Record<string, any> = { ...form };
    if (body.predecessors && typeof body.predecessors === 'string') {
      body.predecessors = body.predecessors.split(/[,，\s]+/).filter(Boolean);
    }
    const url = `${API_BASE}/collections/${feature.collection}${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}${isZh ? `「${taskField ? item[taskField.key] : item.id}」吗？` : ` "${taskField ? item[taskField.key] : item.id}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const stats = [
    { icon: CalendarDays, label: isZh ? '工作项' : 'Work Items', value: sorted.length, tone: 'blue' },
    { icon: TrendingUp, label: isZh ? '平均完成度' : 'Avg Progress', value: `${avgProgress}%`, tone: 'purple' },
    { icon: CheckCircle2, label: isZh ? '已完成' : 'Done', value: finishedCount, tone: 'emerald' },
    { icon: AlertTriangle, label: isZh ? '滞后' : 'Behind', value: lagging, tone: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新增进度' : 'Add Progress'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">{isZh ? '进度甘特图' : 'Progress Gantt Chart'}</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setProjectFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t('all')}</button>
            {projects.map((p) => (
              <button key={p} onClick={() => setProjectFilter(p)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{isZh ? '暂无进度数据' : 'No progress data'}</p>
              {allowCreate && <p className="text-sm mt-1">{isZh ? '点击右上角「新增进度」添加带开始/结束日期的工作项' : 'Click "Add Progress" at the top right to add work items with start/end dates'}</p>}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <div style={{ minWidth: 720 }}>
                  {/* 图例 */}
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 pb-3 mb-2 border-b border-gray-100 text-xs text-gray-500">
                    <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded-sm bg-gray-200" />{isZh ? '计划工期' : 'Planned'}</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded-sm bg-blue-500" />{isZh ? '实际进度' : 'Actual'}</span>
                    <span className="flex items-center gap-1.5"><span className="w-3 h-3 border-2 border-red-500 rounded-full" />{isZh ? '今日线' : 'Today'}</span>
                    <span className="flex items-center gap-1.5"><Flag className="w-3.5 h-3.5 text-amber-500 fill-amber-400" />{isZh ? '里程碑' : 'Milestones'}</span>
                    <span className="flex items-center gap-1.5"><span className="w-5 h-3 rounded-sm bg-red-500" />{isZh ? '关键路径' : 'Critical Path'}</span>
                    <span className="flex items-center gap-1.5"><Link2 className="w-3.5 h-3.5 text-gray-400" />{isZh ? '任务依赖' : 'Dependencies'}</span>
                    <span className="ml-auto flex items-center gap-1"><GitBranch className="w-3.5 h-3.5 text-amber-500" />{milestonePcts.length} {isZh ? '里程碑' : 'milestones'} · <span className="text-red-600 font-medium">{criticalIds.size}</span> {isZh ? '关键任务' : 'critical'} · {isZh ? '滞后' : 'behind'} <span className="text-red-600 font-medium">{lagging}</span></span>
                  </div>

                  <div className="flex border-b border-gray-200 pb-2 mb-2">
                    <div className="w-52 flex-shrink-0 text-xs text-gray-500 font-medium">{tField(projectField?.key || 'project', projectField?.label || (isZh ? '项目 / 工作项' : 'Project / Work Item'))}</div>
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

                  <div className="flex">
                    {/* 左侧任务列表 */}
                    <div className="w-52 flex-shrink-0">
                      {sorted.map((it, i) => {
                        const critical = criticalIds.has(it.id);
                        return (
                          <div key={it.id} style={{ height: rowH }} className="flex items-center pr-3 gap-2">
                            <p className={`text-sm font-medium truncate ${critical ? 'text-red-700' : 'text-gray-800'}`}>{taskField ? it[taskField.key] : it.id}</p>
                            {critical && <span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" title={isZh ? '关键路径' : 'Critical path'} />}
                            <p className={`text-xs truncate ml-auto ${critical ? 'text-red-400' : 'text-gray-400'}`}>{it.owner || ''}</p>
                          </div>
                        );
                      })}
                    </div>

                    {/* 甘特图主体 */}
                    <div ref={chartRef} className="flex-1 relative" style={{ height: sorted.length * rowH }}>
                      {/* 网格线（月份） */}
                      <div className="absolute inset-0 flex pointer-events-none">
                        {months.map((m) => (
                          <div key={m.key} className="flex-shrink-0 border-l border-gray-100" style={{ width: `${(m.days / totalDays) * 100}%` }} />
                        ))}
                      </div>

                      {/* 今日线 */}
                      {todayInRange && (
                        <div className="absolute top-0 bottom-0 w-px bg-red-500 z-10 pointer-events-none" style={{ left: `${todayPct}%` }}>
                          <span className="absolute -top-1 -translate-x-1/2 text-[9px] font-semibold text-red-500 bg-white px-0.5 rounded">{isZh ? '今日' : 'Today'}</span>
                        </div>
                      )}

                      {/* 依赖连线（集中绘制） */}
                      {chartSize.w > 0 && arrows.length > 0 && (
                        <svg className="absolute inset-0 w-full h-full pointer-events-none z-20">
                          <defs>
                            <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                              <polygon points="0 0, 6 3, 0 6" fill="#94a3b8" />
                            </marker>
                          </defs>
                          {arrows.map((a) => (
                            <line key={a.key} x1={a.x1} y1={a.y1} x2={a.x2} y2={a.y2} stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#arrowhead)" strokeDasharray="4 3" />
                          ))}
                        </svg>
                      )}

                      {/* 任务条 */}
                      {sorted.map((it, idx) => {
                        const start = new Date(it[startField!.key]).getTime();
                        const end = new Date(it[endField?.key || startField!.key]).getTime();
                        const offset = ((start - minDate.getTime()) / (totalDays * 86400000)) * 100;
                        const width = Math.max(((end - start) / (totalDays * 86400000)) * 100, 1.5);
                        const progress = progressField ? Number(it[progressField.key] || 0) : 0;
                        const planned = plannedField ? Number(it[plannedField.key] || 0) : 0;
                        const critical = criticalIds.has(it.id);
                        const overPlan = progress > planned;
                        return (
                          <div key={it.id} className="absolute left-0 right-0 flex items-center" style={{ top: idx * rowH, height: rowH }}>
                            {/* 计划工期条（浅色） */}
                            <div className="relative h-5 rounded-md bg-gray-200/80" style={{ left: `${offset}%`, width: `${width}%` }}>
                              {/* 计划进度（蓝色区域 = 计划值） */}
                              <div className="absolute inset-y-0 left-0 rounded-md bg-blue-400/50" style={{ width: `${Math.min(planned, 100)}%` }} />
                              {/* 实际进度（深色覆盖，若超前则深蓝） */}
                              <div className={`absolute inset-y-0 left-0 rounded-md ${overPlan ? 'bg-emerald-500' : progress >= 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(progress, 100)}%` }} />
                              {/* 关键路径外框 */}
                              {critical && <div className="absolute inset-0 rounded-md border-2 border-red-500" />}
                              <span className="absolute -top-0.5 left-1 text-[10px] font-semibold text-gray-700 drop-shadow-sm">
                                {progress < 100 ? `${progress}%` : '✓'}
                              </span>
                              {progress < planned && progress < 100 && (
                                <span className="absolute -top-3.5 right-0 text-[9px] text-red-500 font-medium">↓{Math.round(planned - progress)}%</span>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {/* 里程碑菱形 */}
                      {milestonePcts.length > 0 && (
                        <div className="absolute left-0 right-0 bottom-0 h-8 border-t border-dashed border-amber-200 z-10">
                          <span className="absolute -top-5 left-1 text-[10px] text-amber-500 font-medium flex items-center gap-1"><GitBranch className="w-3 h-3" />{isZh ? '里程碑' : 'Milestones'}</span>
                          {milestonePcts.map((m) => (
                            <div key={m.id} className="absolute -translate-x-1/2" style={{ left: `${m.pct}%`, top: 10 }} title={isZh ? `${m.project} · ${m.name}（计划 ${m.planDate}${m.actualDate ? ` · 实际 ${m.actualDate}` : ''}）` : `${m.project} · ${m.name} (plan ${m.planDate}${m.actualDate ? ` · actual ${m.actualDate}` : ''})`}>
                              <svg width="14" height="14" className={m.status === '已完成' ? 'text-emerald-500' : m.status === '已延期' ? 'text-red-500' : 'text-amber-500'}>
                                <rect x="2" y="2" width="10" height="10" transform="rotate(45 7 7)" fill="currentColor" />
                              </svg>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-4 pt-3 border-t border-gray-100">
                <span className="text-xs text-gray-400"><b className="text-gray-600">{activeCount}</b> {isZh ? '进行中' : 'in progress'}</span>
                <span className="text-xs text-gray-400"><b className="text-gray-600">{finishedCount}</b> {isZh ? '已完成' : 'done'}</span>
                <span className="text-xs text-gray-400"><b className="text-gray-600">{notStarted}</b> {isZh ? '未开始' : 'not started'}</span>
                <span className="text-xs text-gray-400"><b className="text-gray-600">{lagging}</b> {isZh ? '滞后' : 'behind'}</span>
                <span className="text-xs text-gray-400"><b className="text-red-600">{criticalIds.size}</b> {isZh ? '关键路径任务' : 'critical tasks'}</span>
                <span className="text-xs text-gray-400"><b className="text-gray-600">{avgProgress}%</b> {isZh ? '平均完成度' : 'avg progress'}</span>
              </div>
            </>
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