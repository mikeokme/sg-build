'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Target, Building2, ShoppingCart, Boxes, Wallet, ShieldCheck, Users, Settings, Database, Bell, Truck, ClipboardCheck, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/config/features';
import { CATEGORY_MIN_LEVEL, getRoleLevel } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const categoryIcons: Record<string, any> = {
  oa: Bell,
  market: Target,
  engineering: Building2,
  procurement: ShoppingCart,
  material: Boxes,
  equipment: Truck,
  finance: Wallet,
  quality: ShieldCheck,
  hr: Users,
  platform: Settings,
  resource: Database,
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

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [pendingApprovals, setPendingApprovals] = useState<any[]>([]);
  const [notices, setNotices] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    fetch(`${API_BASE}/collections/approvals`, { headers })
      .then((r) => r.json())
      .then((d) => setPendingApprovals(Array.isArray(d) ? d.filter((x) => x.status === '待审批') : []))
      .catch(() => {});
    fetch(`${API_BASE}/collections/notices`, { headers })
      .then((r) => r.json())
      .then((d) => setNotices(Array.isArray(d) ? d : []))
      .catch(() => {});
    fetch(`${API_BASE}/collections/schedules`, { headers })
      .then((r) => r.json())
      .then((d) => setSchedules(Array.isArray(d) ? d : []))
      .catch(() => {});
  }, []);

  const today = new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' });

  const userLevel = getRoleLevel(user?.role);
  const visibleCategories = categories.filter((cat) => userLevel >= (CATEGORY_MIN_LEVEL[cat.key] ?? 40));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
          <p className="text-gray-500 text-sm mt-0.5">欢迎回来，{user?.username || 'admin'} · {today}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/oa/approvals"><Badge variant="outline" className="px-3 py-1.5 gap-1 cursor-pointer hover:bg-orange-50 border-orange-200 text-orange-600"><Clock className="w-3.5 h-3.5" />{pendingApprovals.length} 条待审批</Badge></Link>
          <Link href="/oa/notices"><Badge variant="outline" className="px-3 py-1.5 gap-1 cursor-pointer hover:bg-blue-50 border-blue-200 text-blue-600"><Bell className="w-3.5 h-3.5" />{notices.length} 条公告</Badge></Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardCheck className="w-4 h-4 text-orange-500" />待我审批</CardTitle></CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">暂无待审批事项</p> : (
              <div className="space-y-2">
                {pendingApprovals.map((it) => (
                  <Link key={it.id} href="/oa/approvals" className="flex items-center gap-3 p-2.5 rounded-lg bg-orange-50/60 hover:bg-orange-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">{it.title}</p><p className="text-xs text-gray-400">{it.type} · ¥{Number(it.amount || 0).toLocaleString()}</p></div>
                    <ArrowRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Bell className="w-4 h-4 text-blue-500" />最新公告</CardTitle></CardHeader>
          <CardContent>
            {notices.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">暂无公告</p> : (
              <div className="space-y-2">
                {notices.slice(0, 4).map((it) => (
                  <Link key={it.id} href="/oa/notices" className="flex items-center gap-3 p-2.5 rounded-lg bg-blue-50/60 hover:bg-blue-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">{it.title}</p><p className="text-xs text-gray-400">{it.publisher} · {it.date}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Clock className="w-4 h-4 text-emerald-500" />近期日程</CardTitle></CardHeader>
          <CardContent>
            {schedules.length === 0 ? <p className="text-sm text-gray-400 py-4 text-center">暂无日程</p> : (
              <div className="space-y-2">
                {schedules.slice(0, 4).map((it) => (
                  <Link key={it.id} href="/oa/calendar" className="flex items-center gap-3 p-2.5 rounded-lg bg-emerald-50/60 hover:bg-emerald-50 transition-colors">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                    <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">{it.title}</p><p className="text-xs text-gray-400">{it.date} · {it.location || '未设地点'}</p></div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

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