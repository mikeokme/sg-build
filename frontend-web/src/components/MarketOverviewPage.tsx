'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Users, Target, Trophy, FileSignature, FileCheck, FolderKanban, TrendingUp, ArrowRight } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const STAGE_EN: Record<string, string> = {
  初步接触: 'Initial Contact', 方案沟通: 'Solution Discussion', 报价谈判: 'Quote Negotiation', 投标: 'Bidding', 中标: 'Won',
};

const STAGES = ['初步接触', '方案沟通', '报价谈判', '投标', '中标'];
const STAGE_COLORS: Record<string, string> = {
  初步接触: 'bg-blue-400', 方案沟通: 'bg-cyan-400', 报价谈判: 'bg-amber-400', 投标: 'bg-orange-400', 中标: 'bg-emerald-400',
};

function fmtMoney(n: number | undefined) {
  if (n == null || isNaN(n)) return '0';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(0)}万`;
  return `¥${n}`;
}

export function MarketOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['customers', 'opportunities', 'bids', 'bidReports', 'contracts', 'projectInits'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    Promise.all(
      collections.map(async (name) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) {
            const list = await res.json();
            setData((p) => ({ ...p, [name]: list }));
          }
        } catch {}
      }),
    ).finally(() => setLoading(false));
  }, []);

  const customers = data.customers || [];
  const opportunities = data.opportunities || [];
  const bids = data.bids || [];
  const bidReports = data.bidReports || [];
  const contracts = data.contracts || [];
  const projectInits = data.projectInits || [];

  const today = new Date().toISOString().slice(0, 10);

  const pipeline = useMemo(() => {
    const totals: Record<string, number> = {};
    const counts: Record<string, number> = {};
    for (const s of STAGES) { totals[s] = 0; counts[s] = 0; }
    for (const o of opportunities) {
      const st = o.stage;
      if (totals[st] === undefined) continue;
      totals[st] += Number(o.amount) || 0;
      counts[st] += 1;
    }
    return { totals, counts };
  }, [opportunities]);

  const won = bidReports.filter((r) => r.result === '中标');
  const lost = bidReports.filter((r) => r.result === '未中标');
  const winRate = won.length + lost.length ? (won.length / (won.length + lost.length)) * 100 : 0;

  const runningContracts = contracts.filter((c) => c.status === '履行中' || c.status === '已生效');
  const runningAmount = runningContracts.reduce((s, c) => s + (Number(c.amount) || 0), 0);

  const pendingApproval = projectInits.filter((p) => p.status === '待审批');
  const upcomingBids = bids.filter((b) => String(b.bidDate || '') >= today);

  const wonRanking = [...won].sort((a, b) => (Number(b.amount) || 0) - (Number(a.amount) || 0)).slice(0, 5);

  const maxStage = Math.max(1, ...STAGES.map((s) => pipeline.totals[s]));

  const stats = [
    { icon: Users, label: isZh ? '客户总数' : 'Customers', value: String(customers.length), sub: isZh ? `${customers.filter((c) => c.level === '战略').length} 家战略客户` : `${customers.filter((c) => c.level === '战略').length} strategic`, tone: 'blue' },
    { icon: Target, label: isZh ? '商机总额' : 'Opportunity Value', value: fmtMoney(opportunities.reduce((s, o) => s + (Number(o.amount) || 0), 0)), sub: isZh ? `${opportunities.length} 条商机跟单` : `${opportunities.length} opportunities`, tone: 'purple' },
    { icon: Trophy, label: isZh ? '中标率' : 'Win Rate', value: `${winRate.toFixed(0)}%`, sub: isZh ? `${won.length} 中标 / ${bidReports.length} 次投标` : `${won.length} won / ${bidReports.length} bids`, tone: 'emerald' },
    { icon: FileSignature, label: isZh ? '履行合同额' : 'Active Contract Value', value: fmtMoney(runningAmount), sub: isZh ? `${runningContracts.length} 份履行中` : `${runningContracts.length} active`, tone: 'amber' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/market/opportunities"><Button variant="outline" size="sm">{tFeat('market', 'opportunities')}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          <Link href="/market/customers"><Button variant="outline" size="sm">{tFeat('market', 'customers')}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-purple-500" />{isZh ? '销售漏斗' : 'Sales Funnel'}</h2>
                  <span className="text-xs text-gray-400">{isZh ? '商机总额' : 'Total'} {fmtMoney(opportunities.reduce((s, o) => s + (Number(o.amount) || 0), 0))}</span>
                </div>
                <div className="space-y-3">
                  {STAGES.map((s, i) => (
                    <div key={s}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-gray-600 font-medium w-20">{isZh ? s : STAGE_EN[s] || s}</span>
                        <span className="text-gray-400">{pipeline.counts[s]} {isZh ? '条' : ''} · {fmtMoney(pipeline.totals[s])}</span>
                      </div>
                      <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                        <div className={`h-full rounded-full ${STAGE_COLORS[s]}`} style={{ width: `${(pipeline.totals[s] / maxStage) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  {opportunities.length === 0 && <p className="text-sm text-gray-400 text-center py-4">{isZh ? '暂无商机数据' : 'No opportunity data'}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><Trophy className="w-4 h-4 text-emerald-500" />{isZh ? '中标排行' : 'Win Ranking'}</h2>
                  <span className="text-xs text-gray-400">{isZh ? '按金额' : 'By amount'}</span>
                </div>
                <div className="space-y-2.5">
                  {wonRanking.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无中标记录' : 'No wins yet'}</p>}
                  {wonRanking.map((r, i) => (
                    <div key={r.id} className="flex items-center gap-3">
                      <span className={`w-5 h-5 rounded-md text-[10px] font-bold flex items-center justify-center flex-shrink-0 ${i === 0 ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-gray-700 truncate">{r.name}</p>
                        <p className="text-[11px] text-gray-400">{r.date}</p>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">{fmtMoney(r.amount)}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileCheck className="w-4 h-4 text-blue-500" />{isZh ? '近期投标' : 'Upcoming Bids'}</h2>
                <div className="space-y-2.5">
                  {upcomingBids.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无进行中的投标' : 'No bids in progress'}</p>}
                  {upcomingBids.map((b) => (
                    <div key={b.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 truncate">{b.name}</p>
                        <p className="text-[11px] text-gray-400">{b.bidDate} · {b.customer}</p>
                      </div>
                      <Badge className={`text-[10px] flex-shrink-0 ${b.status === '准备中' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'}`}>{b.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FolderKanban className="w-4 h-4 text-purple-500" />{tFeat('market', 'project-init')}</h2>
                <div className="space-y-2.5">
                  {projectInits.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无立项记录' : 'No project initiations'}</p>}
                  {projectInits.map((p) => (
                    <div key={p.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 truncate">{p.name}</p>
                        <p className="text-[11px] text-gray-400">{p.customer} · {fmtMoney(p.amount)}</p>
                      </div>
                      <Badge className={`text-[10px] flex-shrink-0 ${p.status === '已立项' ? 'bg-emerald-100 text-emerald-700' : p.status === '待审批' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700'}`}>{p.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileSignature className="w-4 h-4 text-amber-500" />{isZh ? '合同执行' : 'Contract Execution'}</h2>
                <div className="space-y-2.5">
                  {contracts.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无合同' : 'No contracts'}</p>}
                  {contracts.slice(0, 6).map((c) => (
                    <div key={c.id} className="flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 truncate">{c.name}</p>
                        <p className="text-[11px] text-gray-400">{c.code} · {c.party}</p>
                      </div>
                      <Badge className={`text-[10px] flex-shrink-0 ${c.status === '履行中' ? 'bg-blue-100 text-blue-700' : c.status === '已生效' ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {pendingApproval.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-center justify-between">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <FileCheck className="w-4 h-4" />{isZh ? `有 ${pendingApproval.length} 个立项待审批：${pendingApproval.map((p) => p.name).join('、')}` : `${pendingApproval.length} project initiations pending approval: ${pendingApproval.map((p) => p.name).join(', ')}`}
                </p>
                <Link href="/market/project-init"><Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100">{isZh ? '去审批' : 'Approve'}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}