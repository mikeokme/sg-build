'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const BAR_COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-rose-500', 'bg-indigo-500', 'bg-teal-500'];

function daysBetween(a: string, b: string) {
  return Math.max(0, Math.round((new Date(b).getTime() - new Date(a).getTime()) / 86400000));
}

export function GanttPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

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

  const startField = feature.fields.find((f) => f.key === 'startDate');
  const endField = feature.fields.find((f) => f.key === 'endDate');
  const taskField = feature.fields.find((f) => f.key === 'task' || f.key === 'title');
  const projectField = feature.fields.find((f) => f.key === 'project');
  const progressField = feature.fields.find((f) => f.key === 'progress');

  const withDates = items.filter((it) => startField && it[startField.key]);
  const minDate = withDates.length && startField ? new Date(Math.min(...withDates.map((it) => new Date(it[startField.key]).getTime()))) : new Date();
  const maxDate = withDates.length && startField ? new Date(Math.max(...withDates.map((it) => new Date(it[endField?.key || startField.key]).getTime()))) : new Date(new Date().getTime() + 30 * 86400000);
  const totalDays = Math.max(1, daysBetween(minDate.toISOString(), maxDate.toISOString()));

  const months: { key: string; label: string; days: number }[] = [];
  {
    let cursor = new Date(minDate);
    cursor.setDate(1);
    while (cursor <= maxDate) {
      const next = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
      const days = Math.min(daysBetween(cursor.toISOString(), next.toISOString()), daysBetween(cursor.toISOString(), maxDate.toISOString()) + 1);
      months.push({ key: cursor.toISOString(), label: `${cursor.getMonth() + 1}${isZh ? '月' : ''}`, days: Math.max(1, days) });
      cursor = next;
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <Badge variant="secondary" className="text-xs">{withDates.length} {isZh ? '个工作项' : 'work items'}</Badge>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '进度甘特图' : 'Progress Gantt Chart'}</CardTitle></CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
          ) : withDates.length === 0 ? (
            <div className="text-center py-16 text-gray-400">
              <p>{isZh ? '暂无进度数据' : 'No progress data'}</p>
              <p className="text-sm mt-1">{isZh ? '请先在列表中新增带开始/结束日期的工作项' : 'Add work items with start/end dates in the list first'}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div style={{ minWidth: 600 }}>
                <div className="flex border-b border-gray-200 pb-2 mb-2">
                  <div className="w-48 flex-shrink-0 text-xs text-gray-500 font-medium">{tField(projectField?.key || 'project', projectField?.label || (isZh ? '项目' : 'Project'))}</div>
                  <div className="flex-1 relative" style={{ height: 20 }}>
                    <div className="absolute inset-0 flex">
                      {months.map((m) => (
                        <div key={m.key} className="flex-shrink-0 border-l border-gray-100" style={{ width: `${(m.days / totalDays) * 100}%` }}>
                          <span className="text-xs text-gray-400 pl-1">{m.label}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  {withDates.map((it, idx) => {
                    const start = new Date(it[startField!.key]).getTime();
                    const end = new Date(it[endField?.key || startField!.key]).getTime();
                    const offset = ((start - minDate.getTime()) / (totalDays * 86400000)) * 100;
                    const width = Math.max(((end - start) / (totalDays * 86400000)) * 100, 1.5);
                    const progress = progressField ? Number(it[progressField.key] || 0) : 0;
                    return (
                      <div key={it.id} className="flex items-center">
                        <div className="w-48 flex-shrink-0 pr-3">
                          <p className="text-sm text-gray-800 font-medium truncate">{taskField ? it[taskField.key] : it.id}</p>
                          <p className="text-xs text-gray-400 truncate">{projectField ? it[projectField.key] : ''}</p>
                        </div>
                        <div className="flex-1 relative h-6 rounded-md bg-gray-50" style={{ marginLeft: `${offset}%`, marginRight: `${100 - offset - width}%` }}>
                          <div className={`absolute inset-y-0 left-0 rounded-md ${BAR_COLORS[idx % BAR_COLORS.length]} opacity-90`} style={{ width: `${width}%` }}>
                            <div className="absolute inset-y-0 left-0 rounded-md bg-black/25" style={{ width: `${progress}%` }} />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] text-white font-medium">{progressField ? `${progress}%` : ''}</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}