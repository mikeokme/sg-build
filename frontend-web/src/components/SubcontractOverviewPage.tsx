'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Handshake, Users, Building2, FileText, Wallet, Clock, Loader2, Search,
  Star, TrendingUp, Truck, AlertTriangle, ClipboardCheck, ChevronRight,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { FeatureDef } from '@/config/features';
import { useProject } from '@/context/ProjectContext';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444'];

const EVAL_STYLE: Record<string, string> = {
  优秀: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  良好: 'bg-blue-100 text-blue-700 border-blue-200',
  合格: 'bg-amber-100 text-amber-700 border-amber-200',
  不合格: 'bg-red-100 text-red-700 border-red-200',
};

const CONTRACT_STYLE: Record<string, string> = {
  履行中: 'bg-blue-100 text-blue-700 border-blue-200',
  已完工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  已结算: 'bg-purple-100 text-purple-700 border-purple-200',
  草稿: 'bg-slate-100 text-slate-600 border-slate-200',
  已生效: 'bg-cyan-100 text-cyan-700 border-cyan-200',
};

function fmtMoney(v: number | string): string {
  const n = Number(v);
  if (!n) return '-';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function SubcontractOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('全部');
  const { matchesProject } = useProject();
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const names = [
      'laborSubcontractors', 'proSubcontractors', 'laborContracts', 'proContracts',
      'subcontractChanges', 'subcontractSettlements', 'subcontractPayments', 'subcontractEvaluations',
    ];
    Promise.all(
      names.map(async (name) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) {
            const d = await res.json();
            setData((prev: any) => ({ ...(prev || {}), [name]: d }));
          }
        } catch {}
      }),
    ).finally(() => setLoading(false));
  }, []);

  const labor = (data?.laborSubcontractors || []).filter(matchesProject);
  const pro = (data?.proSubcontractors || []).filter(matchesProject);
  const laborContracts = (data?.laborContracts || []).filter(matchesProject);
  const proContracts = (data?.proContracts || []).filter(matchesProject);
  const changes = (data?.subcontractChanges || []).filter(matchesProject);
  const settlements = (data?.subcontractSettlements || []).filter(matchesProject);
  const payments = (data?.subcontractPayments || []).filter(matchesProject);
  const evals = (data?.subcontractEvaluations || []).filter(matchesProject);

