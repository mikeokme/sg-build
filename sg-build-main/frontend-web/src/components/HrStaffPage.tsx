'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Search, Phone, CalendarDays, GraduationCap, Cake, Building2, Users, HardHat, Award, AlertTriangle, User2 } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const DEPT_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-amber-500', 'bg-violet-500', 'bg-rose-500', 'bg-cyan-500', 'bg-orange-500', 'bg-indigo-500', 'bg-teal-500'];
const DEPT_LIGHT = ['bg-blue-100 text-blue-600', 'bg-emerald-100 text-emerald-600', 'bg-amber-100 text-amber-600', 'bg-violet-100 text-violet-600', 'bg-rose-100 text-rose-600', 'bg-cyan-100 text-cyan-600', 'bg-orange-100 text-orange-600', 'bg-indigo-100 text-indigo-600', 'bg-teal-100 text-teal-600'];

const STAFF_FIELDS: { key: string; label: string; type?: string; required?: boolean; options?: { value: string; label: string }[] }[] = [
  { key: 'name', label: '姓名', required: true },
  { key: 'department', label: '部门' },
  { key: 'position', label: '职位' },
  { key: 'gender', label: '性别', type: 'select', options: ['男', '女'].map((v) => ({ value: v, label: v })) },
  { key: 'birthDate', label: '出生日期', type: 'date' },
  { key: 'education', label: '学历', type: 'select', options: ['初中及以下', '高中/中专', '大专', '本科', '硕士及以上'].map((v) => ({ value: v, label: v })) },
  { key: 'phone', label: '联系电话' },
  { key: 'hireDate', label: '入职日期', type: 'date' },
  { key: 'status', label: '状态', type: 'select', options: ['在职', '离职', '休假'].map((v) => ({ value: v, label: v })) },
];

const statusCls = (st: string) =>
  st === '在职' ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
  : st === '休假' ? 'bg-amber-50 text-amber-600 border-amber-200'
  : 'bg-gray-100 text-gray-500 border-gray-200';

