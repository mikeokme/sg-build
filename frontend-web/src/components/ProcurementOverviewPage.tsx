'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShoppingCart, FileText, CheckCircle2, Wallet, Truck, Clock,
  Loader2, Search, Star, Building2, TrendingUp, Clipboard,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { FeatureDef } from '@/config/features';
import { useProject } from '@/context/ProjectContext';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899'];

const ORDER_STATUS_STYLE: Record<string, string> = {
  待确认: 'bg-amber-100 text-amber-700 border-amber-200',
  已下单: 'bg-blue-100 text-blue-700 border-blue-200',
  部分到货: 'bg-cyan-100 text-cyan-700 border-cyan-200',
  已收货: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  已完结: 'bg-slate-100 text-slate-600 border-slate-200',
};

const EVAL_RANK: Record<string, string> = {
  'A级-优秀': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'B级-良好': 'bg-blue-100 text-blue-700 border-blue-200',
  'C级-合格': 'bg-amber-100 text-amber-700 border-amber-200',
  'D级-淘汰': 'bg-red-100 text-red-700 border-red-200',
};

function fmtMoney(v: number | string): string {
  const n = Number(v);
  if (!n) return '-';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function ProcurementOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const { matchesProject } = useProject();
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    const fetches: [string, string][] = [
      ['procurementPlans', 'plans'],
      ['majorRequests', 'requests'],
      ['purchaseOrders', 'orders'],
      ['purchaseReceipts', 'receipts'],
      ['supplierEvaluations', 'evals'],
      ['groupContracts', 'gc'],
      ['purchaseContracts', 'pc'],
      ['rentalContracts', 'rc'],
      ['subcontracts', 'sc'],
      ['suppliers', 'suppliers'],
    ];
    Promise.all(
      fetches.map(async ([name]) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) {
            const d = await res.json();
            setData((prev: any) => ({ ...(prev || {}), [name]: d }));
          }
        } catch {}
      }),
    ).finally(() => setLoading(false));
  }, []);

  const plans = (data?.procurementPlans || []).filter(matchesProject);
  const requests = (data?.majorRequests || []).filter(matchesProject);
  const orders = (data?.purchaseOrders || []).filter(matchesProject);
  const receipts = (data?.purchaseReceipts || []).filter(matchesProject);
  const evals = (data?.supplierEvaluations || []).filter(matchesProject);
  const groupContracts = (data?.groupContracts || []).filter(matchesProject);
  const purchaseContracts = (data?.purchaseContracts || []).filter(matchesProject);
  const rentalContracts = (data?.rentalContracts || []).filter(matchesProject);
  const subcontracts = (data?.subcontracts || []).filter(matchesProject);
  const suppliers = (data?.suppliers || []).filter(matchesProject);

  const contractsAll = [...groupContracts, ...purchaseContracts, ...rentalContracts, ...subcontracts];
  const contractTotal = contractsAll.reduce((s, c) => s + (Number(c.amount) || 0), 0);
  const orderTotal = orders.reduce((s: any, o: any) => s + (Number(o.amount) || Number(o.quantity) * Number(o.price) || 0), 0);
  const planPending = plans.filter((p: any) => p.status === '待审批').length;
  const requestPending = requests.filter((r: any) => r.status === '待审批').length;
  const orderActive = orders.filter((o: any) => o.status === '待确认' || o.status === '已下单' || o.status === '部分到货').length;
  const receiptPending = receipts.filter((r: any) => r.status === '待验收').length;
  const receiptOK = receipts.filter((r: any) => r.status === '验收合格').length;
  const evalExcellent = evals.filter((e: any) => e.result === 'A级-优秀').length;
  const evalBad = evals.filter((e: any) => e.result === 'D级-淘汰').length;

  const stats = [
    { icon: Wallet, label: isZh ? '合同总金额' : 'Contract Total', value: fmtMoney(contractTotal), sub: isZh ? `${contractsAll.length} 份合同` : `${contractsAll.length} contracts`, tone: 'purple' },
    { icon: ShoppingCart, label: isZh ? '采购订单' : 'Purchase Orders', value: orders.length, sub: isZh ? `${orderActive} 单执行中` : `${orderActive} in progress`, tone: 'blue' },
    { icon: FileText, label: isZh ? '待审批' : 'Pending Approval', value: planPending + requestPending, sub: isZh ? `采购计划${planPending} · 请示${requestPending}` : `Plans ${planPending} · Requests ${requestPending}`, tone: 'amber' },
    { icon: Truck, label: isZh ? '到货验收' : 'Goods Receiving', value: receipts.length, sub: isZh ? `${receiptPending} 单待验收 · ${receiptOK} 单合格` : `${receiptPending} pending · ${receiptOK} passed`, tone: 'cyan' },
    { icon: Building2, label: isZh ? '供应商' : 'Suppliers', value: suppliers.length, sub: isZh ? `${evalExcellent} 家A级` : `${evalExcellent} Grade-A`, tone: 'emerald' },
    { icon: Clock, label: isZh ? '待结算验收' : 'Receipts to Settle', value: receiptPending, sub: isZh ? '需关注' : 'Attention needed', tone: 'red' },
  ];

  // 供应商评价排行
  const evalSorted = [...evals].sort((a, b) => {
    const avgA = (Number(a.qualityScore) + Number(a.deliveryScore) + Number(a.priceScore) + Number(a.serviceScore)) / 4;
    const avgB = (Number(b.qualityScore) + Number(b.deliveryScore) + Number(b.priceScore) + Number(b.serviceScore)) / 4;
    return avgB - avgA;
  });
  const evalChartData = evalSorted.map((e: any) => ({
    name: e.supplier,
    [isZh ? '综合分' : 'Score']: Math.round((Number(e.qualityScore) + Number(e.deliveryScore) + Number(e.priceScore) + Number(e.serviceScore)) / 4),
  }));

  // 合同类型分布
  const contractPie = [
    { name: isZh ? '集采合同' : 'Group Contracts', value: groupContracts.length },
    { name: isZh ? '采购合同' : 'Purchase Contracts', value: purchaseContracts.length },
    { name: isZh ? '租赁合同' : 'Rental Contracts', value: rentalContracts.length },
    { name: isZh ? '分包合同' : 'Subcontracts', value: subcontracts.length },
  ].filter((x) => x.value > 0);

  // 订单状态分布
  const orderDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) map.set(o.status || '未设置', (map.get(o.status || '未设置') || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [orders]);

  // 各物资采购金额
  const materialSpend = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders) {
      const amt = Number(o.amount) || Number(o.quantity) * Number(o.price) || 0;
      map.set(o.material, (map.get(o.material) || 0) + amt);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [orders]);

  const filteredOrders = useMemo(() => {
    let list = orders;
    if (statusFilter !== '全部') list = list.filter((o: any) => o.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((o: any) => Object.values(o).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [orders, statusFilter, search]);

  const statusOptions = ['待确认', '已下单', '部分到货', '已收货', '已完结'];

  const quickLinks = [
    { label: isZh ? '编制采购计划' : 'Procurement Plans', href: '/procurement/procurement-plans', icon: FileText },
    { label: isZh ? '大宗采购请示' : 'Major Requests', href: '/procurement/major-requests', icon: Clipboard },
    { label: isZh ? '新建采购订单' : 'New Purchase Order', href: '/procurement/orders', icon: ShoppingCart },
    { label: isZh ? '到货验收' : 'Goods Receiving', href: '/procurement/receipts', icon: Truck },
    { label: isZh ? '供应商评价' : 'Supplier Evaluation', href: '/procurement/supplier-eval', icon: Star },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500">
          <TrendingUp className="w-3.5 h-3.5" />{isZh ? '集采降本 · 供应保障' : 'Group purchasing savings · Supply assurance'}
        </Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '合同类型分布' : 'Contract Type Distribution'}</CardTitle></CardHeader>
              <CardContent>
                {contractPie.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">{isZh ? '暂无合同数据' : 'No contract data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie data={contractPie} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={75} label={({ name, value }: any) => `${name} ${value}`}>
                        {contractPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '订单状态分布' : 'Order Status Distribution'}</CardTitle></CardHeader>
              <CardContent>
                {orderDist.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">{isZh ? '暂无订单数据' : 'No order data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={orderDist} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="name" fontSize={10} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                      <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '供应商综合评分' : 'Supplier Composite Score'}</CardTitle></CardHeader>
              <CardContent>
                {evalChartData.length === 0 ? (
                  <div className="text-center py-12 text-gray-400 text-sm">{isZh ? '暂无评价数据' : 'No evaluation data'}</div>
                ) : (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={evalChartData} layout="vertical" margin={{ top: 0, right: 20, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" domain={[0, 100]} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis type="category" dataKey="name" fontSize={10} width={110} tickLine={false} axisLine={false} />
                      <Tooltip />
                      <Bar dataKey={isZh ? '综合分' : 'Score'} fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={16} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
                <CardTitle className="text-base font-semibold">{isZh ? '采购订单' : 'Purchase Orders'}</CardTitle>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button onClick={() => setStatusFilter('全部')}
                    className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{t('all')}</button>
                  {statusOptions.map((s) => (
                    <button key={s} onClick={() => setStatusFilter(s)}
                      className={`px-2 py-1 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s}</button>
                  ))}
                </div>
                <div className="relative flex-1 max-w-xs ml-auto">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input placeholder={isZh ? '搜索订单...' : 'Search orders...'} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
                </div>
              </CardHeader>
              <CardContent>
                {filteredOrders.length === 0 ? (
                  <div className="text-center py-12 text-gray-400">
                    <ShoppingCart className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                    <p>{isZh ? '暂无订单' : 'No orders'}</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredOrders.map((o: any) => {
                      const amt = Number(o.amount) || Number(o.quantity) * Number(o.price) || 0;
                      return (
                        <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <ShoppingCart className="w-4 h-4 text-blue-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-sm text-gray-900 truncate">{o.material || o.code}</p>
                              <Badge variant="outline" className={`${ORDER_STATUS_STYLE[o.status] || ''} text-[10px] px-1.5 py-0 border-0`}>{o.status}</Badge>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">
                              {o.code} · {o.supplier} · {o.quantity}{o.unit} × ¥{Number(o.price || 0).toLocaleString()}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-sm font-semibold text-gray-900 tabular-nums">{fmtMoney(amt)}</p>
                            {o.expectedDate && <p className="text-[10px] text-gray-400">{isZh ? '预计' : 'ETA'} {o.expectedDate}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '物资采购金额' : 'Material Spend'}</CardTitle></CardHeader>
                <CardContent>
                  {materialSpend.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">{t('noData')}</p>
                  ) : (
                    <div className="space-y-2">
                      {materialSpend.slice(0, 6).map((m) => (
                        <div key={m.name} className="text-sm">
                          <div className="flex justify-between mb-1">
                            <span className="text-gray-700 truncate mr-2">{m.name}</span>
                            <span className="text-xs text-purple-600 font-medium flex-shrink-0">{fmtMoney(m.value)}</span>
                          </div>
                          <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (m.value / (materialSpend[0]?.value || 1)) * 100)}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '供应商评级' : 'Supplier Ratings'}</CardTitle></CardHeader>
                <CardContent className="space-y-2">
                  {evalSorted.slice(0, 4).map((e: any) => {
                    const avg = Math.round((Number(e.qualityScore) + Number(e.deliveryScore) + Number(e.priceScore) + Number(e.serviceScore)) / 4);
                    return (
                      <div key={e.id} className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-2 min-w-0">
                          <Star className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                          <span className="text-gray-700 truncate">{e.supplier}</span>
                        </div>
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="text-xs font-semibold text-gray-700 tabular-nums">{avg}</span>
                          <Badge variant="outline" className={`${EVAL_RANK[e.result] || ''} text-[10px] px-1.5 py-0 border-0`}>{e.result}</Badge>
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '快捷操作' : 'Quick Actions'}</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-5 gap-2">
              {quickLinks.map((a) => (
                <Link key={a.label} href={a.href}
                  className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-gray-50 hover:bg-blue-50 hover:text-blue-600 transition-colors text-sm text-gray-700">
                  <a.icon className="w-4 h-4 text-blue-500" />
                  {a.label}
                </Link>
              ))}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}