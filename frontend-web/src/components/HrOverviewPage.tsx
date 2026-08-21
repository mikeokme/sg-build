'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Users, Building2, HardHat, CalendarCheck2, GraduationCap, Gift, Cake, ArrowRight, Award, AlertTriangle, Phone, TrendingUp } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const DEPT_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500'];

const ATT_EN: Record<string, string> = {
  出勤: 'Present', 迟到: 'Late', 早退: 'Early Leave', 请假: 'On Leave', 缺勤: 'Absent',
};

export function HrOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['staff', 'attendances', 'teams', 'trainings', 'rewards'];

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

  const staff: any[] = data.staff || [];
  const attendances: any[] = data.attendances || [];
  const teams: any[] = data.teams || [];
  const trainings: any[] = data.trainings || [];
  const rewards: any[] = data.rewards || [];

  const active = staff.filter((s) => s.status === '在职');
  const deptCount = new Set(staff.map((s) => s.department)).size;

  const maxDate = attendances.reduce((m, a) => (a.date > m ? a.date : m), '');
  const todayAtt = attendances.filter((a) => a.date === maxDate);
  const attBy = (st: string) => todayAtt.filter((a) => a.status === st).length;
  const attRate = todayAtt.length ? Math.round((attBy('出勤') / todayAtt.length) * 100) : 0;

  const deptMap = new Map<string, number>();
  staff.forEach((s) => deptMap.set(s.department, (deptMap.get(s.department) || 0) + 1));
  const depts = [...deptMap.entries()].sort((a, b) => b[1] - a[1]);
  const maxDept = Math.max(...depts.map((d) => d[1]), 1);

  const eduMap = new Map<string, number>();
  staff.forEach((s) => {
    const k = s.education || '未填写';
    eduMap.set(k, (eduMap.get(k) || 0) + 1);
  });
  const eduOrder = ['硕士及以上', '本科', '大专', '高中/中专', '初中及以下', '未填写'];
  const eduList = [...eduMap.entries()].sort((a, b) => eduOrder.indexOf(a[0]) - eduOrder.indexOf(b[0]));

  const recent = [...staff].sort((a, b) => (b.hireDate || '').localeCompare(a.hireDate || '')).slice(0, 5);

  const today = new Date();
  const birthdays: any[] = staff
    .filter((s) => s.birthDate)
    .map((s) => {
      const bd = new Date(s.birthDate);
      const thisY = new Date(today.getFullYear(), bd.getMonth(), bd.getDate());
      const nextY = new Date(today.getFullYear() + 1, bd.getMonth(), bd.getDate());
      const diffDays = Math.round(((thisY >= today ? thisY : nextY).getTime() - today.getTime()) / 86400000);
      return { ...s, diffDays, age: today.getFullYear() - bd.getFullYear() };
    })
    .filter((x) => x.diffDays <= 90)
    .sort((a, b) => a.diffDays - b.diffDays);

  const teamMembers = teams.reduce((s, t) => s + (Number(t.members) || 0), 0);
  const planned = trainings.filter((t) => t.status === '计划中' || t.status === '进行中');
  const rwdCnt = rewards.filter((r) => r.type === '奖励').length;
  const punCnt = rewards.filter((r) => r.type === '处罚').length;

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tCat(categoryKey)} · {tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isZh ? '覆盖组织编制、考勤、班组、培训与激励的一体化人力资源全景 · 对标全球先进 HR 平台' : 'Integrated HR overview covering organization, attendance, teams, training and incentives · Benchmarked against leading global HR platforms'}</p>
        </div>
        <Link href={`/${categoryKey}/hr-staff`} className="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700">
          {tFeat('hr', 'hr-staff')} <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        <StatCard icon={Users} label={isZh ? '在职员工' : 'Active Staff'} value={active.length} sub={isZh ? `共 ${staff.length} 人 · ${deptCount} 个部门` : `${staff.length} total · ${deptCount} departments`} tone="blue" />
        <StatCard icon={HardHat} label={isZh ? '施工班组' : 'Work Teams'} value={teams.length} sub={isZh ? `产业工人共 ${teamMembers} 人` : `${teamMembers} workers total`} tone="emerald" />
        <StatCard icon={CalendarCheck2} label={isZh ? '今日出勤率' : "Today's Attendance"} value={`${attRate}%`} sub={isZh ? `出勤 ${attBy('出勤')}/${todayAtt.length} 人` : `${attBy('出勤')}/${todayAtt.length} present`} tone="cyan" />
        <StatCard icon={GraduationCap} label={isZh ? '培训计划' : 'Training Plans'} value={planned.length} sub={isZh ? '计划/进行中培训' : 'Planned / ongoing'} tone="amber" />
        <StatCard icon={Award} label={isZh ? '奖惩激励' : 'Rewards & Penalties'} value={`${rwdCnt}/${punCnt}`} sub={isZh ? '激励与问责并重' : 'Incentives with accountability'} tone="rose" />
        <StatCard icon={Cake} label={isZh ? '生日提醒' : 'Birthday Reminders'} value={birthdays.length} sub={isZh ? '未来90天生日提醒' : 'Next 90 days'} tone="violet" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><Building2 className="w-4 h-4 text-blue-600" />{isZh ? '部门人员分布' : 'Staff by Department'}</h3>
          <div className="space-y-3">
            {depts.map(([name, cnt], i) => (
              <div key={name}>
                <div className="flex justify-between text-xs mb-1"><span className="text-gray-600">{name}</span><span className="text-gray-400 font-medium">{cnt} {isZh ? '人' : ''}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${DEPT_COLORS[i % DEPT_COLORS.length]}`} style={{ width: `${(cnt / maxDept) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><GraduationCap className="w-4 h-4 text-emerald-600" />{isZh ? '学历结构' : 'Education Background'}</h3>
          <div className="flex flex-wrap gap-2">
            {eduList.map(([name, cnt]) => (
              <div key={name} className="border border-gray-200 rounded-xl px-3 py-2 text-center min-w-[88px]">
                <p className="text-lg font-bold text-gray-900">{cnt}</p>
                <p className="text-[11px] text-gray-500">{name}</p>
              </div>
            ))}
          </div>
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mt-6 mb-3"><CalendarCheck2 className="w-4 h-4 text-cyan-600" />{isZh ? '今日考勤概况' : "Today's Attendance"}</h3>
          <div className="flex flex-wrap gap-2">
            {[['出勤', attBy('出勤'), 'text-emerald-600 bg-emerald-50'], ['迟到', attBy('迟到'), 'text-amber-600 bg-amber-50'], ['早退', attBy('早退'), 'text-orange-600 bg-orange-50'], ['请假', attBy('请假'), 'text-blue-600 bg-blue-50'], ['缺勤', attBy('缺勤'), 'text-rose-600 bg-rose-50']].map(([st, n, cls]) => (
              <Badge key={st as string} variant="outline" className={`${cls} border-0 px-3 py-1.5`}>{isZh ? st : ATT_EN[st as string] || st} <b className="ml-1">{n}</b></Badge>
            ))}
            {todayAtt.length === 0 && <span className="text-xs text-gray-400">{isZh ? '暂无考勤记录' : 'No attendance records'}</span>}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><Cake className="w-4 h-4 text-violet-600" />{isZh ? '生日提醒（未来90天）' : 'Birthdays (Next 90 Days)'}</h3>
          {birthdays.length === 0 ? (
            <p className="text-xs text-gray-400">{isZh ? '未来90天内暂无员工生日' : 'No birthdays in the next 90 days'}</p>
          ) : (
            <div className="space-y-2">
              {birthdays.map((s) => (
                <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-violet-100 text-violet-600 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>
                    <div><p className="text-sm font-medium text-gray-800">{s.name} <span className="text-[11px] text-gray-400">{s.department}</span></p><p className="text-[11px] text-gray-400">{s.age}{isZh ? '岁' : ''}</p></div>
                  </div>
                  <Badge className={s.diffDays <= 7 ? 'bg-rose-50 text-rose-600 border-rose-200' : 'bg-violet-50 text-violet-600 border-violet-200'}>{s.diffDays === 0 ? t('today') : isZh ? `${s.diffDays}天后` : `in ${s.diffDays}d`}</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><HardHat className="w-4 h-4 text-emerald-600" />{isZh ? '施工班组一览' : 'Work Teams'} <Badge variant="outline" className="text-[10px]">{teams.length}</Badge></h3>
          <div className="space-y-2 max-h-64 overflow-auto">
            {teams.map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                <div><p className="text-sm font-medium text-gray-800">{t.name}</p><p className="text-[11px] text-gray-400">{t.project} · {isZh ? `班组长 ${t.leader}` : `Lead: ${t.leader}`}</p></div>
                <Badge variant="outline" className="text-[11px]">{t.members}{isZh ? '人' : ''}</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><TrendingUp className="w-4 h-4 text-blue-600" />{isZh ? '近期入职' : 'Recent Hires'}</h3>
          <div className="space-y-2">
            {recent.map((s) => (
              <div key={s.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">{s.name.charAt(0)}</div>
                  <div><p className="text-sm font-medium text-gray-800">{s.name}</p><p className="text-[11px] text-gray-400">{s.position} · {s.department}</p></div>
                </div>
                <span className="text-[11px] text-gray-400">{(s.hireDate || '').slice(0, 10)}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>

        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><GraduationCap className="w-4 h-4 text-amber-600" />{isZh ? '培训计划' : 'Training Plans'}</h3>
          <div className="space-y-2">
            {trainings.map((t) => (
              <div key={t.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                <div><p className="text-sm font-medium text-gray-800">{t.title}</p><p className="text-[11px] text-gray-400">{t.trainer} · {t.date} · {isZh ? `${t.participants}人参训` : `${t.participants} participants`}</p></div>
                <Badge className={t.status === '已完成' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : t.status === '进行中' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-amber-50 text-amber-600 border-amber-200'}>{t.status}</Badge>
              </div>
            ))}
          </div>
          {rewards.length > 0 && (
            <>
              <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mt-5 mb-3"><AlertTriangle className="w-4 h-4 text-rose-500" />{isZh ? '奖惩动态' : 'Rewards & Penalties Feed'}</h3>
              <div className="space-y-2">
                {rewards.map((r) => (
                  <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                    <div><p className="text-sm font-medium text-gray-800">{r.person}</p><p className="text-[11px] text-gray-400">{r.reason}</p></div>
                    <Badge className={r.type === '奖励' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}>{(r.type === '奖励' ? '+' : '-')}{r.amount}元</Badge>
                  </div>
                ))}
              </div>
            </>
          )}
        </CardContent></Card>
      </div>
    </div>
  );
}