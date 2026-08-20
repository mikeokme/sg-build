'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Building2, TrendingUp, CheckCircle2, Wallet, Clock, AlertTriangle,
  Loader2, Search, Plus, ChevronRight, CalendarDays, FileText,
  GitBranch, ClipboardList, Activity,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { FeatureDef } from '@/config/features';
import { canCreate } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const STATUS_COLOR: Record<string, string> = {
  立项: 'bg-slate-100 text-slate-600 border-slate-200',
  在建: 'bg-blue-100 text-blue-700 border-blue-200',
  竣工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  完工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  停工: 'bg-red-100 text-red-700 border-red-200',
  暂缓: 'bg-amber-100 text-amber-700 border-amber-200',
};

const STATUS_DOT: Record<string, string> = {
  立项: 'bg-slate-400',
  在建: 'bg-blue-500 animate-pulse',
  竣工: 'bg-emerald-500',
  完工: 'bg-emerald-500',
  停工: 'bg-red-500',
  暂缓: 'bg-amber-500',
};

const TYPE_BADGE: Record<string, string> = {
  水利枢纽: 'text-blue-600 bg-blue-50 border-blue-200',
  渠道工程: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  防洪工程: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  灌溉工程: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  水库工程: 'text-teal-600 bg-teal-50 border-teal-200',
  生态工程: 'text-green-600 bg-green-50 border-green-200',
  环保工程: 'text-purple-600 bg-purple-50 border-purple-200',
  监测工程: 'text-orange-600 bg-orange-50 border-orange-200',
  景观工程: 'text-pink-600 bg-pink-50 border-pink-200',
  综合治理: 'text-sky-600 bg-sky-50 border-sky-200',
};

