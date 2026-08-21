'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Users, Layers, Megaphone, BellRing, ScrollText, Database, UserCircle, ArrowRight, Lock } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { categories } from '@/config/features';
import { categoryIcon, categoryTone } from '@/config/branding';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const ROLE_COLORS: Record<string, string> = {
  super_admin: 'bg-red-500', high_admin: 'bg-orange-500', general_admin: 'bg-amber-400',
  employee: 'bg-blue-500', outsource: 'bg-gray-400',
};
const ROLE_LABELS: Record<string, string> = {
  super_admin: '超级管理员', high_admin: '高权限管理员', general_admin: '一般管理员',
  employee: '普通职工', outsource: '外协人员',
};
const ROLE_LABELS_EN: Record<string, string> = {
  super_admin: 'Super Admin', high_admin: 'High Admin', general_admin: 'General Admin',
  employee: 'Employee', outsource: 'Outsourced',
};

export function PlatformOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['platformInfo', 'alerts', 'logs'];

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
    )
      .then(async () => {
        try {
          const res = await fetch(`${API_BASE}/auth/users`, { headers });
          if (res.ok) setUsers(await res.json());
        } catch {}
      })
      .finally(() => setLoading(false));
  }, []);

  const info = data.platformInfo || [];
  const alerts = data.alerts || [];
  const logs = data.logs || [];

  const published = info.filter((i) => i.status === '已发布');
  const pendingAlerts = alerts.filter((a) => a.status === '未处理');
  const severeAlerts = alerts.filter((a) => a.level === '严重');

  const roleStats = useMemo(() => {
    const m: Record<string, number> = {};
    for (const u of users) m[u.role] = (m[u.role] || 0) + 1;
    return m;
  }, [users]);
  const maxRole = Math.max(1, ...Object.values(roleStats));

  const moduleCount = categories.reduce((s, c) => s + c.features.length, 0);
  const dataSets = categories.filter((c) => c.features.some((f) => f.collection)).length;

  const sortedLogs = [...logs].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 8);

  const stats = [
    { icon: Users, label: isZh ? '平台用户' : 'Platform Users', value: String(users.length || '-'), sub: isZh ? '含 5 类系统角色' : '5 system roles', tone: 'blue' },
    { icon: Layers, label: isZh ? '业务中心' : 'Business Centers', value: String(categories.length), sub: isZh ? `${moduleCount} 个功能模块` : `${moduleCount} feature modules`, tone: 'emerald' },
    { icon: Megaphone, label: isZh ? '已发布公告' : 'Published Notices', value: String(published.length), sub: isZh ? `${info.length} 条信息` : `${info.length} items total`, tone: 'purple' },
    { icon: BellRing, label: isZh ? '未处理预警' : 'Open Alerts', value: String(pendingAlerts.length), sub: isZh ? `${severeAlerts.length} 条严重` : `${severeAlerts.length} critical`, tone: 'orange' },
    { icon: ScrollText, label: isZh ? '操作日志' : 'Audit Logs', value: String(logs.length), sub: isZh ? '最近 7 天活跃' : 'Active in last 7 days', tone: 'cyan' },
    { icon: Database, label: isZh ? '数据集合' : 'Data Collections', value: String(dataSets), sub: isZh ? '业务数据集中管理' : 'Centralized business data', tone: 'rose' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? '平台一体化运营管理：用户权限 · 业务模块 · 公告预警 · 审计日志 · 数据资产' : 'Unified platform operations: users & permissions · modules · notices & alerts · audit logs · data assets'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/platform/users"><span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 gap-1">{tFeat('platform', 'users')}<ArrowRight className="w-3.5 h-3.5" /></span></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((s) => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} sub={s.sub} tone={s.tone} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 用户角色分布 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><UserCircle className="w-4 h-4 text-blue-600" />{isZh ? '用户角色分布' : 'User Role Distribution'}</h3>
          {Object.keys(roleStats).length === 0 && <p className="text-xs text-gray-400">{isZh ? '暂无用户数据' : 'No user data'}</p>}
          <div className="space-y-3">
            {Object.entries(roleStats).map(([role, cnt]) => (
              <div key={role}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="flex items-center gap-1.5 text-gray-600"><span className={`w-2.5 h-2.5 rounded ${ROLE_COLORS[role] || 'bg-gray-400'}`} />{isZh ? (ROLE_LABELS[role] || role) : (ROLE_LABELS_EN[role] || role)}</span>
                  <span className="text-gray-400 font-medium">{cnt} {isZh ? '人' : ''} · {users.length ? Math.round((cnt / users.length) * 100) : 0}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${ROLE_COLORS[role] || 'bg-gray-400'}`} style={{ width: `${(cnt / maxRole) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 rounded-lg bg-blue-50 p-2.5 text-xs text-blue-600 flex items-center gap-1.5"><Lock className="w-3.5 h-3.5" />{isZh ? '平台中心仅超级管理员可配置' : 'Platform center configurable by super admins only'}</div>
        </CardContent></Card>

        {/* 模块全景 */}
        <Card className="lg:col-span-2"><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><Layers className="w-4 h-4 text-emerald-600" />{isZh ? '业务模块全景' : 'Business Module Overview'}</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {categories.map((c) => {
              const Icon = categoryIcon(c.key);
              const t = categoryTone(c.key);
              return (
                <div key={c.key} className="rounded-xl border border-gray-100 p-3 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className={`w-8 h-8 rounded-lg ${t.bg} flex items-center justify-center`}><Icon className={`w-4 h-4 ${t.text}`} /></div>
                    <Badge variant="outline" className="text-[10px]">{c.features.length} {isZh ? '功能' : 'features'}</Badge>
                  </div>
                  <p className="text-sm font-semibold text-gray-800 mt-2">{c.title}</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">{c.features.map((f) => f.title).slice(0, 4).join(' · ')}{c.features.length > 4 ? ' …' : ''}</p>
                </div>
              );
            })}
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 系统公告 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><Megaphone className="w-4 h-4 text-purple-600" />{isZh ? '系统公告' : 'System Notices'}</h3>
          {published.length === 0 && <p className="text-xs text-gray-400 text-center py-6">{isZh ? '暂无公告' : 'No notices'}</p>}
          <div className="space-y-2">
            {published.slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-lg border border-gray-100 p-2.5">
                <p className="text-xs font-medium text-gray-800">{p.title}</p>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{p.content}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className="text-[10px]">{p.type}</Badge>
                  <span className="text-[10px] text-gray-400">{p.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>

        {/* 预警中心 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><BellRing className="w-4 h-4 text-orange-500" />{isZh ? '预警中心' : 'Alert Center'}</h3>
          {alerts.length === 0 && <p className="text-xs text-gray-400 text-center py-6">{isZh ? '暂无预警' : 'No alerts'}</p>}
          <div className="space-y-2">
            {alerts.map((a) => (
              <div key={a.id} className={`rounded-lg border p-2.5 ${a.level === '严重' ? 'border-red-200 bg-red-50/50' : a.level === '警告' ? 'border-orange-200 bg-orange-50/50' : 'border-gray-100'}`}>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-medium text-gray-800 truncate">{a.title}</p>
                  <Badge className={`text-[10px] ml-2 flex-shrink-0 ${a.level === '严重' ? 'bg-red-100 text-red-700' : a.level === '警告' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-600'}`}>{a.level}</Badge>
                </div>
                <p className="text-[11px] text-gray-500 mt-1 line-clamp-2">{a.content}</p>
                <div className="flex items-center justify-between mt-1.5">
                  <Badge variant="outline" className={`text-[10px] ${a.status === '已处理' ? 'text-emerald-600' : 'text-rose-600'}`}>{a.status}</Badge>
                  <span className="text-[10px] text-gray-400">{a.date}</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent></Card>

        {/* 最近操作日志 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><ScrollText className="w-4 h-4 text-cyan-600" />{isZh ? '最近操作日志' : 'Recent Audit Logs'}</h3>
          {sortedLogs.length === 0 && <p className="text-xs text-gray-400 text-center py-6">{isZh ? '暂无日志' : 'No logs'}</p>}
          <div className="space-y-2">
            {sortedLogs.map((l) => (
              <div key={l.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-gray-800 truncate">{l.action}</p>
                  <p className="text-[11px] text-gray-400">{l.operator} · {l.module}</p>
                </div>
                <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{l.date}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}