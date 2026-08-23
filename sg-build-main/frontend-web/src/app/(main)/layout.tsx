'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Building2, Settings, Menu, Bell, Search,
  ChevronDown, LogOut, UserCircle, ChevronRight, LayoutGrid, ClipboardCheck, MessageCircle,
  Network, Sun, Moon, Monitor,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
  DropdownMenuGroup,
} from '@/components/ui/dropdown-menu';
import { categories } from '@/config/features';
import { CATEGORY_MIN_LEVEL, getRoleLevel, getRoleLabel } from '@/config/roles';
import { KeyRound } from 'lucide-react';
import { useSettings } from '@/context/SettingsContext';
import { categoryIcon, categoryTone } from '@/config/branding';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const notificationTypeStyle: Record<string, any> = {
  approval: { dot: 'bg-orange-500', labelZh: '审批', labelEn: 'Approval' },
  task: { dot: 'bg-blue-500', labelZh: '任务', labelEn: 'Task' },
  system: { dot: 'bg-purple-500', labelZh: '系统', labelEn: 'System' },
  alert: { dot: 'bg-red-500', labelZh: '预警', labelEn: 'Alert' },
};

function timeAgo(iso: string, lang: string): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return lang === 'zh' ? '刚刚' : 'just now';
  if (mins < 60) return lang === 'zh' ? `${mins}分钟前` : `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return lang === 'zh' ? `${hours}小时前` : `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return lang === 'zh' ? `${days}天前` : `${days} days ago`;
  return new Date(iso).toLocaleDateString(lang === 'zh' ? 'zh-CN' : 'en-US');
}

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { theme, cycleTheme, language, cycleLanguage } = useSettings();
  const { t, tCat, tFeat } = useT();
  const isZh = language === 'zh';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const cat of categories) map[cat.key] = true;
    return map;
  });
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => {
    const map: Record<string, boolean> = {};
    for (const cat of categories) {
      for (const f of cat.features) {
        if (f.group) map[`${cat.key}::${f.group}`] = true;
      }
    }
    return map;
  });
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifOpen, setNotifOpen] = useState(false);
  const [siteSettings, setSiteSettings] = useState<any>(null);

  const fetchNotifications = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      const res = await fetch(`${API_BASE}/notifications`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const list = await res.json();
        setNotifications(list);
        setUnreadCount(list.filter((n: any) => !n.read).length);
      }
    } catch {}
  };

  const markAllRead = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/notifications/read-all`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(0);
    } catch {}
  };

  const markRead = async (id: string) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    try {
      await fetch(`${API_BASE}/notifications/${id}/read`, { method: 'PUT', headers: { Authorization: `Bearer ${token}` } });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
      setUnreadCount((c) => Math.max(0, c - 1));
    } catch {}
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    setLoading(false);
    fetchNotifications();

    // 获取系统设置（公司名称 + Logo）
    fetch(`${API_BASE}/auth/settings`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d) => { if (d && !d.message) setSiteSettings(d); })
      .catch(() => {});

    // SSE 实时推送：新通知到达时即时刷新未读角标
    const es = new EventSource(`${API_BASE}/notifications/stream?token=${encodeURIComponent(token)}`);
    es.onmessage = (ev) => { try { const d = JSON.parse(ev.data); if (d?.notification) fetchNotifications(); } catch {} };
    es.onerror = () => { /* 断线自动重连，交给浏览器 */ };

    const interval = setInterval(fetchNotifications, 60000);
    return () => { clearInterval(interval); es.close(); };
  }, []);

  useEffect(() => {
    if (!pathname) return;
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length >= 1) {
      const catKey = segments[0];
      const cat = categories.find((c) => c.key === catKey);
      if (cat) {
        setCollapsed((prev) => {
          const next = { ...prev };
          // 默认全部折叠，仅当用户主动展开
          if (next[catKey] === undefined) next[catKey] = true;
          return next;
        });
      }
    }
  }, [pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-lg">{t('loading')}</div></div>;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    router.replace('/login');
  };

  const toggleCollapse = (key: string) => setCollapsed((prev) => ({ ...prev, [key]: !prev[key] }));

  const userLevel = getRoleLevel(user?.role);
  const visibleCategories = categories.filter((cat) => userLevel >= (CATEGORY_MIN_LEVEL[cat.key] ?? 40));

  return (
    <div className="flex h-screen bg-gray-100 overflow-hidden">
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} flex-shrink-0 bg-slate-900 transition-all duration-200 flex flex-col overflow-hidden`}>
        <div className="h-14 flex items-center px-4 border-b border-slate-700/50 flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0 overflow-hidden">
              {siteSettings?.companyLogo ? (
                <img src={siteSettings.companyLogo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                <Building2 className="w-4 h-4 text-white" />
              )}
            </div>
            {sidebarOpen && <div><span className="font-bold text-white text-sm block leading-none">{siteSettings?.companyName || 'SG-Build'}</span><span className="text-[10px] text-slate-400 leading-none">施工管理系统</span></div>}
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <Link href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${pathname === '/' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'}`}>
            <LayoutGrid className={`w-5 h-5 flex-shrink-0 ${pathname === '/' ? 'text-blue-400' : 'text-blue-400'}`} />
            {sidebarOpen && <span className="text-sm truncate">{t('workbench')}</span>}
          </Link>
          <Link href="/todos"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${pathname === '/todos' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'}`}>
            <ClipboardCheck className={`w-5 h-5 flex-shrink-0 ${pathname === '/todos' ? 'text-blue-400' : 'text-amber-400'}`} />
            {sidebarOpen && <span className="text-sm truncate">{t('todos')}</span>}
          </Link>
          <Link href="/chat"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${pathname === '/chat' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'}`}>
            <MessageCircle className={`w-5 h-5 flex-shrink-0 ${pathname === '/chat' ? 'text-blue-400' : 'text-cyan-400'}`} />
            {sidebarOpen && <span className="text-sm truncate">{t('messages')}</span>}
          </Link>
          {userLevel >= 80 && (
            <Link href="/org"
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${pathname === '/org' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'}`}>
              <Network className={`w-5 h-5 flex-shrink-0 ${pathname === '/org' ? 'text-blue-400' : 'text-violet-400'}`} />
              {sidebarOpen && <span className="text-sm truncate">{t('org')}</span>}
            </Link>
          )}

          {visibleCategories.map((cat) => {
            const Icon = categoryIcon(cat.key);
            const tone = categoryTone(cat.key);
            const isOpen = !collapsed[cat.key];
            const isActive = pathname?.startsWith(`/${cat.key}`);
            return (
              <div key={cat.key} className="mb-1">
                <button
                  onClick={() => sidebarOpen && toggleCollapse(cat.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-300 hover:bg-slate-800 hover:text-slate-100'}`}>
                  <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? 'text-blue-400' : tone.side}`} />
                  {sidebarOpen && <span className="text-sm truncate flex-1 text-left">{tCat(cat.key)}</span>}
                  {sidebarOpen && <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />}
                </button>
                {sidebarOpen && isOpen && (
                  <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5 mt-0.5">
                    {(() => {
                      const groups = new Map<string, typeof cat.features>();
                      for (const f of cat.features) {
                        const g = f.group || '';
                        if (!groups.has(g)) groups.set(g, []);
                        groups.get(g)!.push(f);
                      }
                      return Array.from(groups.entries()).map(([group, feats]) => {
                        const gKey = `${cat.key}::${group}`;
                        const gOpen = !collapsedGroups[gKey];
                        return (
                          <div key={gKey}>
                            {group ? (
                              <button
                                onClick={() => setCollapsedGroups((prev) => ({ ...prev, [gKey]: !prev[gKey] }))}
                                className="w-full flex items-center gap-1.5 px-3 pt-2 pb-1 text-left group/g">
                                <ChevronDown className={`w-3 h-3 text-slate-500 transition-transform ${gOpen ? '' : '-rotate-90'}`} />
                                <span className="text-sm font-semibold text-slate-400 tracking-wide uppercase group-hover/g:text-slate-200">{group}</span>
                                <span className="text-[10px] text-slate-600 ml-auto">{feats.length}</span>
                              </button>
                            ) : null}
                            {gOpen && (
                              <div className="space-y-0.5">
                                {feats.map((f) => {
                                  const active = pathname === `/${cat.key}/${f.key}`;
                                  return (
                                    <Link key={f.key} href={`/${cat.key}/${f.key}`}
                                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${active ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                                      <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />
                                      <span className="truncate">{tFeat(cat.key, f.key)}</span>
                                    </Link>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        );
                      });
                    })()}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
        {sidebarOpen && (
          <div className="p-3 border-t border-slate-700/50 flex-shrink-0">
            <DropdownMenu>
              <DropdownMenuTrigger className="w-full">
                <div className="flex items-center gap-2 px-2 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors cursor-pointer">
                  <Avatar className="w-7 h-7">
                    {user?.avatar && <AvatarImage src={user.avatar} alt="头像" className="object-cover" />}
                    <AvatarFallback className="bg-blue-600 text-white text-xs font-bold">{(user?.name || user?.username || 'U')[0]?.toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0 text-left"><p className="text-xs font-medium text-white truncate">{user?.name || user?.username || 'admin'}</p><p className="text-xs text-slate-400 truncate">{getRoleLabel(user?.role)}</p></div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-sm">{t('myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/account"><DropdownMenuItem className="cursor-pointer text-sm"><UserCircle className="w-4 h-4 mr-2" />{t('profile')}</DropdownMenuItem></Link>
                  {userLevel >= (CATEGORY_MIN_LEVEL.platform ?? 100) && (
                    <Link href="/settings"><DropdownMenuItem className="cursor-pointer text-sm"><Settings className="w-4 h-4 mr-2" />{t('settings')}</DropdownMenuItem></Link>
                  )}
                  <Link href="/account?tab=password"><DropdownMenuItem className="cursor-pointer text-sm"><KeyRound className="w-4 h-4 mr-2" />{t('changePassword')}</DropdownMenuItem></Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 text-sm"><LogOut className="w-4 h-4 mr-2" />{t('logout')}</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-gray-500">
            <Menu className="w-5 h-5" />
          </Button>
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input placeholder={t('search')} className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            {/* 主题切换按钮 */}
            <button
              onClick={cycleTheme}
              title={isZh ? (theme === 'light' ? '明色模式' : theme === 'dark' ? '暗色模式' : '跟随系统') : (theme === 'light' ? 'Light mode' : theme === 'dark' ? 'Dark mode' : 'System mode')}
              className="inline-flex shrink-0 items-center justify-center size-8 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800">
              {theme === 'light' ? <Sun className="w-5 h-5 text-violet-500" /> : theme === 'dark' ? <Moon className="w-5 h-5 text-violet-500" /> : <Monitor className="w-5 h-5 text-violet-500" />}
            </button>
            {/* 语言切换按钮 */}
            <button
              onClick={cycleLanguage}
              title={t('switchLang')}
              className="inline-flex shrink-0 items-center justify-center size-8 rounded-lg text-cyan-500 hover:bg-gray-100 dark:hover:bg-gray-800 text-xs font-bold">
              {isZh ? '汉' : 'EN'}
            </button>
            <DropdownMenu open={notifOpen} onOpenChange={(o) => { setNotifOpen(o); if (o) fetchNotifications(); }}>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center gap-1.5 px-2 h-8 rounded-lg text-gray-500 hover:bg-gray-100 relative">
                <Bell className="w-5 h-5 text-amber-500" />
                {unreadCount > 0 && (
                  <span className="text-xs text-amber-600 font-bold">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-[420px] overflow-y-auto">
                <DropdownMenuGroup>
                  <div className="flex items-center justify-between pr-1">
                    <DropdownMenuLabel className="text-sm">{t('notifications')}</DropdownMenuLabel>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-700 px-2 py-0.5 rounded hover:bg-blue-50">{t('markAllRead')}</button>
                    )}
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="py-10 text-center text-gray-400 text-sm">{t('noNotifications')}</div>
                  ) : (
                    notifications.slice(0, 8).map((n) => {
                      const style = notificationTypeStyle[n.type] || notificationTypeStyle.system;
                      return (
                        <Link key={n.id} href={n.link || '/notifications'} onClick={() => !n.read && markRead(n.id)}>
                          <DropdownMenuItem className={`flex items-start gap-2 py-2.5 cursor-pointer ${n.read ? 'opacity-60' : 'hover:bg-gray-50'}`}>
                            <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${style.dot}`} />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-gray-700 truncate">{n.title}</p>
                              <p className="text-xs text-gray-400 truncate mt-0.5">{n.content}</p>
                              <p className="text-xs text-gray-300 mt-0.5">{isZh ? style.labelZh : style.labelEn} · {timeAgo(n.createdAt, language)}</p>
                            </div>
                          </DropdownMenuItem>
                        </Link>
                      );
                    })
                  )}
                  <DropdownMenuSeparator />
                  <Link href="/notifications"><DropdownMenuItem className="cursor-pointer justify-center text-sm text-blue-600 hover:bg-blue-50 py-2">{t('viewAll')}</DropdownMenuItem></Link>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center gap-1.5 px-2 h-8 rounded-lg text-gray-500 hover:bg-gray-100">
                {user?.avatar ? (
                  <img src={user.avatar} alt="头像" className="w-7 h-7 rounded-full object-cover" />
                ) : (
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold">{(user?.name || user?.username || 'U')[0]?.toUpperCase()}</div>
                )}
                <span className="text-xs font-medium text-gray-700 max-w-[80px] truncate">{user?.name || user?.username || '用户'}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel className="text-sm">{t('myAccount')}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <Link href="/account"><DropdownMenuItem className="cursor-pointer text-sm"><UserCircle className="w-4 h-4 mr-2" />{t('profile')}</DropdownMenuItem></Link>
                  {userLevel >= (CATEGORY_MIN_LEVEL.platform ?? 100) && (
                    <Link href="/settings"><DropdownMenuItem className="cursor-pointer text-sm"><Settings className="w-4 h-4 mr-2" />{t('settings')}</DropdownMenuItem></Link>
                  )}
                  <Link href="/account?tab=password"><DropdownMenuItem className="cursor-pointer text-sm"><KeyRound className="w-4 h-4 mr-2" />{t('changePassword')}</DropdownMenuItem></Link>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600 text-sm"><LogOut className="w-4 h-4 mr-2" />{t('logout')}</DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}