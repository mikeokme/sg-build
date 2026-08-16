'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Search, Plus, FileText, CalendarDays } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, getCurrentRole } from '@/config/roles';

const API_BASE = 'http://localhost:3000';

export function DocPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<any>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  const allowCreate = canCreate(categoryKey, getCurrentRole());

  const titleField = feature.fields.find((f) => f.key === 'title');
  const contentField = feature.fields.find((f) => f.key === 'content');
  const dateField = feature.fields.find((f) => f.key === 'date');
  const categoryField = feature.fields.find((f) => f.key === 'category' || f.key === 'type');

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

  const filtered = items.filter((it) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return Object.values(it).some((v) => String(v ?? '').toLowerCase().includes(q));
  });

  const openCreate = () => {
    setForm({});
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
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
        </div>
        {allowCreate && <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />发布</Button>}
      </div>

      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <Input placeholder="搜索..." className="pl-9 h-9 bg-white border-gray-200" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
      ) : filtered.length === 0 ? (
        <Card><CardContent className="text-center py-16 text-gray-400"><p>暂无内容</p><p className="text-sm mt-1">点击右上角「发布」添加</p></CardContent></Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((it) => (
            <Card key={it.id} className="cursor-pointer hover:shadow-md transition-all" onClick={() => setSelected(it)}>
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="font-semibold text-gray-900 truncate">{titleField ? it[titleField.key] : it.id}</span>
                </div>
                {categoryField && it[categoryField.key] && <Badge variant="outline" className="text-xs mb-2">{it[categoryField.key]}</Badge>}
                {contentField && it[contentField.key] && (
                  <p className="text-sm text-gray-500 line-clamp-3 mt-1">{it[contentField.key]}</p>
                )}
                {dateField && it[dateField.key] && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-3"><CalendarDays className="w-3 h-3" />{it[dateField.key]}</div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) setSelected(null); }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          {selected && (
            <>
              <DialogHeader>
                <DialogTitle>{titleField ? selected[titleField.key] : selected.id}</DialogTitle>
                {categoryField && selected[categoryField.key] && <Badge variant="outline" className="text-xs w-fit">{selected[categoryField.key]}</Badge>}
              </DialogHeader>
              {dateField && selected[dateField.key] && <p className="text-xs text-gray-400 -mt-2">{selected[dateField.key]}</p>}
              <div className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{contentField ? selected[contentField.key] || '（无正文）' : JSON.stringify(selected, null, 2)}</div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle>发布{feature.title}</DialogTitle></DialogHeader>
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
                    className="mt-1 w-full min-h-32 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm"
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                ) : (
                  <Input
                    className="mt-1"
                    type={f.type === 'date' ? 'date' : 'text'}
                    value={form[f.key] ?? ''}
                    onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>
          <Button onClick={handleSave} disabled={saving} className="w-full bg-blue-600">
            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}确认发布
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}