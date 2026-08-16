'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Target, Building2, ShoppingCart, Boxes, Wallet, ShieldCheck,
  Users, Settings, Database, Menu, Bell, Search, Truck,
  ChevronDown, LogOut, UserCircle, ChevronRight, LayoutGrid,
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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

export default function MainLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      window.location.href = '/login';
      return;
    }
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    setLoading(false);
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
          for (const c of categories) next[c.key] = c.key !== catKey;
          return next;
        });
      }
    }
  }, [pathname]);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-900"><div className="text-white text-lg">加载中...</div></div>;

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
            <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            {sidebarOpen && <div><span className="font-bold text-white text-sm block leading-none">SG-Build</span><span className="text-[10px] text-slate-400 leading-none">施工管理系统</span></div>}
          </div>
        </div>
        <nav className="flex-1 py-3 px-2 overflow-y-auto">
          <Link href="/"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all mb-1 ${pathname === '/' ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
            <LayoutGrid className="w-5 h-5 flex-shrink-0" />
            {sidebarOpen && <span className="text-sm truncate">工作台</span>}
          </Link>

          {visibleCategories.map((cat) => {
            const Icon = categoryIcons[cat.key] || Building2;
            const isOpen = !collapsed[cat.key];
            const isActive = pathname?.startsWith(`/${cat.key}`);
            return (
              <div key={cat.key} className="mb-1">
                <button
                  onClick={() => sidebarOpen && toggleCollapse(cat.key)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${isActive ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  {sidebarOpen && <span className="text-sm truncate flex-1 text-left">{cat.title}</span>}
                  {sidebarOpen && <ChevronDown className={`w-4 h-4 flex-shrink-0 transition-transform ${isOpen ? '' : '-rotate-90'}`} />}
                </button>
                {sidebarOpen && isOpen && (
                  <div className="ml-4 pl-3 border-l border-slate-700/50 space-y-0.5 mt-0.5">
                    {cat.features.map((f) => {
                      const active = pathname === `/${cat.key}/${f.key}`;
                      return (
                        <Link key={f.key} href={`/${cat.key}/${f.key}`}
                          className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${active ? 'bg-blue-600/20 text-blue-400' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                          <ChevronRight className="w-3 h-3 flex-shrink-0 opacity-50" />
                          <span className="truncate">{f.title}</span>
                        </Link>
                      );
                    })}
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
                  <Avatar className="w-8 h-8"><AvatarFallback className="bg-blue-600 text-white text-xs">{user?.username?.[0]?.toUpperCase() || 'M'}</AvatarFallback></Avatar>
                  <div className="flex-1 min-w-0 text-left"><p className="text-sm font-medium text-white truncate">{user?.username || 'admin'}</p><p className="text-[10px] text-slate-400 truncate">{getRoleLabel(user?.role)}</p></div>
                  <ChevronDown className="w-4 h-4 text-slate-500" />
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="top" className="w-56 mb-2">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><UserCircle className="w-4 h-4 mr-2" />个人信息</DropdownMenuItem>
                  <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />系统设置</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" />退出登录</DropdownMenuItem>
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
              <Input placeholder="搜索项目、人员、文档..." className="pl-9 h-9 bg-gray-50 border-gray-200 text-sm" />
            </div>
          </div>
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center size-8 rounded-lg text-gray-500 hover:bg-gray-100 relative">
                <Bell className="w-5 h-5" />
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">5</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>通知消息</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {[{ t: '城南地铁站 - 进度周报审核', time: '10分钟前' }, { t: '滨江大桥 - 材料进场验收', time: '1小时前' }, { t: '科技园A栋 - 安全巡检待处理', time: '2小时前' }].map((item, i) => (
                    <DropdownMenuItem key={i} className="flex items-start gap-2 py-2.5 cursor-pointer hover:bg-gray-50">
                      <div className="w-2 h-2 rounded-full mt-1.5 flex-shrink-0 bg-orange-500" />
                      <div className="flex-1 min-w-0"><p className="text-sm text-gray-700 truncate">{item.t}</p><p className="text-xs text-gray-400">{item.time}</p></div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
            <DropdownMenu>
              <DropdownMenuTrigger className="inline-flex shrink-0 items-center justify-center size-8 rounded-lg text-gray-500 hover:bg-gray-100"><UserCircle className="w-5 h-5" /></DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>我的账户</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><UserCircle className="w-4 h-4 mr-2" />个人信息</DropdownMenuItem>
                  <DropdownMenuItem><Settings className="w-4 h-4 mr-2" />系统设置</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-red-600"><LogOut className="w-4 h-4 mr-2" />退出登录</DropdownMenuItem>
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