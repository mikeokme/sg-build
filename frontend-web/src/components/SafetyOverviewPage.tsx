'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, SearchCheck, BrainCircuit, BellRing, ShieldCheck, Siren, Scale, AlertTriangle, ClipboardCheck, LifeBuoy, Users2, ArrowRight } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useProject } from '@/context/ProjectContext';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const MECH = [
  { key: '查找', en: 'Identify', icon: SearchCheck, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: '研判', en: 'Assess', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50' },
  { key: '预警', en: 'Warn', icon: BellRing, color: 'text-orange-600', bg: 'bg-orange-50' },
  { key: '防范', en: 'Prevent', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: '处置', en: 'Respond', icon: Siren, color: 'text-red-600', bg: 'bg-red-50' },
  { key: '责任', en: 'Accountability', icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50' },
];

const LEVEL_META: Record<string, { dot: string; text: string }> = {
  重大: { dot: 'bg-red-500', text: 'text-red-600' },
  较大: { dot: 'bg-orange-500', text: 'text-orange-600' },
  一般: { dot: 'bg-yellow-400', text: 'text-yellow-600' },
  低风险: { dot: 'bg-blue-500', text: 'text-blue-600' },
};
const LEVELS = ['重大', '较大', '一般', '低风险'];
const LEVEL_EN: Record<string, string> = {
  重大: 'Major', 较大: 'Significant', 一般: 'General', 低风险: 'Low',
};
const PLAN_TYPE_EN: Record<string, string> = {
  综合应急预案: 'Comprehensive', 专项应急预案: 'Specialized', 现场处置方案: 'On-site Response',
};

export function SafetyOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['riskLedgers', 'emergencyPlans', 'safetyInspections', 'safetyTrainings', 'safetyInputLedgers', 'safetyAccidents', 'safetyPunishments', 'safetyRewards'];

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

  const { matchesProject } = useProject();

  const risks = (data.riskLedgers || []).filter(matchesProject);
  const plans = (data.emergencyPlans || []).filter(matchesProject);
  const sInsp = (data.safetyInspections || []).filter(matchesProject);
  const sTrn = (data.safetyTrainings || []).filter(matchesProject);
  const sInput = (data.safetyInputLedgers || []).filter(matchesProject);
  const sAcc = (data.safetyAccidents || []).filter(matchesProject);
  const sPun = (data.safetyPunishments || []).filter(matchesProject);
  const sRwd = (data.safetyRewards || []).filter(matchesProject);

  const levelCount = useMemo(() => {
    const m: Record<string, number> = { 重大: 0, 较大: 0, 一般: 0, 低风险: 0 };
    for (const r of risks) if (m[r.level] !== undefined) m[r.level] += 1;
    return m;
  }, [risks]);

  const warningRisks = risks.filter((r) => r.status !== '受控');
  const rectifying = sInsp.filter((i) => i.status === '整改中' || i.status === '待整改');
  const doneInsp = sInsp.filter((i) => i.status === '已完成');
  const rectRate = sInsp.length ? Math.round((doneInsp.length / sInsp.length) * 100) : 0;
  const pendingDrill = plans.filter((p) => p.drillStatus === '待演练');
  const totalInput = sInput.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalTrain = sTrn.reduce((s, t) => s + (Number(t.participants) || 0), 0);
  const maxRiskCount = Math.max(1, ...LEVELS.map((l) => levelCount[l]));

  const mechStats: Record<string, number> = {
    查找: risks.length, 研判: risks.length, 预警: warningRisks.length, 防范: rectifying.length, 处置: plans.length, 责任: sPun.length + sRwd.length,
  };

  const stats = [
    { icon: SearchCheck, label: isZh ? '危险源总数' : 'Hazard Sources', value: String(risks.length), sub: isZh ? `${levelCount['重大']} 重大 / ${levelCount['较大']} 较大` : `${levelCount['重大']} major / ${levelCount['较大']} significant`, tone: 'blue' },
    { icon: AlertTriangle, label: isZh ? '预警风险' : 'Warning Risks', value: String(warningRisks.length), sub: isZh ? '需立即处置' : 'Immediate action needed', tone: 'orange' },
    { icon: ClipboardCheck, label: isZh ? '隐患整改率' : 'Rectification Rate', value: `${rectRate}%`, sub: isZh ? `${rectifying.length} 项整改中` : `${rectifying.length} rectifying`, tone: 'emerald' },
    { icon: LifeBuoy, label: isZh ? '应急预案' : 'Emergency Plans', value: String(plans.length), sub: isZh ? `${pendingDrill.length} 个待演练` : `${pendingDrill.length} drills pending`, tone: 'red' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? '水利安全生产风险管控"六项机制"全覆盖 · 双重预防机制 · 对标优秀智慧安全管理平台' : 'Full coverage of the "Six Mechanisms" for water-conservancy safety risk control · Dual prevention mechanism · Benchmarked against smart safety platforms'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/safety/six-mechanisms"><Button variant="outline" size="sm">{tFeat('safety', 'six-mechanisms')}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          <Link href="/safety/risk-ledger"><Button variant="outline" size="sm">{isZh ? '危险源台账' : 'Hazard Ledger'}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* 六项机制总览 */}
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><ShieldCheck className="w-4 h-4 text-blue-500" />{isZh ? '风险管控"六项机制"运行态势' : '"Six Mechanisms" Risk Control Status'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
                {MECH.map((m, i) => (
                  <Link key={m.key} href="/safety/six-mechanisms" className="block">
                    <div className="rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${m.bg}`}>
                        <m.icon className={`w-4 h-4 ${m.color}`} />
                      </div>
                      <p className="text-lg font-bold text-gray-900 mt-2">{mechStats[m.key]}</p>
                      <p className="text-xs text-gray-500">{isZh ? `${m.key}机制` : m.en}</p>
                      <p className="text-[10px] text-gray-300 mt-1">{i < 5 ? (isZh ? '→ 下一步' : '→ Next') : ''}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">{isZh ? '风险等级分布（红橙黄蓝）' : 'Risk Level Distribution (Red/Orange/Yellow/Blue)'}</h3>
                <div className="space-y-3">
                  {LEVELS.map((l) => {
                    const meta = LEVEL_META[l];
                    return (
                      <div key={l}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="flex items-center gap-2 text-gray-600"><span className={`w-3 h-3 rounded ${meta.dot}`} />{isZh ? `${l}风险` : `${LEVEL_EN[l]} risk`}</span>
                          <span className="text-gray-400">{levelCount[l]} {isZh ? '项' : ''} · {risks.length ? Math.round((levelCount[l] / risks.length) * 100) : 0}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${(levelCount[l] / maxRiskCount) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500 flex items-center gap-1"><Users2 className="w-3 h-3" />{isZh ? '安全教育培训' : 'Safety Training'}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">{sTrn.length} {isZh ? '场' : 'sessions'} · {totalTrain} {isZh ? '人次' : 'participants'}</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 p-3">
                    <p className="text-xs text-gray-500">{isZh ? '安全投入' : 'Safety Investment'}</p>
                    <p className="text-sm font-semibold text-gray-800 mt-1">¥{(totalInput / 10000).toFixed(0)}{isZh ? '万' : 'k'}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />{isZh ? '预警风险' : 'Warning Risks'}</h3>
                {warningRisks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isZh ? '当前全部受控' : 'All under control'}</p>}
                <div className="space-y-2">
                  {warningRisks.map((r) => (
                    <div key={r.id} className="rounded-lg border border-orange-200 bg-orange-50/50 p-2.5">
                      <p className="text-xs font-medium text-gray-800 flex items-center gap-1.5">
                        <span className={`w-2 h-2 rounded-full ${LEVEL_META[r.level]?.dot}`} />{r.name}
                      </p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{r.project} · {r.owner}</p>
                    </div>
                  ))}
                </div>
                <h3 className="text-sm font-semibold text-gray-700 mt-5 mb-2">{isZh ? `整改中隐患（${rectifying.length}）` : `Rectifying Hazards (${rectifying.length})`}</h3>
                <div className="space-y-1.5">
                  {rectifying.map((i) => (
                    <div key={i.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <span className="text-xs text-gray-700 truncate">{i.title}</span>
                      <Badge className="text-[10px] bg-amber-100 text-amber-700 flex-shrink-0 ml-2">{i.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-red-500" />{isZh ? '应急预案' : 'Emergency Plans'}</h3>
                <div className="grid grid-cols-3 gap-2 text-center mb-3">
                  {['综合应急预案', '专项应急预案', '现场处置方案'].map((t) => (
                    <div key={t} className="rounded-lg bg-gray-50 p-2">
                      <p className="text-base font-bold text-gray-700">{plans.filter((p) => p.type === t).length}</p>
                      <p className="text-[10px] text-gray-400">{isZh ? t.replace('应急预案', '').replace('现场处置方案', '现场处置') : PLAN_TYPE_EN[t] || t}</p>
                    </div>
                  ))}
                </div>
                {pendingDrill.length > 0 && (
                  <div className="rounded-lg bg-red-50 p-2.5 text-xs text-red-600">⚠ {isZh ? `${pendingDrill.map((p) => p.name).join('、')} 待演练` : `Drills pending: ${pendingDrill.map((p) => p.name).join(', ')}`}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">{isZh ? '事故记录' : 'Accident Records'}</h3>
                {sAcc.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无事故' : 'No accidents'}</p>}
                <div className="space-y-2">
                  {sAcc.map((a) => (
                    <div key={a.id} className="rounded-lg border border-red-100 bg-red-50/40 p-2.5">
                      <p className="text-xs font-medium text-gray-800">{a.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{a.project} · <span className="text-red-500">{a.level}</span></p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Scale className="w-4 h-4 text-indigo-500" />{isZh ? '责任奖惩' : 'Accountability Rewards & Penalties'}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{sRwd.length}</p>
                    <p className="text-xs text-gray-500">{isZh ? '安全奖励' : 'Safety Rewards'}</p>
                  </div>
                  <div className="rounded-xl bg-red-50 p-3 text-center">
                    <p className="text-lg font-bold text-red-600">{sPun.length}</p>
                    <p className="text-xs text-gray-500">{isZh ? '安全处罚' : 'Safety Penalties'}</p>
                  </div>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                  <span className="text-xs text-gray-600">{isZh ? '管控责任人' : 'Responsible Persons'}</span>
                  <span className="text-xs font-semibold text-indigo-700">{Array.from(new Set(risks.map((r) => r.owner))).length} {isZh ? '人' : ''}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}