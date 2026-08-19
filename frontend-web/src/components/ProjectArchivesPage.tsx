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
import {
  Plus, Search, Pencil, Trash2, Eye, Loader2, Building2,
  TrendingUp, Wallet, Clock, CheckCircle2, XCircle, AlertTriangle,
  MapPin, CalendarDays, User, Shield, ChevronRight,
} from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, canViewField, canEditField, getCurrentRole } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

const STATUS_COLOR: Record<string, string> = {
  立项: 'bg-slate-100 text-slate-600 border-slate-200',
  在建: 'bg-blue-100 text-blue-700 border-blue-200',
  竣工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  完工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  停工: 'bg-red-100 text-red-700 border-red-200',
  暂缓: 'bg-amber-100 text-amber-700 border-amber-200',
};

const STATUS_DOT: Record<string, string> = {
  立项: 'bg-slate-400',
  在建: 'bg-blue-500 animate-pulse',
  竣工: 'bg-emerald-500',
  完工: 'bg-emerald-500',
  停工: 'bg-red-500',
  暂缓: 'bg-amber-500',
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
  return { text: `${diff} 天后`, cls: 'text-gray-500' };
}

function ProjectStats({ items }: { items: any[] }) {
  const total = items.length;
  const inConstruction = items.filter((i) => i.status === '在建').length;
  const completed = items.filter((i) => i.status === '竣工' || i.status === '完工').length;
  const totalAmount = items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const pending = items.filter((i) => i.status === '立项').length;
  const suspended = items.filter((i) => i.status === '停工' || i.status === '暂缓').length;

  const stats = [
    { icon: Building2, label: '项目总数', value: total, sub: '累计建档', color: 'text-blue-600', bg: 'bg-blue-50' },
    { icon: TrendingUp, label: '在建项目', value: inConstruction, sub: '施工中', color: 'text-emerald-600', bg: 'bg-emerald-50' },
    { icon: CheckCircle2, label: '已完工', value: completed, sub: '竣工/完工', color: 'text-sky-600', bg: 'bg-sky-50' },
    { icon: Wallet, label: '合同总额', value: fmtMoney(totalAmount), sub: '累计签约', color: 'text-purple-600', bg: 'bg-purple-50' },
    { icon: Clock, label: '待开工', value: pending, sub: '立项阶段', color: 'text-amber-600', bg: 'bg-amber-50' },
    { icon: AlertTriangle, label: '暂停中', value: suspended, sub: '停工/暂缓', color: 'text-red-600', bg: 'bg-red-50' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((s) => (
        <Card key={s.label} className="hover:shadow-md transition-shadow">
          <CardContent className="p-4 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${s.bg}`}>
              <s.icon className={`w-5 h-5 ${s.color}`} />
            </div>
            <div>
              <p className="text-lg font-bold text-gray-900">{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ViewDialog({ item, open, onClose }: { item: any; open: boolean; onClose: () => void }) {
  if (!item) return null;
  const remaining = daysRemaining(item.endDate);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <DialogTitle className="text-base text-gray-900">{item.name || '未命名项目'}</DialogTitle>
              <p className="text-xs text-gray-400 mt-0.5">项目编号: {item.code || '-'}</p>
            </div>
            {item.status && (
              <Badge className={`${STATUS_COLOR[item.status] || 'bg-gray-100'} border ml-auto`}>{item.status}</Badge>
            )}
          </div>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            <InfoField icon={MapPin} label="项目地点" value={item.location} />
            <InfoField icon={Building2} label="工程类型" value={item.type} badgeClass={TYPE_BADGE[item.type]} />
            <InfoField icon={User} label="项目经理" value={item.manager} />
            <InfoField icon={Shield} label="监理负责人" value={item.supervisor} />
            <InfoField icon={Building2} label="建设单位" value={item.customer} />
            <InfoField icon={Wallet} label="合同类型" value={item.contractType} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField icon={Wallet} label="合同金额" value={fmtMoney(item.amount)} accent />
            <InfoField icon={CheckCircle2} label="质量目标" value={item.qualityTarget} />
            <InfoField icon={Shield} label="安全目标" value={item.safetyTarget} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <InfoField icon={CalendarDays} label="开工日期" value={item.startDate} />
            <InfoField icon={CalendarDays} label="计划竣工" value={item.endDate} />
            <InfoField icon={Clock} label="计划工期" value={item.planDuration ? `${item.planDuration} 天` : '-'} />
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">工程范围</Label>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{item.scope || '-'}</p>
          </div>
          <div>
            <Label className="text-xs text-gray-500 mb-1 block">项目简介</Label>
            <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{item.description || '-'}</p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t">
            <span className={`w-2 h-2 rounded-full ${STATUS_DOT[item.status] || 'bg-gray-400'}`} />
            <span className="text-xs text-gray-500">状态: <span className={`font-medium ${remaining.cls}`}>{item.status} · 剩余 {remaining.text}</span></span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function InfoField({ icon: Icon, label, value, accent, badgeClass }: any) {
  return (
    <div>
      <Label className="text-xs text-gray-500 mb-1 block">
        {Icon && <Icon className="w-3 h-3 inline mr-1" />}
        {label}
      </Label>
      {badgeClass ? (
        <Badge variant="outline" className={badgeClass}>{value}</Badge>
      ) : accent ? (
        <p className={`text-sm font-semibold ${accent ? 'text-emerald-600' : 'text-gray-900'}`}>{value}</p>
      ) : (
        <p className="text-sm text-gray-700">{value || '-'}</p>
      )}
    </div>
  );
}

function EditDialog({ feature, item, open, onClose, onSave }: {
  feature: FeatureDef;
  item: any | null;
  open: boolean;
  onClose: () => void;
  onSave: (data: Record<string, any>) => void;
}) {
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      const defaults: Record<string, any> = {};
      for (const f of feature.fields) defaults[f.key] = f.type === 'number' ? 0 : '';
      if (item) {
        Object.keys(defaults).forEach((k) => { if (item[k] !== undefined) defaults[k] = item[k]; });
      }
      setForm(defaults);
    }
  }, [open, item]);

  const set = (key: string, val: any) => setForm((p) => ({ ...p, [key]: val }));

  const handleSubmit = async () => {
    setSaving(true);
    onSave(form);
    setSaving(false);
  };

  if (!open) return null;
  const title = item ? '编辑项目' : '新建项目';

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{title}</DialogTitle></DialogHeader>
        <div className="space-y-4 py-2">
          <div className="grid grid-cols-2 gap-4">
            {['name', 'code', 'location', 'type', 'manager', 'supervisor', 'customer', 'contractType',
              'amount', 'qualityTarget', 'safetyTarget', 'startDate', 'endDate', 'planDuration'].map((key) => {
              const f = feature.fields.find((ff) => ff.key === key);
              if (!f) return null;
              return (
                <div key={key}>
                  <Label>{f.label}{f.required ? <span className="text-red-500 ml-0.5">*</span> : ''}</Label>
                  {f.type === 'select' ? (
                    <select
                      className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                      value={form[key] ?? ''}
                      onChange={(e) => set(key, e.target.value)}
                    >
                      <option value="">请选择</option>
                      {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                  ) : f.type === 'textarea' ? (
                    <textarea
                      className="mt-1 w-full min-h-20 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                      value={form[key] ?? ''}
                      onChange={(e) => set(key, e.target.value)}
                      placeholder={`请输入${f.label}`}
                    />
                  ) : (
                    <Input
                      className="mt-1"
                      type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                      value={form[key] ?? ''}
                      onChange={(e) => set(key, f.type === 'number' ? Number(e.target.value) : e.target.value)}
                      placeholder={`请输入${f.label}`}
                    />
                  )}
                </div>
              );
            })}
          </div>
          <div>
            <Label>项目简介</Label>
            {(() => {
              const f = feature.fields.find((ff) => ff.key === 'description');
              if (!f) return null;
              return (
                <textarea
                  className="mt-1 w-full min-h-20 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                  value={form.description ?? ''}
                  onChange={(e) => set('description', e.target.value)}
                  placeholder="请输入项目简介"
                />
              );
            })()}
          </div>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>取消</Button>
          <Button size="sm" onClick={handleSubmit} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
            {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}
            {item ? '保存修改' : '确认新建'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function ProjectArchivesPage({ feature, categoryTitle }: { feature: FeatureDef; categoryTitle: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [viewItem, setViewItem] = useState<any>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const role = getCurrentRole();
  const allowCreate = canCreate('engineering', role);
  const allowEdit = canEdit('engineering', role);
  const allowDelete = canDelete('engineering', role);

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
        headers: { Authorization: token ? `Bearer ${token}` : '' },
      });
      if (res.ok) {
        const data = await res.json();
        setItems(Array.isArray(data) ? data : []);
      } else {
        console.warn(`Collections fetch failed: ${res.status} ${res.statusText}`);
      }
    } catch (e) {
      console.error('Failed to fetch projects:', e);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature.collection]);

  const filtered = useMemo(() => {
    let list = items;
    if (statusFilter !== '全部') list = list.filter((i) => i.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [items, search, statusFilter]);

  const openCreate = () => {
    setEditing(null);
    setEditOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    setEditOpen(true);
  };

  const handleSave = async (data: Record<string, any>) => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/collections/${feature.collection}${editing ? `/${editing.id}` : ''}`;
    await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(data),
    });
    setEditOpen(false);
    setEditing(null);
    fetchItems();
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`确认删除项目「${item.name}」？此操作不可恢复。`)) return;
    const token = localStorage.getItem('token');
    setDeleting(item.id);
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    setDeleting(null);
    fetchItems();
  };

  const statusOptions = ['全部', '立项', '在建', '竣工', '完工', '停工', '暂缓'];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />新建项目</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />只读模式</Badge>
        )}
      </div>

      {/* Stats */}
      <ProjectStats items={items} />

      {/* Filter bar + table */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base font-semibold">项目列表</CardTitle>
          <div className="flex items-center gap-2">
            {statusOptions.map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={`px-2.5 py-1 rounded-full text-xs transition-colors ${
                  statusFilter === s
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="搜索项目..." className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} 条</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>暂无项目数据</p>
              {allowCreate && <p className="text-sm mt-1">点击右上角「新建项目」添加</p>}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-28">项目编号</TableHead>
                  <TableHead>项目名称</TableHead>
                  <TableHead>工程类型</TableHead>
                  <TableHead>建设单位</TableHead>
                  <TableHead className="text-right">合同金额</TableHead>
                  <TableHead>开工日期</TableHead>
                  <TableHead>计划竣工</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead className="w-28 text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => {
                  const remaining = daysRemaining(item.endDate);
                  return (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <span className="text-xs font-mono text-gray-500">{item.code || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0">
                            <Building2 className="w-3.5 h-3.5 text-blue-500" />
                          </div>
                          <span className="font-medium text-sm text-gray-900 truncate max-w-[180px]">{item.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {item.type ? (
                          <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${TYPE_BADGE[item.type] || 'bg-gray-50'}`}>{item.type}</Badge>
                        ) : <span className="text-gray-400 text-xs">-</span>}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-gray-600">{item.customer || '-'}</span>
                      </TableCell>
                      <TableCell className="text-right">
                        <span className="text-sm font-semibold text-gray-900 tabular-nums">{fmtMoney(item.amount)}</span>
                      </TableCell>
                      <TableCell>
                        <span className="text-xs text-gray-500">{item.startDate || '-'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-gray-500">{item.endDate || '-'}</div>
                        <div className={`text-[10px] ${remaining.cls}`}>{remaining.text}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[item.status] || 'bg-gray-400'}`} />
                          <Badge variant="outline" className={`${STATUS_COLOR[item.status] || 'bg-gray-100'} text-[10px] px-1.5 py-0 border-0`}>{item.status}</Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon-sm" onClick={() => { setViewItem(item); setViewOpen(true); }} title="查看详情" className="text-blue-600">
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          {allowEdit && (
                            <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)} title="编辑" className="text-gray-500 hover:text-blue-600">
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          )}
                          {allowDelete && (
                            <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item)} title="删除" className="text-gray-500 hover:text-red-600" disabled={deleting === item.id}>
                              {deleting === item.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Detail view dialog */}
      <ViewDialog item={viewItem} open={viewOpen} onClose={() => setViewOpen(false)} />

      {/* Create/Edit dialog */}
      <EditDialog
        feature={feature}
        item={editing}
        open={editOpen}
        onClose={() => setEditOpen(false)}
        onSave={handleSave}
      />
    </div>
  );
}
