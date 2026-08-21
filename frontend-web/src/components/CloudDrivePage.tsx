'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Loader2, Folder, FileText, FileSpreadsheet, Presentation, Image as ImageIcon, Video, Archive, DraftingCompass, File,
  Upload, Plus, Search, Star, Share2, Download, Trash2, ChevronRight, HardDrive, RefreshCw, Grid3x3, List, FolderPlus, CheckCircle2, MoreHorizontal,
} from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { getCurrentRole, canCreate, canDelete } from '@/config/roles';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const TYPE_META: Record<string, { label: string; icon: any; cls: string }> = {
  folder: { label: '文件夹', icon: Folder, cls: 'text-amber-500 bg-amber-50' },
  doc: { label: '文档', icon: FileText, cls: 'text-blue-500 bg-blue-50' },
  pdf: { label: 'PDF', icon: FileText, cls: 'text-red-500 bg-red-50' },
  xls: { label: '表格', icon: FileSpreadsheet, cls: 'text-emerald-500 bg-emerald-50' },
  ppt: { label: '演示', icon: Presentation, cls: 'text-orange-500 bg-orange-50' },
  img: { label: '图片', icon: ImageIcon, cls: 'text-purple-500 bg-purple-50' },
  video: { label: '视频', icon: Video, cls: 'text-pink-500 bg-pink-50' },
  zip: { label: '压缩包', icon: Archive, cls: 'text-yellow-500 bg-yellow-50' },
  cad: { label: '图纸', icon: DraftingCompass, cls: 'text-cyan-500 bg-cyan-50' },
  other: { label: '文件', icon: File, cls: 'text-gray-500 bg-gray-100' },
};

const TYPE_TABS = [
  { key: 'all', label: '全部' },
  { key: 'folder', label: '文件夹' },
  { key: 'doc', label: '文档' },
  { key: 'pdf', label: 'PDF' },
  { key: 'xls', label: '表格' },
  { key: 'ppt', label: '演示' },
  { key: 'img', label: '图片' },
  { key: 'video', label: '视频' },
  { key: 'zip', label: '压缩包' },
  { key: 'cad', label: '图纸' },
];

const fmtSize = (b: number) => b >= 1073741824 ? `${(b / 1073741824).toFixed(2)}GB` : b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : b >= 1024 ? `${(b / 1024).toFixed(1)}KB` : `${b}B`;

