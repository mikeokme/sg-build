'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Search, Pencil, Trash2, Loader2, Eye } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, canViewField, canEditField, getCurrentRole } from '@/config/roles';
import { useProjectFilter, useCurrentProject } from '@/context/ProjectContext';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

function createEmptyForm(fields: FeatureDef['fields']) {
  const form: Record<string, any> = {};
  for (const f of fields) {
    form[f.key] = f.type === 'number' ? 0 : '';
  }
  return form;
}

export function FeaturePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const { t, tCat, tFeat, tField } = useT();

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const matchesProject = useProjectFilter(categoryKey);
  const currentProject = useCurrentProject(categoryKey);

  const visibleFields = useMemo(
    () => feature.fields.filter((f) => canViewField(feature.collection, f.key, role)),
    [feature, role],
  );
  const isFieldEditable = (f: (typeof feature.fields)[0]) =>
    canEditField(feature.collection, f.key, allowEdit, role);

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

  const filtered = useMemo(() => {
    let list = items.filter(matchesProject);
    if (!search.trim()) return list;
    const q = search.toLowerCase();
    return list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
  }, [items, search, matchesProject]);

  const openCreate = () => {
    setEditing(null);
    const form: Record<string, any> = {};
    for (const f of visibleFields) form[f.key] = f.type === 'number' ? 0 : '';
    if (currentProject && feature.fields.some((f) => f.key === 'project')) {
      form.project = currentProject.name;
    }
    setForm(form);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of visibleFields) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
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
    if (!confirm(`${t('confirmDelete')}「${Object.values(item)[1] || item.id}」吗？`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/${feature.collection}/${item.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    fetchItems();
  };

  const renderValue = (item: any, key: string) => {
    const field = feature.fields.find((f) => f.key === key);
    const v = item[key];
    if (v === undefined || v === null || v === '') return <span className="text-gray-400">-</span>;
    if (field?.type === 'select') {
      return <Badge variant="outline" className="text-xs">{v}</Badge>;
    }
    if (field?.type === 'number') {
      return <span className="tabular-nums">{Number(v).toLocaleString()}</span>;
    }
    return <span className="truncate max-w-[220px] inline-block align-bottom">{String(v)}</span>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate ? (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{t('add')}</Button>
        ) : (
          <Badge variant="outline" className="px-3 py-1.5 gap-1 border-gray-200 text-gray-500"><Eye className="w-3.5 h-3.5" />{t('readonly')}</Badge>
        )}
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base font-semibold">{tFeat(categoryKey, feature.key)}{t('list')}</CardTitle>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={t('search')} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} {t('count')}</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{t('noData')}</p>
              <p className="text-sm mt-1">{t('noDataHint')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {visibleFields.map((f) => <TableHead key={f.key}>{tField(f.key, f.label)}</TableHead>)}
                  <TableHead className="w-20 text-right">{t('operation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((item) => (
                  <TableRow key={item.id}>
                    {visibleFields.map((f) => <TableCell key={f.key}>{renderValue(item, f.key)}</TableCell>)}
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {allowEdit && <Button variant="ghost" size="icon-sm" onClick={() => openEdit(item)} title={t('edit')}><Pencil className="w-4 h-4 text-blue-600" /></Button>}
                        {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(item)} title={t('delete')}><Trash2 className="w-4 h-4 text-red-600" /></Button>}
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
            {visibleFields.map((f) => (
              <div key={f.key}>
                <Label>{tField(f.key, f.label)}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select
                    className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    disabled={!isFieldEditable(f)}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  >
                    <option value="">{t('pleaseSelect')}</option>
                    {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea
                    className="mt-1 w-full min-h-24 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    disabled={!isFieldEditable(f)}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="mt-1"
                    type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    disabled={!isFieldEditable(f)}
                    onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })}
                    placeholder={`${t('inputPlaceholder')}${tField(f.key, f.label)}`}
                  />
                )}
                {!isFieldEditable(f) && <span className="text-[10px] text-gray-400 mt-0.5 block">{t('cannotEdit')}</span>}
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