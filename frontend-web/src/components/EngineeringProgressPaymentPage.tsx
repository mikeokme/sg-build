'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { StatCard } from '@/components/ui/StatCard';
import { Loader2, Search, Plus, Pencil, Trash2, Eye, Building2, Wallet, TrendingUp, CheckCircle2, Clock, AlertCircle, FileText, BarChart3 } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete } from '@/config/roles';
import { getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';
import { useProjectFilter, useCurrentProject } from '@/context/ProjectContext';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, PieChart, Pie, Cell, Legend } from 'recharts';

const API_BASE = 'http://localhost:14725';
const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

function fmtMoney(n: number) {
  if (!n) return '¥0';
  if (n >= 100000000) return `¥${(n / 100000000).toFixed(2)}亿`;
  if (n >= 10000) return `¥${(n / 10000).toFixed(1)}万`;
  return `¥${n.toLocaleString()}`;
}

export function EngineeringProgressPaymentPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';
  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const matchesProject = useProjectFilter(categoryKey);
  const currentProject = useCurrentProject(categoryKey);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) {
      const data = await res.json();
      setItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, [feature.collection]);

  const filtered = useMemo(() => {
    let list = items.filter(matchesProject);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    if (statusFilter !== '全部') list = list.filter((it) => it.status === statusFilter);
    return list;
  }, [items, search, statusFilter, matchesProject]);

  // 汇总统计（实时掌握所有项目）
  const stats = useMemo(() => {
    const totalReported = filtered.reduce((s, it) => s + Number(it.reportedAmount || 0), 0);
    const totalVerified = filtered.reduce((s, it) => s + Number(it.verifiedAmount || 0), 0);
    const totalApproved = filtered.reduce((s, it) => s + Number(it.approvedAmount || 0), 0);
    const avgProgress = filtered.length ? (filtered.reduce((s, it) => s + Number(it.progressPercent || 0), 0) / filtered.length).toFixed(1) : '0';
    const paidRatio = totalVerified ? ((totalApproved / totalVerified) * 100).toFixed(1) : '0';
    return { totalReported, totalVerified, totalApproved, avgProgress, paidRatio };
  }, [filtered]);

  // 按项目聚合（用于表格与图表）
  const byProject = useMemo(() => {
    const map = new Map<string, any>();
    for (const it of filtered) {
      const key = it.project || '未关联项目';
      const cur = map.get(key) || { project: key, reported: 0, verified: 0, approved: 0, count: 0, progress: 0 };
      cur.reported += Number(it.reportedAmount || 0);
      cur.verified += Number(it.verifiedAmount || 0);
      cur.approved += Number(it.approvedAmount || 0);
      cur.count += 1;
      cur.progress = Math.max(cur.progress, Number(it.cumulativeProgress || it.progressPercent || 0));
      map.set(key, cur);
    }
    return Array.from(map.values()).sort((a, b) => b.approved - a.approved);
  }, [filtered]);

  const periodTrend = useMemo(() => {
    const map = new Map<string, any>();
    for (const it of filtered) {
      const p = it.period || it.applyDate?.slice(0, 7) || '未知期次';
      const cur = map.get(p) || { period: p, reported: 0, verified: 0, approved: 0 };
      cur.reported += Number(it.reportedAmount || 0);
      cur.verified += Number(it.verifiedAmount || 0);
      cur.approved += Number(it.approvedAmount || 0);
      map.set(p, cur);
    }
    return Array.from(map.values()).sort((a, b) => a.period.localeCompare(b.period));
  }, [filtered]);

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    if (currentProject) f.project = currentProject.name;
    setForm(f);
    setDialogOpen(true);
  };
  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of feature.fields) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
    setForm(next);
    setDialogOpen(true);
  };
  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/collections/${feature.collection}${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, { method: editing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(form) });
    if (res.ok) { setDialogOpen(false); fetchItems(); }
    setSaving(false);
  };
  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}「${item.period || item.project}」？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchItems();
  };

  if (loading) return <div className="flex items-center justify-center py-24 text-gray-400 gap-2"><Loader2 className="w-5 h-5 animate-spin" />{t('loading')}</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-xs text-gray-500 mt-1">{isZh ? '建设单位视角 · 按期次实时掌握进度与支付' : 'Owner perspective · real-time progress & payment by period'}</p>
        </div>
        {allowCreate ? <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新增支付单' : 'New Payment'}</Button> : <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>}
      </div>

      {/* 顶部汇总（和工作总览对应） */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4">
        <StatCard icon={Building2} label={isZh ? '覆盖项目' : 'Projects'} value={byProject.length} tone="blue" />
        <StatCard icon={FileText} label={isZh ? '支付单数' : 'Records'} value={filtered.length} tone="slate" />
        <StatCard icon={TrendingUp} label={isZh ? '平均进度' : 'Avg Progress'} value={`${stats.avgProgress}%`} tone="emerald" />
        <StatCard icon={Wallet} label={isZh ? '申报金额' : 'Reported'} value={fmtMoney(stats.totalReported)} tone="amber" />
        <StatCard icon={CheckCircle2} label={isZh ? '核定/支付' : 'Verified/Paid'} value={`${fmtMoney(stats.totalVerified)} / ${fmtMoney(stats.totalApproved)}`} tone="cyan" />
        <StatCard icon={BarChart3} label={isZh ? '支付比例' : 'Paid Ratio'} value={`${stats.paidRatio}%`} tone="purple" />
      </div>

      {/* 图表区 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-500" />{isZh ? '按期次支付趋势' : 'Payment Trend by Period'}</CardTitle></CardHeader>
          <CardContent>
            {periodTrend.length === 0 ? <div className="text-center py-16 text-gray-400">{t('noData')}</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={periodTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="period" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${(v/10000).toFixed(0)}w`} />
                  <Tooltip formatter={(v: any, n: any) => [fmtMoney(Number(v)), n === 'reported' ? (isZh ? '申报' : 'Reported') : n === 'verified' ? (isZh ? '核定' : 'Verified') : (isZh ? '支付' : 'Paid')]} />
                  <Legend />
                  <Bar dataKey="reported" name={isZh ? '申报' : 'Reported'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="verified" name={isZh ? '核定' : 'Verified'} fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="approved" name={isZh ? '支付' : 'Paid'} fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-emerald-500" />{isZh ? '按项目支付分布' : 'By Project'}</CardTitle></CardHeader>
          <CardContent>
            {byProject.length === 0 ? <div className="text-center py-16 text-gray-400">{t('noData')}</div> : (
              <ResponsiveContainer width="100%" height={240}>
                <PieChart>
                  <Pie data={byProject.slice(0, 6)} dataKey="approved" nameKey="project" cx="50%" cy="50%" outerRadius={85} label={({ project, approved }: any) => `${project.slice(0, 6)} ${fmtMoney(Number(approved))}`}>
                    {byProject.slice(0, 6).map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [fmtMoney(Number(v)), isZh ? '已支付' : 'Paid']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 按项目汇总表 */}
      <Card>
        <CardHeader className="pb-3"><CardTitle className="text-base font-semibold">{isZh ? '按项目汇总（实时）' : 'Summary by Project (Realtime)'}</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{isZh ? '项目' : 'Project'}</TableHead>
                <TableHead className="text-right">{isZh ? '累计进度' : 'Progress'}</TableHead>
                <TableHead className="text-right">{isZh ? '申报' : 'Reported'}</TableHead>
                <TableHead className="text-right">{isZh ? '核定' : 'Verified'}</TableHead>
                <TableHead className="text-right">{isZh ? '已支付' : 'Paid'}</TableHead>
                <TableHead className="text-right">{isZh ? '单数' : 'Count'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {byProject.map((row) => (
                <TableRow key={row.project}>
                  <TableCell className="font-medium max-w-[220px] truncate">{row.project}</TableCell>
                  <TableCell className="text-right"><Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200">{row.progress}%</Badge></TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(row.reported)}</TableCell>
                  <TableCell className="text-right tabular-nums">{fmtMoney(row.verified)}</TableCell>
                  <TableCell className="text-right tabular-nums font-semibold">{fmtMoney(row.approved)}</TableCell>
                  <TableCell className="text-right">{row.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 明细列表（可按项目下拉过滤，与主软件统一） */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">{isZh ? '支付明细' : 'Payment Records'}</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            {['全部', '待申报', '已申报', '已审核', '已支付'].map((s) => (
              <button key={s} onClick={() => setStatusFilter(s)} className={`px-2.5 py-1 rounded-full text-xs transition-colors ${statusFilter === s ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{s === '全部' ? t('all') : s}</button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} {t('count')}</Badge>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? <div className="text-center py-16 text-gray-400"><p>{t('noData')}</p><p className="text-sm mt-1">{isZh ? '选择项目查看实时支付情况' : 'Select project to view realtime payments'}</p></div> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{isZh ? '期次' : 'Period'}</TableHead>
                  <TableHead>{isZh ? '项目' : 'Project'}</TableHead>
                  <TableHead className="text-right">{isZh ? '进度' : 'Progress'}</TableHead>
                  <TableHead className="text-right">{isZh ? '申报' : 'Reported'}</TableHead>
                  <TableHead className="text-right">{isZh ? '核定' : 'Verified'}</TableHead>
                  <TableHead className="text-right">{isZh ? '支付' : 'Paid'}</TableHead>
                  <TableHead>{isZh ? '状态' : 'Status'}</TableHead>
                  <TableHead className="text-right">{t('operation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((it) => (
                  <TableRow key={it.id}>
                    <TableCell className="font-mono text-xs">{it.period || '-'}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{it.project}</TableCell>
                    <TableCell className="text-right">{it.progressPercent ?? '-'}%</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(Number(it.reportedAmount || 0))}</TableCell>
                    <TableCell className="text-right tabular-nums">{fmtMoney(Number(it.verifiedAmount || 0))}</TableCell>
                    <TableCell className="text-right tabular-nums font-medium">{fmtMoney(Number(it.approvedAmount || 0))}</TableCell>
                    <TableCell><Badge variant="outline" className={it.status === '已支付' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : it.status === '已审核' ? 'bg-blue-50 text-blue-700 border-blue-200' : it.status === '已申报' ? 'bg-amber-50 text-amber-700 border-amber-200' : 'bg-slate-50 text-slate-600'}>{it.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title={t('edit')}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                        {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title={t('delete')}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                        {!allowEdit && !allowDelete && <span className="text-xs text-gray-300">-</span>}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? t('edit') : t('add')}{tFeat(categoryKey, feature.key)}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {feature.fields.map((f) => (
              <div key={f.key}>
                <Label>{tField(f.key, f.label)}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm" value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">{t('pleaseSelect')}</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : <Input className="mt-1" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} placeholder={`${t('inputPlaceholder')}${tField(f.key, f.label)}`} />}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">{saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{editing ? t('save') : t('confirmAdd')}</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
