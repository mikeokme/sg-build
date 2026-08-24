'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Loader2, Wallet, TrendingUp, TrendingDown, ReceiptText, Banknote, FileCheck2, PieChart, ArrowRight } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useProject } from '@/context/ProjectContext';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

function fmtMoney(n: number | undefined) {
  if (n == null || isNaN(n)) return '¥0';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(0)}万`;
  return `¥${n}`;
}

export function FinanceOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['funds', 'reimbursements', 'payments', 'subcontractPayments', 'costAnalyses', 'invoices'];

  useEffect(() => {
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

  const { matchesProject } = useProject();

  const funds = (data.funds || []).filter(matchesProject);
  const reimbursements = (data.reimbursements || []).filter(matchesProject);
  const payments = (data.payments || []).filter(matchesProject);
  const subcontractPayments = (data.subcontractPayments || []).filter(matchesProject);
  const costAnalyses = (data.costAnalyses || []).filter(matchesProject);
  const invoices = (data.invoices || []).filter(matchesProject);

  const received = funds.filter((f) => f.type === '收款').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const paid = funds.filter((f) => f.type === '付款').reduce((s, f) => s + (Number(f.amount) || 0), 0);
  const net = received - paid;

  const pendingReimbs = reimbursements.filter((r) => r.status === '待审批');
  const pendingPayments = payments.filter((p) => p.status === '待付款');
  const pendingSubs = subcontractPayments.filter((s) => s.status === '待支付');
  const pendingAmount = pendingPayments.reduce((s, p) => s + (Number(p.amount) || 0), 0) + pendingSubs.reduce((s, p) => s + (Number(p.amount) || 0), 0);

  const inputInvoices = invoices.filter((i) => i.type === '进项').reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const outputInvoices = invoices.filter((i) => i.type === '销项').reduce((s, i) => s + (Number(i.amount) || 0), 0);

  const totalPlanned = costAnalyses.reduce((s, c) => s + (Number(c.plannedCost) || 0), 0);
  const totalActual = costAnalyses.reduce((s, c) => s + (Number(c.actualCost) || 0), 0);
  const totalProfit = costAnalyses.reduce((s, c) => s + (Number(c.profit) || 0), 0);
  const costRate = totalPlanned ? (totalActual / totalPlanned) * 100 : 0;

  const sortedCosts = [...costAnalyses].sort((a, b) => (Number(b.profit) || 0) - (Number(a.profit) || 0));
  const maxCost = Math.max(1, ...costAnalyses.map((c) => Number(c.plannedCost) || 0));

  const recentFunds = [...funds].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);

  const stats = [
    { icon: Wallet, label: isZh ? '资金净流入' : 'Net Cash Flow', value: fmtMoney(net), sub: isZh ? `收款 ${fmtMoney(received)} / 付款 ${fmtMoney(paid)}` : `In ${fmtMoney(received)} / Out ${fmtMoney(paid)}`, tone: 'blue' },
    { icon: ReceiptText, label: isZh ? '待审批报销' : 'Reimbursements Pending', value: String(pendingReimbs.length), sub: isZh ? '报销中心待办' : 'Awaiting in reimbursement center', tone: 'purple' },
    { icon: Banknote, label: isZh ? '待付款金额' : 'Payments Due', value: fmtMoney(pendingAmount), sub: isZh ? `${pendingPayments.length} 笔付款 + ${pendingSubs.length} 笔分包结算` : `${pendingPayments.length} payments + ${pendingSubs.length} subcontract settlements`, tone: 'amber' },
    { icon: FileCheck2, label: isZh ? '成本利润率' : 'Profit Margin', value: totalActual ? `${((totalProfit / totalActual) * 100).toFixed(0)}%` : '0%', sub: isZh ? `利润 ${fmtMoney(totalProfit)}` : `Profit ${fmtMoney(totalProfit)}`, tone: 'emerald' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <div className="flex gap-2">
          <Link href="/finance/finance-approval"><Button variant="outline" size="sm">{tFeat('finance', 'finance-approval')}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
          <Link href="/finance/finance-reimburse"><Button variant="outline" size="sm">{tFeat('finance', 'finance-reimburse')}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {stats.map((s) => <StatCard key={s.label} {...s} />)}
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
            <Card className="xl:col-span-2">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><PieChart className="w-4 h-4 text-blue-500" />{isZh ? '项目成本分析' : 'Project Cost Analysis'}</h2>
                  <span className="text-xs text-gray-400">{isZh ? '成本率' : 'Cost rate'} {costRate.toFixed(0)}% · {isZh ? '计划' : 'Planned'} {fmtMoney(totalPlanned)}</span>
                </div>
                <div className="space-y-3">
                  {sortedCosts.length === 0 && <p className="text-sm text-gray-400 text-center py-6">{isZh ? '暂无成本数据' : 'No cost data'}</p>}
                  {sortedCosts.map((c) => {
                    const pct = ((Number(c.plannedCost) || 0) / maxCost) * 100;
                    return (
                      <div key={c.id}>
                        <div className="flex items-center justify-between text-xs mb-1">
                          <span className="text-gray-600 font-medium">{c.project}</span>
                          <span className="text-gray-400">{isZh ? '实际' : 'Actual'} {fmtMoney(c.actualCost)} / {isZh ? '计划' : 'Planned'} {fmtMoney(c.plannedCost)} · {isZh ? '利润' : 'Profit'} <b className="text-emerald-600">{fmtMoney(c.profit)}</b></span>
                        </div>
                        <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                          <div className="h-full bg-blue-400" style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center gap-1 mt-0.5">
                          <div className="h-1 rounded bg-amber-400" style={{ width: `${((Number(c.actualCost) || 0) / maxCost) * 100}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5">
                <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-emerald-500" />{isZh ? '资金收支' : 'Cash In / Out'}</h2>
                <div className="flex items-center gap-3 mb-4">
                  <div className="flex-1 rounded-xl bg-emerald-50 p-3">
                    <p className="text-[11px] text-emerald-500 flex items-center gap-1"><TrendingUp className="w-3 h-3" />{isZh ? '收款' : 'Income'}</p>
                    <p className="text-base font-bold text-emerald-700">{fmtMoney(received)}</p>
                  </div>
                  <div className="flex-1 rounded-xl bg-red-50 p-3">
                    <p className="text-[11px] text-red-500 flex items-center gap-1"><TrendingDown className="w-3 h-3" />{isZh ? '付款' : 'Expense'}</p>
                    <p className="text-base font-bold text-red-600">{fmtMoney(paid)}</p>
                  </div>
                </div>
                <div className="space-y-2">
                  {recentFunds.map((f) => (
                    <div key={f.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                      <div className="min-w-0">
                        <p className="text-xs text-gray-700 truncate">{f.title}</p>
                        <p className="text-[11px] text-gray-400">{f.party} · {f.date}</p>
                      </div>
                      <span className={`text-xs font-semibold flex-shrink-0 ${f.type === '收款' ? 'text-emerald-600' : 'text-red-500'}`}>
                        {f.type === '收款' ? '+' : '-'}{fmtMoney(f.amount)}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-500 mb-1.5">{isZh ? `发票统计：进项 ${fmtMoney(inputInvoices)} / 销项 ${fmtMoney(outputInvoices)}` : `Invoices: Input ${fmtMoney(inputInvoices)} / Output ${fmtMoney(outputInvoices)}`}</p>
                  <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden flex">
                    <div className="h-full bg-emerald-400" style={{ width: `${(inputInvoices / Math.max(1, inputInvoices + outputInvoices)) * 100}%` }} />
                    <div className="h-full bg-red-400" style={{ width: `${(outputInvoices / Math.max(1, inputInvoices + outputInvoices)) * 100}%` }} />
                  </div>
                  <div className="flex justify-between text-[10px] text-gray-400 mt-1">
                    <span>{isZh ? '进项' : 'Input'}</span><span>{isZh ? '销项' : 'Output'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {pendingReimbs.length + pendingPayments.length + pendingSubs.length > 0 && (
            <Card className="border-amber-200 bg-amber-50/50">
              <CardContent className="p-4 flex items-center justify-between flex-wrap gap-2">
                <p className="text-sm text-amber-700 flex items-center gap-2">
                  <ReceiptText className="w-4 h-4" />
                  {isZh ? `有 ${pendingReimbs.length} 笔报销待审批、${pendingPayments.length + pendingSubs.length} 笔款项待支付` : `${pendingReimbs.length} reimbursements pending approval, ${pendingPayments.length + pendingSubs.length} payments due`}
                </p>
                <Link href="/finance/finance-approval"><Button variant="outline" size="sm" className="text-amber-700 border-amber-300 hover:bg-amber-100">{isZh ? '去处理' : 'Process'}<ArrowRight className="w-3.5 h-3.5 ml-1" /></Button></Link>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}