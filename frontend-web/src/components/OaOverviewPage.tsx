'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Bell, ClipboardCheck, CalendarDays, Users, ListTodo, FolderOpen, Clock, AlertTriangle, CheckCircle2, Send, MessageSquare, ChevronRight, FileText, Megaphone, TrendingUp, Sparkles } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const PRIORITY_STYLE: Record<string, string> = {
  紧急: 'text-red-600 bg-red-50 border-red-200',
  高: 'text-orange-600 bg-orange-50 border-orange-200',
  中: 'text-blue-600 bg-blue-50 border-blue-200',
  低: 'text-gray-600 bg-gray-50 border-gray-200',
};

const TASK_STATUS_EN: Record<string, string> = {
  未开始: 'Not Started', 进行中: 'In Progress', 已完成: 'Completed', 已逾期: 'Overdue',
};

function fmtDate(d: string) {
  if (!d) return '';
  const dt = new Date(d);
  return `${dt.getMonth() + 1}月${dt.getDate()}日`;
}

function timeAgo(d: string) {
  if (!d) return '';
  const diff = Date.now() - new Date(d).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}小时前`;
  return `${Math.floor(h / 24)}天前`;
}

export function OaOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['approvals', 'schedules', 'meetings', 'tasks', 'notices', 'documents', 'notifications'];

  useEffect(() => {
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
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

  const approvals = data.approvals || [];
  const schedules = data.schedules || [];
  const meetings = data.meetings || [];
  const tasks = data.tasks || [];
  const notices = data.notices || [];
  const documents = data.documents || [];
  const notifications = data.notifications || [];

  const today = new Date().toISOString().slice(0, 10);
  const todayStr = fmtDate(today);

  const pendingApprovals = approvals.filter((a) => a.status === '待审批');
  const myApprovals = approvals.filter((a) => a.applicant === (user?.username || user?.name || ''));
  const todaySchedules = schedules.filter((s) => String(s.date || '').startsWith(today));
  const upcomingMeetings = meetings
    .filter((m) => String(m.date || '') >= today)
    .sort((a, b) => (a.date || '').localeCompare(b.date || ''))
    .slice(0, 4);
  const todayTasks = tasks.filter((t) => String(t.dueDate || '').startsWith(today) && t.status !== '已完成');
  const overdueTasks = tasks.filter((t) => t.status !== '已完成' && t.dueDate && String(t.dueDate) < today);
  const myTasks = tasks.filter((t) => t.assignee === (user?.username || user?.name || '') && t.status !== '已完成');
  const publishedNotices = notices.filter((n) => n.status === '已发布');
  const unread = notifications.filter((n) => !n.read);

  const taskByStatus = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const t of tasks) {
      const s = t.status || '未开始';
      if (!map.has(s)) map.set(s, []);
      map.get(s)!.push(t);
    }
    return map;
  }, [tasks]);

  const stats = [
    { icon: ClipboardCheck, label: isZh ? '待我审批' : 'My Approvals', value: pendingApprovals.length, tone: 'orange', link: '/oa/approvals' },
    { icon: ListTodo, label: isZh ? '我的任务' : 'My Tasks', value: myTasks.length, tone: 'blue', link: '/oa/tasks' },
    { icon: CalendarDays, label: isZh ? '今日日程' : "Today's Schedule", value: todaySchedules.length, tone: 'emerald', link: '/oa/calendar' },
    { icon: Users, label: isZh ? '近期会议' : 'Upcoming Meetings', value: upcomingMeetings.length, tone: 'purple', link: '/oa/meetings' },
  ];

  const quickLinks = [
    { label: isZh ? '发起审批' : 'New Approval', href: '/oa/approvals', icon: Send, tone: 'text-orange-600 bg-orange-50' },
    { label: isZh ? '发布公告' : 'Post Notice', href: '/oa/notices', icon: Megaphone, tone: 'text-blue-600 bg-blue-50' },
    { label: isZh ? '新建日程' : 'New Schedule', href: '/oa/calendar', icon: CalendarDays, tone: 'text-emerald-600 bg-emerald-50' },
    { label: isZh ? '预约会议' : 'Book Meeting', href: '/oa/meetings', icon: Users, tone: 'text-purple-600 bg-purple-50' },
    { label: isZh ? '新建任务' : 'New Task', href: '/oa/tasks', icon: ListTodo, tone: 'text-cyan-600 bg-cyan-50' },
    { label: isZh ? '上传文档' : 'Upload Document', href: '/oa/documents', icon: FolderOpen, tone: 'text-amber-600 bg-amber-50' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-blue-500" />
            {todayStr} · {isZh ? `待办 ${pendingApprovals.length + myTasks.length + todaySchedules.length + overdueTasks.length} 项` : `${pendingApprovals.length + myTasks.length + todaySchedules.length + overdueTasks.length} todos`} · {isZh ? `未读通知 ${unread.length} 条` : `${unread.length} unread`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Link href="/chat"><Button variant="outline" size="sm"><MessageSquare className="w-4 h-4 mr-1.5" />{isZh ? '消息' : 'Messages'}</Button></Link>
          <Link href="/todos"><Button className="bg-blue-600 hover:bg-blue-700" size="sm"><ClipboardCheck className="w-4 h-4 mr-1.5" />{isZh ? '待办中心' : 'Todos'}</Button></Link>
        </div>
      </div>

      {/* 统计卡 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} tone={s.tone} to={s.link} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* 待办区 */}
        <div className="xl:col-span-2 space-y-4">
          {/* 今日焦点 */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <CardTitle className="text-base font-semibold">{isZh ? '今日待办' : "Today's To-Dos"}</CardTitle>
              <Badge variant="secondary" className="text-xs">{pendingApprovals.length + todaySchedules.length + todayTasks.length + overdueTasks.length} {isZh ? '项' : 'items'}</Badge>
            </CardHeader>
            <CardContent>
              {(pendingApprovals.length + todaySchedules.length + todayTasks.length + overdueTasks.length) === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">{isZh ? '今日无待办，专注工作 🎉' : 'Nothing due today. Stay focused 🎉'}</div>
              ) : (
                <div className="space-y-3">
                  {overdueTasks.map((t) => (
                    <Link key={t.id} href="/oa/tasks" className="flex items-center gap-3 p-3 rounded-xl bg-red-50/70 hover:bg-red-50">
                      <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{t.title}</p>
                        <p className="text-xs text-red-500">{isZh ? `已逾期 · 截止 ${t.dueDate}` : `Overdue · due ${t.dueDate}`}</p>
                      </div>
                      <Badge variant="outline" className="text-xs flex-shrink-0 border-red-200 text-red-600 bg-white">{t.priority}</Badge>
                    </Link>
                  ))}
                  {pendingApprovals.slice(0, 3).map((a) => (
                    <Link key={a.id} href="/oa/approvals" className="flex items-center gap-3 p-3 rounded-xl bg-orange-50/70 hover:bg-orange-50">
                      <Clock className="w-4 h-4 text-orange-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{a.title}</p>
                        <p className="text-xs text-gray-400">{a.type || (isZh ? '审批' : 'Approval')} · {a.applicant || '-'} · {a.date}</p>
                      </div>
                      {Number(a.amount) > 0 && <span className="text-sm font-semibold text-emerald-600 flex-shrink-0 tabular-nums">¥{Number(a.amount).toLocaleString()}</span>}
                    </Link>
                  ))}
                  {todayTasks.map((t) => (
                    <Link key={t.id} href="/oa/tasks" className="flex items-center gap-3 p-3 rounded-xl bg-blue-50/70 hover:bg-blue-50">
                      <ListTodo className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{t.title}</p>
                        <p className="text-xs text-gray-400">{isZh ? '今日到期' : 'Due today'} · {t.assignee || '-'}</p>
                      </div>
                      <Badge variant="outline" className={`text-xs flex-shrink-0 ${PRIORITY_STYLE[t.priority] || ''}`}>{t.priority}</Badge>
                    </Link>
                  ))}
                  {todaySchedules.map((s) => (
                    <Link key={s.id} href="/oa/calendar" className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50/70 hover:bg-emerald-50">
                      <CalendarDays className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{s.title}</p>
                        <p className="text-xs text-gray-400">{s.location || ''} · {s.owner || ''}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 任务看板预览 */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <CardTitle className="text-base font-semibold">{isZh ? '任务看板' : 'Task Board'}</CardTitle>
              <Badge variant="secondary" className="text-xs">{tasks.length} {isZh ? '项任务' : 'tasks'}</Badge>
              <Link href="/oa/tasks" className="ml-auto text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">{isZh ? '进入看板' : 'Open board'}<ChevronRight className="w-3.5 h-3.5" /></Link>
            </CardHeader>
            <CardContent>
              {tasks.length === 0 ? (
                <div className="text-center py-10 text-gray-400 text-sm">{isZh ? '暂无任务' : 'No tasks'}</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  {['未开始', '进行中', '已完成', '已逾期'].map((status) => {
                    const list = status === '已逾期' ? overdueTasks : (taskByStatus.get(status) || []);
                    return (
                      <div key={status} className="rounded-xl bg-gray-50 p-3">
                        <div className="flex items-center gap-2 mb-2.5">
                          <span className={`w-2 h-2 rounded-full ${status === '已完成' ? 'bg-emerald-500' : status === '已逾期' ? 'bg-red-500' : status === '进行中' ? 'bg-blue-500' : 'bg-gray-400'}`} />
                          <span className="text-xs font-medium text-gray-600">{isZh ? status : TASK_STATUS_EN[status] || status}</span>
                          <span className="ml-auto text-[10px] text-gray-400">{list.length}</span>
                        </div>
                        <div className="space-y-1.5">
                          {list.slice(0, 3).map((t) => (
                            <div key={t.id} className="bg-white rounded-lg p-2 shadow-sm border border-gray-100">
                              <p className="text-xs text-gray-700 line-clamp-2">{t.title}</p>
                              <div className="flex items-center justify-between mt-1.5">
                                <span className="text-[10px] text-gray-400">{t.assignee || '-'}</span>
                                {t.priority === '紧急' && <span className="text-[9px] text-red-500 font-medium">{isZh ? '紧急' : 'Urgent'}</span>}
                              </div>
                            </div>
                          ))}
                          {list.length === 0 && <p className="text-center text-[11px] text-gray-300 py-2">{isZh ? '空' : 'Empty'}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* 公告 */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <CardTitle className="text-base font-semibold flex items-center gap-2"><Megaphone className="w-4 h-4 text-blue-500" />{isZh ? '最新公告' : 'Latest Notices'}</CardTitle>
              <Badge variant="secondary" className="text-xs">{publishedNotices.length} {isZh ? '条' : ''}</Badge>
              <Link href="/oa/notices" className="ml-auto text-xs text-blue-600 hover:text-blue-700 flex items-center gap-0.5">{t('all')}<ChevronRight className="w-3.5 h-3.5" /></Link>
            </CardHeader>
            <CardContent>
              {publishedNotices.length === 0 ? (
                <div className="text-center py-8 text-gray-400 text-sm">{isZh ? '暂无公告' : 'No notices'}</div>
              ) : (
                <div className="space-y-2">
                  {publishedNotices.slice(0, 3).map((n) => (
                    <Link key={n.id} href="/oa/notices" className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <FileText className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-800 truncate">{n.title}</p>
                        <p className="text-xs text-gray-400">{n.publisher || '-'} · {n.date}</p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-300" />
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* 右侧栏 */}
        <div className="space-y-4">
          {/* 快捷操作 */}
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '快捷操作' : 'Quick Actions'}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 gap-2">
              {quickLinks.map((a) => (
                <Link key={a.label} href={a.href} className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm text-gray-700">
                  <span className={`w-7 h-7 rounded-lg flex items-center justify-center ${a.tone}`}><a.icon className="w-4 h-4" /></span>
                  {a.label}
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 近期会议 */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <CardTitle className="text-base font-semibold">{isZh ? '近期会议' : 'Upcoming Meetings'}</CardTitle>
              <Badge variant="secondary" className="text-xs">{upcomingMeetings.length}</Badge>
              <Link href="/oa/meetings" className="ml-auto text-xs text-blue-600 hover:text-blue-700"><ChevronRight className="w-3.5 h-3.5" /></Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingMeetings.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">{isZh ? '暂无会议安排' : 'No meetings scheduled'}</p>
              ) : upcomingMeetings.map((m) => (
                <Link key={m.id} href="/oa/meetings" className="flex gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-10 h-10 rounded-lg bg-purple-50 flex flex-col items-center justify-center flex-shrink-0">
                    <span className="text-[8px] text-purple-400 leading-none">{fmtDate(m.date).split('月')[0]}</span>
                    <span className="text-sm font-bold text-purple-600 leading-tight">{fmtDate(m.date).split('月')[1]?.replace('日', '')}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-800 truncate">{m.title}</p>
                    <p className="text-xs text-gray-400 truncate">{m.host || ''} · {m.location || ''}</p>
                  </div>
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* 未读通知 */}
          <Card>
            <CardHeader className="flex flex-row items-center gap-3 pb-3">
              <CardTitle className="text-base font-semibold">{isZh ? '未读通知' : 'Unread Notifications'}</CardTitle>
              <Badge variant="secondary" className="text-xs">{unread.length} {isZh ? '条' : ''}</Badge>
              <Link href="/notifications" className="ml-auto text-xs text-blue-600 hover:text-blue-700"><ChevronRight className="w-3.5 h-3.5" /></Link>
            </CardHeader>
            <CardContent>
              {unread.length === 0 ? (
                <p className="text-center py-6 text-gray-400 text-sm">{isZh ? '暂无未读通知' : 'No unread notifications'}</p>
              ) : (
                <div className="space-y-2">
                  {unread.slice(0, 4).map((n) => (
                    <Link key={n.id} href={n.link || '/notifications'} className="flex items-start gap-2 p-2.5 rounded-lg hover:bg-gray-50">
                      <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-gray-700 truncate">{n.title}</p>
                        <p className="text-xs text-gray-400 truncate">{n.content}</p>
                        <p className="text-[10px] text-gray-300 mt-0.5">{timeAgo(n.createdAt)}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}