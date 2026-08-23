'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Target, ClipboardCheck, GraduationCap, Award, AlertTriangle, CircleCheck, Wrench, Scale, ArrowRight, SearchCheck, Layers, CheckCircle2, CircleDot, Clock } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useProject } from '@/context/ProjectContext';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const PDCA = [
  { key: 'P 策划', title: '策划 Plan', desc: '质量目标与培训计划', descEn: 'Quality goals & training plans', icon: Target, color: 'text-blue-600', bg: 'bg-blue-50' },
  { key: 'D 实施', title: '实施 Do', desc: '三检制 · 过程检查', descEn: 'Three-check system · Process inspection', icon: Wrench, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { key: 'C 检查', title: '检查 Check', desc: '问题整改闭环', descEn: 'Closed-loop rectification', icon: SearchCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
  { key: 'A 处置', title: '处置 Act', desc: '通病防治 · 奖惩激励', descEn: 'Defect prevention · Incentives', icon: Scale, color: 'text-violet-600', bg: 'bg-violet-50' },
];

const INSPECTION_STATUS_EN: Record<string, string> = {
  待整改: 'To Rectify', 整改中: 'Rectifying', 已完成: 'Completed',
};

const STATUS_META: Record<string, string> = {
  待整改: 'bg-rose-50 text-rose-600 border-rose-200',
  整改中: 'bg-amber-50 text-amber-600 border-amber-200',
  已完成: 'bg-emerald-50 text-emerald-600 border-emerald-200',
};

export function QualityOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['qualityInspections', 'qualityTrainings', 'qualityPunishments', 'qualityRewards', 'qualityAccidents', 'qualityDefects'];

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

  const insp = (data.qualityInspections || []).filter(matchesProject);
  const trn = (data.qualityTrainings || []).filter(matchesProject);
  const pun = (data.qualityPunishments || []).filter(matchesProject);
  const rwd = (data.qualityRewards || []).filter(matchesProject);
  const acc = (data.qualityAccidents || []).filter(matchesProject);
  const defs = (data.qualityDefects || []).filter(matchesProject);

  const rectifying = insp.filter((i) => i.status === '整改中' || i.status === '待整改');
  const done = insp.filter((i) => i.status === '已完成');
  const rectRate = insp.length ? Math.round((done.length / insp.length) * 100) : 0;
  const totalTrain = trn.reduce((s, t) => s + (Number(t.participants) || 0), 0);
  const defectActive = defs.filter((d) => d.status !== '已防治').length;

  const projectMap = useMemo(() => {
    const m = new Map<string, { total: number; done: number }>();
    for (const i of insp) {
      const k = i.project || '未标注';
      const cur = m.get(k) || { total: 0, done: 0 };
      cur.total += 1;
      if (i.status === '已完成') cur.done += 1;
      m.set(k, cur);
    }
    return [...m.entries()];
  }, [insp]);
  const maxProj = Math.max(1, ...projectMap.map(([, v]) => v.total));

  const stats = [
    { icon: ClipboardCheck, label: isZh ? '检查整改完成率' : 'Rectification Rate', value: `${rectRate}%`, sub: isZh ? `${rectifying.length} 项整改中` : `${rectifying.length} rectifying`, tone: 'emerald' },
    { icon: GraduationCap, label: isZh ? '质量培训' : 'Quality Training', value: String(trn.length), sub: isZh ? `${totalTrain} 人次参训` : `${totalTrain} participants`, tone: 'blue' },
    { icon: Award, label: isZh ? '质量奖惩' : 'Rewards & Penalties', value: isZh ? `${rwd.length} 奖 / ${pun.length} 罚` : `${rwd.length} R / ${pun.length} P`, sub: isZh ? '激励先进 · 问责失责' : 'Reward excellence · Assign accountability', tone: 'amber' },
    { icon: AlertTriangle, label: isZh ? '质量事故' : 'Quality Accidents', value: String(acc.length), sub: isZh ? '坚持四不放过' : 'Four-nevers principle', tone: 'rose' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? 'ISO 9001 过程方法 · PDCA 质量改进循环 · 三检制 · 质量通病防治 · 对标优秀智慧质量管理平台' : 'ISO 9001 process approach · PDCA quality improvement cycle · Three-check system · Defect prevention · Benchmarked against smart quality platforms'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/quality/quality-inspection"><Button variant="outline" size="sm">{isZh ? '质量检查' : 'Inspections'}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          <Link href="/quality/quality-defect"><Button variant="outline" size="sm">{isZh ? '通病防治' : 'Defect Prevention'}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          {/* PDCA 质量改进循环 */}
          <Card>
            <CardContent className="p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Target className="w-4 h-4 text-blue-500" />{isZh ? 'PDCA 质量改进循环（Plan–Do–Check–Act）' : 'PDCA Quality Improvement Cycle (Plan–Do–Check–Act)'}</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {PDCA.map((p, i) => (
                  <div key={p.key} className="rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${p.bg}`}>
                        <p.icon className={`w-4 h-4 ${p.color}`} />
                      </div>
                      {i < 3 && <ArrowRight className="w-3.5 h-3.5 text-gray-300" />}
                    </div>
                    <p className="text-sm font-semibold text-gray-800 mt-2">{isZh ? p.title : p.title.split(' ')[1]}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{isZh ? p.desc : p.descEn}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-600" />{isZh ? '项目质量检查态势' : 'Inspection Status by Project'}</h3>
                <div className="space-y-3">
                  {projectMap.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isZh ? '暂无检查记录' : 'No inspection records'}</p>}
                  {projectMap.map(([name, v]) => {
                    const rate = v.total ? Math.round((v.done / v.total) * 100) : 0;
                    return (
                      <div key={name}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600">{name}</span>
                          <span className="text-gray-400">{v.done}/{v.total} {isZh ? '项完成' : 'done'} · {rate}%</span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                          <div className="h-full rounded-full bg-emerald-500" style={{ width: `${(v.total / maxProj) * 100}%` }} />
                          <div className="-mt-2.5 h-2.5 rounded-full bg-emerald-500/25" style={{ width: `${rate}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="mt-4 grid grid-cols-3 gap-2 text-center">
                  {[['待整改', insp.filter((i) => i.status === '待整改').length, 'bg-rose-50 text-rose-600'], ['整改中', rectifying.filter((i) => i.status === '整改中').length, 'bg-amber-50 text-amber-600'], ['已完成', done.length, 'bg-emerald-50 text-emerald-600']].map(([st, n, cls]) => (
                    <div key={st as string} className={`rounded-xl ${cls} p-3`}>
                      <p className="text-lg font-bold">{n}</p>
                      <p className="text-xs">{isZh ? st : INSPECTION_STATUS_EN[st as string] || st}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Wrench className="w-4 h-4 text-violet-600" />{isZh ? '质量通病防治' : 'Defect Prevention'}</h3>
                {defs.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isZh ? '暂无通病台账' : 'No defect records'}</p>}
                <div className="space-y-2">
                  {defs.map((d) => (
                    <div key={d.id} className="rounded-lg border border-gray-100 p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-medium text-gray-800">{d.name}</p>
                        <Badge className={d.status === '已防治' ? 'bg-emerald-50 text-emerald-600 border-emerald-200 text-[10px]' : 'bg-amber-50 text-amber-600 border-amber-200 text-[10px]'}>{d.status}</Badge>
                      </div>
                      <p className="text-[11px] text-gray-500 mt-1">{d.position || d.project} · {d.cause}</p>
                    </div>
                  ))}
                </div>
                {defectActive > 0 && <div className="mt-3 rounded-lg bg-violet-50 p-2.5 text-xs text-violet-600">⚠ {isZh ? `${defectActive} 项通病防治中` : `${defectActive} defects under prevention`}</div>}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><GraduationCap className="w-4 h-4 text-blue-600" />{isZh ? '质量培训' : 'Quality Training'}</h3>
                {trn.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无培训' : 'No training records'}</p>}
                <div className="space-y-2">
                  {trn.map((t) => (
                    <div key={t.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div><p className="text-xs font-medium text-gray-800">{t.title}</p><p className="text-[11px] text-gray-400">{t.trainer} · {t.date}</p></div>
                      <Badge variant="outline" className="text-[10px]">{t.participants}{isZh ? '人' : ''}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Award className="w-4 h-4 text-amber-600" />{isZh ? '质量奖惩' : 'Rewards & Penalties'}</h3>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="rounded-xl bg-emerald-50 p-3 text-center">
                    <p className="text-lg font-bold text-emerald-600">{rwd.length}</p>
                    <p className="text-xs text-gray-500">{isZh ? '奖励' : 'Rewards'}</p>
                  </div>
                  <div className="rounded-xl bg-rose-50 p-3 text-center">
                    <p className="text-lg font-bold text-rose-600">{pun.length}</p>
                    <p className="text-xs text-gray-500">{isZh ? '处罚' : 'Penalties'}</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  {[...rwd, ...pun].slice(0, 4).map((r) => (
                    <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                      <span className="text-[11px] text-gray-600 truncate">{r.person} · {r.reason}</span>
                      <span className={`text-[11px] font-semibold ${r.type === '奖励' ? 'text-emerald-600' : 'text-rose-600'}`}>{r.type === '奖励' ? '+' : '-'}{r.amount}元</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-rose-500" />{isZh ? '质量事故' : 'Quality Accidents'}</h3>
                {acc.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无事故' : 'No accidents'}</p>}
                <div className="space-y-2">
                  {acc.map((a) => (
                    <div key={a.id} className="rounded-lg border border-red-100 bg-red-50/40 p-2.5">
                      <p className="text-xs font-medium text-gray-800">{a.title}</p>
                      <p className="text-[11px] text-gray-500 mt-0.5">{a.project} · <span className="text-red-500">{a.level}</span> · {a.date}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
                  <CircleCheck className="w-4 h-4" />{isZh ? '一次验收合格率达标，持续改进' : 'First-pass acceptance rate on target, continuous improvement'}
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}