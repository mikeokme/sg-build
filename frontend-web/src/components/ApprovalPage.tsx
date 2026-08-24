'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, Check, X, Clock, Search, Inbox, Send, History } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canApprove, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const statusBadge: Record<string, any> = {
  待审批: { variant: 'outline', className: 'border-orange-300 text-orange-600 bg-orange-50' },
  已批准: { variant: 'outline', className: 'border-emerald-300 text-emerald-600 bg-emerald-50' },
  已驳回: { variant: 'outline', className: 'border-red-300 text-red-600 bg-red-50' },
  已撤回: { variant: 'outline', className: 'border-gray-300 text-gray-500 bg-gray-50' },
};

const tabs = [
  { key: 'pending', label: '待我审批', icon: Clock },
  { key: 'mine', label: '我发起的', icon: Send },
  { key: 'done', label: '已办结', icon: History },
];

export function ApprovalPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('pending');
  const [search, setSearch] = useState('');
  const [user, setUser] = useState<any>(null);

  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';
  const role = getCurrentRole();
  const allowApprove = canApprove(role);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const saved = localStorage.getItem('user');
    if (saved) { try { setUser(JSON.parse(saved)); } catch {} }
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature.collection]);

  const list = items.filter((it) => {
    if (tab === 'pending') return it.status === '待审批';
    if (tab === 'mine') return it.applicant === (user?.username || user?.name || '');
    return it.status === '已批准' || it.status === '已驳回' || it.status === '已撤回';
  });

  const filtered = list.filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q));
  });

  const handleDecision = async (id: string, status: string) => {
    const item = items.find((it) => it.id === id);
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, status }),
    });
    fetchItems();
  };

  const typeLabel = feature.fields.find((f) => f.key === 'type')?.label || tField('type', '类型');
  const amountField = feature.fields.find((f) => f.key === 'amount');

  const TAB_LABEL: Record<string, string> = {
    pending: isZh ? '待我审批' : 'My Approvals',
    mine: isZh ? '我发起的' : 'Submitted by Me',
    done: isZh ? '已办结' : 'Completed',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <Badge variant="secondary" className="text-xs">{filtered.length} {t('count')}</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const count = tab === 'pending' ? items.filter((i) => i.status === '待审批').length
                : tab === 'mine' ? items.filter((i) => i.applicant === (user?.username || '')).length
                : items.filter((i) => i.status === '已批准' || i.status === '已驳回').length;
              return (
                <button key={t.key} onClick={() => setTab(t.key)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm transition-all ${tab === t.key ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
                  <Icon className="w-3.5 h-3.5" />
                  {TAB_LABEL[t.key]}
                  <span className={`text-xs ${tab === t.key ? 'text-blue-500' : 'text-gray-400'}`}>{count}</span>
                </button>
              );
            })}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Inbox className="w-8 h-8 mx-auto mb-2 text-gray-300" />
              <p>{tab === 'pending' ? (isZh ? '暂无待审批事项' : 'No pending approvals') : tab === 'mine' ? (isZh ? '暂无发起的审批' : 'No submitted approvals') : (isZh ? '暂无已办结审批' : 'No completed approvals')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map((it) => (
                <div key={it.id} className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-sm text-gray-900 truncate">{it.title}</span>
                      {it.type && <Badge variant="outline" className="text-xs px-1.5 py-0">{it.type}</Badge>}
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${statusBadge[it.status]?.className || ''}`}>{it.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500">
                      {isZh ? '申请人' : 'Applicant'}: {it.applicant || '-'} · {isZh ? '申请日期' : 'Date'}: {it.date || '-'}
                      {amountField && Number(it.amount) > 0 && <span className="ml-2 text-emerald-600 font-medium">¥ {Number(it.amount).toLocaleString()}</span>}
                    </p>
                  </div>
                  {it.status === '待审批' && allowApprove ? (
                    <div className="flex gap-2 flex-shrink-0">
                      <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => handleDecision(it.id, '已批准')}><Check className="w-3.5 h-3.5 mr-1" />{isZh ? '批准' : 'Approve'}</Button>
                      <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50 text-xs" onClick={() => handleDecision(it.id, '已驳回')}><X className="w-3.5 h-3.5 mr-1" />{t('reject')}</Button>
                    </div>
                  ) : (
                    <Badge variant="outline" className="text-xs flex-shrink-0">{it.date || ''}</Badge>
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