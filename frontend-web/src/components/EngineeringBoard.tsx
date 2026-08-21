'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { MapPin, Building2, User, CalendarRange, TrendingUp, CircleDollarSign, ArrowRight } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CHINA_PROVINCES, BASINS, PROJECT_DOTS, CHINA_VIEWBOX } from '@/data/chinaMap';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const fmt = (v: number) => (v >= 100000000 ? `¥${(v / 100000000).toFixed(2)}亿` : v >= 10000 ? `¥${(v / 10000).toFixed(1)}万` : `¥${(v || 0).toLocaleString()}`);

interface ProjectInfo {
  id: string;
  name: string;
  location: string;
  type: string;
  scope: string;
  manager: string;
  amount: number;
  startDate: string;
  endDate: string;
  planDuration: number;
  status: string;
}

const basinColor = (name: string) => BASINS.find((b) => b.name === name)?.color || '#64748b';

function calcProgress(p: ProjectInfo) {
  const start = new Date(p.startDate).getTime();
  const end = new Date(p.endDate).getTime();
  const now = Date.now();
  if (!start || !end || end <= start) return 0;
  return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
}

export function EngineeringBoard() {
  const [projects, setProjects] = useState<ProjectInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoverProv, setHoverProv] = useState<string | null>(null);
  const [activeProv, setActiveProv] = useState<string | null>(null);
  const [hoverDot, setHoverDot] = useState<string | null>(null);
  const [selected, setSelected] = useState<ProjectInfo | null>(null);
  const { t, lang } = useT();
  const isZh = lang === 'zh';

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${API_BASE}/collections/projectArchives`, { headers: { Authorization: `Bearer ${token}` } })
      .then((r) => r.json())
      .then((d: ProjectInfo[]) => { setProjects(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const inBuilding = useMemo(() => projects.filter((p) => p.status === '在建'), [projects]);
  const projectOf = (dotId: string) => inBuilding.find((p) => p.id === dotId);
  const dotOf = (projectId: string) => PROJECT_DOTS.find((d) => d.id === projectId);
  const locOf = (p: ProjectInfo) => {
    const dot = dotOf(p.id);
    return (p.location && p.location.trim()) ? p.location : (dot ? `${dot.province}省${dot.city}` : p.location);
  };
  const visibleDots = useMemo(() => PROJECT_DOTS.filter((d) => inBuilding.some((p) => p.id === d.id)), [inBuilding]);

  const provCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const dot of visibleDots) {
      if (inBuilding.some((p) => p.id === dot.id)) m[dot.province] = (m[dot.province] || 0) + 1;
    }
    return m;
  }, [inBuilding, visibleDots]);

  const totalAmount = useMemo(() => visibleDots.reduce((s, d) => s + ((projectOf(d.id)?.amount) || 0), 0), [visibleDots]);
  const totalProvinces = Object.keys(provCount).length;

  const basinStats = useMemo(() => {
    const m: Record<string, { count: number; amount: number }> = {};
    for (const dot of visibleDots) {
      const p = projectOf(dot.id);
      if (!p) continue;
      m[dot.basin] = { count: (m[dot.basin]?.count || 0) + 1, amount: (m[dot.basin]?.amount || 0) + (p.amount || 0) };
    }
    return m;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visibleDots]);

  const activeProvDots = PROJECT_DOTS.filter((d) => d.province === activeProv);

  const sortedProvinces = useMemo(() => {
    const list = [...CHINA_PROVINCES];
    if (hoverProv) {
      const idx = list.findIndex((p) => p.cn === hoverProv);
      if (idx >= 0) {
        const [it] = list.splice(idx, 1);
        list.push(it);
      }
    }
    return list;
  }, [hoverProv]);

  const w = CHINA_VIEWBOX.w;
  const h = CHINA_VIEWBOX.h;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-start justify-between gap-4 pb-3">
        <div>
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-500" />{t('engineeringBoard')}
          </CardTitle>
          <p className="text-xs text-gray-500 mt-0.5">{t('boardDesc')}</p>
        </div>
        <Link href="/engineering/project-archives" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 shrink-0">
          {t('projectArchives')} <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </CardHeader>
      <CardContent className="p-4">
        {loading ? (
          <div className="flex items-center justify-center py-24 text-sm text-gray-400">{t('loading')}</div>
        ) : (
          <div className="grid grid-cols-1 xl:grid-cols-[1fr_300px] gap-4">
            {/* 地图区 */}
            <div className="relative rounded-xl border border-gray-100 bg-gradient-to-b from-sky-50/40 to-white p-2">
              <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto select-none">
                <style>{`
                  .province { transition: transform 0.2s ease, fill 0.2s ease, stroke 0.2s ease; transform-box: fill-box; transform-origin: center; cursor: pointer; }
                  .province:hover { transform: scale(1.12); }
                  .dot-pulse { animation: dotPulse 1.6s ease-in-out infinite; }
                  @keyframes dotPulse { 0%,100% { r: 7; opacity: 0.9; } 50% { r: 11; opacity: 0.35; } }
                `}</style>
                {sortedProvinces.map((p) => {
                  const hasProj = provCount[p.cn] > 0;
                  const isHover = hoverProv === p.cn;
                  const isActive = activeProv === p.cn;
                  const fill = hasProj ? (isActive ? '#bfdbfe' : '#dbeafe') : isHover ? '#d1d5db' : '#e5e7eb';
                  const stroke = isActive ? '#6366f1' : hasProj ? '#818cf8' : '#ffffff';
                  const sw = isActive ? 2 : hasProj ? 1.4 : 0.8;
                  return (
                    <g
                      key={p.id}
                      onMouseEnter={() => setHoverProv(p.cn)}
                      onMouseLeave={() => setHoverProv(null)}
                      onClick={() => setActiveProv(activeProv === p.cn ? null : p.cn)}
                    >
                      <path d={p.d} fill={fill} stroke={stroke} strokeWidth={sw} className="province" />
                      {isHover && (
                        <text x={p.cx} y={p.cy} textAnchor="middle" fontSize="11" fontWeight="600" fill="#334155" pointerEvents="none">
                          {p.cn}
                          <tspan x={p.cx} dy="13" fontSize="9" fontWeight="400" fill="#64748b">{provCount[p.cn] ? `${t('underConstruction')} ${provCount[p.cn]}` : ''}</tspan>
                        </text>
                      )}
                    </g>
                  );
                })}
                {/* 项目点 */}
                {PROJECT_DOTS.map((dot) => {
                  const p = projectOf(dot.id);
                  if (!p) return null;
                  const color = basinColor(dot.basin);
                  const isSel = selected?.id === dot.id;
                  const isHov = hoverDot === dot.id;
                  return (
                    <g
                      key={dot.id}
                      onMouseEnter={() => setHoverDot(dot.id)}
                      onMouseLeave={() => setHoverDot(null)}
                      onClick={(e) => { e.stopPropagation(); setSelected(isSel ? null : p); }}
                      style={{ cursor: 'pointer' }}
                    >
                      <circle cx={dot.x} cy={dot.y} r={isHov || isSel ? 9 : 6} fill={color} fillOpacity={0.15} className="dot-pulse" pointerEvents="none" />
                      <circle cx={dot.x} cy={dot.y} r={isHov || isSel ? 5.5 : 4} fill={color} stroke="#fff" strokeWidth={1.5} />
                      {isHov && (
                        <g pointerEvents="none">
                          <rect x={dot.x - 68} y={dot.y - 78} width={136} height={64} rx={8} fill="#1e293b" fillOpacity={0.92} />
                          <text x={dot.x} y={dot.y - 64} textAnchor="middle" fontSize="11" fontWeight="600" fill="#fff">{p.name}</text>
                          <text x={dot.x} y={dot.y - 49} textAnchor="middle" fontSize="9" fill="#cbd5e1">{locOf(p)}</text>
                          <text x={dot.x} y={dot.y - 36} textAnchor="middle" fontSize="9" fill="#cbd5e1">{p.type} · {fmt(p.amount)}</text>
                          <text x={dot.x} y={dot.y - 23} textAnchor="middle" fontSize="9" fill="#fbbf24">{t('progress')} {calcProgress(p)}%</text>
                        </g>
                      )}
                    </g>
                  );
                })}
              </svg>
              {/* 流域图例 */}
              <div className="absolute top-3 right-3 bg-white/90 backdrop-blur rounded-lg border border-gray-200 px-3 py-2 shadow-sm">
                <p className="text-[11px] font-semibold text-gray-600 mb-1">{t('basinLegend')}</p>
                <div className="space-y-1">
                  {BASINS.map((b) => {
                    const st = basinStats[b.name];
                    return (
                      <div key={b.name} className="flex items-center gap-2 text-[11px] text-gray-500">
                        <span className="w-2.5 h-2.5 rounded-full" style={{ background: b.color }} />
                        <span className="w-14">{b.name}</span>
                        <span className="text-gray-400">{st ? `${st.count} ${t('count')}` : '—'}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* 右侧面板 */}
            <div className="space-y-4">
              {/* 概览统计 */}
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl bg-indigo-50/60 border border-indigo-100 p-3">
                  <p className="text-[11px] text-indigo-500 flex items-center gap-1"><Building2 className="w-3 h-3" />{t('inBuildingCount')}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{visibleDots.length}</p>
                </div>
                <div className="rounded-xl bg-sky-50/60 border border-sky-100 p-3">
                  <p className="text-[11px] text-sky-500 flex items-center gap-1"><MapPin className="w-3 h-3" />{t('provinces')}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{totalProvinces}</p>
                </div>
                <div className="col-span-2 rounded-xl bg-emerald-50/60 border border-emerald-100 p-3">
                  <p className="text-[11px] text-emerald-500 flex items-center gap-1"><CircleDollarSign className="w-3 h-3" />{t('contractAmount')}</p>
                  <p className="text-xl font-bold text-gray-900 mt-1">{fmt(totalAmount)}</p>
                </div>
              </div>

              {/* 省份/项目列表 */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2 flex items-center justify-between">
                  <span>{activeProv ? `${activeProv} · ${t('underConstruction')}` : t('projectList')}</span>
                  <span className="text-gray-400 font-normal">{activeProv ? activeProvDots.length : visibleDots.length} {t('count')}</span>
                </p>
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                  {(activeProv ? activeProvDots : PROJECT_DOTS)
                    .filter((d) => activeProv || projectOf(d.id))
                    .map((dot) => {
                      const p = projectOf(dot.id);
                      if (!p) return null;
                      const isSel = selected?.id === p.id;
                      return (
                        <button
                          key={dot.id}
                          onClick={() => setSelected(isSel ? null : p)}
                          className={`w-full text-left rounded-lg border p-2.5 transition-colors ${isSel ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200 bg-white hover:border-indigo-200 hover:bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-sm font-medium text-gray-900 truncate">{p.name}</p>
                            <span className="w-2 h-2 rounded-full shrink-0" style={{ background: basinColor(dot.basin) }} />
                          </div>
                          <p className="text-[11px] text-gray-400 mt-0.5">{dot.city} · {p.type}</p>
                          <div className="mt-1.5 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className="h-full rounded-full" style={{ width: `${calcProgress(p)}%`, background: basinColor(dot.basin) }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 mt-1">
                            <span>{t('progress')} {calcProgress(p)}%</span>
                            <span>{fmt(p.amount)}</span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* 选中项目概况 */}
              {selected && (
                <div className="rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-3">
                  <p className="text-sm font-semibold text-gray-900">{selected.name}</p>
                  <div className="mt-2 space-y-1.5 text-[12px] text-gray-600">
                    <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-indigo-500" />{locOf(selected)}</p>
                    <p className="flex items-center gap-2"><Building2 className="w-3.5 h-3.5 text-indigo-500" />{selected.type} · {selected.scope || '建设中'}</p>
                    <p className="flex items-center gap-2"><User className="w-3.5 h-3.5 text-indigo-500" />{isZh ? '项目经理' : 'Project Manager'}：{selected.manager}</p>
                    <p className="flex items-center gap-2"><CircleDollarSign className="w-3.5 h-3.5 text-indigo-500" />{isZh ? '合同金额' : 'Contract Amount'}：{fmt(selected.amount)}</p>
                    <p className="flex items-center gap-2"><CalendarRange className="w-3.5 h-3.5 text-indigo-500" />{isZh ? '工期' : 'Duration'}：{selected.startDate} ~ {selected.endDate}</p>
                    <p className="flex items-center gap-2"><TrendingUp className="w-3.5 h-3.5 text-indigo-500" />{isZh ? '工期进度' : 'Schedule Progress'}：{calcProgress(selected)}%</p>
                  </div>
                  <Link href={`/engineering/project/${selected.id}`} className="mt-3 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700">
                    {isZh ? '查看项目详情' : 'View Project Details'} <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}