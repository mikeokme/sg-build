'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Pencil, Trash2, Loader2, Eye, Star, TrendingUp } from 'lucide-react';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, Radar, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useProjectFilter, useCurrentProject } from '@/context/ProjectContext';

const API_BASE = 'http://localhost:3000';

const EVAL_RANK: Record<string, string> = {
  'A级-优秀': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'B级-良好': 'bg-blue-100 text-blue-700 border-blue-200',
  'C级-合格': 'bg-amber-100 text-amber-700 border-amber-200',
  'D级-淘汰': 'bg-red-100 text-red-700 border-red-200',
};

export function SupplierEvalPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [active, setActive] = useState<any>(null);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const matchesProject = useProjectFilter(categoryKey);
  const currentProject = useCurrentProject(categoryKey);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setItems(list);
      setActive((prev: any) => (prev && list.find((l: any) => l.id === prev.id)) || list[0] || null);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature.collection]);

  const scopedItems = useMemo(() => items.filter(matchesProject), [items, matchesProject]);

  useEffect(() => {
    setActive((prev: any) => (prev && scopedItems.find((l: any) => l.id === prev.id)) || scopedItems[0] || null);
  }, [scopedItems]);

  const ranked = useMemo(() => {
    return [...scopedItems].sort((a, b) => {
      const avgA = (Number(a.qualityScore) + Number(a.deliveryScore) + Number(a.priceScore) + Number(a.serviceScore)) / 4;
      const avgB = (Number(b.qualityScore) + Number(b.deliveryScore) + Number(b.priceScore) + Number(b.serviceScore)) / 4;
      return avgB - avgA;
    });
  }, [scopedItems]);

  const rankDist = useMemo(() => {
    const map = new Map<string, number>();
    for (const it of scopedItems) map.set(it.result || '未评级', (map.get(it.result || '未评级') || 0) + 1);
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [scopedItems]);

  const avgQuality = scopedItems.length ? Math.round(scopedItems.reduce((s, it) => s + (Number(it.qualityScore) || 0), 0) / scopedItems.length) : 0;
  const avgDelivery = scopedItems.length ? Math.round(scopedItems.reduce((s, it) => s + (Number(it.deliveryScore) || 0), 0) / scopedItems.length) : 0;
  const avgPrice = scopedItems.length ? Math.round(scopedItems.reduce((s, it) => s + (Number(it.priceScore) || 0), 0) / scopedItems.length) : 0;
  const avgService = scopedItems.length ? Math.round(scopedItems.reduce((s, it) => s + (Number(it.serviceScore) || 0), 0) / scopedItems.length) : 0;
  const excellent = scopedItems.filter((it) => it.result === 'A级-优秀').length;
  const bad = scopedItems.filter((it) => it.result === 'D级-淘汰').length;

  const radarData = [
    { metric: '质量', value: avgQuality },
    { metric: '交期', value: avgDelivery },
    { metric: '价格', value: avgPrice },
    { metric: '服务', value: avgService },
  ];

  const activeAvg = active ? Math.round((Number(active.qualityScore) + Number(active.deliveryScore) + Number(active.priceScore) + Number(active.serviceScore)) / 4) : 0;

  const openCreate = () => {
    setEditing(null);
    setForm({ qualityScore: 0, deliveryScore: 0, priceScore: 0, serviceScore: 0, result: 'B级-良好' });
    for (const f of feature.fields) if (f.type === 'number') setForm((prev) => ({ ...prev, [f.key]: 0 }));
    setForm((prev) => ({ ...prev, result: 'B级-良好' }));
    if (currentProject && feature.fields.some((f) => f.key === 'project')) {
      setForm((prev) => ({ ...prev, project: currentProject.name }));
    }
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
    if (!confirm(`确认删除对「${item.supplier}」的评价吗？`)) return;
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
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
          <p className="text-sm text-gray-500 mt-1">质量·交期·价格·服务 四维考评 · 分级管理供应商</p>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新增评价</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />只读</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { icon: Star, label: '评价总数', value: scopedItems.length, tone: 'text-purple-600 bg-purple-50' },
          { icon: TrendingUp, label: 'A级优秀', value: excellent, tone: 'text-emerald-600 bg-emerald-50' },
          { icon: Star, label: '平均质量分', value: avgQuality, tone: 'text-blue-600 bg-blue-50' },
          { icon: Star, label: '平均交期分', value: avgDelivery, tone: 'text-cyan-600 bg-cyan-50' },
          { icon: Star, label: 'D级待淘汰', value: bad, tone: 'text-red-600 bg-red-50' },
        ].map((s) => (
          <Card key={s.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${s.tone}`}>
                <s.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">四维平均得分</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="72%">
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="metric" fontSize={13} tickLine={false} />
                <Radar name="平均分" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.25} />
                <Tooltip />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">供应商评级分布</CardTitle></CardHeader>
          <CardContent>
            {rankDist.length === 0 ? (
              <div className="text-center py-16 text-gray-400 text-sm">暂无评价数据</div>
            ) : (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={rankDist} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={{ stroke: '#e2e8f0' }} />
                  <YAxis fontSize={11} tickLine={false} axisLine={false} allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-2">
          <CardHeader><CardTitle className="text-base font-semibold">供应商评价列表</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
            ) : ranked.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <p>暂无评价数据</p>
                {allowCreate && <p className="text-sm mt-1">点击右上角「新增评价」</p>}
              </div>
            ) : (
              <div className="space-y-2">
                {ranked.map((it, idx) => (
                  <div key={it.id} className={`flex items-center gap-3 p-3 rounded-xl transition-colors cursor-pointer ${active?.id === it.id ? 'bg-blue-50 ring-1 ring-blue-200' : 'bg-gray-50 hover:bg-gray-100'}`} onClick={() => setActive(it)}>
                    <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-purple-600">#{idx + 1}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm text-gray-900 truncate">{it.supplier}</p>
                        <Badge variant="outline" className={`${EVAL_RANK[it.result] || ''} text-[10px] px-1.5 py-0 border-0`}>{it.result}</Badge>
                      </div>
                      <p className="text-xs text-gray-400 mt-0.5 truncate">
                        {it.project} · 质量{it.qualityScore} 交期{it.deliveryScore} 价格{it.priceScore} 服务{it.serviceScore} · {it.date || '-'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-bold text-gray-900 tabular-nums">{Math.round((Number(it.qualityScore) + Number(it.deliveryScore) + Number(it.priceScore) + Number(it.serviceScore)) / 4)}</p>
                      <p className="text-[10px] text-gray-400">综合分</p>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      {allowEdit && <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); openEdit(it); }}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                      {allowDelete && <Button variant="ghost" size="icon-sm" onClick={(e) => { e.stopPropagation(); handleDelete(it); }}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base font-semibold">评价详情</CardTitle></CardHeader>
          <CardContent>
            {!active ? (
              <div className="text-center py-16 text-gray-400 text-sm">选择左侧供应商查看详情</div>
            ) : (
              <div className="space-y-3">
                <div>
                  <p className="font-semibold text-gray-900">{active.supplier}</p>
                  <p className="text-xs text-gray-400">{active.project}</p>
                </div>
                <Badge className={`${EVAL_RANK[active.result] || ''} border-0`}>{active.result}</Badge>
                <div className="flex items-center gap-2">
                  <span className="text-3xl font-bold text-gray-900 tabular-nums">{activeAvg}</span>
                  <span className="text-xs text-gray-400">综合得分</span>
                </div>
                <div className="space-y-2">
                  {[
                    { label: '质量', v: Number(active.qualityScore) },
                    { label: '交期', v: Number(active.deliveryScore) },
                    { label: '价格', v: Number(active.priceScore) },
                    { label: '服务', v: Number(active.serviceScore) },
                  ].map((r) => (
                    <div key={r.label} className="text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-gray-600">{r.label}</span>
                        <span className="font-medium text-gray-800 tabular-nums">{r.v}</span>
                      </div>
                      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, r.v)}%`, background: r.v >= 85 ? '#10b981' : r.v >= 70 ? '#f59e0b' : '#ef4444' }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 rounded-lg bg-gray-50 text-sm text-gray-600">{active.content || '暂无评价意见'}</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑' : '新增'}供应商评价</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {feature.fields.map((f) => (
              <div key={f.key}>
                <Label>{f.label}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">请选择</option>
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
                    placeholder={`请输入${f.label}`}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
            {editing ? '保存修改' : '确认提交'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}