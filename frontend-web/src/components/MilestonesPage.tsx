'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, GitBranch, CheckCircle2, Loader, Circle, AlertTriangle } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const STATUS_STYLE: Record<string, string> = {
  未开始: 'bg-slate-100 text-slate-600 border-slate-200',
  进行中: 'bg-blue-100 text-blue-700 border-blue-200',
  已完成: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  已延期: 'bg-red-100 text-red-700 border-red-200',
};

export function MilestonesPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [projectFilter, setProjectFilter] = useState('全部');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);

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

  const projects = useMemo(() => Array.from(new Set(items.map((it) => it.project).filter(Boolean))), [items]);

  const filtered = useMemo(() => {
    if (projectFilter === '全部') return items;
    return items.filter((it) => it.project === projectFilter);
  }, [items, projectFilter]);

  const sorted = useMemo(() => [...filtered].sort((a, b) => (a.planDate || '').localeCompare(b.planDate || '')), [filtered]);

  const doneCount = items.filter((it) => it.status === '已完成').length;
  const activeCount = items.filter((it) => it.status === '进行中').length;
  const overdueCount = items.filter((it) => it.status === '已延期' || (it.status !== '已完成' && it.planDate && new Date(it.planDate).getTime() < Date.now())).length;
  const avgProgress = items.length ? Math.round(items.reduce((s, it) => s + Number(it.progress || 0), 0) / items.length) : 0;

  const openCreate = () => {
    setEditing(null);
    setForm({ project: projectFilter === '全部' ? '' : projectFilter, status: '未开始', progress: 0 });
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
    if (!confirm(`确认删除里程碑「${item.name || item.id}」吗？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const statusIcon = (s: string) => {
    if (s === '已完成') return <CheckCircle2 className="w-4 h-4 text-emerald-500" />;
    if (s === '进行中') return <Loader className="w-4 h-4 text-blue-500 animate-spin" />;
    if (s === '已延期') return <AlertTriangle className="w-4 h-4 text-red-500" />;
    return <Circle className="w-4 h-4 text-slate-300" />;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新增里程碑</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />只读</Badge>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { icon: GitBranch, label: '里程碑总数', value: items.length, tone: 'text-blue-600 bg-blue-50' },
          { icon: CheckCircle2, label: '已完成', value: doneCount, tone: 'text-emerald-600 bg-emerald-50' },
          { icon: Loader, label: '进行中', value: activeCount, tone: 'text-purple-600 bg-purple-50' },
          { icon: AlertTriangle, label: '逾期风险', value: overdueCount, tone: 'text-red-600 bg-red-50' },
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

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3 flex-wrap">
          <CardTitle className="text-base font-semibold">里程碑计划</CardTitle>
          <div className="flex items-center gap-1.5 flex-wrap">
            <button onClick={() => setProjectFilter('全部')}
              className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === '全部' ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>全部</button>
            {projects.map((p) => (
              <button key={p} onClick={() => setProjectFilter(p)}
                className={`px-2 py-1 rounded-full text-xs transition-colors ${projectFilter === p ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>{p}</button>
            ))}
          </div>
          <Badge variant="secondary" className="text-xs ml-auto">平均进度 {avgProgress}%</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : sorted.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>暂无里程碑</p>
              {allowCreate && <p className="text-sm mt-1">点击右上角「新增里程碑」建立关键节点</p>}
            </div>
          ) : (
            <div className="space-y-3">
              {sorted.map((it) => (
                <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  {statusIcon(it.status)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-sm text-gray-900 truncate">{it.name}</p>
                      <Badge variant="outline" className={`${STATUS_STYLE[it.status] || ''} border-0 text-[10px] px-1.5 py-0`}>{it.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">
                      {it.project}
                      {it.planDate && <span className="ml-2">计划 {it.planDate}</span>}
                      {it.actualDate && <span className="ml-2 text-emerald-600">实际 {it.actualDate}</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden max-w-xs">
                        <div className={`h-full rounded-full ${it.status === '已完成' ? 'bg-emerald-500' : 'bg-blue-500'}`} style={{ width: `${Number(it.progress || 0)}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 tabular-nums w-9 text-right">{Number(it.progress || 0)}%</span>
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(it)} title="编辑"><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                    {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(it)} title="删除"><Trash2 className="w-4 h-4 text-red-600" /></Button>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing ? '编辑' : '新增'}里程碑</DialogTitle></DialogHeader>
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
            {editing ? '保存修改' : '确认新增'}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}