'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Search, Eye, FileText, CalendarDays, User2, FolderOpen, Files, BookOpen, LayoutTemplate, FileBarChart, FileBox } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const CATEGORY_ICONS: Record<string, any> = {
  制度文件: BookOpen,
  合同文件: FileBarChart,
  图纸资料: LayoutTemplate,
  报告总结: FileText,
  其他: FileBox,
};

const CATEGORY_COLORS: Record<string, string> = {
  制度文件: 'text-blue-600 bg-blue-50',
  合同文件: 'text-purple-600 bg-purple-50',
  图纸资料: 'text-cyan-600 bg-cyan-50',
  报告总结: 'text-emerald-600 bg-emerald-50',
  其他: 'text-gray-600 bg-gray-50',
};

export function OaDocumentsPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('全部');
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const allowCreate = canCreate(categoryKey, getCurrentRole());
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

  const titleField = feature.fields.find((f) => f.key === 'title');
  const contentField = feature.fields.find((f) => f.key === 'content');
  const dateField = feature.fields.find((f) => f.key === 'date');
  const categoryField = feature.fields.find((f) => f.key === 'category');

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

  const categories = useMemo(() => {
    const set = new Set<string>();
    for (const it of items) if (it.category) set.add(it.category);
    return Array.from(set);
  }, [items]);

  const filtered = useMemo(() => {
    let list = items;
    if (category !== '全部') list = list.filter((it) => it.category === category);
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((it) => Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q)));
    }
    return [...list].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
  }, [items, category, search]);

  const byCategory = useMemo(() => {
    const map = new Map<string, any[]>();
    for (const it of items) {
      const c = it.category || '其他';
      if (!map.has(c)) map.set(c, []);
      map.get(c)!.push(it);
    }
    return map;
  }, [items]);

  const openCreate = () => {
    const f: Record<string, any> = {};
    for (const field of feature.fields) f[field.key] = field.type === 'number' ? 0 : '';
    setForm(f);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      setDialogOpen(false);
      fetchItems();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate && <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '上传文档' : 'Upload'}</Button>}
      </div>

      {/* 分类统计 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-4">
        {[['全部', Files, 'text-gray-600 bg-gray-100'], ...categories.map((c) => [c, CATEGORY_ICONS[c] || FileText, CATEGORY_COLORS[c] || 'text-gray-600 bg-gray-50'] as any)].map(([c, Icon, tone]) => (
          <button key={c} onClick={() => setCategory(c)} className="text-left">
            <Card className={`hover:shadow-md transition-shadow ${category === c ? 'ring-2 ring-blue-300' : ''}`}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-lg font-bold text-gray-900">{c === '全部' ? items.length : byCategory.get(c)?.length || 0}</p>
                  <p className="text-xs text-gray-500">{c === '全部' ? (isZh ? '全部文档' : 'All Documents') : c}</p>
                </div>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder={t('search')} className="pl-9 h-9 bg-white border-gray-200" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400"><FolderOpen className="w-10 h-10 mx-auto mb-2 text-gray-300" /><p>{isZh ? '暂无文档' : 'No documents'}</p><p className="text-sm mt-1">{isZh ? '点击右上角「上传文档」建立知识库' : 'Click "Upload" at the top right to build the knowledge base'}</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((it) => {
            const Icon = CATEGORY_ICONS[it.category] || FileText;
            const tone = CATEGORY_COLORS[it.category] || 'text-gray-600 bg-gray-50';
            return (
              <Card key={it.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(it)}>
                <CardContent className="p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tone}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{titleField ? it[titleField.key] : it.id}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {it.category && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{it.category}</Badge>}
                        {it.author && <span className="text-xs text-gray-400 flex items-center gap-0.5"><User2 className="w-3 h-3" />{it.author}</span>}
                      </div>
                    </div>
                  </div>
                  {contentField && it[contentField.key] && (
                    <p className="text-sm text-gray-500 line-clamp-2 mt-2">{it[contentField.key]}</p>
                  )}
                  {dateField && it[dateField.key] && (
                    <div className="flex items-center gap-1 text-xs text-gray-400 mt-3"><CalendarDays className="w-3 h-3" />{it[dateField.key]}</div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-500" />
                  {titleField ? selected[titleField.key] : selected.id}
                </DialogTitle>
                <div className="flex items-center gap-2 mt-1">
                  {selected.category && <Badge variant="outline" className="text-xs">{selected.category}</Badge>}
                  {selected.author && <span className="text-xs text-gray-400">{selected.author}</span>}
                </div>
              </DialogHeader>
              {dateField && selected[dateField.key] && <p className="text-xs text-gray-400 -mt-2">{selected[dateField.key]}</p>}
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{contentField ? selected[contentField.key] || (isZh ? '（无正文）' : '(No content)') : JSON.stringify(selected, null, 2)}</div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>{t('add')}{tFeat(categoryKey, feature.key)}</DialogTitle></DialogHeader>
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
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}{t('confirmAdd')}
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}