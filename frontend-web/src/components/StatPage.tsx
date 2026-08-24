'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';
import type { FeatureDef } from '@/config/features';
import { useProjectFilter } from '@/context/ProjectContext';
import { useT } from '@/i18n';
import { getApiBase } from '@/lib/api';

const API_BASE = getApiBase();

const COLORS = ['bg-blue-500', 'bg-emerald-500', 'bg-orange-500', 'bg-purple-500', 'bg-cyan-500', 'bg-rose-500'];

export function StatPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [baseItems, setBaseItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const matchesProject = useProjectFilter(categoryKey);
  const { t, tCat, tFeat, tField, lang } = useT();
  const isZh = lang === 'zh';

  const fetchItems = async () => {
    const token = localStorage.getItem('token');
    const res = await fetch(`${API_BASE}/collections/${feature.collection}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (res.ok) {
      const data = await res.json();
      setBaseItems(Array.isArray(data) ? data : []);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, [feature.collection]);

  const items = useMemo(() => baseItems.filter(matchesProject), [baseItems, matchesProject]);

  const numFields = feature.fields.filter((f) => f.type === 'number');
  const selectFields = feature.fields.filter((f) => f.type === 'select');
  const textFields = feature.fields.filter((f) => f.type !== 'number' && f.type !== 'select' && f.type !== 'textarea');

  const totalAmount = numFields.length > 0
    ? items.reduce((sum, it) => sum + Number(it[numFields[0].key] || 0), 0)
    : 0;

  const selectStats = selectFields.length > 0
    ? (() => {
        const field = selectFields[0];
        const counts = new Map<string, number>();
        for (const it of items) {
          const v = it[field.key] || '未设置';
          counts.set(v, (counts.get(v) || 0) + 1);
        }
        return Array.from(counts.entries());
      })()
    : [];

  const firstTextKey = textFields[0]?.key || null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{tCat(categoryKey)}</p>
          <h1 className="text-2xl font-bold text-gray-900">{tFeat(categoryKey, feature.key)}</h1>
        </div>
        <Badge variant="secondary" className="text-xs">{items.length} {isZh ? '条数据' : 'records'}</Badge>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-24 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />{t('loading')}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-blue-600">{items.length}</p><p className="text-xs text-gray-500 mt-1">{isZh ? '总记录数' : 'Total Records'}</p></CardContent></Card>
            {numFields.length > 0 && (
              <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-emerald-600">{totalAmount.toLocaleString()}</p><p className="text-xs text-gray-500 mt-1">{tField(numFields[0].key, numFields[0].label)}{isZh ? '合计' : ' Total'}</p></CardContent></Card>
            )}
            <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-orange-600">{selectStats.reduce((s, [, n]) => s + n, 0)}</p><p className="text-xs text-gray-500 mt-1">{isZh ? '已分类记录' : 'Categorized'}</p></CardContent></Card>
            <Card><CardContent className="p-4"><p className="text-2xl font-semibold text-purple-600">{textFields.length > 0 ? new Set(items.map((it) => it[textFields[0].key])).size : items.length}</p><p className="text-xs text-gray-500 mt-1">{firstTextKey || (isZh ? '分类' : 'Category')} {isZh ? '数量' : 'Count'}</p></CardContent></Card>
          </div>

          {selectStats.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base font-semibold">{isZh ? `按「${selectFields[0].label}」分布` : `Distribution by "${selectFields[0].label}"`}</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {selectStats.map(([label, count], i) => {
                  const pct = items.length ? Math.round((count / items.length) * 100) : 0;
                  return (
                    <div key={label}>
                      <div className="flex justify-between text-sm mb-1"><span>{label}</span><span className="text-gray-500">{count} {t('count')} · {pct}%</span></div>
                      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${COLORS[i % COLORS.length]} transition-all`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader><CardTitle className="text-base font-semibold">{isZh ? '明细数据' : 'Details'}</CardTitle></CardHeader>
            <CardContent>
              {items.length === 0 ? (
                <div className="text-center py-12 text-gray-400"><p>{t('noData')}</p></div>
              ) : (
                <div className="space-y-2">
                  {items.map((it, i) => (
                    <div key={it.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                      <div className={`w-8 h-8 rounded-lg ${COLORS[i % COLORS.length]} text-white flex items-center justify-center text-xs font-semibold flex-shrink-0`}>{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-gray-900 truncate">{firstTextKey ? it[firstTextKey] : it.id}</p>
                        <p className="text-xs text-gray-400 truncate">
                          {textFields.slice(1).map((f) => `${tField(f.key, f.label)}: ${it[f.key] ?? '-'}`).join(' · ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {numFields.length > 0 && <span className="text-sm font-semibold text-emerald-600 tabular-nums">{Number(it[numFields[0].key] || 0).toLocaleString()}</span>}
                        {selectFields.length > 0 && <Badge variant="outline" className="text-xs">{it[selectFields[0].key] || '-'}</Badge>}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}