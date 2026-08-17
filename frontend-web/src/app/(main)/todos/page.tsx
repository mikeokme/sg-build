'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import {
  ClipboardCheck, ListTodo, Wallet, AlertTriangle, Wrench, ArrowRight,
  Loader2, Inbox, Briefcase, CheckCircle2, Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const API_BASE = 'http://localhost:3000';

const typeMeta: Record<string, { label: string; icon: any; cls: string }> = {
  approval: { label: '待我审批', icon: ClipboardCheck, cls: 'bg-orange-50 text-orange-600 border-orange-200' },
  task: { label: '我的任务', icon: ListTodo, cls: 'bg-blue-50 text-blue-600 border-blue-200' },
  payment: { label: '待付款', icon: Wallet, cls: 'bg-cyan-50 text-cyan-600 border-cyan-200' },
  alert: { label: '未处理预警', icon: AlertTriangle, cls: 'bg-red-50 text-red-600 border-red-200' },
  inspection: { label: '整改待办', icon: Wrench, cls: 'bg-amber-50 text-amber-600 border-amber-200' },
};

export default function TodosPage() {
  const router = useRouter();
  const params = useSearchParams();
  const jump = params?.get('jump') || '';
  const [groups, setGroups] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchTodos = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    try {
      const res = await fetch(`${API_BASE}/todos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const d = await res.json();
        setGroups(d.groups || []);
        setTotal(d.total || 0);
      }
    } catch {}
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const jumpRoute: Record<string, string> = {
    approvals: '/oa/approvals', projectInits: '/market/project-init',
    majorRequests: '/procurement/major-requests', plans: '/engineering/plans',
    changes: '/engineering/changes', reimbursements: '/finance/reimbursements',
    subcontractPlans: '/engineering/subcontract-plans', tasks: '/oa/tasks',
  };

  const resolveLink = (link: string) => {
    if (!link) return '#';
    if (link.startsWith('/todos?jump=')) {
      const c = link.replace('/todos?jump=', '');
      return jumpRoute[c] || '#';
    }
    return link;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">待办中心</p>
          <h1 className="text-2xl font-bold text-gray-900">我的待办</h1>
          <p className="text-gray-500 text-sm mt-0.5">汇总各业务模块中需要您处理的审批、任务与预警</p>
        </div>
        <Badge className="px-3 py-1.5 bg-blue-600">{total} 条待办</Badge>
      </div>

      {jump && (
        <div className="p-3 rounded-lg bg-amber-50 border border-amber-200 text-sm text-amber-700 flex items-center gap-2">
          <AlertTriangle className="w-4 h-4" />
          已为您定位到相关待办，点击条目跳转对应业务模块处理。
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...</div>
      ) : groups.length === 0 ? (
        <Card className="py-20 flex flex-col items-center gap-3 text-gray-400">
          <Inbox className="w-12 h-12" />
          <p className="text-gray-500">太棒了，当前没有待办事项</p>
          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {groups.map((g) => {
            const meta = typeMeta[g.type] || typeMeta.task;
            const Icon = meta.icon;
            return (
              <Card key={g.key}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-semibold flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <span className={`w-8 h-8 rounded-lg flex items-center justify-center border ${meta.cls}`}><Icon className="w-4 h-4" /></span>
                      {g.label}
                    </span>
                    <Badge variant="outline" className="bg-gray-50">{g.count} 条</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-1.5">
                  {g.items.slice(0, 8).map((it: any) => (
                    <Link key={it.id} href={resolveLink(it.link)} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 group">
                      <Circle className="w-2.5 h-2.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" fill="currentColor" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate font-medium">{it.title}</p>
                        <p className="text-xs text-gray-400 truncate">{it.sub}</p>
                      </div>
                      {it.meta && <Badge variant="outline" className="text-[10px] flex-shrink-0 bg-white">{it.meta}</Badge>}
                      <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 flex-shrink-0" />
                    </Link>
                  ))}
                  {g.count > 8 && <p className="text-xs text-gray-400 text-center pt-1">还有 {g.count - 8} 条...</p>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}