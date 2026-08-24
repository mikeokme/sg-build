'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight, Building2, Wallet, Bell, ClipboardCheck, Clock, AlertTriangle,
  TrendingUp, Briefcase, Banknote, FileText,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/StatCard';
import { EngineeringBoard } from '@/components/EngineeringBoard';
import { categories } from '@/config/features';
import { CATEGORY_MIN_LEVEL, getRoleLevel } from '@/config/roles';
import { categoryIcon, categoryTone } from '@/config/branding';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const fmt = (v: number) => (v >= 100000000 ? `¥${(v / 100000000).toFixed(2)}亿` : v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${(v || 0).toLocaleString()}`);

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { t, tCat, tFeat, lang } = useT();
  const isZh = lang === 'zh';

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

  if (loading) return <div className="flex items-center justify-center py-32 text-gray-400">{t('loading')}</div>;

  const p = stats?.projects || {};
  const f = stats?.finance || {};
  const td = stats?.todos || {};
  const pro = stats?.production || {};
  const costData = (stats?.cost || []).map((c: any) => ({ ...c, plannedCost: c.plannedCost / 10000, actualCost: c.actualCost / 10000, profit: c.profit / 10000 }));
  const prodData = (pro.trend || []).map((x: any) => ({ ...x, value: x.value }));
  const pieData = [
    { name: t('underConstruction'), value: p.underConstruction || 0 },
    { name: t('completed2'), value: p.completed || 0 },
  ];
  const pieColors = ['#3b82f6', '#10b981'];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{t('welcome')}，{user?.username || 'admin'} · {today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/todos"><Badge variant="outline" className="px-3 py-1.5 gap-1 cursor-pointer hover:bg-orange-50 border-orange-200 text-orange-600"><Clock className="w-3.5 h-3.5" />{td.pendingTotal ?? 0} {t('pending')}</Badge></Link>
          <Link href="/notifications"><Badge variant="outline" className="px-3 py-1.5 gap-1 cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-600"><Bell className="w-3.5 h-3.5" />{stats?.unreadCount ?? 0} {t('unread')}</Badge></Link>
        </div>
      </div>

      {/* 核心指标 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={Building2} label={t('inBuilding')} value={p.underConstruction ?? 0} sub={`${t('totalProjects')} ${p.total ?? 0} · ${t('completed')} ${p.completed ?? 0}`} tone="blue" />
        <StatCard icon={Briefcase} label={t('contractTotal')} value={fmt(f.contractTotal ?? 0)} sub={`${t('invoiced')} ${fmt(f.invoiceOut ?? 0)} ${t('invoiceOut')}`} tone="purple" />
        <StatCard icon={TrendingUp} label={t('monthlyOutput')} value={fmt(pro.latest ?? 0)} sub={`${pro.latestMonth || '--'} ${t('statMonth')}`} tone="emerald" />
        <StatCard icon={Banknote} label={t('netIncome')} value={fmt(f.netIncome ?? 0)} sub={`${t('income')} ${fmt(f.totalRevenue ?? 0)} / ${t('expense')} ${fmt(f.totalSpend ?? 0)}`} tone="cyan" />
        <StatCard icon={ClipboardCheck} label={t('myApprovals')} value={td.pendingTotal ?? 0} sub={`${t('pendingPayments')} ${td.pendingPayments ?? 0} · ${t('myTasks')} ${td.myTasks ?? 0}`} tone="orange" />
        <StatCard icon={AlertTriangle} label={t('unhandledAlerts')} value={td.alertTotal ?? 0} sub={`${t('safetyRemediation')} ${stats?.quality?.safetyPending ?? 0} · ${t('qualityRemediation')} ${stats?.quality?.qualityPending ?? 0}`} tone="red" />
      </div>

      {/* 工程看板 */}
      <EngineeringBoard />

      {/* 图表区 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-base font-semibold">{t('outputTrend')}</CardTitle></CardHeader>
          <CardContent>
            {prodData.length === 0 ? <p className="text-sm text-gray-400 py-16 text-center">{t('noOutputData')}</p> : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={prodData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="month" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip formatter={(v: any) => `¥${Number(v).toLocaleString()} ${isZh ? '万' : '10k'}`} />
                  <Bar dataKey="value" name={t('monthlyOutput')} fill="#3b82f6" radius={[6, 6, 0, 0]} barSize={38} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">{t('projectStructure')}</CardTitle></CardHeader>
          <CardContent>
            {pieData[0].value + pieData[1].value === 0 ? <p className="text-sm text-gray-400 py-16 text-center">{t('noProject')}</p> : (
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
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Wallet className="w-4 h-4 text-purple-500" />{t('costAnalysis')}</CardTitle></CardHeader>
          <CardContent>
            {costData.length === 0 ? <p className="text-sm text-gray-400 py-16 text-center">{t('noCostData')}</p> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={costData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="project" fontSize={10} interval={0} />
                  <YAxis fontSize={11} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="plannedCost" name={t('plannedCost')} fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="actualCost" name={t('actualCost')} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="profit" name={t('profit')} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-orange-500" />{t('toDo')}</CardTitle></CardHeader>
          <CardContent>
            {(td.pendingTotal ?? 0) + (td.pendingPayments ?? 0) + (td.alertTotal ?? 0) + (td.myTasks ?? 0) === 0 ? (
              <p className="text-sm text-gray-400 py-10 text-center">{t('noTodos')}</p>
            ) : (
              <div className="space-y-2">
                <Link href="/todos" className="flex items-center justify-between p-2.5 rounded-lg bg-orange-50/60 hover:bg-orange-50">
                  <span className="text-sm text-gray-700">{t('myApprovals')}</span><Badge className="bg-orange-500">{td.pendingTotal ?? 0}</Badge>
                </Link>
                <Link href="/oa/tasks" className="flex items-center justify-between p-2.5 rounded-lg bg-blue-50/60 hover:bg-blue-50">
                  <span className="text-sm text-gray-700">{t('myTasks')}</span><Badge className="bg-blue-500">{td.myTasks ?? 0}</Badge>
                </Link>
                <Link href="/finance/payments" className="flex items-center justify-between p-2.5 rounded-lg bg-cyan-50/60 hover:bg-cyan-50">
                  <span className="text-sm text-gray-700">{t('pendingPayments')}</span><Badge className="bg-cyan-500">{td.pendingPayments ?? 0}</Badge>
                </Link>
                <Link href="/platform/alerts" className="flex items-center justify-between p-2.5 rounded-lg bg-red-50/60 hover:bg-red-50">
                  <span className="text-sm text-gray-700">{t('unhandledAlerts')}</span><Badge className="bg-red-500">{td.alertTotal ?? 0}</Badge>
                </Link>
                <Link href="/notifications" className="flex items-center justify-between p-2.5 rounded-lg bg-purple-50/60 hover:bg-purple-50">
                  <span className="text-sm text-gray-700">{t('unreadNotifications')}</span><Badge className="bg-purple-500">{stats?.unreadCount ?? 0}</Badge>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-red-500" />{t('alertAndNotice')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats?.alerts?.length === 0 && stats?.notices?.length === 0 ? (
                <p className="text-sm text-gray-400 py-10 text-center">{t('noAlertNotice')}</p>
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
        <h2 className="text-base font-semibold text-gray-900 mb-3">{t('businessCenter')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleCategories.map((cat) => {
            const Icon = categoryIcon(cat.key);
            const tone = categoryTone(cat.key);
            return (
              <Card key={cat.key} className={`${tone.bg} border ${tone.border} hover:shadow-md transition-all cursor-pointer`}>
                <CardContent className="p-5">
                  <Link href={`/${cat.key}/${cat.features[0].key}`} className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${tone.bg} border ${tone.border}`}>
                        <Icon className={`w-5 h-5 ${tone.text}`} />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">{tCat(cat.key)}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{cat.features.length} {t('featureModules')}</p>
                      </div>
                    </div>
                    <ArrowRight className={`w-4 h-4 ${tone.text} mt-1`} />
                  </Link>
<div className="mt-3 flex flex-wrap gap-1.5">
                    {cat.features.slice(0, 4).map((f) => (
                      <Link key={f.key} href={`/${cat.key}/${f.key}`}
                        className="text-xs px-2 py-1 rounded-md bg-white/70 border border-gray-200 text-gray-600 hover:text-blue-600 hover:border-blue-300 transition-colors">
                        {tFeat(cat.key, f.key)}
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