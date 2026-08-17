'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Target, Building2, ShoppingCart, Boxes, Wallet, ShieldCheck,
  Users, Settings, Database, Bell, Truck, ClipboardCheck, Clock, AlertTriangle,
  TrendingUp, Briefcase, Banknote, FileText, CircleCheck,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/config/features';
import { CATEGORY_MIN_LEVEL, getRoleLevel } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const categoryIcons: Record<string, any> = {
  oa: Bell, market: Target, engineering: Building2, procurement: ShoppingCart,
  material: Boxes, equipment: Truck, finance: Wallet, quality: ShieldCheck,
  hr: Users, platform: Settings, resource: Database,
};

const colors = [
  { text: 'text-blue-600', bg: 'bg-blue-50 border-blue-100', hover: 'hover:border-blue-300' },
  { text: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100', hover: 'hover:border-emerald-300' },
  { text: 'text-orange-600', bg: 'bg-orange-50 border-orange-100', hover: 'hover:border-orange-300' },
  { text: 'text-purple-600', bg: 'bg-purple-50 border-purple-100', hover: 'hover:border-purple-300' },
  { text: 'text-cyan-600', bg: 'bg-cyan-50 border-cyan-100', hover: 'hover:border-cyan-300' },
  { text: 'text-rose-600', bg: 'bg-rose-50 border-rose-100', hover: 'hover:border-rose-300' },
  { text: 'text-teal-600', bg: 'bg-teal-50 border-teal-100', hover: 'hover:border-teal-300' },
  { text: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100', hover: 'hover:border-indigo-300' },
  { text: 'text-amber-600', bg: 'bg-amber-50 border-amber-100', hover: 'hover:border-amber-300' },
  { text: 'text-sky-600', bg: 'bg-sky-50 border-sky-100', hover: 'hover:border-sky-300' },
  { text: 'text-fuchsia-600', bg: 'bg-fuchsia-50 border-fuchsia-100', hover: 'hover:border-fuchsia-300' },
];

const fmt = (v: number) => (v >= 100000000 ? `¥${(v / 100000000).toFixed(2)}亿` : v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${(v || 0).toLocaleString()}`);

function StatCard({ icon: Icon, label, value, sub, tone }: any) {
  const tones: Record<string, any> = {
    blue: 'text-blue-600 bg-blue-50',
    emerald: 'text-emerald-600 bg-emerald-50',
    orange: 'text-orange-600 bg-orange-50',
    purple: 'text-purple-600 bg-purple-50',
    red: 'text-red-600 bg-red-50',
    cyan: 'text-cyan-600 bg-cyan-50',
  };
  const t = tones[tone] || tones.blue;
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${t}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-gray-500">{label}</p>
          <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
          {sub && <p className="text-[11px] text-gray-400 truncate">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/dashboard/stats`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });
  const userLevel = getRoleLevel(user?.role);
  const visibleCategories = categories.filter((cat) => userLevel >= (CATEGORY_MIN_LEVEL[cat.key] ?? 40));

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400">数据加载中...</div>;

  const p = stats?.projects || {};
  const f = stats?.finance || {};
  const t = stats?.todos || {};
  const pro = stats?.production || {};
  const costData = (stats?.cost || []).map((c: any) => ({ ...c, 计划成本: c.plannedCost / 10000, 实际成本: c.actualCost / 10000, 利润: c.profit / 10000 }));
  const prodData = (pro.trend || []).map((x: any) => ({ ...x, 产值: x.value }));
  const pieData = [
    { name: '在建项目', value: p.underConstruction || 0 },
    { name: '竣工项目', value: p.completed || 0 },
  ];
  const pieColors = ['#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 text-sm mt-0.5">欢迎回来，{user?.username || 'admin'} · {today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/todos"><Badge variant="outline" className="px-3 py-1.5 gap-1 cursor-pointer hover:bg-orange-50 border-orange-200 text-orange-600"><Clock className="w-3.5 h-3.5" />{t.pendingTotal ?? 0} 条待办</Badge></Link>
          <Link href="/notifications"><Badge variant="outline" className="px-3 py-1.5 gap-1 cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-600"><Bell className="w-3.5 h-3.5" />{stats?.unreadCount ?? 0} 条未读</Badge></Link>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Building2} label="在建项目" value={p.underConstruction ?? 0} sub={`共 ${p.total ?? 0} 个 · 竣工 ${p.completed ?? 0}`} tone="blue" />
        <StatCard icon={Briefcase} label="合同总额" value={fmt(f.contractTotal ?? 0)} sub={`累计签订 ${fmt(f.invoiceOut ?? 0)} 销项发票`} tone="purple" />
        <StatCard icon={TrendingUp} label="本月产值" value={fmt(pro.latest ?? 0)} sub={`${pro.latestMonth || '--'} 统计`} tone="emerald" />
        <StatCard icon={Banknote} label="资金净流入" value={fmt(f.netIncome ?? 0)} sub={`收 ${fmt(f.totalRevenue ?? 0)} / 支 ${fmt(f.totalSpend ?? 0)}`} tone="cyan" />
        <StatCard icon={ClipboardCheck} label="待我审批" value={t.pendingTotal ?? 0} sub={`待付款 ${t.pendingPayments ?? 0} · 我的任务 ${t.myTasks ?? 0}`} tone="orange" />
        <StatCard icon={AlertTriangle} label="未处理预警" value={t.alertTotal ?? 0} sub={`安全整改 ${stats?.quality?.safetyPending ?? 0} · 质量整改 ${stats?.quality?.qualityPending ?? 0}`} tone="red" />
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-semibold">产值趋势（万元）</CardTitle></CardHeader>
          <CardContent>
            {prodData.length === 0 ? <p className="text-sm text-gray-400 py-16 text-center">暂无产值数据</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={prodData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: any) => `¥${Number(v).toLocaleString()} 万`} />
                  <Bar dataKey="产值" fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={38} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">项目结构</CardTitle></CardHeader>
          <CardContent>
            {pieData[0].value + pieData[1].value === 0 ? <p className="text-sm text-gray-400 py-16 text-center">暂无项目</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={(e: any) => `${e.name} ${e.value}`}>
                    {pieData.map((_, i) => <Cell key={i} fill={pieColors[i % pieColors.length]} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 成本分析 + 待办 + 预警 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-500" />项目成本分析（万元）</CardTitle></CardHeader>
          <CardContent>
            {costData.length === 0 ? <p className="text-sm text-gray-400 py-16 text-center">暂无成本数据</p> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={costData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="project" fontSize={10} interval={0} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="计划成本" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="实际成本" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="利润" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-orange-500" />待我处理</CardTitle></CardHeader>
          <CardContent>
            {(t.pendingTotal ?? 0) + (t.pendingPayments ?? 0) + (t.alertTotal ?? 0) + (t.myTasks ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">暂无待办事项</p>
            ) : (
              <div className="space-y-2">
                <Link href="/todos" className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/60 hover:bg-orange-50">
                  <span className="text-sm text-gray-700">待我审批</span><Badge className="bg-orange-500">{t.pendingTotal ?? 0}</Badge>
                </Link>
                <Link href="/oa/tasks" className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 hover:bg-blue-50">
                  <span className="text-sm text-gray-700">我的任务</span><Badge className="bg-blue-500">{t.myTasks ?? 0}</Badge>
                </Link>
                <Link href="/finance/payments" className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50/60 hover:bg-cyan-50">
                  <span className="text-sm text-gray-700">待付款</span><Badge className="bg-cyan-500">{t.pendingPayments ?? 0}</Badge>
                </Link>
                <Link href="/platform/alerts" className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/60 hover:bg-red-50">
                  <span className="text-sm text-gray-700">未处理预警</span><Badge className="bg-red-500">{t.alertTotal ?? 0}</Badge>
                </Link>
                <Link href="/notifications" className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/60 hover:bg-purple-50">
                  <span className="text-sm text-gray-700">未读通知</span><Badge className="bg-purple-500">{stats?.unreadCount ?? 0}</Badge>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />预警 & 公告</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.alerts?.length === 0 && stats?.notices?.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">暂无预警与公告</p>
              ) : (
                <>
                  {(stats?.alerts || []).map((a: any) => (
                    <Link key={a.id} href="/platform/alerts" className="flex items-center gap-2 p-2 rounded-lg bg-red-50/60 hover:bg-red-50">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">{a.title}</p><p className="text-xs text-gray-400">{a.date}</p></div>
                    </Link>
                  ))}
                  {(stats?.notices || []).map((n: any) => (
                    <Link key={n.id} href="/oa/notices" className="flex items-center gap-2 p-2 rounded-lg bg-blue-50/60 hover:bg-blue-50">
                      <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">{n.title}</p><p className="text-xs text-gray-400">{n.publisher} · {n.date}</p></div>
                    </Link>
                  ))}
                </>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 业务中心 */}
      <div>
        <h2 className="text-base font-semibold text-gray-900 mb-3">业务中心</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleCategories.map((cat, i) => {
            const Icon = categoryIcons[cat.key] || Building2;
            const c = colors[i % colors.length];
            return (
              <Card key={cat.key} className={`${c.bg.split(' ')[1]} ${c.hover} hover:shadow-md transition-all cursor-pointer`}>
                <CardContent className="p-5">
                  <Link href={`/${cat.key}/${cat.features[0].key}`} className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${c.bg.split(' ')[0]} border ${c.bg.split(' ')[1]}`}>
                        <Icon className={`w-5 h-5 ${c.text}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{cat.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.features.length} 个功能模块</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${c.text} mt-1`} />
                  </Link>
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {cat.features.slice(0, 4).map((f) => (
                      <Link key={f.key} href={`/${cat.key}/${f.key}`}
                        className="text-xs px-2 py-1 rounded-md bg-white/70 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                        {f.title}
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}