const contractAll = [...laborContracts, ...proContracts];
  const contractAmount = contractAll.reduce((s: any, c: any) => s + (Number(c.amount) || 0), 0);
  const settlementTotal = settlements.reduce((s: any, c: any) => s + (Number(c.amount) || 0), 0);
  const paidTotal = settlements.reduce((s: any, c: any) => s + (Number(c.paidAmount) || 0), 0);
  const paymentPending = payments.filter((p: any) => p.status === '待支付').length;
  const paymentTotal = payments.reduce((s: any, p: any) => s + (Number(p.amount) || 0), 0);
  const changePending = changes.filter((c: any) => c.status === '待审批').length;
  const workerTotal = labor.reduce((s: any, l: any) => s + (Number(l.workerCount) || 0), 0);
  const activeLabor = labor.filter((l: any) => l.status === '合作中').length;
  const activePro = pro.filter((p: any) => p.status === '合作中').length;
  const evalExcellent = evals.filter((e: any) => e.result === '优秀').length;
  const evalBad = evals.filter((e: any) => e.result === '不合格').length;

  const stats = [
    { icon: Handshake, label: isZh ? '分包商总数' : 'Subcontractors', value: labor.length + pro.length, sub: isZh ? `劳务${labor.length} · 专业${pro.length}` : `Labor ${labor.length} · Pro ${pro.length}`, tone: 'blue' },
    { icon: Users, label: isZh ? '在册劳务人数' : 'Registered Workers', value: workerTotal, sub: isZh ? `${activeLabor} 家劳务合作中` : `${activeLabor} labor partners active`, tone: 'cyan' },
    { icon: FileText, label: isZh ? '分包合同' : 'Subcontracts', value: contractAll.length, sub: isZh ? `劳务${laborContracts.length} · 专业${proContracts.length}` : `Labor ${laborContracts.length} · Pro ${proContracts.length}`, tone: 'purple' },
    { icon: Wallet, label: isZh ? '合同总额' : 'Contract Total', value: fmtMoney(contractAmount), sub: isZh ? `${contractAll.filter((c: any) => c.status === '履行中').length} 份履行中` : `${contractAll.filter((c: any) => c.status === '履行中').length} active`, tone: 'emerald' },
    { icon: AlertTriangle, label: isZh ? '待办事项' : 'To-Do Items', value: changePending + paymentPending, sub: isZh ? `变更${changePending} · 付款${paymentPending}` : `Changes ${changePending} · Payments ${paymentPending}`, tone: 'amber' },
    { icon: Truck, label: isZh ? '分包结算' : 'Settlements', value: settlements.length, sub: isZh ? `已付 ${fmtMoney(paidTotal)} / ${fmtMoney(settlementTotal)}` : `Paid ${fmtMoney(paidTotal)} / ${fmtMoney(settlementTotal)}`, tone: 'red' },
  ];

  // 合同类型分布
  const contractPie = [
    { name: isZh ? '劳务分包合同' : 'Labor Contracts', value: laborContracts.length },
    { name: isZh ? '专业分包合同' : 'Professional Contracts', value: proContracts.length },
  ].filter((x) => x.value > 0);

  // 劳务工种分布
  const workTypeDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const l of labor) map.set(l.workType || '未设置', (map.get(l.workType || '未设置') || 0) + (Number(l.workerCount) || 0));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [labor]);

  // 分包考核排行
  const evalSorted = [...evals].sort((a, b) => {
    const avgA = (Number(a.qualityScore) + Number(a.progressScore) + Number(a.safetyScore) + Number(a.cooperationScore)) / 4;
    const avgB = (Number(b.qualityScore) + Number(b.progressScore) + Number(b.safetyScore) + Number(b.cooperationScore)) / 4;
    return avgB - avgA;
  });

  // 分包合同金额排行
  const contractRank = [...contractAll].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 6);

  const filteredContracts = useMemo(() => {
    let list = contractAll;
    if (typeFilter !== '全部') list = list.filter((c: any) => typeFilter === '劳务' ? laborContracts.includes(c) : proContracts.includes(c));
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((c: any) => Object.values(c).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [contractAll, typeFilter, search]);

  const quickLinks = [
    { label: isZh ? '新增劳务分包商' : 'Add Labor Subcontractor', href: '/subcontract/labor-subcontractors', icon: Users },
    { label: isZh ? '新增专业分包商' : 'Add Pro Subcontractor', href: '/subcontract/pro-subcontractors', icon: Building2 },
    { label: isZh ? '劳务分包合同' : 'Labor Contracts', href: '/subcontract/labor-contracts', icon: FileText },
    { label: isZh ? '专业分包合同' : 'Pro Contracts', href: '/subcontract/pro-contracts', icon: ClipboardCheck },
    { label: isZh ? '分包结算' : 'Settlements', href: '/subcontract/subcontract-settlements', icon: Wallet },
    { label: isZh ? '分包考核' : 'Evaluations', href: '/subcontract/subcontract-eval', icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500">
          <TrendingUp className="w-3.5 h-3.5" />{isZh ? '劳务 + 专业 · 全周期管控' : 'Labor + Professional · Full lifecycle control'}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '合同类型分布' : 'Contract Type Distribution'}</CardTitle></CardHeader>
              <CardContent>
                {contractPie.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">{isZh ? '暂无合同数据' : 'No contract data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={contractPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }: any) => `${name} ${value}`}>
                        {contractPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '劳务工种人数分布' : 'Workers by Trade'}</CardTitle></CardHeader>
              <CardContent>
                {workTypeDist.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">{isZh ? '暂无劳务数据' : 'No labor data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={workTypeDist} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '分包商考核排行' : 'Evaluation Ranking'}</CardTitle></CardHeader>
              <CardContent>
                {evalSorted.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">{isZh ? '暂无考核数据' : 'No evaluation data'}</div>
                ) : (
                  <div className="space-y-2">
                    {evalSorted.slice(0, 5).map((e: any) => {
                      const avg = Math.round((Number(e.qualityScore) + Number(e.progressScore) + Number(e.safetyScore) + Number(e.cooperationScore)) / 4);
                      return (
                        <div key={e.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-gray-50">
                          <div className="flex items-center gap-2 min-w-0">
                            <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                            <span className="text-gray-700 truncate">{e.subcontractor}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs font-semibold text-gray-700 tabular-nums">{avg}</span>
                            <Badge variant="outline" className={`${EVAL_STYLE[e.result] || ''} text-[10px] px-1.5 py-0 border-0`}>{e.result}</Badge>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
                <CardTitle className="text-base font-semibold">{isZh ? '分包合同' : 'Subcontracts'}</CardTitle>
                <div className="flex items-center gap-1.5">
                  <button onClick={() => setTypeFilter('全部')}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${typeFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t('all')}</button>
                  <button onClick={() => setTypeFilter('劳务')}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${typeFilter === '劳务' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{isZh ? '劳务' : 'Labor'}</button>
                  <button onClick={() => setTypeFilter('专业')}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${typeFilter === '专业' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{isZh ? '专业' : 'Professional'}</button>
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder={isZh ? '搜索合同...' : 'Search contracts...'} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                {filteredContracts.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>{isZh ? '暂无分包合同' : 'No subcontracts'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredContracts.map((c: any) => (
                      <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                          <FileText className="w-4 h-4 text-purple-500" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-sm text-gray-900 truncate">{c.name}</p>
                            <Badge variant="outline" className={`${CONTRACT_STYLE[c.status] || ''} text-[10px] px-1.5 py-0 border-0`}>{c.status}</Badge>
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5 truncate">
                            {c.code} · {c.subcontractor} · {c.project} · {c.workType || c.category || ''}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-semibold text-gray-900 tabular-nums">{fmtMoney(c.amount)}</p>
                          <p className="text-[10px] text-gray-400">{isZh ? '签订' : 'Signed'} {c.signDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '合同金额排行' : 'Contract Amount Ranking'}</CardTitle></CardHeader>
                <CardContent>
                  {contractRank.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">{t('noData')}</p>
                  ) : (
                    <div className="space-y-2">
                      {contractRank.map((c: any) => (
                        <div key={c.id} className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-700 truncate mr-2">{c.name}</span>
                            <span className="text-xs text-purple-600 font-medium flex-shrink-0">{fmtMoney(c.amount)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (Number(c.amount) / (contractRank[0]?.amount || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '待办提醒' : 'Reminders'}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {[
                    { label: isZh ? '分包合同变更待审批' : 'Contract changes pending approval', count: changePending, href: '/subcontract/subcontract-changes', tone: 'text-amber-600' },
                    { label: isZh ? '分包付款待支付' : 'Payments due', count: paymentPending, href: '/subcontract/subcontract-payments', tone: 'text-red-600' },
                    { label: isZh ? '分包结算待审批' : 'Settlements pending approval', count: settlements.filter((s: any) => s.status === '待审批').length, href: '/subcontract/subcontract-settlements', tone: 'text-blue-600' },
                    { label: isZh ? '考核不合格分包商' : 'Failing subcontractors', count: evalBad, href: '/subcontract/subcontract-eval', tone: 'text-red-600' },
                  ].map((t) => (
                    <Link key={t.label} href={t.href} className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm">
                      <span className="text-gray-600">{t.label}</span>
                      <span className={`font-semibold tabular-nums ${t.count > 0 ? t.tone : 'text-gray-300'}`}>{t.count}</span>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '快捷操作' : 'Quick Actions'}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2">
              {quickLinks.map((a) => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm text-gray-700">
                  <a.icon className="w-4 h-4 text-blue-500" />
                  {a.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}