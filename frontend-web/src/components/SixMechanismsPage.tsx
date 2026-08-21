'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Loader2, Plus, Pencil, Trash2, Eye, Search, SearchCheck, BrainCircuit, BellRing, ShieldCheck, Siren, Scale, ArrowRight, Users, ClipboardList, FileWarning, LifeBuoy, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { canCreate, canEdit, canDelete, getCurrentRole } from '@/config/roles';
import { useProject } from '@/context/ProjectContext';
import { useT } from '@/i18n';

const API_BASE = 'http://localhost:14725';

const MECHANISMS = [
  { key: '查找', icon: SearchCheck, color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200', title: '查找机制', en: 'Identify', subtitle: '全面辨识危险源 · 清单管理 · 动态更新', subtitleEn: 'Identify all hazards · Checklist management · Dynamic updates' },
  { key: '研判', icon: BrainCircuit, color: 'text-purple-600', bg: 'bg-purple-50', border: 'border-purple-200', title: '研判机制', en: 'Assess', subtitle: '风险评价分级 · 四色标识 · 判定方法', subtitleEn: 'Risk evaluation & grading · Four-color coding · Assessment methods' },
  { key: '预警', icon: BellRing, color: 'text-orange-600', bg: 'bg-orange-50', border: 'border-orange-200', title: '预警机制', en: 'Warn', subtitle: '监测监控 · 及时预警 · 提前响应', subtitleEn: 'Monitoring · Timely warning · Early response' },
  { key: '防范', icon: ShieldCheck, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200', title: '防范机制', en: 'Prevent', subtitle: '管控措施 · 教育培训 · 隐患排查', subtitleEn: 'Control measures · Training · Hazard screening' },
  { key: '处置', icon: Siren, color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200', title: '处置机制', en: 'Respond', subtitle: '应急预案 · 一源一案 · 四不放过', subtitleEn: 'Emergency plans · One plan per hazard · Four-nevers principle' },
  { key: '责任', icon: Scale, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-200', title: '责任机制', en: 'Accountability', subtitle: '责任主体 · 奖惩并举 · 考核问责', subtitleEn: 'Responsible parties · Rewards & penalties · Assessment' },
];

const LEVEL_META: Record<string, { color: string; dot: string; badge: string }> = {
  重大: { color: 'text-red-600', dot: 'bg-red-500', badge: 'bg-red-100 text-red-700' },
  较大: { color: 'text-orange-600', dot: 'bg-orange-500', badge: 'bg-orange-100 text-orange-700' },
  一般: { color: 'text-yellow-600', dot: 'bg-yellow-400', badge: 'bg-yellow-100 text-yellow-700' },
  低风险: { color: 'text-blue-600', dot: 'bg-blue-500', badge: 'bg-blue-100 text-blue-700' },
};
const LEVELS = ['重大', '较大', '一般', '低风险'];
const LEVEL_EN: Record<string, string> = {
  重大: 'Major', 较大: 'Significant', 一般: 'General', 低风险: 'Low',
};
const PLAN_TYPE_EN: Record<string, string> = {
  综合应急预案: 'Comprehensive', 专项应急预案: 'Specialized', 现场处置方案: 'On-site Response',
};

const RISK_FIELDS = [
  { key: 'name', label: '危险源/风险点', labelEn: 'Hazard / Risk Point', required: true },
  { key: 'project', label: '所属工程', labelEn: 'Project' },
  { key: 'category', label: '类别', labelEn: 'Category', type: 'select', options: ['施工', '工程运行', '设施设备', '人员行为', '管理体系', '作业环境'] },
  { key: 'source', label: '风险描述', labelEn: 'Risk Description', type: 'textarea' },
  { key: 'level', label: '风险等级', labelEn: 'Risk Level', type: 'select', options: ['重大', '较大', '一般', '低风险'] },
  { key: 'method', label: '判定方法', labelEn: 'Assessment Method', type: 'select', options: ['直接评定法', 'LEC作业条件危险性评价法', 'LS风险矩阵法', '安全检查表法'] },
  { key: 'measures', label: '管控措施', labelEn: 'Control Measures', type: 'textarea' },
  { key: 'monitor', label: '监测监控方式', labelEn: 'Monitoring Method' },
  { key: 'owner', label: '管控责任人', labelEn: 'Responsible Person' },
  { key: 'status', label: '管控状态', labelEn: 'Control Status', type: 'select', options: ['受控', '预警', '失控'] },
  { key: 'updateDate', label: '辨识更新日期', labelEn: 'Identification Update Date', type: 'date' },
];

export function SixMechanismsPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [data, setData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState('查找');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const { lang, t, tCat, tFeat } = useT();
  const isZh = lang === 'zh';

  const role = getCurrentRole();
  const allowCreate = canCreate(categoryKey, role);
  const allowEdit = canEdit(categoryKey, role);
  const allowDelete = canDelete(categoryKey, role);

  const collections = ['riskLedgers', 'emergencyPlans', 'safetyInspections', 'qualityInspections', 'safetyTrainings', 'qualityTrainings', 'safetyInputLedgers', 'safetyAccidents', 'qualityAccidents', 'safetyPunishments', 'safetyRewards', 'qualityPunishments', 'qualityRewards'];

  const fetchAll = async () => {
    const token = localStorage.getItem('token');
    const headers = { Authorization: `Bearer ${token}` };
    const results = await Promise.all(
      collections.map(async (name) => {
        try {
          const res = await fetch(`${API_BASE}/collections/${name}`, { headers });
          if (res.ok) return { name, list: await res.json() };
        } catch {}
        return { name, list: [] };
      }),
    );
    const next: Record<string, any[]> = {};
    for (const r of results) next[r.name] = r.list;
    setData(next);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const { matchesProject } = useProject();

  const risks = (data.riskLedgers || []).filter(matchesProject);
  const plans = (data.emergencyPlans || []).filter(matchesProject);
  const sInsp = (data.safetyInspections || []).filter(matchesProject);
  const qInsp = (data.qualityInspections || []).filter(matchesProject);
  const sTrn = (data.safetyTrainings || []).filter(matchesProject);
  const qTrn = (data.qualityTrainings || []).filter(matchesProject);
  const sInput = (data.safetyInputLedgers || []).filter(matchesProject);
  const sAcc = (data.safetyAccidents || []).filter(matchesProject);
  const qAcc = (data.qualityAccidents || []).filter(matchesProject);
  const sPun = (data.safetyPunishments || []).filter(matchesProject);
  const sRwd = (data.safetyRewards || []).filter(matchesProject);
  const qPun = (data.qualityPunishments || []).filter(matchesProject);
  const qRwd = (data.qualityRewards || []).filter(matchesProject);

  const allInsp = [...sInsp, ...qInsp];
  const allAcc = [...sAcc, ...qAcc];
  const allTrn = [...sTrn, ...qTrn];
  const allPun = [...sPun, ...qPun];
  const allRwd = [...sRwd, ...qRwd];

  const levelCount = useMemo(() => {
    const m: Record<string, number> = { 重大: 0, 较大: 0, 一般: 0, 低风险: 0 };
    for (const r of risks) if (m[r.level] !== undefined) m[r.level] += 1;
    return m;
  }, [risks]);

  const methodCount = useMemo(() => {
    const m: Record<string, number> = {};
    for (const r of risks) m[r.method] = (m[r.method] || 0) + 1;
    return m;
  }, [risks]);

  const warningRisks = risks.filter((r) => r.status !== '受控');
  const rectifying = allInsp.filter((i) => i.status === '整改中' || i.status === '待整改');
  const doneInsp = allInsp.filter((i) => i.status === '已完成');
  const rectRate = allInsp.length ? Math.round((doneInsp.length / allInsp.length) * 100) : 0;
  const pendingDrill = plans.filter((p) => p.drillStatus === '待演练');
  const totalInput = sInput.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const totalTrain = allTrn.reduce((s, t) => s + (Number(t.participants) || 0), 0);
  const maxRiskCount = Math.max(1, ...LEVELS.map((l) => levelCount[l]));

  const openCreate = () => {
    setEditing(null);
    const f: Record<string, any> = {};
    for (const field of RISK_FIELDS) f[field.key] = field.type === 'number' ? 0 : '';
    setForm(f);
    setDialogOpen(true);
  };

  const openEdit = (item: any) => {
    setEditing(item);
    const next: Record<string, any> = {};
    for (const f of RISK_FIELDS) next[f.key] = item[f.key] ?? (f.type === 'number' ? 0 : '');
    setForm(next);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('token');
    const url = `${API_BASE}/collections/riskLedgers${editing ? `/${editing.id}` : ''}`;
    const res = await fetch(url, {
      method: editing ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify(form),
    });
    if (res.ok) { setDialogOpen(false); fetchAll(); }
    setSaving(false);
  };

  const handleDelete = async (item: any) => {
    if (!confirm(isZh ? `确认删除危险源「${item.name}」吗？` : `Delete hazard "${item.name}"?`)) return;
    const token = localStorage.getItem('token');
    await fetch(`${API_BASE}/collections/riskLedgers/${item.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
    fetchAll();
  };

  const mechData = MECHANISMS.find((m) => m.key === active)!;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
          <p className="text-sm text-gray-500 mt-1">{isZh ? '水利安全生产风险管控"六项机制"（水利部实施意见）—— 查找 → 研判 → 预警 → 防范 → 处置 → 责任' : '"Six Mechanisms" for water-conservancy safety risk control (MWR implementation) — Identify → Assess → Warn → Prevent → Respond → Accountability'}</p>
        </div>
        {active === '查找' && allowCreate && (
          <Button onClick={openCreate} className="bg-blue-600 hover:bg-blue-700"><Plus className="w-4 h-4 mr-2" />{isZh ? '登记危险源' : 'Register Hazard'}</Button>
        )}
      </div>

      {/* 六项机制闭环导航 */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {MECHANISMS.map((m, i) => (
          <button key={m.key} onClick={() => setActive(m.key)} className="text-left">
            <Card className={`transition-all ${active === m.key ? `ring-2 ${m.border} shadow-md` : 'hover:shadow-md'}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${m.bg}`}>
                    <m.icon className={`w-5 h-5 ${m.color}`} />
                  </div>
                  {i < 5 && <ArrowRight className="w-3.5 h-3.5 text-gray-300 hidden xl:block" />}
                </div>
                <p className={`text-sm font-semibold mt-2 ${active === m.key ? m.color : 'text-gray-700'}`}>{isZh ? m.title : m.en}</p>
                <p className="text-[11px] text-gray-400 mt-0.5">{isZh ? m.subtitle : m.subtitleEn}</p>
              </CardContent>
            </Card>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          {/* 当前机制概览 */}
          <Card className={mechData.border && `border`}>
            <CardContent className="p-5 flex items-start gap-4">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 ${mechData.bg}`}>
                <mechData.icon className={`w-6 h-6 ${mechData.color}`} />
              </div>
              <div className="flex-1">
                <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">{isZh ? mechData.title : mechData.en}<Badge variant="outline" className="text-[10px]">{isZh ? mechData.subtitle : mechData.subtitleEn}</Badge></h2>
                <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                  {active === '查找' && (isZh ? '全面辨识危险源，覆盖施工、工程运行、设施设备、人员行为、管理体系和作业环境六类；按"横向到边、纵向到底"建立危险源清单，每季度至少辨识1次并动态更新。' : 'Comprehensively identify hazards across six categories: construction, operation, facilities & equipment, human behavior, management systems and work environment; build a hazard checklist with full horizontal and vertical coverage, identifying at least once per quarter with dynamic updates.')}
                  {active === '研判' && (isZh ? '对危险源开展风险评价，采用直接评定法、作业条件危险性评价法（LEC法）、风险矩阵法（LS法）和检查表法确定风险等级，由高到低为重大、较大、一般、低风险，用红橙黄蓝四色标示。' : 'Conduct risk evaluation using direct assessment, LEC method, LS risk matrix and checklist methods to determine risk levels — Major, Significant, General and Low from high to low — marked with red, orange, yellow and blue.')}
                  {active === '预警' && (isZh ? '建立监测监控体系，对关键部位和环节实时监控；对重大、较大风险实行差异化管控，及时发布预警、提前响应，做到抓早抓小、防患未然。' : 'Establish a monitoring system for real-time surveillance of key locations and processes; apply differentiated control for major and significant risks, issue warnings promptly and respond early to prevent incidents.')}
                  {active === '防范' && (isZh ? '通过风险公告、工程技术、管理、教育培训和个体防护措施控制风险；开展隐患排查治理"五落实"，确保风险始终处于受控范围。' : 'Control risks through risk notification, engineering, management, education & training and personal protective measures; implement the "five implementations" in hazard screening and rectification to keep risks under control.')}
                  {active === '处置' && (isZh ? '健全综合预案、专项预案和现场处置方案三级应急预案，重大危险源"一源一案"；突发事故坚持"四不放过"原则，确保处置准、处置快、处置好。' : 'Improve three-tier emergency plans (comprehensive, specialized and on-site response), with one dedicated plan per major hazard; adhere to the "four-nevers" principle for accidents to ensure accurate, fast and effective response.')}
                  {active === '责任' && (isZh ? '明确责任主体（生产经营单位）与监管主体，压实各岗位管控责任；奖励主动防控、处罚失职失责，严格考核问责。' : 'Clarify responsible parties (production & business units) and supervisory bodies, consolidate control responsibilities at every post; reward proactive prevention, penalize negligence, and enforce strict accountability.')}
                </p>
              </div>
              <div className="text-right flex-shrink-0 hidden md:block">
                <p className="text-3xl font-bold text-gray-900">
                  {active === '查找' ? risks.length : active === '研判' ? risks.length : active === '预警' ? warningRisks.length : active === '防范' ? rectifying.length : active === '处置' ? plans.length : allPun.length + allRwd.length}
                </p>
                <p className="text-xs text-gray-400">{isZh ? `当前${mechData.title.replace('机制', '')}数据` : `Current ${mechData.en.toLowerCase()} data`}</p>
              </div>
            </CardContent>
          </Card>

          {/* ============ 查找机制：危险源台账 ============ */}
          {active === '查找' && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <Card><CardContent className="p-3"><p className="text-lg font-bold text-gray-900">{risks.length}</p><p className="text-xs text-gray-500">{isZh ? '危险源总数' : 'Total Hazards'}</p></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-lg font-bold text-red-600">{levelCount['重大']}</p><p className="text-xs text-gray-500">{isZh ? '重大危险源' : 'Major Hazards'}</p></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-lg font-bold text-orange-600">{levelCount['较大']}</p><p className="text-xs text-gray-500">{isZh ? '较大风险' : 'Significant Risks'}</p></CardContent></Card>
                <Card><CardContent className="p-3"><p className="text-lg font-bold text-blue-600">{risks.filter((r) => r.status === '受控').length}</p><p className="text-xs text-gray-500">{isZh ? '受控管理' : 'Under Control'}</p></CardContent></Card>
              </div>
              <Card>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 text-left text-xs text-gray-500 bg-gray-50">
                          <th className="py-2.5 px-4 font-medium">{isZh ? '危险源 / 风险点' : 'Hazard / Risk Point'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '等级' : 'Level'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '类别' : 'Category'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '所属工程' : 'Project'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '判定方法' : 'Method'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '责任人' : 'Owner'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '管控状态' : 'Status'}</th>
                          <th className="py-2.5 px-3 font-medium">{isZh ? '辨识更新' : 'Updated'}</th>
                          {allowEdit && <th className="py-2.5 pr-4 font-medium text-right">{t('operation')}</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {risks.map((r) => {
                          const meta = LEVEL_META[r.level] || LEVEL_META['一般'];
                          return (
                            <tr key={r.id} className="border-b border-gray-50 hover:bg-gray-50">
                              <td className="py-2.5 px-4">
                                <p className="text-gray-800 font-medium">{r.name}</p>
                                <p className="text-[11px] text-gray-400 max-w-[240px] truncate">{r.source}</p>
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                                  <span className={`w-2 h-2 rounded-full ${meta.dot}`} />
                                  <span className={meta.color}>{isZh ? r.level : LEVEL_EN[r.level] || r.level}</span>
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-gray-500">{r.category}</td>
                              <td className="py-2.5 px-3 text-xs text-gray-500">{r.project}</td>
                              <td className="py-2.5 px-3 text-xs text-gray-500">{r.method}</td>
                              <td className="py-2.5 px-3 text-xs text-gray-500">{r.owner}</td>
                              <td className="py-2.5 px-3">
                                <Badge className={`text-[10px] ${r.status === '受控' ? 'bg-emerald-100 text-emerald-700' : r.status === '预警' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{r.status}</Badge>
                              </td>
                              <td className="py-2.5 px-3 text-xs text-gray-400">{r.updateDate}</td>
                              {allowEdit && (
                                <td className="py-2.5 pr-4 text-right">
                                  <div className="flex justify-end gap-1">
                                    <Button variant="ghost" size="icon-sm" onClick={() => openEdit(r)} title={t('edit')}><Pencil className="w-3.5 h-3.5 text-blue-600" /></Button>
                                    {allowDelete && <Button variant="ghost" size="icon-sm" onClick={() => handleDelete(r)} title={t('delete')}><Trash2 className="w-3.5 h-3.5 text-red-600" /></Button>}
                                  </div>
                                </td>
                              )}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
              {allowCreate && (
                <Button variant="outline" onClick={openCreate} className="w-full border-dashed text-gray-400 hover:text-blue-600 hover:border-blue-300">
                  <Plus className="w-4 h-4 mr-2" />{isZh ? '登记新危险源' : 'Register New Hazard'}
                </Button>
              )}
            </>
          )}

          {/* ============ 研判机制：风险分级 ============ */}
          {active === '研判' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">{isZh ? '风险等级分布（红橙黄蓝四色标示）' : 'Risk Level Distribution (Red/Orange/Yellow/Blue)'}</h3>
                  <div className="space-y-3">
                    {LEVELS.map((l) => {
                      const meta = LEVEL_META[l];
                      return (
                        <div key={l}>
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="flex items-center gap-2 text-gray-600"><span className={`w-3 h-3 rounded ${meta.dot}`} />{isZh ? `${l}风险` : `${LEVEL_EN[l]} risk`}</span>
                            <span className="text-gray-400">{levelCount[l]} {isZh ? '项' : ''} · {risks.length ? Math.round((levelCount[l] / risks.length) * 100) : 0}%</span>
                          </div>
                          <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
                            <div className={`h-full rounded-full ${meta.dot}`} style={{ width: `${(levelCount[l] / maxRiskCount) * 100}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-xs text-gray-400 mt-4 leading-relaxed">{isZh ? '风险等级由高到低依次为重大（红）、较大（橙）、一般（黄）、低（蓝）风险，实行分级管控、分类处置。' : 'Risk levels from high to low: Major (red), Significant (orange), General (yellow), Low (blue) — with tiered control and classified response.'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-4">{isZh ? '风险评价判定方法' : 'Risk Assessment Methods'}</h3>
                  <div className="space-y-2">
                    {Object.entries(methodCount).map(([m, c]) => (
                      <div key={m} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <span className="text-xs text-gray-700">{m}</span>
                        <span className="text-xs font-semibold text-gray-500">{c} {isZh ? '项' : ''}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-purple-50 p-3 text-xs text-purple-700 leading-relaxed">
                    {isZh ? '常用判定方法：直接评定法（重大危险源直接判定）、作业条件危险性评价法（LEC法）、风险矩阵法（LS法）、安全检查表法。应及时编制危险源辨识与风险评价报告，动态调整风险等级。' : 'Common methods: direct assessment (for major hazards), LEC method, LS risk matrix, and safety checklist. Hazard identification and risk evaluation reports should be prepared promptly, with risk levels adjusted dynamically.'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ 预警机制 ============ */}
          {active === '预警' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><AlertTriangle className="w-4 h-4 text-orange-500" />{isZh ? `预警 / 失控风险（${warningRisks.length}）` : `Warning / Out-of-control Risks (${warningRisks.length})`}</h3>
                  {warningRisks.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isZh ? '当前全部受控，无预警风险' : 'All under control, no warning risks'}</p>}
                  <div className="space-y-2">
                    {warningRisks.map((r) => (
                      <div key={r.id} className="rounded-xl border border-orange-200 bg-orange-50/50 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800 flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full ${LEVEL_META[r.level]?.dot}`} />{r.name}
                          </p>
                          <Badge className={`text-[10px] ${r.status === '预警' ? 'bg-orange-100 text-orange-700' : 'bg-red-100 text-red-700'}`}>{isZh ? r.status : r.status === '预警' ? 'Warning' : 'Out of Control'}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{r.project} · {isZh ? `监测：${r.monitor}` : `Monitoring: ${r.monitor}`} · {isZh ? `责任人：${r.owner}` : `Owner: ${r.owner}`}</p>
                        <p className="text-xs text-orange-700 mt-1">{isZh ? `管控措施：${r.measures}` : `Measures: ${r.measures}`}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><BellRing className="w-4 h-4 text-blue-500" />{isZh ? `整改中隐患（${rectifying.length}）` : `Rectifying Hazards (${rectifying.length})`}</h3>
                  {rectifying.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isZh ? '暂无整改中隐患' : 'No hazards being rectified'}</p>}
                  <div className="space-y-2">
                    {rectifying.map((i) => (
                      <div key={i.id} className="rounded-xl border border-gray-200 p-3">
                        <p className="text-sm font-medium text-gray-800">{i.title}</p>
                        <p className="text-xs text-gray-500 mt-1">{i.project} · {i.inspector}</p>
                        <p className="text-xs text-gray-400 mt-1">{i.issues}</p>
                        <Badge className="mt-2 text-[10px] bg-amber-100 text-amber-700">{isZh ? i.status : i.status === '整改中' ? 'Rectifying' : 'To Rectify'}</Badge>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-blue-50 p-3 text-xs text-blue-700 leading-relaxed">
                    {isZh ? '预警机制要求建立监测监控体系，对重大、较大风险部位实时监控；隐患整改中事项应及时预警、限时闭环，防范事故发生。' : 'The warning mechanism requires a monitoring system with real-time surveillance of major and significant risk areas; rectification items should be warned promptly and closed within deadlines to prevent accidents.'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ 防范机制 ============ */}
          {active === '防范' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="md:col-span-2">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><ClipboardList className="w-4 h-4 text-emerald-500" />{isZh ? '隐患排查治理闭环' : 'Hazard Screening & Rectification Loop'}</h3>
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="rounded-xl bg-emerald-50 p-3 text-center"><p className="text-xl font-bold text-emerald-600">{doneInsp.length}</p><p className="text-xs text-gray-500">{isZh ? '已完成' : 'Completed'}</p></div>
                    <div className="rounded-xl bg-amber-50 p-3 text-center"><p className="text-xl font-bold text-amber-600">{rectifying.length}</p><p className="text-xs text-gray-500">{isZh ? '整改中' : 'Rectifying'}</p></div>
                    <div className="rounded-xl bg-gray-50 p-3 text-center"><p className="text-xl font-bold text-gray-700">{rectRate}%</p><p className="text-xs text-gray-500">{isZh ? '整改完成率' : 'Rectification Rate'}</p></div>
                  </div>
                  <div className="space-y-2">
                    {allInsp.map((i) => (
                      <div key={i.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{i.title}</p>
                          <p className="text-[11px] text-gray-400">{i.project} · {i.inspector}</p>
                        </div>
                        <Badge className={`text-[10px] flex-shrink-0 ${i.status === '已完成' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>{isZh ? i.status : i.status === '已完成' ? 'Completed' : i.status === '整改中' ? 'Rectifying' : 'To Rectify'}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <div className="space-y-4">
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{isZh ? `教育培训（${allTrn.length} 场 · ${totalTrain} 人次）` : `Training (${allTrn.length} sessions · ${totalTrain} participants)`}</h3>
                    <div className="space-y-2">
                      {allTrn.map((t) => (
                        <div key={t.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">{t.title}</span>
                          <span className="text-gray-400 flex-shrink-0 ml-2">{t.participants}{isZh ? '人' : ''}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">{isZh ? '安全投入' : 'Safety Investment'}</h3>
                    <p className="text-xl font-bold text-emerald-600 mb-2">¥{(totalInput / 10000).toFixed(0)}{isZh ? '万' : 'k'}</p>
                    <div className="space-y-1.5">
                      {sInput.map((i) => (
                        <div key={i.id} className="flex items-center justify-between text-xs">
                          <span className="text-gray-600 truncate">{i.project} · {i.item}</span>
                          <span className="text-gray-400 flex-shrink-0 ml-2">¥{Number(i.amount).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* ============ 处置机制 ============ */}
          {active === '处置' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><LifeBuoy className="w-4 h-4 text-red-500" />{isZh ? `应急预案（${plans.length}）` : `Emergency Plans (${plans.length})`}</h3>
                    <Badge className="text-[10px] bg-red-100 text-red-700">{isZh ? `${pendingDrill.length} 待演练` : `${pendingDrill.length} drills pending`}</Badge>
                  </div>
                  <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                    {['综合应急预案', '专项应急预案', '现场处置方案'].map((pt) => (
                      <div key={pt} className="rounded-lg bg-gray-50 p-2">
                        <p className="text-base font-bold text-gray-700">{plans.filter((p) => p.type === pt).length}</p>
                        <p className="text-[10px] text-gray-400">{isZh ? pt.replace('应急预案', '').replace('现场处置方案', '现场处置') : PLAN_TYPE_EN[pt] || pt}</p>
                      </div>
                    ))}
                  </div>
                  <div className="space-y-2">
                    {plans.map((p) => (
                      <div key={p.id} className="rounded-xl border border-gray-200 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">{p.name}</p>
                          <Badge variant="outline" className={`text-[10px] ${p.drillStatus === '已演练' ? 'text-emerald-600 border-emerald-200' : 'text-orange-600 border-orange-200'}`}>{isZh ? p.drillStatus : p.drillStatus === '已演练' ? 'Drilled' : 'Pending Drill'}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{p.type} · {isZh ? `适用：${p.scene}` : `Scene: ${p.scene}`} · {isZh ? `责任人：${p.responsible}` : `Owner: ${p.responsible}`}</p>
                        {p.drillDate && <p className="text-[11px] text-gray-400 mt-0.5">{isZh ? `最近演练：${p.drillDate}` : `Last drill: ${p.drillDate}`}</p>}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><FileWarning className="w-4 h-4 text-red-500" />{isZh ? `事故记录（${allAcc.length}）` : `Accident Records (${allAcc.length})`}</h3>
                  {allAcc.length === 0 && <p className="text-sm text-gray-400 text-center py-8">{isZh ? '暂无事故记录' : 'No accident records'}</p>}
                  <div className="space-y-2">
                    {allAcc.map((a) => (
                      <div key={a.id} className="rounded-xl border border-red-100 bg-red-50/40 p-3">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-800">{a.title}</p>
                          <Badge className="text-[10px] bg-red-100 text-red-700">{a.level}</Badge>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{a.project} · {a.date}</p>
                        <p className="text-xs text-gray-600 mt-1">{a.description}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 leading-relaxed">
                    {isZh ? '处置机制坚持"四不放过"原则：事故原因未查清不放过、责任人员未处理不放过、整改措施未落实不放过、有关人员未受到教育不放过；重大危险源实行"一源一案"。' : 'The response mechanism adheres to the "four-nevers" principle: never close the case until the cause is identified, the responsible are handled, rectification is implemented, and relevant personnel are educated; one dedicated plan per major hazard.'}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* ============ 责任机制 ============ */}
          {active === '责任' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />{isZh ? `奖励记录（${allRwd.length}）` : `Reward Records (${allRwd.length})`}</h3>
                  <div className="space-y-2">
                    {allRwd.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-emerald-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{r.person} · {r.reason}</p>
                          <p className="text-[11px] text-gray-400">{r.code} · {r.project} · {r.date}</p>
                        </div>
                        <span className="text-xs font-semibold text-emerald-600 flex-shrink-0">+¥{Number(r.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Scale className="w-4 h-4 text-red-500" />{isZh ? `处罚记录（${allPun.length}）` : `Penalty Records (${allPun.length})`}</h3>
                  <div className="space-y-2">
                    {allPun.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                        <div className="min-w-0">
                          <p className="text-xs text-gray-700 truncate">{r.person} · {r.reason}</p>
                          <p className="text-[11px] text-gray-400">{r.code} · {r.project} · {r.date}</p>
                        </div>
                        <span className="text-xs font-semibold text-red-500 flex-shrink-0">-¥{Number(r.amount).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="md:col-span-2">
                <CardContent className="p-5">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-500" />{isZh ? '风险管控责任主体清单' : 'Risk Control Responsible Parties'}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {Array.from(new Set(risks.map((r) => r.owner))).map((owner) => (
                      <div key={owner} className="flex items-center justify-between rounded-lg bg-indigo-50 px-3 py-2">
                        <span className="text-sm text-gray-700 font-medium">{owner}</span>
                        <Badge className="text-[10px] bg-indigo-100 text-indigo-700">{isZh ? `${risks.filter((r) => r.owner === owner).length} 项管控` : `${risks.filter((r) => r.owner === owner).length} controls`}</Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{isZh ? `${editing ? '编辑' : '登记'}危险源` : `${editing ? 'Edit' : 'Register'} Hazard`}</DialogTitle></DialogHeader>
          <div className="space-y-4 py-2">
            {RISK_FIELDS.map((f) => (
              <div key={f.key}>
                <Label>{isZh ? f.label : f.labelEn}{f.required && <span className="text-red-500 ml-0.5">*</span>}</Label>
                {f.type === 'select' ? (
                  <select className="mt-1 w-full h-10 px-3 rounded-md border border-gray-300 bg-white text-sm" value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })}>
                    <option value="">{t('pleaseSelect')}</option>
                    {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
                  </select>
                ) : f.type === 'textarea' ? (
                  <textarea className="mt-1 w-full min-h-20 px-3 py-2 rounded-md border border-gray-300 bg-white text-sm" value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: e.target.value })} />
                ) : (
                  <Input className="mt-1" type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'} value={form[f.key] ?? ''} onChange={(e) => setForm({ ...form, [f.key]: f.type === 'number' ? Number(e.target.value) : e.target.value })} placeholder={`${t('inputPlaceholder')}${isZh ? f.label : f.labelEn}`} />
                )}
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