'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/StatCard';
import {
  ArrowLeft, Building2, MapPin, CalendarDays, User, Wallet,
  FileText, Plus, Trash2, Eye, Loader2, Shield, CheckCircle2,
  Clock, TrendingUp, Download, Paperclip, GitBranch, ClipboardList,
  Sun, Cloud, CloudRain, AlertCircle, Wrench, Users,
  ShoppingCart, Boxes, Truck, Handshake, AlertTriangle, BadgeCheck, Coins, Users2,
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, PieChart, Pie, Cell, Legend,
} from 'recharts';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const STATUS_COLOR: Record<string, string> = {
  立项: 'bg-slate-100 text-slate-600 border-slate-200',
  在建: 'bg-blue-100 text-blue-700 border-blue-200',
  竣工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  完工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  停工: 'bg-red-100 text-red-700 border-red-200',
  暂缓: 'bg-amber-100 text-amber-700 border-amber-200',
};

const TYPE_BADGE: Record<string, string> = {
  水利枢纽: 'text-blue-600 bg-blue-50 border-blue-200',
  渠道工程: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  防洪工程: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  灌溉工程: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  水库工程: 'text-teal-600 bg-teal-50 border-teal-200',
  生态工程: 'text-green-600 bg-green-50 border-green-200',
  环保工程: 'text-purple-600 bg-purple-50 border-purple-200',
  监测工程: 'text-orange-600 bg-orange-50 border-orange-200',
  景观工程: 'text-pink-600 bg-pink-50 border-pink-200',
  综合治理: 'text-sky-600 bg-sky-50 border-sky-200',
};

const DOC_TYPE_ICON: Record<string, string> = {
  技术方案: '📋', 图纸: '📐', 检测报告: '🔬', 验收记录: '✅',
  设计变更: '📝', 评估报告: '📊', 设备清单: '📦', 合同文件: '📄', 其他: '📁',
};

const WEATHER_ICON: Record<string, any> = {
  晴: Sun, 多云: Cloud, 阴: Cloud, 小雨: CloudRain, 大雨: CloudRain, 雷雨: CloudRain,
};

const BAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-rose-500'];
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function fmtBytes(b: number): string {
  if (!b) return '-';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function fmtMoney(v: number | string): string {
  const n = Number(v);
  if (!n) return '-';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

function daysRemaining(endDate: string): { text: string; cls: string } {
  if (!endDate) return { text: '-', cls: 'text-gray-400' };
  const diff = Math.ceil((new Date(endDate).getTime() - Date.now()) / 86400000);
  if (diff < 0) return { text: `已逾期 ${Math.abs(diff)} 天`, cls: 'text-red-500' };
  if (diff === 0) return { text: '今日到期', cls: 'text-amber-500 font-semibold' };
  return { text: `剩余 ${diff} 天`, cls: 'text-gray-500' };
}

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

type TabKey = 'overview' | 'schedule' | 'logs' | 'milestones' | 'costs' | 'documents';

export default function ProjectDetailPage() {
  const { t, lang } = useT();
  const isZh = lang === 'zh';
  const params = useParams<{ id: string }>();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [delDocId, setDelDocId] = useState<string | null>(null);

  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('');
  const [docFile, setDocFile] = useState('');
  const [docDesc, setDocDesc] = useState('');

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${params.id}/overview`, { headers });
      if (res.ok) {
        const d = await res.json();
        setData(d);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProject(); }, [params.id]);

  const handleAddDoc = async () => {
    if (!docName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${params.id}/documents`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: docName, type: docType, fileName: docFile, description: docDesc, uploader: '当前用户' }),
      });
      if (res.ok) {
        setAddDocOpen(false);
        setDocName(''); setDocType(''); setDocFile(''); setDocDesc('');
        fetchProject();
      }
    } catch {}
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`${API_BASE}/projects/documents/${docId}`, { method: 'DELETE', headers });
      if (res.ok) fetchProject();
    } catch {}
    setDelDocId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />{t('loading')}
      </div>
    );
  }
  const project = data?.project;
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
        <Building2 className="w-12 h-12 text-gray-300" />
        <p>{isZh ? '项目不存在' : 'Project not found'}</p>
        <Link href="/engineering/project-archives"><Button variant="outline" size="sm">{isZh ? '返回列表' : 'Back to list'}</Button></Link>
      </div>
    );
  }

  const s = data.stats || {};
  const remaining = daysRemaining(project.endDate);
  const typeBadgeClass = TYPE_BADGE[project.type] || 'bg-gray-50 text-gray-500 border-gray-200';
  const documents = data.documents || [];
  const logs = data.logs || [];
  const milestones = data.milestones || [];
  const progressItems = data.progress || [];
  const production = data.production || [];
  const budgets = data.budgets || [];

  // 甘特计算
  const scheduleItems = progressItems.filter((it: any) => it.startDate);
  const sMin = scheduleItems.length ? new Date(Math.min(...scheduleItems.map((it: any) => new Date(it.startDate).getTime()))) : new Date(project.startDate || Date.now());
  const sMax = scheduleItems.length ? new Date(Math.max(...scheduleItems.map((it: any) => new Date(it.endDate || it.startDate).getTime()))) : new Date(project.endDate || Date.now());
  const sTotal = Math.max(1, daysBetween(sMin.toISOString(), sMax.toISOString()));
  const sMonths: { key: string; label: string; days: number }[] = [];
  {
    let cursor = new Date(sMin);
    cursor.setDate(1);
    while (cursor <= sMax) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const days = Math.min(daysBetween(cursor.toISOString(), next.toISOString()), daysBetween(cursor.toISOString(), sMax.toISOString()) + 1);
      sMonths.push({ key: cursor.toISOString(), label: `${cursor.getMonth() + 1}月`, days: Math.max(1, days) });
      cursor = next;
    }
  }

  // 产值月度趋势
  const prodTrend = [...new Set(production.map((x: any) => x.month))]
    .sort()
    .map((m) => ({ month: m, value: production.filter((x: any) => x.month === m).reduce((sum: number, x: any) => sum + Number(x.value || 0), 0) }));

  // 预算分布
  const budgetData = (() => {
    const map = new Map<string, number>();
    for (const b of budgets) map.set(b.category || '其他', (map.get(b.category || '其他') || 0) + Number(b.amount || 0));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  })();

  const tabList: { key: TabKey; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: isZh ? '项目概况' : 'Overview', icon: Building2 },
    { key: 'schedule', label: isZh ? '进度甘特' : 'Schedule', icon: TrendingUp, count: scheduleItems.length },
    { key: 'logs', label: isZh ? '施工日志' : 'Logs', icon: ClipboardList, count: logs.length },
    { key: 'milestones', label: isZh ? '里程碑' : 'Milestones', icon: GitBranch, count: milestones.length },
    { key: 'costs', label: isZh ? '成本产值' : 'Costs', icon: Wallet },
    { key: 'documents', label: isZh ? '项目文档' : 'Documents', icon: FileText, count: documents.length },
  ];

  const topStats = [
    { icon: Wallet, label: '合同金额', value: fmtMoney(project.amount), sub: project.contractType, tone: 'purple' },
    { icon: TrendingUp, label: '累计产值', value: fmtMoney(s.productionCumulative || s.productionValue), sub: `${(s.productionValue || 0).toLocaleString()} 万本月`, tone: 'emerald' },
    { icon: CalendarDays, label: '计划工期', value: project.planDuration ? `${project.planDuration}天` : '-', sub: remaining.text, subCls: remaining.cls, tone: 'blue' },
    { icon: CheckCircle2, label: '里程碑完成', value: `${s.milestoneDone ?? 0}/${s.milestoneTotal ?? 0}`, sub: `${s.milestoneActive ?? 0} 个进行中`, tone: 'cyan' },
    { icon: TrendingUp, label: '平均进度', value: `${s.avgProgress ?? 0}%`, sub: `${s.progressItemCount ?? 0} 个工作项`, tone: 'amber' },
    { icon: FileText, label: '项目文档', value: s.documentCount ?? 0, sub: '份资料', tone: 'sky' },
  ];

  const relatedBlocks = [
    { title: '采购供应', tone: 'sky', icon: ShoppingCart, items: [
      { label: '采购订单', value: s.purchaseOrderCount ?? 0, sub: `${s.purchaseOrderAmount ? fmtMoney(s.purchaseOrderAmount) : '-'} 金额` },
      { label: '到货单', value: s.receiptCount ?? 0, sub: '笔' },
      { label: '采购计划', value: s.procurementPlans?.length ?? 0, sub: '项' },
    ] },
    { title: '物资材料', tone: 'emerald', icon: Boxes, items: [
      { label: '收料单', value: s.materialReceivingCount ?? 0, sub: `${s.materialReceivingAmount ? fmtMoney(s.materialReceivingAmount) : '-'} 金额` },
      { label: '领料单', value: s.materialIssueCount ?? 0, sub: '笔' },
      { label: '退料', value: s.materialReturn?.length ?? 0, sub: '笔' },
    ] },
    { title: '机械设备', tone: 'amber', icon: Truck, items: [
      { label: '设备', value: s.equipmentCount ?? 0, sub: '台' },
      { label: '租赁合同', value: s.equipmentLeaseCount ?? 0, sub: '份' },
      { label: '维保', value: (s.equipmentMaintenanceCount ?? 0) + (s.equipmentRepairCount ?? 0), sub: '次' },
    ] },
    { title: '分包协作', tone: 'teal', icon: Handshake, items: [
      { label: '劳务/专业合同', value: (s.laborContractCount ?? 0) + (s.proContractCount ?? 0), sub: '份' },
      { label: '结算单', value: s.subcontractSettlementCount ?? 0, sub: '份' },
      { label: '付款', value: s.subcontractPaymentCount ?? 0, sub: `${s.subcontractPaymentAmount ? fmtMoney(s.subcontractPaymentAmount) : '-'} 已付` },
    ] },
    { title: '安全管控', tone: 'red', icon: Shield, items: [
      { label: '安全隐患', value: s.riskCount ?? 0, sub: `${s.riskWarning ?? 0} 项未受控` },
      { label: '安全巡检', value: s.safetyInspectionCount ?? 0, sub: `${s.safetyPending ?? 0} 项整改中` },
      { label: '安全事故', value: s.safetyAccidentCount ?? 0, sub: '起' },
    ] },
    { title: '质量管理', tone: 'green', icon: BadgeCheck, items: [
      { label: '质量巡检', value: s.qualityInspectionCount ?? 0, sub: `${s.qualityPending ?? 0} 项整改中` },
      { label: '质量缺陷', value: s.qualityDefectCount ?? 0, sub: '项' },
      { label: '质量事故', value: s.qualityAccidentCount ?? 0, sub: '起' },
    ] },
    { title: '成本分析', tone: 'purple', icon: Coins, items: [
      { label: '计划成本', value: fmtMoney(s.costPlanned), sub: '-' },
      { label: '实际成本', value: fmtMoney(s.costActual), sub: '-' },
      { label: '预计利润', value: fmtMoney(s.costProfit), sub: '-' },
    ] },
    { title: '项目组织', tone: 'cyan', icon: Users2, items: [
      { label: '项目团队', value: s.teamCount ?? 0, sub: `${s.teamMembers ?? 0} 名成员` },
      { label: '协作供应商', value: s.supplierCount ?? 0, sub: '家' },
      { label: '项目文档', value: s.documentCount ?? 0, sub: '份' },
    ] },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/engineering/project-archives">
          <Button variant="ghost" size="sm" className="text-gray-500"><ArrowLeft className="w-4 h-4 mr-1" />返回</Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{project.name}</h1>
              <p className="text-xs text-gray-400">项目编号: {project.code || '-'} · 创建于 {project.createdAt?.slice(0, 10) || '-'}</p>
            </div>
            <Badge className={`${STATUS_COLOR[project.status] || 'bg-gray-100'} border ml-2`}>{project.status}</Badge>
          </div>
        </div>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        {topStats.map((st) => (
          <StatCard key={st.label} {...st} />
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit flex-wrap">
        {tabList.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {typeof t.count === 'number' && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" />基本信息</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="项目编号" value={project.code} />
                <InfoRow label="工程类型" value={project.type} badgeClass={typeBadgeClass} />
                <InfoRow label="项目地点" value={project.location} icon={MapPin} />
                <InfoRow label="建设单位" value={project.customer} icon={Building2} />
                <InfoRow label="项目经理" value={project.manager} icon={User} />
                <InfoRow label="监理负责人" value={project.supervisor} icon={Shield} />
                <InfoRow label="合同类型" value={project.contractType} />
                <InfoRow label="合同金额" value={fmtMoney(project.amount)} accent />
                <InfoRow label="质量目标" value={project.qualityTarget} />
                <InfoRow label="安全目标" value={project.safetyTarget} />
                <InfoRow label="开工日期" value={project.startDate} icon={CalendarDays} />
                <InfoRow label="计划竣工" value={project.endDate} icon={CalendarDays} badge={
                  <span className={`text-xs ml-1 ${remaining.cls}`}>{remaining.text}</span>
                } />
                <InfoRow label="计划工期" value={project.planDuration ? `${project.planDuration} 天` : '-'} icon={Clock} />
              </div>
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-gray-500 mb-1 block">工程范围</Label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{project.scope || '-'}</p>
              </div>
              <div className="mt-4">
                <Label className="text-xs text-gray-500 mb-1 block">项目简介</Label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{project.description || '-'}</p>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">待办事项</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-amber-50/60">
                  <span className="text-gray-700">待审批计划</span><Badge className="bg-amber-500">{s.planPending ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-orange-50/60">
                  <span className="text-gray-700">待审批变更</span><Badge className="bg-orange-500">{s.changePending ?? 0}</Badge>
                </div>
                <div className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-blue-50/60">
                  <span className="text-gray-700">施工日志</span><Badge className="bg-blue-500">{s.logCount ?? 0} 篇</Badge>
                </div>
                <div className="flex items-center justify-between text-sm p-2.5 rounded-lg bg-emerald-50/60">
                  <span className="text-gray-700">累计出勤</span><Badge className="bg-emerald-500">{(s.logLaborTotal ?? 0).toLocaleString()} 人次</Badge>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">成本概览</CardTitle></CardHeader>
              <CardContent className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">预算总额</span><span className="font-semibold text-gray-900 tabular-nums">{fmtMoney(s.budgetAmount)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">已发生成本</span><span className="font-semibold text-gray-900 tabular-nums">{fmtMoney(s.budgetActual)}</span>
                </div>
                {s.budgetAmount ? (
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min(100, (s.budgetActual / s.budgetAmount) * 100)}%` }} />
                  </div>
                ) : null}
                <div className="flex items-center justify-between text-sm pt-1">
                  <span className="text-gray-500">变更签证金额</span><span className="font-semibold text-gray-900 tabular-nums">{fmtMoney(s.changeAmount)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 关联业务数据 */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {relatedBlocks.map((blk) => {
            const t = blk.tone;
            return (
              <Card key={blk.title}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <span className={`w-8 h-8 rounded-lg flex items-center justify-center ${t === 'sky' ? 'bg-sky-100 text-sky-600' : t === 'emerald' ? 'bg-emerald-100 text-emerald-600' : t === 'amber' ? 'bg-amber-100 text-amber-600' : t === 'teal' ? 'bg-teal-100 text-teal-600' : t === 'red' ? 'bg-red-100 text-red-600' : t === 'green' ? 'bg-green-100 text-green-600' : t === 'purple' ? 'bg-purple-100 text-purple-600' : 'bg-cyan-100 text-cyan-600'}`}>
                      <blk.icon className="w-4 h-4" />
                    </span>
                    {blk.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-1 space-y-2.5">
                  {blk.items.map((it) => (
                    <div key={it.label} className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">{it.label}</span>
                      <div className="text-right">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{it.value}</span>
                        {it.sub !== '-' && <span className="text-[10px] text-gray-400 ml-1.5">{it.sub}</span>}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Schedule Tab */}
      {tab === 'schedule' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2"><TrendingUp className="w-4 h-4 text-blue-500" />进度甘特图</CardTitle>
            <Badge variant="secondary" className="text-xs">{scheduleItems.length} 个工作项 · 平均 {s.avgProgress ?? 0}%</Badge>
          </CardHeader>
          <CardContent>
            {scheduleItems.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>暂无进度数据</p>
                <p className="text-sm mt-1">请在「施工进度」模块填报该项目的进度</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <div style={{ minWidth: 560 }}>
                  <div className="flex border-b border-gray-200 pb-2 mb-2">
                    <div className="w-44 flex-shrink-0 text-xs text-gray-500 font-medium">工作项</div>
                    <div className="flex-1 relative" style={{ height: 20 }}>
                      <div className="absolute inset-0 flex">
                        {sMonths.map((m) => (
                          <div key={m.key} className="flex-shrink-0 border-l border-gray-100" style={{ width: `${(m.days / sTotal) * 100}%` }}>
                            <span className="text-xs text-gray-400 pl-1">{m.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {scheduleItems.map((it: any, idx: number) => {
                      const start = new Date(it.startDate).getTime();
                      const end = new Date(it.endDate || it.startDate).getTime();
                      const offset = ((start - sMin.getTime()) / (sTotal * 86400000)) * 100;
                      const width = Math.max(((end - start) / (sTotal * 86400000)) * 100, 1.5);
                      const p = Number(it.progress || 0);
                      return (
                        <div key={it.id} className="flex items-center">
                          <div className="w-44 flex-shrink-0 pr-3">
                            <p className="text-sm text-gray-800 font-medium truncate">{it.task || it.id}</p>
                            <p className="text-xs text-gray-400 truncate">{it.owner || ''}</p>
                          </div>
                          <div className="flex-1 relative h-7 rounded-md bg-gray-50" style={{ marginLeft: `${offset}%`, marginRight: `${100 - offset - width}%` }}>
                            <div className={`absolute inset-y-0 left-0 rounded-md ${BAR_COLORS[idx % BAR_COLORS.length]} opacity-90`} style={{ width: `${width}%` }}>
                              <div className="absolute inset-y-0 left-0 rounded-md bg-black/25" style={{ width: `${p}%` }} />
                              <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{p}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Logs Tab */}
      {tab === 'logs' && (
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><ClipboardList className="w-4 h-4 text-blue-500" />施工日志 ({logs.length})</CardTitle></CardHeader>
          <CardContent>
            {logs.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>暂无施工日志</p>
                <p className="text-sm mt-1">请在「施工日志」模块填写该项目的日志</p>
              </div>
            ) : (
              <div className="space-y-3">
                {logs.map((it: any) => {
                  const WI = WEATHER_ICON[it.weather] || Sun;
                  return (
                    <div key={it.id} className="border border-gray-100 rounded-xl p-4 hover:border-blue-200 transition-colors">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-gray-500 flex items-center gap-1"><CalendarDays className="w-3 h-3" />{it.date}</span>
                        <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600"><WI className="w-3 h-3" />{it.weather}</Badge>
                        <Badge variant="outline" className="gap-1 text-[10px] px-1.5 py-0 bg-gray-50 text-gray-600"><Users className="w-3 h-3" />{it.labor || 0}人</Badge>
                        {it.recorder && <span className="text-xs text-gray-400 ml-auto">记录人：{it.recorder}</span>}
                      </div>
                      <p className="text-sm text-gray-700 mt-2 leading-relaxed">{it.workContent || '-'}</p>
                      {it.equipment && (
                        <p className="text-xs text-gray-500 flex items-center gap-1.5 mt-1.5"><Wrench className="w-3 h-3 text-gray-400" />{it.equipment}</p>
                      )}
                      {it.issues && it.issues !== '无' ? (
                        <p className="text-xs text-amber-600 flex items-start gap-1.5 bg-amber-50 rounded-lg px-2.5 py-1.5 mt-2"><AlertCircle className="w-3 h-3 mt-0.5 flex-shrink-0" />{it.issues}</p>
                      ) : (
                        <p className="text-xs text-emerald-600 flex items-center gap-1.5 mt-2"><AlertCircle className="w-3 h-3" />当日无问题</p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Milestones Tab */}
      {tab === 'milestones' && (
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><GitBranch className="w-4 h-4 text-blue-500" />里程碑 ({milestones.length})</CardTitle></CardHeader>
          <CardContent>
            {milestones.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>暂无里程碑</p>
                <p className="text-sm mt-1">请在「里程碑管理」模块建立该项目的关键节点</p>
              </div>
            ) : (
              <div className="space-y-3">
                {milestones.map((m: any) => (
                  <div key={m.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50">
                    {m.status === '已完成' ? <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      : m.status === '进行中' ? <Loader2 className="w-4 h-4 text-blue-500 animate-spin flex-shrink-0" />
                      : <Clock className="w-4 h-4 text-slate-300 flex-shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm text-gray-900 truncate">{m.name}</p>
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 border-0 ${
                          m.status === '已完成' ? 'bg-emerald-100 text-emerald-700' : m.status === '进行中' ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                        }`}>{m.status}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5">
                        计划 {m.planDate || '-'}
                        {m.actualDate && <span className="ml-2 text-emerald-600">实际 {m.actualDate}</span>}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                          <div className={`h-full rounded-full ${m.status === '已完成' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Number(m.progress || 0)}%` }} />
                        </div>
                        <span className="text-xs text-gray-500 tabular-nums w-9 text-right">{Number(m.progress || 0)}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Costs Tab */}
      {tab === 'costs' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">月度产值趋势（万元）</CardTitle></CardHeader>
            <CardContent>
              {prodTrend.length === 0 ? (
                <div className="text-center py-16 text-gray-400">暂无产值数据</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={prodTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} 万`, '产值']} />
                    <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">预算构成</CardTitle></CardHeader>
            <CardContent>
              {budgetData.length === 0 ? (
                <div className="text-center py-16 text-gray-400">暂无预算数据</div>
              ) : (
                <ResponsiveContainer width="100%" height={240}>
                  <PieChart>
                    <Pie data={budgetData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} label={({ name, value }: any) => `${name} ${fmtMoney(Number(value))}`}>
                      {budgetData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: any) => [fmtMoney(Number(v)), '预算']} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />项目文档 ({documents.length})
            </CardTitle>
            <div className="flex-1" />
            <Button size="sm" onClick={() => setAddDocOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />上传文档
            </Button>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Paperclip className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>暂无项目文档</p>
                <p className="text-sm mt-1">点击右上角「上传文档」添加</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc: any) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="text-2xl flex-shrink-0">{DOC_TYPE_ICON[doc.type] || '📁'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">{doc.name}</span>
                        {doc.type && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.type}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{doc.fileName || '-'}</span>
                        <span className="text-xs text-gray-400">{fmtBytes(doc.size)}</span>
                        <span className="text-xs text-gray-400">{doc.uploader || '-'} · {doc.date || '-'}</span>
                      </div>
                      {doc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewDoc(doc)} title="查看"><Eye className="w-3.5 h-3.5 text-blue-600" /></Button>
                      <Button variant="ghost" size="icon-sm" title="下载"><Download className="w-3.5 h-3.5 text-gray-500" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDelDocId(doc.id)} title="删除"><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* View document dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>文档详情</DialogTitle></DialogHeader>
          {viewDoc && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-3xl">{DOC_TYPE_ICON[viewDoc.type] || '📁'}</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">{viewDoc.name}</p>
                  <p className="text-xs text-gray-500">{viewDoc.fileName || '未命名文件'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtBytes(viewDoc.size)} · {viewDoc.type || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">上传人:</span> <span className="ml-1">{viewDoc.uploader || '-'}</span></div>
                <div><span className="text-gray-500">日期:</span> <span className="ml-1">{viewDoc.date || '-'}</span></div>
              </div>
              {viewDoc.description && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewDoc.description}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewDoc(null)}>关闭</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs"><Download className="w-3.5 h-3.5 mr-1" />下载</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add document dialog */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>上传项目文档</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>文档名称 *</Label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="输入文档名称" className="mt-1" />
            </div>
            <div>
              <Label>文档类型</Label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm">
                <option value="">请选择类型</option>
                {['技术方案', '图纸', '检测报告', '验收记录', '设计变更', '评估报告', '设备清单', '合同文件', '其他'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>文件名</Label>
              <Input value={docFile} onChange={(e) => setDocFile(e.target.value)} placeholder="如: xxx.pdf" className="mt-1" />
            </div>
            <div>
              <Label>描述</Label>
              <textarea value={docDesc} onChange={(e) => setDocDesc(e.target.value)} className="mt-1 w-full min-h-16 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm" placeholder="文档描述..." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setAddDocOpen(false)}>取消</Button>
              <Button size="sm" onClick={handleAddDoc} disabled={!docName.trim()} className="bg-blue-600 hover:bg-blue-700 text-xs">确认上传</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delDocId} onOpenChange={(o) => !o && setDelDocId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">确认删除该文档？此操作不可恢复。</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDelDocId(null)}>取消</Button>
            <Button size="sm" onClick={() => handleDeleteDoc(delDocId!)} className="bg-red-600 hover:bg-red-700 text-xs">确认删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, accent, badgeClass, badge }: any) {
  return (
    <div>
      <Label className="text-xs text-gray-500 mb-1 block">
        {Icon && <Icon className="w-3 h-3 inline mr-1" />}
        {label}
      </Label>
      {badgeClass ? (
        <Badge variant="outline" className={badgeClass}>{value}</Badge>
      ) : accent ? (
        <p className="text-sm font-semibold text-emerald-600">{value}</p>
      ) : badge ? (
        <div className="flex items-center gap-2 text-sm text-gray-700">{value}{badge}</div>
      ) : (
        <p className="text-sm text-gray-700">{value || '-'}</p>
      )}
    </div>
  );
}