'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCheck, Trash2, Bell, Inbox } from 'lucide-react';

const API_BASE = 'http://localhost:14725';

const typeMeta: Record<string, { label: string; className: string }> = {
  approval: { label: '审批', className: 'border-orange-300 text-orange-600 bg-orange-50' },
  task: { label: '任务', className: 'border-blue-300 text-blue-600 bg-blue-50' },
  system: { label: '系统', className: 'border-purple-300 text-purple-600 bg-purple-50' },
  alert: { label: '预警', className: 'border-red-300 text-red-600 bg-red-50' },
};

function formatTime(iso: string): string {
  if (!iso) return '';
  const d = new Date(iso);
  const now = Date.now();
  const diff = now - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return '刚刚';
  if (mins < 60) return `${mins}分钟前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}小时前`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}天前`;
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function NotificationsPage() {
  const router = useRouter();
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const [search, setSearch] = useState('');

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) { router.replace('/login'); return; }
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setList(await res.json());
    } catch {}
    finally { setLoading(false); }
  }, [router]);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  // SSE 实时推送
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;
    const es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);
    es.onmessage = (ev) => { try { const d = JSON.parse(ev.data); if (d?.notification) fetchNotifications(); } catch {} };
    return () => es.close();
  }, [fetchNotifications]);

  const markRead = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setList((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
    setList((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const remove = async (id: string) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/notifications/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setList((prev) => prev.filter((n) => n.id !== id));
  };

  const filtered = list.filter((n) => {
    if (filter === 'unread' && n.read) return false;
    if (filter === 'read' && !n.read) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (n.title || '').toLowerCase().includes(q) || (n.content || '').toLowerCase().includes(q);
    }
    return true;
  });

  const unreadCount = list.filter((n) => !n.read).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">消息中心</p>
          <h1 className="text-2xl font-bold text-gray-900">通知消息</h1>
          <p className="text-gray-500 text-sm mt-0.5">审批、任务、系统消息集中查看</p>
        </div>
        <Button variant="outline" size="sm" onClick={markAllRead} disabled={unreadCount === 0}>
          <CheckCheck className="w-4 h-4 mr-1.5" />全部已读
        </Button>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {([
            { key: 'all', label: `全部 ${list.length}` },
            { key: 'unread', label: `未读 ${unreadCount}` },
            { key: 'read', label: '已读' },
          ] as const).map((t) => (
            <button key={t.key} onClick={() => setFilter(t.key)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${filter === t.key ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {t.label}
            </button>
          ))}
        </div>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="搜索通知..."
          className="h-9 w-56 rounded-lg border border-gray-200 px-3 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-gray-400"><Loader2 className="w-5 h-5 animate-spin mr-2" />加载中...</div>
      ) : filtered.length === 0 ? (
        <Card className="py-20 flex flex-col items-center gap-3 text-gray-400">
          <Inbox className="w-12 h-12" />
          <p className="text-gray-500">暂无通知</p>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map((n) => {
            const meta = typeMeta[n.type] || typeMeta.system;
            return (
              <div key={n.id} className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${n.read ? 'bg-white border-gray-100' : 'bg-blue-50/40 border-blue-100'}`}>
                <div className="pt-1 flex-shrink-0">
                  {n.read ? <Bell className="w-5 h-5 text-gray-300" /> : <div className="w-2.5 h-2.5 rounded-full bg-blue-500 mt-1.5" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="outline" className={`text-xs px-1.5 py-0 ${meta.className}`}>{meta.label}</Badge>
                    <span className={`text-sm font-medium truncate ${n.read ? 'text-gray-600' : 'text-gray-900'}`}>{n.title}</span>
                  </div>
                  {n.content && <p className="text-sm text-gray-500 truncate">{n.content}</p>}
                  <p className="text-xs text-gray-400 mt-1">{formatTime(n.createdAt)}</p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  {!n.read && (
                    <button onClick={() => markRead(n.id)} title="标记已读"
                      className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                      <CheckCheck className="w-4 h-4" />
                    </button>
                  )}
                  {n.link && (
                    <Link href={n.link} onClick={() => !n.read && markRead(n.id)}>
                      <button title="查看详情" className="p-1.5 rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 text-xs">查看</button>
                    </Link>
                  )}
                  <button onClick={() => remove(n.id)} title="删除"
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
