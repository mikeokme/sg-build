'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, TrendingUp, BarChart3, Wallet } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip,
  CartesianGrid, LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';
const PIE_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4', '#ef4444', '#ec4899', '#14b8a6'];

export function ProductionValuePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
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

  const totalValue = items.reduce((s, it) => s + Number(it.value || 0), 0);
  const totalCumulative = items.reduce((s, it) => s + Number(it.cumulative || 0), 0);
  const projects = useMemo(() => Array.from(new Set(items.map((it) => it.project).filter(Boolean))), [items]);

  const monthlyTrend = useMemo(() => {
    const map = new Map<string, number>();
    for (const pv of items) map.set(pv.month, (map.get(pv.month) || 0) + Number(pv.value || 0));
    return Array.from(map.entries())
      .map(([month, value]) => ({ month, value }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [items]);

  const cumulativeByProject = useMemo(() => {
    const map = new Map<string, number>();
    for (const pv of items) map.set(pv.project, (map.get(pv.project) || 0) + Number(pv.cumulative || pv.value || 0));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [items]);

  const projectShare = useMemo(() => {
    const map = new Map<string, number>();
    for (const pv of items) map.set(pv.project, (map.get(pv.project) || 0) + Number(pv.value || 0));
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [items]);

  const openCreate = () => {
    setEditing(null);
    setForm({});
    for (const f of feature.fields) if (f.type === 'number') form[f.key] = 0;
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
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}${isZh ? `「${item.project || ''} ${item.month || ''}」的产值记录吗？` : ` production value record for "${item.project || ''} ${item.month || ''}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '填报产值' : 'Report Value'}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: TrendingUp, label: isZh ? '本月产值合计' : 'Monthly Output', value: `${totalValue.toLocaleString()} ${isZh ? '万' : 'w'}`, tone: 'blue' },
          { icon: Wallet, label: isZh ? '累计产值' : 'Cumulative Output', value: `${totalCumulative.toLocaleString()} ${isZh ? '万' : 'w'}`, tone: 'emerald' },
          { icon: BarChart3, label: isZh ? '统计项目数' : 'Projects', value: projects.length, tone: 'purple' },
          { icon: BarChart3, label: isZh ? '记录条数' : 'Records', value: items.length, tone: 'amber' },

        ].map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '月度产值趋势（万元）' : 'Monthly Output Trend (10k CNY)'}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
            ) : monthlyTrend.length === 0 ? (
              <div className="text-center py-16 text-gray-400">{isZh ? '暂无产值数据' : 'No production value data'}</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={monthlyTrend} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="month" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ${isZh ? '万' : 'w'}`, isZh ? '产值' : 'Value']} />
                  <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={36} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '各项目产值占比' : 'Output Share by Project'}</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
            ) : projectShare.length === 0 ? (
              <div className="text-center py-16 text-gray-400">{isZh ? '暂无产值数据' : 'No production value data'}</div>
            ) : (
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={projectShare} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, value }: any) => `${String(name).slice(0, 6)} ${Number(value).toFixed(0)}${isZh ? '万' : 'w'}`}>
                    {projectShare.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ${isZh ? '万' : 'w'}`, isZh ? '产值' : 'Value']} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '累计产值排行（万元）' : 'Cumulative Output Ranking (10k CNY)'}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : cumulativeByProject.length === 0 ? (
            <div className="text-center py-16 text-gray-400">{isZh ? '暂无产值数据' : 'No production value data'}</div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={cumulativeByProject} layout="vertical" margin={{ top: 0, right: 30, left: 20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `${Number(v).toFixed(0)}${isZh ? '万' : 'w'}`} />
                <YAxis type="category" dataKey="name" fontSize={10} width={150} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: any) => [`${Number(v).toLocaleString()} ${isZh ? '万' : 'w'}`, isZh ? '累计产值' : 'Cumulative']} />
                <Bar dataKey="value" fill="#10b981" radius={[0, 4, 4, 0]} maxBarSize={20} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base font-semibold">{isZh ? '产值明细' : 'Value Details'}</CardTitle>
          <Badge variant="secondary" className="text-xs">{items.length} {t('count')}</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400">{isZh ? '暂无产值记录' : 'No production value records'}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-left text-xs text-gray-500">
                    <th className="py-2 pr-4 font-medium">{isZh ? '项目' : 'Project'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '月份' : 'Month'}</th>
                    <th className="py-2 pr-4 font-medium text-right">{isZh ? '本月产值（万）' : 'Monthly Output (10k)'}</th>
                    <th className="py-2 pr-4 font-medium text-right">{isZh ? '累计产值（万）' : 'Cumulative (10k)'}</th>
                    <th className="py-2 pr-4 font-medium">{isZh ? '责任人' : 'Owner'}</th>
                    <th className="py-2 font-medium text-right">{t('operation')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((it) => (
                    <tr key={it.id} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 pr-4 text-gray-800">{it.project || '-'}</td>
                      <td className="py-2 pr-4 text-gray-600">{it.month || '-'}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-gray-900 font-medium">{Number(it.value || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-right tabular-nums text-emerald-600">{Number(it.cumulative || 0).toLocaleString()}</td>
                      <td className="py-2 pr-4 text-gray-600">{it.owner || '-'}</td>
                      <td className="py-2 text-right">
                        <div className="flex justify-end gap-1">
                          {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title={t('edit')}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                          {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title={t('delete')}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
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
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">{t('pleaseSelect')}</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="mt-1"
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    placeholder={`${t('inputPlaceholder')}${tField(f.key, f.label)}`}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? t('save') : t('confirmAdd')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}