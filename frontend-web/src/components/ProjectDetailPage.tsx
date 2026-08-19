'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  ArrowLeft, Building2, MapPin, CalendarDays, User, Wallet,
  FileText, Plus, Trash2, Eye, Loader2, Shield, CheckCircle2,
  Clock, TrendingUp, Download, Paperclip,
} from 'lucide-react';

const API_BASE = 'http://localhost:3000';

const STATUS_COLOR: Record<string, string> = {
  立项: 'bg-slate-100 text-slate-600 border-slate-200',
  在建: 'bg-blue-100 text-blue-700 border-blue-200',
  竣工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  完工: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  停工: 'bg-red-100 text-red-700 border-red-200',
  暂缓: 'bg-amber-100 text-amber-700 border-amber-200',
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

const DOC_TYPE_ICON: Record<string, string> = {
  技术方案: '📋', 图纸: '📐', 检测报告: '🔬', 验收记录: '✅',
  设计变更: '📝', 评估报告: '📊', 设备清单: '📦', 合同文件: '📄', 其他: '📁',
};

function fmtBytes(b: number): string {
  if (!b) return '-';
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

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
  return { text: `剩余 ${diff} 天`, cls: 'text-gray-500' };
}

type TabKey = 'overview' | 'documents' | 'costs';

export default function ProjectDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const [project, setProject] = useState<any>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabKey>('overview');
  const [viewDoc, setViewDoc] = useState<any>(null);
  const [addDocOpen, setAddDocOpen] = useState(false);
  const [delDocId, setDelDocId] = useState<string | null>(null);

  // New document form
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('');
  const [docFile, setDocFile] = useState('');
  const [docDesc, setDocDesc] = useState('');

  const fetchProject = async () => {
    try {
      const res = await fetch(`${API_BASE}/projects/${params.id}`, { headers });
      if (res.ok) {
        const data = await res.json();
        setProject(data);
        setDocuments(data.documents || []);
      }
    } catch {}
    setLoading(false);
  };

  useEffect(() => { fetchProject(); }, [params.id]);

  const handleAddDoc = async () => {
    if (!docName.trim()) return;
    try {
      const res = await fetch(`${API_BASE}/projects/${params.id}/documents`, {
        method: 'POST', headers,
        body: JSON.stringify({ name: docName, type: docType, fileName: docFile, description: docDesc, uploader: '当前用户' }),
      });
      if (res.ok) {
        setAddDocOpen(false);
        setDocName(''); setDocType(''); setDocFile(''); setDocDesc('');
        fetchProject();
      }
    } catch {}
  };

  const handleDeleteDoc = async (docId: string) => {
    try {
      const res = await fetch(`${API_BASE}/projects/documents/${docId}`, { method: 'DELETE', headers });
      if (res.ok) fetchProject();
    } catch {}
    setDelDocId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 text-gray-400 gap-2">
        <Loader2 className="w-5 h-5 animate-spin" />加载中...
      </div>
    );
  }
  if (!project) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-gray-400 gap-4">
        <Building2 className="w-12 h-12 text-gray-300" />
        <p>项目不存在</p>
        <Link href="/engineering/project-archives"><Button variant="outline" size="sm">返回列表</Button></Link>
      </div>
    );
  }

  const remaining = daysRemaining(project.endDate);
  const typeBadgeClass = TYPE_BADGE[project.type] || 'bg-gray-50 text-gray-500 border-gray-200';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href="/engineering/project-archives">
          <Button variant="ghost" size="sm" className="text-gray-500"><ArrowLeft className="w-4 h-4 mr-1" />返回</Button>
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-5 h-5 text-blue-600" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">{project.name}</h1>
              <p className="text-xs text-gray-400">项目编号: {project.code || '-'} · 创建于 {project.createdAt?.slice(0, 10) || '-'}</p>
            </div>
            <Badge className={`${STATUS_COLOR[project.status] || 'bg-gray-100'} border ml-2`}>{project.status}</Badge>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-lg p-1 w-fit">
        {([
          { key: 'overview', label: '项目概况', icon: Building2 },
          { key: 'documents', label: '项目文档', icon: FileText, count: documents.length },
          { key: 'costs', label: '成本进度', icon: TrendingUp },
        ] as const).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-1.5 rounded-md text-sm transition-all ${
              tab === t.key ? 'bg-white shadow-sm text-blue-600 font-medium' : 'text-gray-500 hover:text-gray-700'
            }`}>
            <t.icon className="w-3.5 h-3.5" />
            {t.label}
            {'count' in t && <span className="text-xs bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded-full">{t.count}</span>}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {tab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* 基本信息 */}
          <Card className="lg:col-span-2">
            <CardHeader><CardTitle className="text-base font-semibold flex items-center gap-2"><Building2 className="w-4 h-4 text-blue-500" />基本信息</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <InfoRow label="项目编号" value={project.code} />
                <InfoRow label="工程类型" value={project.type} badgeClass={typeBadgeClass} />
                <InfoRow label="项目地点" value={project.location} icon={MapPin} />
                <InfoRow label="建设单位" value={project.customer} icon={Building2} />
                <InfoRow label="项目经理" value={project.manager} icon={User} />
                <InfoRow label="监理负责人" value={project.supervisor} icon={Shield} />
                <InfoRow label="合同类型" value={project.contractType} />
                <InfoRow label="合同金额" value={fmtMoney(project.amount)} accent />
                <InfoRow label="质量目标" value={project.qualityTarget} />
                <InfoRow label="安全目标" value={project.safetyTarget} />
                <InfoRow label="开工日期" value={project.startDate} icon={CalendarDays} />
                <InfoRow label="计划竣工" value={project.endDate} icon={CalendarDays} badge={
                  <span className={`text-xs ml-1 ${remaining.cls}`}>{remaining.text}</span>
                } />
                <InfoRow label="计划工期" value={project.planDuration ? `${project.planDuration} 天` : '-'} icon={Clock} />
              </div>
              <div className="mt-4 pt-4 border-t">
                <Label className="text-xs text-gray-500 mb-1 block">工程范围</Label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{project.scope || '-'}</p>
              </div>
              <div className="mt-4">
                <Label className="text-xs text-gray-500 mb-1 block">项目简介</Label>
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{project.description || '-'}</p>
              </div>
            </CardContent>
          </Card>

          {/* 统计卡片 */}
          <div className="space-y-4">
            <StatCard icon={FileText} label="项目文档" value={documents.length} sub="份文档资料" color="blue" />
            <StatCard icon={Wallet} label="合同金额" value={fmtMoney(project.amount)} sub={project.contractType} color="purple" />
            <StatCard icon={CalendarDays} label="计划工期" value={project.planDuration ? `${project.planDuration}天` : '-'} sub={remaining.text} color={remaining.cls.includes('red') ? 'red' : 'emerald'} />
            <StatCard icon={CheckCircle2} label="质量目标" value={project.qualityTarget || '-'} sub={project.safetyTarget} color="cyan" />
          </div>
        </div>
      )}

      {/* Documents Tab */}
      {tab === 'documents' && (
        <Card>
          <CardHeader className="flex flex-row items-center gap-3 pb-3">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-500" />项目文档 ({documents.length})
            </CardTitle>
            <div className="flex-1" />
            <Button size="sm" onClick={() => setAddDocOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-xs h-8">
              <Plus className="w-3.5 h-3.5 mr-1" />上传文档
            </Button>
          </CardHeader>
          <CardContent>
            {documents.length === 0 ? (
              <div className="text-center py-16 text-gray-400">
                <Paperclip className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p>暂无项目文档</p>
                <p className="text-sm mt-1">点击右上角「上传文档」添加</p>
              </div>
            ) : (
              <div className="space-y-2">
                {documents.map((doc) => (
                  <div key={doc.id} className="flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                    <div className="text-2xl flex-shrink-0">{DOC_TYPE_ICON[doc.type] || '📁'}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-sm text-gray-900 truncate">{doc.name}</span>
                        {doc.type && <Badge variant="outline" className="text-[10px] px-1.5 py-0">{doc.type}</Badge>}
                      </div>
                      <div className="flex items-center gap-3 mt-0.5">
                        <span className="text-xs text-gray-400">{doc.fileName || '-'}</span>
                        <span className="text-xs text-gray-400">{fmtBytes(doc.size)}</span>
                        <span className="text-xs text-gray-400">{doc.uploader || '-'} · {doc.date || '-'}</span>
                      </div>
                      {doc.description && <p className="text-xs text-gray-500 mt-0.5 truncate">{doc.description}</p>}
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0">
                      <Button variant="ghost" size="icon-sm" onClick={() => setViewDoc(doc)} title="查看"><Eye className="w-3.5 h-3.5 text-blue-600" /></Button>
                      <Button variant="ghost" size="icon-sm" title="下载"><Download className="w-3.5 h-3.5 text-gray-500" /></Button>
                      <Button variant="ghost" size="icon-sm" onClick={() => setDelDocId(doc.id)} title="删除"><Trash2 className="w-3.5 h-3.5 text-red-500" /></Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Costs Tab */}
      {tab === 'costs' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={Wallet} label="合同金额" value={fmtMoney(project.amount)} sub={project.contractType} color="purple" />
          <StatCard icon={TrendingUp} label="累计产值" value="¥0" sub="暂无产值数据" color="emerald" />
          <StatCard icon={Clock} label="工期进度" value={project.planDuration ? `${Math.round((Date.now() - new Date(project.startDate).getTime()) / 86400000)} / ${project.planDuration} 天` : '-'} sub={remaining.text} color="blue" />
        </div>
      )}

      {/* View document dialog */}
      <Dialog open={!!viewDoc} onOpenChange={(o) => !o && setViewDoc(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>文档详情</DialogTitle></DialogHeader>
          {viewDoc && (
            <div className="space-y-3 py-2">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-3xl">{DOC_TYPE_ICON[viewDoc.type] || '📁'}</span>
                <div>
                  <p className="font-medium text-sm text-gray-900">{viewDoc.name}</p>
                  <p className="text-xs text-gray-500">{viewDoc.fileName || '未命名文件'}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{fmtBytes(viewDoc.size)} · {viewDoc.type || '-'}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div><span className="text-gray-500">上传人:</span> <span className="ml-1">{viewDoc.uploader || '-'}</span></div>
                <div><span className="text-gray-500">日期:</span> <span className="ml-1">{viewDoc.date || '-'}</span></div>
              </div>
              {viewDoc.description && (
                <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">{viewDoc.description}</p>
              )}
              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" size="sm" onClick={() => setViewDoc(null)}>关闭</Button>
                <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-xs"><Download className="w-3.5 h-3.5 mr-1" />下载</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add document dialog */}
      <Dialog open={addDocOpen} onOpenChange={setAddDocOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader><DialogTitle>上传项目文档</DialogTitle></DialogHeader>
          <div className="space-y-3 py-2">
            <div>
              <Label>文档名称 *</Label>
              <Input value={docName} onChange={(e) => setDocName(e.target.value)} placeholder="输入文档名称" className="mt-1" />
            </div>
            <div>
              <Label>文档类型</Label>
              <select value={docType} onChange={(e) => setDocType(e.target.value)}
                className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm">
                <option value="">请选择类型</option>
                {['技术方案', '图纸', '检测报告', '验收记录', '设计变更', '评估报告', '设备清单', '合同文件', '其他'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>文件名</Label>
              <Input value={docFile} onChange={(e) => setDocFile(e.target.value)} placeholder="如: xxx.pdf" className="mt-1" />
            </div>
            <div>
              <Label>描述</Label>
              <textarea value={docDesc} onChange={(e) => setDocDesc(e.target.value)} className="mt-1 w-full min-h-16 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm" placeholder="文档描述..." />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" size="sm" onClick={() => setAddDocOpen(false)}>取消</Button>
              <Button size="sm" onClick={handleAddDoc} disabled={!docName.trim()} className="bg-blue-600 hover:bg-blue-700 text-xs">确认上传</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete confirm */}
      <Dialog open={!!delDocId} onOpenChange={(o) => !o && setDelDocId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle>确认删除</DialogTitle></DialogHeader>
          <p className="text-sm text-gray-600 py-2">确认删除该文档？此操作不可恢复。</p>
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setDelDocId(null)}>取消</Button>
            <Button size="sm" onClick={() => handleDeleteDoc(delDocId!)} className="bg-red-600 hover:bg-red-700 text-xs">确认删除</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoRow({ label, value, icon: Icon, accent, badgeClass, badge }: any) {
  return (
    <div>
      <Label className="text-xs text-gray-500 mb-1 block">
        {Icon && <Icon className="w-3 h-3 inline mr-1" />}
        {label}
      </Label>
      {badgeClass ? (
        <Badge variant="outline" className={badgeClass}>{value}</Badge>
      ) : accent ? (
        <p className="text-sm font-semibold text-emerald-600">{value}</p>
      ) : badge ? (
        <div className="flex items-center gap-2 text-sm text-gray-700">{value}{badge}</div>
      ) : (
        <p className="text-sm text-gray-700">{value || '-'}</p>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, color }: any) {
  const colors: Record<string, any> = {
    blue: 'text-blue-600 bg-blue-50', purple: 'text-purple-600 bg-purple-50',
    emerald: 'text-emerald-600 bg-emerald-50', red: 'text-red-600 bg-red-50',
    cyan: 'text-cyan-600 bg-cyan-50', amber: 'text-amber-600 bg-amber-50',
  };
  const c = colors[color] || colors.blue;
  return (
    <Card>
      <CardContent className="p-4 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${c}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-lg font-bold text-gray-900">{value}</p>
          <p className="text-xs text-gray-500">{label}</p>
          {sub && <p className="text-[10px] text-gray-400">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