export function HrStaffPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [attendances, setAtt] = useState<any[]>([]);
  const [rewards, setRewards] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('全部');
  const [statusFilter, setStatusFilter] = useState('全部');
  const [selected, setSelected] = useState<any>(null);
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

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const [s, a, r, t] = await Promise.all([
      fetch(`${API_BASE}/collections/staff`, { headers }),
      fetch(`${API_BASE}/collections/attendances`, { headers }),
      fetch(`${API_BASE}/collections/rewards`, { headers }),
      fetch(`${API_BASE}/collections/teams`, { headers }),
    ]);
    if (s.ok) setStaff(await s.json());
    if (a.ok) setAtt(await a.json());
    if (r.ok) setRewards(await r.json());
    if (t.ok) setTeams(await t.json());
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const depts = useMemo(() => Array.from(new Set(staff.map((s) => s.department).filter(Boolean))), [staff]);
  const deptIndex = (d: string) => Math.max(0, depts.indexOf(d));

  const filtered = useMemo(() => {
    let list = staff;
    if (deptFilter !== '全部') list = list.filter((s) => s.department === deptFilter);
    if (statusFilter !== '全部') list = list.filter((s) => s.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) => [s.name, s.position, s.department, s.phone].some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return list;
  }, [staff, deptFilter, statusFilter, search]);

  const serviceYears = (d: string) => {
    if (!d) return '';
    const yrs = Math.floor((Date.now() - new Date(d).getTime()) / (365.25 * 86400000));
    return `${yrs}${isZh ? '年' : 'y'}`;
  };
  const age = (bd: string) => bd ? (new Date().getFullYear() - new Date(bd).getFullYear()) : null;

  const personAtt = (name: string) => attendances.filter((a) => a.name === name).sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);
  const personRewards = (name: string) => rewards.filter((r) => r.person === name);
  const personTeams = (name: string) => teams.filter((t) => t.leader === name);

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of STAFF_FIELDS) f[field.key] = field.type === 'number' ? 0 : '';
    setForm(f);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of STAFF_FIELDS) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
    setForm(next);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/collections/staff${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) { setDialogOpen(false); fetchAll(); }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}${isZh ? `员工「${item.name}」吗？` : ` employee "${item.name}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/staff/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    setSelected(null);
    fetchAll();
  };

  const attCls = (st: string) =>
    st === '出勤' ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
    : st === '迟到' ? 'bg-amber-50 text-amber-600 border-amber-200'
    : st === '早退' ? 'bg-orange-50 text-orange-600 border-orange-200'
    : st === '请假' ? 'bg-blue-50 text-blue-600 border-blue-200'
    : 'bg-rose-50 text-rose-600 border-rose-200';

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold text-gray-900">{tCat(categoryKey)} · {tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{isZh ? '员工主数据 360° 档案：集中呈现基本信息、考勤、奖惩与班组归属' : 'Employee master data 360° profile: basic info, attendance, rewards & team membership'}</p>
        </div>
        {allowCreate && (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '新建员工' : 'New Employee'}</Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder={`${t('search')}${isZh ? ' 姓名 / 职位 / 部门 / 电话' : ' name / position / department / phone'}`} value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-2">
          <Button key={statusFilter} variant="outline" size="sm" onClick={() => setStatusFilter('全部')}>{t('all')}</Button>
          {['在职', '休假', '离职'].map((st) => (
            <Button key={st} size="sm" variant={statusFilter === st ? 'default' : 'outline'} onClick={() => setStatusFilter(st)}>{st}</Button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button key="all" size="sm" variant={deptFilter === '全部' ? 'default' : 'outline'} onClick={() => setDeptFilter('全部')}>{isZh ? '全部部门' : 'All Departments'}</Button>
        {depts.map((d) => (
          <Button key={d} size="sm" variant={deptFilter === d ? 'default' : 'outline'} onClick={() => setDeptFilter(d)}>{d}</Button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {filtered.map((s) => (
          <button key={s.id} onClick={() => setSelected(s)} className="text-left">
            <Card className="hover:shadow-md transition-shadow h-full">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className={`w-11 h-11 rounded-xl ${DEPT_LIGHT[deptIndex(s.department)]} flex items-center justify-center text-base font-bold flex-shrink-0`}>
                    {String(s.name || '?').charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900 truncate">{s.name}</p>
                      <Badge className={`${statusCls(s.status)} text-[10px]`}>{s.status || '在职'}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{s.position} · {s.department}</p>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-400">
                  <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{s.phone || '-'}</span>
                  <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{s.hireDate ? `${s.hireDate.slice(0, 10)} · ${serviceYears(s.hireDate)}` : '-'}</span>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>
      {filtered.length === 0 && <p className="text-center text-gray-400 py-10 text-sm">{isZh ? '未找到符合条件的员工' : 'No employees match the criteria'}</p>}

      {/* 360° 详情抽屉 */}
      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${DEPT_LIGHT[deptIndex(selected.department)]} flex items-center justify-center text-base font-bold`}>{String(selected.name).charAt(0)}</div>
                  <div>
                    <p className="text-base font-bold text-gray-900">{selected.name} <Badge className={`${statusCls(selected.status)} text-[10px] ml-1`}>{selected.status || '在职'}</Badge></p>
                    <p className="text-xs text-gray-500 font-normal">{selected.position} · {selected.department}</p>
                  </div>
                </DialogTitle>
              </DialogHeader>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-sm">
                {[
                  [User2, isZh ? '性别' : 'Gender', selected.gender || '-'],
                  [Cake, isZh ? '出生日期' : 'Birth Date', selected.birthDate ? `${selected.birthDate}（${age(selected.birthDate)}${isZh ? '岁' : 'y'}）` : '-'],
                  [GraduationCap, isZh ? '学历' : 'Education', selected.education || '-'],
                  [Phone, isZh ? '联系电话' : 'Phone', selected.phone || '-'],
                  [CalendarDays, isZh ? '入职日期' : 'Hire Date', selected.hireDate ? `${selected.hireDate} · ${isZh ? '司龄' : 'tenure '}${serviceYears(selected.hireDate)}` : '-'],
                  [Building2, isZh ? '所属部门' : 'Department', selected.department || '-'],
                ].map(([Icon, label, value], i) => (
                  <div key={i} className="bg-gray-50 rounded-lg px-3 py-2">
                    <p className="text-[11px] text-gray-400 flex items-center gap-1"><Icon className="w-3 h-3" />{label}</p>
                    <p className="text-xs font-medium text-gray-700 mt-0.5">{value}</p>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2"><HardHat className="w-4 h-4 text-emerald-600" />{isZh ? '考勤记录' : 'Attendance'}</h4>
                  {personAtt(selected.name).length === 0 ? (
                    <p className="text-xs text-gray-400">{isZh ? '暂无考勤记录' : 'No attendance records'}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {personAtt(selected.name).map((a) => (
                        <Badge key={a.id} variant="outline" className={`${attCls(a.status)} border-0`}>{a.date} · {a.status}</Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2"><Award className="w-4 h-4 text-amber-600" />{isZh ? '奖惩记录' : 'Rewards'}</h4>
                  {personRewards(selected.name).length === 0 ? (
                    <p className="text-xs text-gray-400">{isZh ? '暂无奖惩记录' : 'No reward records'}</p>
                  ) : (
                    <div className="space-y-2">
                      {personRewards(selected.name).map((r) => (
                        <div key={r.id} className="flex items-center justify-between border border-gray-100 rounded-lg px-3 py-2">
                          <div className="flex items-center gap-2">
                            {r.type === '奖励' ? <Award className="w-4 h-4 text-emerald-500" /> : <AlertTriangle className="w-4 h-4 text-rose-500" />}
                            <div><p className="text-xs font-medium text-gray-700">{r.type} · {r.reason}</p><p className="text-[11px] text-gray-400">{r.date}</p></div>
                          </div>
                          <Badge className={r.type === '奖励' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}>{(r.type === '奖励' ? '+' : '-')}{r.amount}{isZh ? '元' : ''}</Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div>
                  <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-2"><Users className="w-4 h-4 text-blue-600" />{isZh ? '班组归属' : 'Teams'}</h4>
                  {personTeams(selected.name).length === 0 ? (
                    <p className="text-xs text-gray-400">{isZh ? '未担任班组长' : 'Not a team leader'}</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {personTeams(selected.name).map((t) => (
                        <Badge key={t.id} variant="outline" className="bg-blue-50 text-blue-600 border-blue-200">{t.name} · {isZh ? `班组长（${t.members}人 · ${t.project}）` : `leader (${t.members}ppl · ${t.project})`}</Badge>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {(allowEdit || allowDelete) && (
                <DialogFooter>
                  {allowDelete && <Button variant="destructive" onClick={() => handleDelete(selected)}><Trash2 className="w-4 h-4 mr-2" />{t('delete')}</Button>}
                  {allowEdit && <Button variant="outline" onClick={() => { const s = selected; setSelected(null); openEdit(s); }}><Pencil className="w-4 h-4 mr-2" />{t('edit')}</Button>}
                </DialogFooter>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* 新建 / 编辑表单 */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editing ? t('edit') : t('add')}{tFeat(categoryKey, feature.key)}</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            {STAFF_FIELDS.map((f) => (
              <div key={f.key} className={f.type === 'textarea' ? 'col-span-2' : ''}>
                <Label className="text-xs text-gray-500">{tField(f.key, f.label)}{f.required && <span className="text-rose-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    className="w-full mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  >
                    <option value="">{t('pleaseSelect')}</option>
                    {(f.options || []).map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: e.target.value }))}
                    rows={3}
                    className="w-full mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                  />
                ) : (
                  <Input
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value }))}
                    className="mt-1"
                    placeholder={f.type === 'number' ? '0' : ''}
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{isZh ? '取消' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">
              {saving && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
              {editing ? t('save') : t('confirmAdd')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}