const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function fmtMoney(v: number | string): string {
  const n = Number(v);
  if (!n) return '-';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

function daysRemaining(endDate: string): { text: string; cls: string } {
  if (!endDate) return { text: '-', cls: 'text-gray-400' };
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { text: `已逾期 ${Math.abs(diff)} 天`, cls: 'text-red-500' };
  if (diff === 0) return { text: '今日到期', cls: 'text-amber-500 font-semibold' };
  return { text: `${diff} 天后`, cls: 'text-gray-500' };
}

function StatCard({ icon: Icon, label, value, sub, tone }: any) {
  const tones: Record<string, string> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    sky: 'text-sky-600 bg-sky-50',
    purple: 'text-purple-600 bg-purple-50',
    amber: 'text-amber-600 bg-amber-50',
    red: 'text-red-600 bg-red-50',
  };
  const t = tones[tone] || tones.blue;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
          {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export function EngineeringOverviewPage({ feature, categoryTitle }: { feature: FeatureDef; categoryTitle: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [progress, setProgress] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [changes, setChanges] = useState<any[]>([]);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [budgets, setBudgets] = useState<any[]>([]);
  const [production, setProduction] = useState<any[]>([]);
  const [completions, setCompletions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [showCreate, setShowCreate] = useState(false);

  const role = getCurrentRoleForView();
  const allowCreate = canCreate('engineering', role);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const fetches: [string, (v: any[]) => void][] = [
      ['projectArchives', setProjects],
      ['progress', setProgress],
      ['plans', setPlans],
      ['changes', setChanges],
      ['milestones', setMilestones],
      ['constructionLogs', setLogs],
      ['budgets', setBudgets],
      ['productionValues', setProduction],
      ['completions', setCompletions],
    ];
    Promise.all(
      fetches.map(async ([name, setter]) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) setter(await res.json());
        } catch {}
      }),
    ).finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    let list = projects;
    if (statusFilter !== '全部') list = list.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [projects, search, statusFilter]);

  const inConstruction = projects.filter((p) => p.status === '在建');
  const completed = projects.filter((p) => p.status === '竣工' || p.status === '完工');
  const totalAmount = projects.reduce((s, p) => s + (Number(p.amount) || 0), 0);
  const overdue = projects.filter((p) => p.endDate && new Date(p.endDate).getTime() < Date.now() && p.status !== '竣工' && p.status !== '完工');
  const pendingPlans = plans.filter((p) => p.status === '待审批');
  const pendingChanges = changes.filter((c) => c.status === '待审批');
  const activeMilestones = milestones.filter((m) => m.status === '进行中');
  const nearEnd = projects
    .filter((p) => p.endDate && p.status === '在建')
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime())
    .slice(0, 5);

  const statusDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of projects) map.set(p.status || '未设置', (map.get(p.status || '未设置') || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const prodTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const pv of production) map.set(pv.month, (map.get(pv.month) || 0) + Number(pv.value || 0));
    return Array.from(map.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12);
  }, [production]);

  const budgetByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const b of budgets) {
      if (b.project) map.set(b.project, (map.get(b.project) || 0) + Number(b.amount || 0));
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [budgets]);

  const stats = [
    { icon: Building2, label: '项目总数', value: projects.length, sub: '累计建档', tone: 'blue' },
    { icon: TrendingUp, label: '在建项目', value: inConstruction.length, sub: '施工中', tone: 'emerald' },
    { icon: CheckCircle2, label: '已完工', value: completed.length, sub: '竣工/完工', tone: 'sky' },
    { icon: Wallet, label: '合同总额', value: fmtMoney(totalAmount), sub: '累计签约', tone: 'purple' },
    { icon: Clock, label: '待审批事项', value: pendingPlans.length + pendingChanges.length, sub: `需用计划${pendingPlans.length} · 变更${pendingChanges.length}`, tone: 'amber' },
    { icon: AlertTriangle, label: '逾期/延期', value: overdue.length, sub: '存在工期风险', tone: 'red' },
  ];

  const statusOptions = ['全部', '立项', '在建', '竣工', '完工', '停工', '暂缓'];

  const quickActions = [
    { label: '新建项目', href: '/engineering/project-archives', icon: Plus },
    { label: '上传文档', href: '/engineering/project-documents', icon: FileText },
    { label: '填报进度', href: '/engineering/progress', icon: Activity },
    { label: '施工日志', href: '/engineering/construction-logs', icon: ClipboardList },
    { label: '里程碑', href: '/engineering/milestones', icon: GitBranch },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">工程管理驾驶舱</h1>
        </div>
        <div className="flex items-center gap-2">
          {allowCreate && (
            <Link href="/engineering/project-archives">
              <Button className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新建项目</Button>
            </Link>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
      ) : (
        <>
          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* Charts row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-1">
              <CardHeader><CardTitle className="text-base font-semibold">项目状态分布</CardTitle></CardHeader>
              <CardContent>
                {statusDist.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">暂无数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={statusDist} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }) => `${name} ${value}`}>
                        {statusDist.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader><CardTitle className="text-base font-semibold">产值趋势（万元）</CardTitle></CardHeader>
              <CardContent>
                {prodTrend.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">暂无产值数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={prodTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} 万`, '产值']} />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={32} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Projects + side panels */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            {/* Project list */}
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-3">
                <CardTitle className="text-base font-semibold">项目清单</CardTitle>
                <div className="flex items-center gap-1.5">
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                      {s}
                    </button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder="搜索项目..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                {filtered.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>暂无项目</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filtered.map((p) => {
                      const remaining = daysRemaining(p.endDate);
                      return (
                        <Link key={p.id} href={`/engineering/project/${p.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 hover:shadow-sm transition-all group">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900 truncate">{p.name}</p>
                              {p.type && <Badge variant="outline" className={`text-[10px] px-1.5 py-0 flex-shrink-0 ${TYPE_BADGE[p.type] || ''}`}>{p.type}</Badge>}
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {p.code || '--'} · {p.customer || '建设单位未填'} · 竣工 {p.endDate || '-'}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">{fmtMoney(p.amount)}</p>
                            <div className="flex items-center justify-end gap-1.5 mt-0.5">
                              <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[p.status] || 'bg-gray-400'}`} />
                              <Badge variant="outline" className={`${STATUS_COLOR[p.status] || 'bg-gray-100'} text-[10px] px-1.5 py-0 border-0`}>{p.status}</Badge>
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Right panel */}
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base font-semibold">临近竣工 / 工期风险</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {nearEnd.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">暂无在建项目</p>
                  ) : nearEnd.map((p) => {
                    const r = daysRemaining(p.endDate);
                    return (
                      <div key={p.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-gray-50">
                        <span className="truncate text-gray-700 mr-2">{p.name}</span>
                        <span className={`text-xs font-medium flex-shrink-0 ${r.cls}`}>{r.text}</span>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base font-semibold">里程碑进度</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {activeMilestones.length === 0 ? (
                    <p className="text-sm text-gray-400 py-4 text-center">暂无进行中里程碑</p>
                  ) : activeMilestones.slice(0, 5).map((m) => (
                    <div key={m.id} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-700 truncate mr-2">{m.project} · {m.name}</span>
                        <span className="text-xs text-blue-600 font-medium flex-shrink-0">{Number(m.progress || 0)}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-blue-500 rounded-full" style={{ width: `${Number(m.progress || 0)}%` }} />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Bottom row */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">快捷操作</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-2">
                {quickActions.map((a) => (
                  <Link key={a.label} href={a.href}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm text-gray-700">
                    <a.icon className="w-4 h-4 text-blue-500" />
                    {a.label}
                  </Link>
                ))}
              </CardContent>
            </Card>

            <Card className="xl:col-span-2">
              <CardHeader><CardTitle className="text-base font-semibold">项目预算对比（元）</CardTitle></CardHeader>
              <CardContent>
                {budgetByProject.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">暂无预算数据</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={budgetByProject} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(Number(v) / 10000).toFixed(0)}万`} />
                      <YAxis type="category" dataKey="name" fontSize={10} width={140} tickLine={false} axisLine={false} />
                      <Tooltip formatter={(v: any) => [fmtMoney(Number(v)), '预算']} />
                      <Bar dataKey="value" fill="#8b5cf6" radius={[0, 4, 4, 0]} maxBarSize={18} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}

function getCurrentRoleForView(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const saved = localStorage.getItem('user');
    if (!saved) return null;
    return JSON.parse(saved).role || null;
  } catch {
    return null;
  }
}