export function CloudDrivePage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [path, setPath] = useState<{ id: string | null; name: string }[]>([]);
  const [query, setQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [tab, setTab] = useState('全部文件');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [selected, setSelected] = useState<string[]>([]);
  const [dialog, setDialog] = useState<'none' | 'folder' | 'upload'>('none');
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);
  const { t, tCat, tFeat, lang } = useT();
  const isZh = lang === 'zh';
  const me = (() => { try { const u = JSON.parse(localStorage.getItem('user') || '{}'); return u.username || u.name || 'admin'; } catch { return 'admin'; } })();

  const typeLabel = (key: string) => {
    const m: Record<string, [string, string]> = {
      folder: ['文件夹', 'Folder'], doc: ['文档', 'Doc'], pdf: ['PDF', 'PDF'], xls: ['表格', 'Sheet'],
      ppt: ['演示', 'Slides'], img: ['图片', 'Image'], video: ['视频', 'Video'], zip: ['压缩包', 'Archive'],
      cad: ['图纸', 'CAD'], other: ['文件', 'File'],
    };
    const e = m[key];
    return e ? (isZh ? e[0] : e[1]) : key;
  };
  const tabLabel = (v: string) =>
    v === '全部文件' ? (isZh ? '全部文件' : 'All Files')
    : v === '最近文件' ? (isZh ? '最近文件' : 'Recent')
    : v === '我的上传' ? (isZh ? '我的上传' : 'My Uploads')
    : v === '我的收藏' ? (isZh ? '我的收藏' : 'Starred')
    : v === '共享给我' ? (isZh ? '共享给我' : 'Shared with Me')
    : v;

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/cloudFiles`, { headers: { Authorization: `Bearer ${token}` } });
    if (res.ok) setItems(await res.json());
    setLoading(false);
  };
  useEffect(() => { fetchItems(); }, []);

  const currentId = path.length ? path[path.length - 1].id : null;
  const folderNames = useMemo(() => {
    const m = new Map<string, string>();
    for (const it of items) if (it.type === 'folder') m.set(it.id, it.name);
    return m;
  }, [items]);

  const viewed = useMemo(() => {
    let list = items;
    if (tab === '全部文件') list = items.filter((i) => i.parentId === currentId);
    else if (tab === '最近文件') list = [...items.filter((i) => i.type !== 'folder')].sort((a, b) => (b.date || '').localeCompare(a.date || ''));
    else if (tab === '我的上传') list = items.filter((i) => i.owner === me);
    else if (tab === '我的收藏') list = items.filter((i) => i.starred);
    else if (tab === '共享给我') list = items.filter((i) => i.shared);
    if (typeFilter !== 'all') list = list.filter((i) => i.type === typeFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => String(i.name || '').toLowerCase().includes(q));
    }
    return list;
  }, [items, path, tab, typeFilter, query, currentId]);

  const fileItems = items.filter((i) => i.type !== 'folder');
  const totalBytes = fileItems.reduce((s, f) => s + (Number(f.size) || 0), 0);
  const quota = 50 * 1073741824;
  const usedPct = Math.min(100, Math.round((totalBytes / quota) * 1000) / 10);

  const enter = (id: string, name: string) => {
    setPath((p) => [...p, { id, name }]);
    setSelected([]);
  };

  const openCreate = (kind: 'folder' | 'upload') => {
    setForm({ name: '', type: 'other', size: 0 });
    setDialog(kind);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const body = {
      name: form.name || (dialog === 'folder' ? (isZh ? '新建文件夹' : 'New Folder') : (isZh ? '未命名文件' : 'Untitled')),
      type: dialog === 'folder' ? 'folder' : form.type || 'other',
      size: dialog === 'folder' ? 0 : Number(form.size) || 0,
      parentId: currentId,
      owner: me,
      date: new Date().toISOString().slice(0, 10),
      starred: false,
      shared: false,
      version: 1,
    };
    const res = await fetch(`${API_BASE}/collections/cloudFiles`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(body),
    });
    if (res.ok) { setDialog('none'); fetchItems(); }
    setSaving(false);
  };

  const toggleStar = async (item: any) => {
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/cloudFiles/${item.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...item, starred: !item.starred }),
    });
    fetchItems();
  };

  const handleDelete = async (item: any) => {
    if (!confirm(`${t('confirmDelete')}${isZh ? `「${item.name}」吗？` : ` "${item.name}"?`}`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/cloudFiles/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchItems();
  };

  const renderRow = (it: any) => {
    const meta = TYPE_META[it.type] || TYPE_META.other;
    const Icon = meta.icon;
    const isSel = selected.includes(it.id);
    return (
      <div
        key={it.id}
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer border ${isSel ? 'border-blue-200 bg-blue-50/60' : 'border-transparent hover:bg-gray-50'} transition-colors group`}
        onClick={() => {
          if (it.type === 'folder') enter(it.id, it.name);
          else setSelected((s) => (isSel ? s.filter((x) => x !== it.id) : [...s, it.id]));
        }}
        onDoubleClick={() => {
          if (it.type !== 'folder') window.open(`data:application/octet-stream;charset=utf-8,${encodeURIComponent(it.name)}`, '_blank');
        }}
      >
        <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 bg-gray-50">
          {it.starred && <Star className="w-4 h-4 text-amber-400 fill-amber-400" />}
        </div>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${meta.cls}`}>
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate flex items-center gap-2">
            {it.name}
            {it.shared && <Badge variant="outline" className="text-[9px] text-emerald-600">{isZh ? '已共享' : 'Shared'}</Badge>}
            {it.version > 1 && <Badge variant="outline" className="text-[9px] text-gray-400">v{it.version}</Badge>}
          </p>
        </div>
        {it.type !== 'folder' && <span className="text-xs text-gray-400 w-20 text-right hidden sm:block flex-shrink-0">{fmtSize(Number(it.size) || 0)}</span>}
        <span className="text-xs text-gray-400 w-20 hidden md:block flex-shrink-0">{it.type !== 'folder' ? it.date : ''}</span>
        <span className="text-xs text-gray-400 w-16 hidden md:block flex-shrink-0">{it.owner}</span>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
          {it.type !== 'folder' && (
            <button onClick={(e) => { e.stopPropagation(); window.open(`data:application/octet-stream;charset=utf-8,${encodeURIComponent(it.name)}`, '_blank'); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title={isZh ? '下载' : 'Download'}>
              <Download className="w-3.5 h-3.5" />
            </button>
          )}
          <button onClick={(e) => { e.stopPropagation(); toggleStar(it); }} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-400" title={isZh ? '收藏' : 'Star'}>
            <Star className={`w-3.5 h-3.5 ${it.starred ? 'text-amber-400 fill-amber-400' : ''}`} />
          </button>
          {allowDelete && (
            <button onClick={(e) => { e.stopPropagation(); handleDelete(it); }} className="p-1.5 rounded-md hover:bg-red-50 text-gray-400 hover:text-red-500" title={t('delete')}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? '企业级云存储 · 集中归档 · 安全共享 · 版本管理' : 'Enterprise cloud storage · central archive · secure sharing · versioning'}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400 mr-2">
            <HardDrive className="w-4 h-4 text-rose-500" />
            <span>{fmtSize(totalBytes)} / 50GB</span>
          </div>
          <div className="hidden sm:block w-28 h-2 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400" style={{ width: `${Math.max(2, usedPct)}%` }} />
          </div>
          {allowCreate && (
            <>
              <Button size="sm" variant="outline" onClick={() => openCreate('folder')}><FolderPlus className="w-4 h-4 mr-1.5" />{isZh ? '新建文件夹' : 'New Folder'}</Button>
              <Button size="sm" className="bg-blue-600 hover:bg-blue-700" onClick={() => openCreate('upload')}><Upload className="w-4 h-4 mr-1.5" />{isZh ? '上传文件' : 'Upload'}</Button>
            </>
          )}
        </div>
      </div>

      {/* 面包屑 + 工具条 */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center text-sm text-gray-500">
          <button onClick={() => { setPath([]); setSelected([]); }} className="font-medium text-blue-600 hover:underline">{isZh ? '我的云盘' : 'My Drive'}</button>
          {path.map((p, i) => (
            <span key={p.id} className="flex items-center">
              <ChevronRight className="w-3.5 h-3.5 text-gray-300 mx-1" />
              <button onClick={() => { setPath(path.slice(0, i + 1)); setSelected([]); }} className={i === path.length - 1 ? 'text-gray-800 font-medium' : 'hover:underline'}>{p.name}</button>
            </span>
          ))}
        </div>
        <div className="flex-1" />
        <div className="relative">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <Input placeholder={isZh ? '搜索文件' : 'Search files'} value={query} onChange={(e) => setQuery(e.target.value)} className="pl-9 h-8 text-sm w-48" />
        </div>
        <div className="flex items-center border rounded-lg overflow-hidden">
          <button onClick={() => setView('list')} className={`p-1.5 ${view === 'list' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`} title={isZh ? '列表' : 'List'}><List className="w-4 h-4" /></button>
          <button onClick={() => setView('grid')} className={`p-1.5 ${view === 'grid' ? 'bg-blue-50 text-blue-600' : 'text-gray-400'}`} title={isZh ? '网格' : 'Grid'}><Grid3x3 className="w-4 h-4" /></button>
        </div>
      </div>

      {/* 选项卡 + 类型筛选 */}
      <div className="flex flex-wrap items-center gap-2">
        {['全部文件', '最近文件', '我的上传', '我的收藏', '共享给我'].map((t) => (
          <Button key={t} size="sm" variant={tab === t ? 'default' : 'outline'} onClick={() => { setTab(t); setSelected([]); }}>{tabLabel(t)}</Button>
        ))}
        <div className="flex-1" />
        {TYPE_TABS.filter((t) => t.key !== 'all').map((t) => (
          <button key={t.key} onClick={() => setTypeFilter(typeFilter === t.key ? 'all' : t.key)} className={`text-xs px-2.5 py-1 rounded-full border ${typeFilter === t.key ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-500 hover:bg-gray-50'}`}>{typeLabel(t.key)}</button>
        ))}
      </div>

      {/* 文件列表 */}
      <Card>
        <CardContent className="p-3">
          {view === 'list' ? (
            <>
              <div className="flex items-center gap-3 px-3 py-2 text-[11px] text-gray-400 border-b border-gray-100 mb-1">
                <div className="w-9 flex-shrink-0" />
                <div className="w-9 flex-shrink-0" />
                <div className="flex-1">{isZh ? '名称' : 'Name'}</div>
                <div className="w-20 text-right hidden sm:block">{isZh ? '大小' : 'Size'}</div>
                <div className="w-20 hidden md:block">{isZh ? '修改时间' : 'Modified'}</div>
                <div className="w-16 hidden md:block">{isZh ? '上传者' : 'Owner'}</div>
                <div className="w-24 flex-shrink-0" />
              </div>
              {viewed.length === 0 ? (
                <p className="text-center text-gray-400 py-10 text-sm">{isZh ? '文件夹为空，点击右上角上传文件或新建文件夹' : 'Folder is empty. Upload files or create a folder from the top right'}</p>
              ) : (
                <div className="space-y-0.5">{viewed.map(renderRow)}</div>
              )}
            </>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
              {viewed.map((it) => {
                const meta = TYPE_META[it.type] || TYPE_META.other;
                const Icon = meta.icon;
                return (
                  <div key={it.id} onClick={() => { if (it.type === 'folder') enter(it.id, it.name); }} className="rounded-xl border border-gray-100 p-3 cursor-pointer hover:shadow-md transition-shadow">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center mb-2 ${meta.cls}`}><Icon className="w-5 h-5" /></div>
                    <p className="text-xs font-medium text-gray-800 truncate">{it.name}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">{it.type === 'folder' ? `${items.filter((x) => x.parentId === it.id).length} ${isZh ? '项' : 'items'}` : fmtSize(Number(it.size) || 0)}</p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 新建文件夹 / 上传弹窗 */}
      <Dialog open={dialog !== 'none'} onOpenChange={(o) => !o && setDialog('none')}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>{dialog === 'folder' ? (isZh ? '新建文件夹' : 'New Folder') : (isZh ? '上传文件' : 'Upload File')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-xs text-gray-500">{isZh ? '名称' : 'Name'} *</Label>
              <Input value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} className="mt-1" placeholder={dialog === 'folder' ? (isZh ? '请输入文件夹名称' : 'Folder name') : (isZh ? '请输入文件名称' : 'File name')} />
            </div>
            {dialog === 'upload' && (
              <div>
                <Label className="text-xs text-gray-500">{isZh ? '文件类型' : 'File Type'}</Label>
                <select value={form.type || 'other'} onChange={(e) => setForm((p) => ({ ...p, type: e.target.value }))} className="w-full mt-1 rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/50">
                  {Object.entries(TYPE_META).filter(([k]) => k !== 'folder').map(([k]) => <option key={k} value={k}>{typeLabel(k)}</option>)}
                </select>
              </div>
            )}
            {dialog === 'upload' && (
              <div>
                <Label className="text-xs text-gray-500">{isZh ? '大小（MB）' : 'Size (MB)'}</Label>
                <Input type="number" value={form.size || ''} onChange={(e) => setForm((p) => ({ ...p, size: e.target.value }))} className="mt-1" placeholder="0" />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog('none')}>{isZh ? '取消' : 'Cancel'}</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-blue-600 hover:bg-blue-700">{saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}{dialog === 'folder' ? (isZh ? '创建' : 'Create') : (isZh ? '上传' : 'Upload')}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}