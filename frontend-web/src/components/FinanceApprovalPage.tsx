'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, CheckCircle2, XCircle, Banknote, ReceiptText, FileSignature, Search, User2, CalendarDays, Building2, ListChecks } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canApprove, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

function fmtMoney(n: number | undefined) {
  if (n == null || isNaN(n)) return '¥0';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(0)}万`;
  return `¥${n}`;
}

type TodoItem = {
  key: string;
  collection: string;
  id: string;
  kind: '报销' | '分包结算' | '付款';
  title: string;
  applicant: string;
  amount: number;
  date: string;
  status: string;
  extra?: string;
  raw: any;
};

export function FinanceApprovalPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<'待办' | '已办'>('待办');
  const [kindFilter, setKindFilter] = useState('全部');
  const [search, setSearch] = useState('');

  const canApproveFlag = canApprove(getCurrentRole());
  const { t, tCat, tFeat, lang } = useT();
  const isZh = lang === 'zh';

  const collections = ['reimbursements', 'subcontractPayments', 'payments'];

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const results = await Promise.all(
      collections.map(async (name) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) return { name, list: await res.json() };
        } catch {}
        return { name, list: [] };
      }),
    );
    const next: Record<string, any[]> = {};
    for (const r of results) next[r.name] = r.list;
    setData(next);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const todos: TodoItem[] = useMemo(() => {
    const list: TodoItem[] = [];
    for (const r of data.reimbursements || []) {
      list.push({ key: `r-${r.id}`, collection: 'reimbursements', id: r.id, kind: '报销', title: r.title, applicant: r.applicant, amount: Number(r.amount) || 0, date: r.date, status: r.status, extra: r.type, raw: r });
    }
    for (const s of data.subcontractPayments || []) {
      list.push({ key: `s-${s.id}`, collection: 'subcontractPayments', id: s.id, kind: '分包结算', title: s.name, applicant: s.subcontractor, amount: Number(s.amount) || 0, date: s.date, status: s.status, extra: s.project, raw: s });
    }
    for (const p of data.payments || []) {
      list.push({ key: `p-${p.id}`, collection: 'payments', id: p.id, kind: '付款', title: p.title, applicant: p.payee, amount: Number(p.amount) || 0, date: p.date, status: p.status, extra: p.method, raw: p });
    }
    return list;
  }, [data]);

  const pending = todos.filter((t) => t.status === '待审批' || t.status === '待付款' || t.status === '待支付');
  const done = todos.filter((t) => !(t.status === '待审批' || t.status === '待付款' || t.status === '待支付'));

  const filtered = useMemo(() => {
    const base = tab === '待办' ? pending : done;
    let list = base;
    if (kindFilter !== '全部') list = list.filter((t) => t.kind === kindFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => (t.title + t.applicant + t.extra).toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [tab, kindFilter, search, pending, done]);

  const pendingAmount = pending.reduce((s, t) => s + t.amount, 0);

  const kinds = [
    { name: '全部', count: (tab === '待办' ? pending : done).length, icon: ListChecks },
    { name: '报销', count: (tab === '待办' ? pending : done).filter((t) => t.kind === '报销').length, icon: ReceiptText },
    { name: '分包结算', count: (tab === '待办' ? pending : done).filter((t) => t.kind === '分包结算').length, icon: Building2 },
    { name: '付款', count: (tab === '待办' ? pending : done).filter((t) => t.kind === '付款').length, icon: Banknote },
  ];

  const act = async (item: TodoItem, newStatus: string) => {
    const token = localStorage.getItem('token');
    const body = { ...item.raw, status: newStatus };
    const res = await fetch(`${API_BASE}/collections/${item.collection}/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) fetchAll();
  };

  const approveReimb = (item: TodoItem) => act(item, '已批准');
  const rejectReimb = (item: TodoItem) => act(item, '已驳回');
  const payIt = (item: TodoItem) => act(item, item.kind === '分包结算' ? '已支付' : '已付款');

  const KIND_ICON: Record<string, any> = { 报销: ReceiptText, 分包结算: Building2, 付款: Banknote };
  const KIND_TONE: Record<string, string> = {
    报销: 'bg-purple-100 text-purple-700', 分包结算: 'bg-blue-100 text-blue-700', 付款: 'bg-amber-100 text-amber-700',
  };

  return (
    <div className="space-y-6">
      <div>
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
        <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        <p className="text-sm text-gray-500 mt-1">{isZh ? '聚合报销单、分包结算款、付款单的报账审批与支付处理' : 'Centralized approval and payment handling for reimbursements, subcontract settlements and payments'}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-lg font-bold text-gray-900">{pending.length}</p>
            <p className="text-xs text-gray-500">{isZh ? '待办事项' : 'Pending Items'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-lg font-bold text-gray-900">{fmtMoney(pendingAmount)}</p>
            <p className="text-xs text-gray-500">{isZh ? '待办金额' : 'Pending Amount'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-lg font-bold text-gray-900">{pending.filter((t) => t.kind === '分包结算').length}</p>
            <p className="text-xs text-gray-500">{isZh ? '待支付分包结算' : 'Pending Subcontract Payments'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-lg font-bold text-gray-900">{pending.filter((t) => t.kind === '报销').length}</p>
            <p className="text-xs text-gray-500">{isZh ? '待审批报销' : 'Pending Reimbursements'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex bg-gray-100 rounded-lg p-1 gap-1">
          {(['待办', '已办'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-3 py-1.5 rounded-md text-sm transition-all ${tab === t ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'}`}>
              {t === '待办' ? (isZh ? '待办' : 'To-do') : (isZh ? '已办' : 'Done')}（{t === '待办' ? pending.length : done.length}）
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {kinds.map((k) => (
            <button key={k.name} onClick={() => setKindFilter(k.name)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm border transition-all ${kindFilter === k.name ? 'border-blue-300 bg-blue-50 text-blue-700 font-medium' : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'}`}>
              <k.icon className="w-3.5 h-3.5" />{k.name === '全部' ? t('all') : k.name}<span className="text-xs text-gray-400">({k.count})</span>
            </button>
          ))}
        </div>
        <div className="relative flex-1 max-w-xs ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input placeholder={`${t('search')}${isZh ? ' 事由 / 申请人 / 单位' : ' subject / applicant / company'}`} className="pl-9 h-9 bg-white border-gray-200" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400"><ListChecks className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>{tab === '待办' ? (isZh ? '暂无待办事项' : 'No pending items') : (isZh ? '暂无已办记录' : 'No completed records')}</p></CardContent></Card>
      ) : (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              {filtered.map((it) => {
                const Icon = KIND_ICON[it.kind];
                const isPending = it.status === '待审批' || it.status === '待付款' || it.status === '待支付';
                return (
                  <div key={it.key} className={`flex items-center gap-3 rounded-xl border p-3 transition-colors ${isPending ? 'border-gray-200 bg-white hover:bg-gray-50' : 'border-gray-100 bg-gray-50/50'}`}>
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${KIND_TONE[it.kind]}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <Badge className={`text-[10px] flex-shrink-0 ${KIND_TONE[it.kind]}`}>{it.kind}</Badge>
                        <p className="text-sm font-medium text-gray-800 truncate">{it.title}</p>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500 mt-1">
                        <span className="flex items-center gap-1"><User2 className="w-3 h-3 text-gray-400" />{it.applicant}</span>
                        {it.extra && <span>{it.extra}</span>}
                        {it.date && <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3 text-gray-400" />{it.date}</span>}
                        <Badge variant="outline" className={`text-[10px] ${isPending ? 'text-amber-600 border-amber-200' : 'text-gray-400 border-gray-200'}`}>{it.status}</Badge>
                      </div>
                    </div>
                    <div className="text-sm font-bold text-gray-900 flex-shrink-0">{fmtMoney(it.amount)}</div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      {isPending && canApproveFlag ? (
                        <>
                          {it.kind === '报销' ? (
                            <>
                              <Button size="sm" className="h-8 bg-emerald-600 hover:bg-emerald-700 text-xs" onClick={() => approveReimb(it)}><CheckCircle2 className="w-3.5 h-3.5 mr-1" />{isZh ? '批准' : 'Approve'}</Button>
                              <Button size="sm" variant="outline" className="h-8 text-red-600 border-red-200 hover:bg-red-50 text-xs" onClick={() => rejectReimb(it)}><XCircle className="w-3.5 h-3.5 mr-1" />{t('reject')}</Button>
                            </>
                          ) : (
                            <Button size="sm" className="h-8 bg-blue-600 hover:bg-blue-700 text-xs" onClick={() => payIt(it)}><Banknote className="w-3.5 h-3.5 mr-1" />{isZh ? '确认支付' : 'Confirm Payment'}</Button>
                          )}
                        </>
                      ) : (
                        <span className="text-[11px] text-gray-400 flex-shrink-0">{isPending ? (isZh ? '无审批权限' : 'No approval rights') : (isZh ? '已办结' : 'Completed')}</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}