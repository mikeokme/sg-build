'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Loader2, Users, Boxes, Truck, Building2, HardHat, Cloud, Database, FileText, Folder, ArrowRight, HardDrive, Upload, Star, TrendingUp } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { StatCard } from '@/components/ui/StatCard';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const fmtSize = (b: number) => b >= 1073741824 ? `${(b / 1073741824).toFixed(2)}GB` : b >= 1048576 ? `${(b / 1048576).toFixed(1)}MB` : b >= 1024 ? `${(b / 1024).toFixed(1)}KB` : `${b}B`;

export function ResourceOverviewPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const collections = ['customers', 'materials', 'suppliers', 'projects', 'teams', 'cloudFiles'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;
    Promise.all(
      collections.map(async (name) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) {
            const list = await res.json();
            setData((p) => ({ ...p, [name]: list }));
          }
        } catch {}
      }),
    ).finally(() => setLoading(false));
  }, []);

  const customers = data.customers || [];
  const materials = data.materials || [];
  const suppliers = data.suppliers || [];
  const projects = data.projects || [];
  const teams = data.teams || [];
  const files = data.cloudFiles || [];

  const fileItems = files.filter((f) => f.type !== 'folder');
  const folders = files.filter((f) => f.type === 'folder');
  const totalBytes = fileItems.reduce((s, f) => s + (Number(f.size) || 0), 0);
  const quota = 50 * 1073741824; // 50GB
  const usedPct = Math.min(100, Math.round((totalBytes / quota) * 1000) / 10);

  const recent = [...fileItems].sort((a, b) => (b.date || '').localeCompare(a.date || '')).slice(0, 6);
  const projStatus = useMemo(() => {
    const m: Record<string, number> = {};
    for (const p of projects) m[p.status || '立项'] = (m[p.status || '立项'] || 0) + 1;
    return m;
  }, [projects]);

  const stats = [
    { icon: Users, label: tFeat('market', 'customers'), value: String(customers.length), sub: isZh ? '合作客户' : 'Partner customers', tone: 'blue' },
    { icon: Boxes, label: isZh ? '物料条目' : 'Material Items', value: String(materials.length), sub: isZh ? '主材/辅材' : 'Main / auxiliary', tone: 'emerald' },
    { icon: Truck, label: isZh ? '供应商' : 'Suppliers', value: String(suppliers.length), sub: isZh ? '供应资源' : 'Supply resources', tone: 'orange' },
    { icon: Building2, label: isZh ? '项目库' : 'Project Library', value: String(projects.length), sub: isZh ? `${projStatus['在建'] || 0} 个在建` : `${projStatus['在建'] || 0} in construction`, tone: 'purple' },
    { icon: HardHat, label: isZh ? '施工班组' : 'Work Teams', value: String(teams.length), sub: isZh ? `${teams.reduce((s, t) => s + (Number(t.members) || 0), 0)} 名工人` : `${teams.reduce((s, t) => s + (Number(t.members) || 0), 0)} workers`, tone: 'cyan' },
    { icon: Cloud, label: isZh ? '云盘文件' : 'Cloud Files', value: String(fileItems.length), sub: isZh ? `${folders.length} 个文件夹 · ${fmtSize(totalBytes)}` : `${folders.length} folders · ${fmtSize(totalBytes)}`, tone: 'rose' },
  ];

  if (loading) {
    return <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? '企业资源一体化管理：客户 · 物料 · 供应商 · 项目库 · 班组 · 企业云盘' : 'Integrated enterprise resources: customers · materials · suppliers · projects · teams · cloud drive'}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/resource/cloud-drive"><span className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-700 gap-1">{isZh ? '进入企业云盘' : 'Open Cloud Drive'}<ArrowRight className="w-3.5 h-3.5" /></span></Link>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {stats.map((s) => <StatCard key={s.label} {...s} />)}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 云盘存储 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-4"><HardDrive className="w-4 h-4 text-rose-500" />{isZh ? '企业云盘存储' : 'Cloud Drive Storage'}</h3>
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-gray-500">{isZh ? '已使用' : 'Used'}</span>
            <span className="text-gray-400 font-medium">{fmtSize(totalBytes)} / 50GB</span>
          </div>
          <div className="h-3 rounded-full bg-gray-100 overflow-hidden">
            <div className="h-full rounded-full bg-gradient-to-r from-rose-400 to-orange-400" style={{ width: `${Math.max(2, usedPct)}%` }} />
          </div>
          <p className="text-[11px] text-gray-400 mt-2">{isZh ? `使用率 ${usedPct}% · 共 ${folders.length} 个文件夹 / ${fileItems.length} 个文件` : `${usedPct}% used · ${folders.length} folders / ${fileItems.length} files`}</p>
          <div className="mt-4 flex items-center gap-2 rounded-lg bg-rose-50 p-2.5 text-xs text-rose-600">
            <Upload className="w-4 h-4" />{isZh ? '支持文档 / 表格 / 图纸 / 影像 / 压缩包集中归档' : 'Centralized archiving for documents, sheets, drawings, media and archives'}
          </div>
        </CardContent></Card>

        {/* 最近上传 */}
        <Card className="lg:col-span-2"><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><Star className="w-4 h-4 text-amber-500" />{isZh ? '最近上传文件' : 'Recent Uploads'}</h3>
          <div className="space-y-2">
            {recent.map((f) => (
              <div key={f.id} className="flex items-center justify-between rounded-lg border border-gray-100 px-3 py-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0"><FileText className="w-4 h-4 text-blue-500" /></div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-gray-800 truncate">{f.name}</p>
                    <p className="text-[11px] text-gray-400">{isZh ? `${f.owner} 上传` : `Uploaded by ${f.owner}`} · {f.date} · {fmtSize(Number(f.size) || 0)}</p>
                  </div>
                </div>
                {f.shared && <Badge variant="outline" className="text-[10px] text-emerald-600">{isZh ? '已共享' : 'Shared'}</Badge>}
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* 物料库 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><Boxes className="w-4 h-4 text-emerald-600" />{isZh ? '物料库' : 'Material Library'}</h3>
          <div className="space-y-2">
            {materials.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div><p className="text-xs font-medium text-gray-800">{m.name}</p><p className="text-[11px] text-gray-400">{m.spec || '-'} · {m.unit || '-'}</p></div>
                <span className="text-xs font-semibold text-gray-600">¥{m.price}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>

        {/* 供应商 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><Truck className="w-4 h-4 text-orange-600" />{isZh ? '供应商资源' : 'Supplier Resources'}</h3>
          <div className="space-y-2">
            {suppliers.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <div className="min-w-0"><p className="text-xs font-medium text-gray-800 truncate">{s.name}</p><p className="text-[11px] text-gray-400 truncate">{s.material}</p></div>
                <span className="text-[11px] text-gray-400 flex-shrink-0 ml-2">{s.project || '-'}</span>
              </div>
            ))}
          </div>
        </CardContent></Card>

        {/* 项目库 */}
        <Card><CardContent className="p-5">
          <h3 className="text-sm font-bold text-gray-800 flex items-center gap-2 mb-3"><Building2 className="w-4 h-4 text-purple-600" />{isZh ? '项目库' : 'Project Library'}</h3>
          <div className="grid grid-cols-2 gap-2 mb-3">
            {Object.entries(projStatus).map(([st, n]) => (
              <div key={st} className="rounded-lg bg-gray-50 p-2 text-center">
                <p className="text-base font-bold text-gray-700">{n}</p>
                <p className="text-[10px] text-gray-400">{st}</p>
              </div>
            ))}
          </div>
          <div className="space-y-1.5">
            {projects.slice(0, 4).map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-1.5">
                <span className="text-[11px] text-gray-600 truncate">{p.name}</span>
                <Badge variant="outline" className="text-[10px]">{p.status}</Badge>
              </div>
            ))}
          </div>
        </CardContent></Card>
      </div>
    </div>
  );
}