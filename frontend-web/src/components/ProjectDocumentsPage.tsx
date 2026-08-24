'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Plus, Search, Trash2, Eye, Loader2, FileText, Paperclip,
  Building2, TrendingUp, FolderOpen,
} from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const DOC_TYPE_BADGE: Record<string, string> = {
  技术方案: 'text-blue-600 bg-blue-50 border-blue-200',
  图纸: 'text-cyan-600 bg-cyan-50 border-cyan-200',
  检测报告: 'text-purple-600 bg-purple-50 border-purple-200',
  验收记录: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  设计变更: 'text-amber-600 bg-amber-50 border-amber-200',
  评估报告: 'text-indigo-600 bg-indigo-50 border-indigo-200',
  设备清单: 'text-orange-600 bg-orange-50 border-orange-200',
  合同文件: 'text-rose-600 bg-rose-50 border-rose-200',
};

function fmtBytes(b: number): string {
  if (!b) return '-';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

export function ProjectDocumentsPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [projects, setProjects] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [addOpen, setAddOpen] = useState(false);
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [delId, setDelId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const role = getCurrentRole();
  const allowCreate = canCreate('engineering', role);
  const allowDelete = canDelete('engineering', role);

  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState('');
  const [formFile, setFormFile] = useState('');
  const [formDesc, setFormDesc] = useState('');

  const fetchProjects = async () => {
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setProjects(await res.json());
    } catch {}
  };

  const fetchDocs = async (projectId: string) => {
    if (!projectId) { setDocs([]); return; }
    const token = localStorage.getItem('token');
    try {
      const res = await fetch(`${API_BASE}/projects/${projectId}/documents`, { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      if (res.ok) setDocs(await res.json());
    } catch {}
  };

  useEffect(() => {
    fetchProjects().then(() => {
      setLoading(false);
      if (projects.length > 0 && !selectedProjectId) {
        setSelectedProjectId(projects[0].id);
        fetchDocs(projects[0].id);
      }
    });
  }, []);

  const handleProjectSelect = (id: string) => {
    setSelectedProjectId(id);
    fetchDocs(id);
  };

  const handleAdd = async () => {
    if (!formName.trim() || !selectedProjectId) return;
    setSaving(true);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/projects/${selectedProjectId}/documents`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ name: formName, type: formType, fileName: formFile, description: formDesc, uploader: '当前用户' }),
      });
    } catch {}
    setAddOpen(false);
    setFormName(''); setFormType(''); setFormFile(''); setFormDesc('');
    fetchDocs(selectedProjectId);
    fetchProjects();
    setSaving(false);
  };

  const handleDelete = async (docId: string) => {
    setDeleting(docId);
    const token = localStorage.getItem('token');
    try {
      await fetch(`${API_BASE}/projects/documents/${docId}`, { method: 'DELETE', headers: token ? { Authorization: `Bearer ${token}` } : {} });
    } catch {}
    setDelId(null);
    fetchDocs(selectedProjectId);
    fetchProjects();
    setDeleting(null);
  };

  const filtered = useMemo(() => {
    if (!search.trim()) return docs;
    const q = search.toLowerCase();
    return docs.filter((d) => Object.values(d).some((v) => String(v ?? '').toLowerCase().includes(q)));
  }, [docs, search]);

  const selectedProject = projects.find((p) => p.id === selectedProjectId);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        {allowCreate && selectedProjectId && (
          <Button onClick={() => setAddOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs"><Plus className="w-4 h-4 mr-1" />{isZh ? '上传文档' : 'Upload Document'}</Button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center"><Building2 className="w-5 h-5 text-blue-600" /></div><div><p className="text-lg font-bold">{projects.length}</p><p className="text-xs text-gray-500">{isZh ? '项目总数' : 'Total Projects'}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center"><FileText className="w-5 h-5 text-emerald-600" /></div><div><p className="text-lg font-bold">{docs.length}</p><p className="text-xs text-gray-500">{isZh ? '当前项目文档' : 'Current Project Docs'}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center"><Paperclip className="w-5 h-5 text-purple-600" /></div><div><p className="text-lg font-bold">{projects.reduce((s,p)=>s+(p.documentCount||0),0)}</p><p className="text-xs text-gray-500">{isZh ? '全部文档' : 'All Documents'}</p></div></CardContent></Card>
        <Card><CardContent className="p-4 flex items-center gap-3"><div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center"><TrendingUp className="w-5 h-5 text-amber-600" /></div><div><p className="text-lg font-bold">{fmtBytes(docs.reduce((s,d)=>s+(d.size||0),0))}</p><p className="text-xs text-gray-500">{isZh ? '文档总量' : 'Total Storage'}</p></div></CardContent></Card>
      </div>

      {/* Project selector + docs table */}
      <Card>
        <CardHeader className="flex flex-row items-center gap-3 pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-500" />{isZh ? '文档库' : 'Document Library'}
          </CardTitle>
          {projects.length > 0 && (
            <select value={selectedProjectId} onChange={(e) => handleProjectSelect(e.target.value)}
              className="h-9 px-3 rounded-md border border-gray-300 bg-white text-sm min-w-[200px]">
              {projects.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.documentCount || 0}{isZh ? '份' : ' files'})</option>)}
            </select>
          )}
          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder={isZh ? '搜索文档...' : 'Search documents...'} className="pl-9 h-9" value={search} onChange={(e) => setSearch(e.target.value)} />
          </div>
          <Badge variant="secondary" className="text-xs">{filtered.length} {t('count')}</Badge>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <FileText className="w-10 h-10 mx-auto mb-3 text-gray-300" />
              <p>{selectedProjectId ? (isZh ? '该项目中暂无文档' : 'No documents in this project') : (isZh ? '请先选择一个项目' : 'Select a project first')}</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-8" />
                  <TableHead>{isZh ? '文档名称' : 'Document Name'}</TableHead>
                  <TableHead>{isZh ? '类型' : 'Type'}</TableHead>
                  <TableHead>{isZh ? '文件名' : 'File Name'}</TableHead>
                  <TableHead>{isZh ? '大小' : 'Size'}</TableHead>
                  <TableHead>{isZh ? '上传人' : 'Uploader'}</TableHead>
                  <TableHead>{isZh ? '日期' : 'Date'}</TableHead>
                  <TableHead className="w-20 text-right">{t('operation')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((doc) => (
                  <TableRow key={doc.id} className="hover:bg-gray-50">
                    <TableCell><span className="text-lg">{DOC_TYPE_BADGE[doc.type] ? '📄' : '📁'}</span></TableCell>
                    <TableCell>
                      <span className="font-medium text-sm text-gray-900">{doc.name}</span>
                      {doc.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{doc.description}</p>}
                    </TableCell>
                    <TableCell>
                      {doc.type ? (
                        <Badge variant="outline" className={`text-[10px] px-1.5 py-0 ${DOC_TYPE_BADGE[doc.type] || ''}`}>{doc.type}</Badge>
                      ) : <span className="text-gray-400 text-xs">-</span>}
                    </TableCell>
                    <TableCell><span className="text-xs font-mono text-gray-500">{doc.fileName || '-'}</span></TableCell>
                    <TableCell><span className="text-xs text-gray-500">{fmtBytes(doc.size)}</span></TableCell>
                    <TableCell><span className="text-xs text-gray-600">{doc.uploader || '-'}</span></TableCell>
                    <TableCell><span className="text-xs text-gray-500">{doc.date || '-'}</span></TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon-sm" onClick={() => setViewDoc(doc)} title={isZh ? '查看' : 'View'} className="text-blue-600"><Eye className="w-3.5 h-3.5" /></Button>
                        {allowDelete && (
                          <Button variant="ghost" size="icon-sm" onClick={() => setDelId(doc.id)} title={t('delete')} className="text-red-500 hover:text-red-700" disabled={deleting === doc.id}>
                            {deleting === doc.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* View dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{isZh ? '文档详情' : 'Document Detail'}</DialogTitle></DialogHeader>
          {viewDoc && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-3xl">{DOC_TYPE_BADGE[viewDoc.type] ? '📄' : '📁'}</span>
                <div>
                  <p className="font-medium text-sm">{viewDoc.name}</p>
                  <p className="text-xs text-gray-500">{viewDoc.fileName || (isZh ? '未命名文件' : 'Unnamed file')}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtBytes(viewDoc.size)} · {viewDoc.type || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">{isZh ? '上传人' : 'Uploader'}:</span> <span className="ml-1">{viewDoc.uploader || '-'}</span></div>
                <div><span className="text-gray-500">{isZh ? '日期' : 'Date'}:</span> <span className="ml-1">{viewDoc.date || '-'}</span></div>
              </div>
              {viewDoc.description && <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewDoc.description}</p>}
              <div className="flex justify-end gap-2 pt-1">
                <Button variant="outline" size="sm" onClick={() => setViewDoc(null)}>{isZh ? '关闭' : 'Close'}</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add doc dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>{isZh ? '上传项目文档' : 'Upload Project Document'}</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>{isZh ? '文档名称' : 'Document Name'} *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={isZh ? '输入文档名称' : 'Enter document name'} className="mt-1" />
            </div>
            <div>
              <Label>{isZh ? '文档类型' : 'Document Type'}</Label>
              <select value={formType} onChange={(e) => setFormType(e.target.value)} className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm">
                <option value="">{isZh ? '请选择类型' : 'Select type'}</option>
                {['技术方案', '图纸', '检测报告', '验收记录', '设计变更', '评估报告', '设备清单', '合同文件', '其他'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>{isZh ? '文件名' : 'File Name'}</Label>
              <Input value={formFile} onChange={(e) => setFormFile(e.target.value)} placeholder="如: xxx.pdf" className="mt-1" />
            </div>
            <div>
              <Label>{isZh ? '描述' : 'Description'}</Label>
              <textarea value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className="mt-1 w-full min-h-16 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm" placeholder={isZh ? '文档描述...' : 'Document description...'} />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setAddOpen(false)}>{isZh ? '取消' : 'Cancel'}</Button>
              <Button onClick={handleAdd} disabled={saving || !formName.trim()} className="bg-blue-600 hover:bg-blue-700 text-xs">
                {saving && <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />}{isZh ? '确认上传' : 'Upload'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delId} onOpenChange={(o) => !o && setDelId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>{t('confirmDelete')}</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">{isZh ? '确认删除该文档？此操作不可恢复。' : 'Delete this document? This cannot be undone.'}</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDelId(null)}>{isZh ? '取消' : 'Cancel'}</Button>
            <Button size="sm" onClick={() => delId && handleDelete(delId)} className="bg-red-600 hover:bg-red-700 text-xs">{t('confirmDelete')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
