'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X, Search, UserPlus, ShieldCheck } from 'lucide-react';
import { ROLE_LABELS } from '@/config/roles';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const statusBadge: Record<string, any> = {
  pending: { label: '待审批', className: 'border-orange-300 text-orange-600 bg-orange-50' },
  approved: { label: '已通过', className: 'border-emerald-300 text-emerald-600 bg-emerald-50' },
  rejected: { label: '已驳回', className: 'border-red-300 text-red-600 bg-red-50' },
};

export function UserManagementPage() {
  const { t, lang } = useT();
  const isZh = lang === 'zh';
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'pending' | 'all'>('pending');
  const [search, setSearch] = useState('');

  const fetchUsers = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/auth/users${tab === 'pending' ? '/pending' : ''}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) setUsers(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, [tab]);

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/auth/users/${id}/${action}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchUsers();
  };

  const filtered = users.filter((u) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return u.username?.toLowerCase().includes(q) || u.email?.toLowerCase().includes(q);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{isZh ? '平台中心' : 'Platform'}</p>
          <h1 className="text-2xl font-bold text-gray-900">{isZh ? '用户与权限管理' : 'Users & Permissions'}</h1>
          <p className="text-gray-500 text-sm mt-0.5">{isZh ? '超级管理员专属 · 注册权限二次确认' : 'Super admin · registration approval'}</p>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            <button onClick={() => setTab('pending')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${tab === 'pending' ? 'bg-white shadow-sm text-orange-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              <UserPlus className="w-3.5 h-3.5" />{isZh ? '待确认申请' : 'Pending'}
            </button>
            <button onClick={() => setTab('all')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${tab === 'all' ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              <ShieldCheck className="w-3.5 h-3.5" />{isZh ? '全部用户' : 'All Users'}
            </button>
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={isZh ? '搜索用户名/邮箱...' : 'Search username/email...'} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{tab === 'pending' ? (isZh ? '暂无待确认的权限申请' : 'No pending requests') : (isZh ? '暂无用户' : 'No users')}</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filtered.map((u) => (
                <div key={u.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold flex-shrink-0">
                    {u.username?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-medium text-sm text-gray-900">{u.username}</span>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusBadge[u.roleStatus]?.className || ''}`}>{statusBadge[u.roleStatus]?.label || u.roleStatus}</Badge>
                      {u.roleStatus === 'pending' && (
                        <Badge variant="outline" className="text-xs px-1.5 py-0 border-blue-300 text-blue-600 bg-blue-50">申请: {ROLE_LABELS[u.appliedRole] || u.appliedRole}</Badge>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 truncate">{u.email} · 当前角色: {u.roleLabel || ROLE_LABELS[u.role]}</p>
                  </div>
                  {u.roleStatus === 'pending' ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handleAction(u.id, 'approve')}><Check className="w-3.5 h-3.5 mr-1" />{isZh ? '通过并授权' : 'Approve'}</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 text-xs" onClick={() => handleAction(u.id, 'reject')}><X className="w-3.5 h-3.5 mr-1" />{isZh ? '驳回' : 'Reject'}</Button>
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400 flex-shrink-0">{u.createdAt?.slice(0, 10) || ''}</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}