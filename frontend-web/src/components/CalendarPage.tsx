'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { FeatureDef } from '@/config/features';

const API_BASE = 'http://localhost:3000';

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

export function CalendarPage({ feature, categoryTitle, categoryKey }: { feature: FeatureDef; categoryTitle: string; categoryKey: string }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });

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

  const dateField = feature.fields.find((f) => f.key === 'date');
  const titleField = feature.fields.find((f) => f.key === 'title' || f.key === 'name' || f.key === 'theme');

  const today = new Date();
  const year = month.getFullYear();
  const m = month.getMonth();
  const firstDay = new Date(year, m, 1);
  const daysInMonth = new Date(year, m + 1, 0).getDate();
  const startWeekday = firstDay.getDay();
  const cells: (number | null)[] = [
    ...Array.from({ length: startWeekday }, () => null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const dayItems = (day: number) => {
    if (!dateField) return [];
    const dateStr = `${year}-${String(m + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return items.filter((it) => String(it[dateField.key]).startsWith(dateStr));
  };

  const navigate = (delta: number) => {
    setMonth(new Date(year, m + delta, 1));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">{categoryTitle}</p>
          <h1 className="text-2xl font-bold text-gray-900">{feature.title}</h1>
        </div>
        <Badge variant="secondary" className="text-xs">{items.length} 条</Badge>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">{year}年 {m + 1}月</CardTitle>
          <div className="flex gap-1">
            <Button variant="outline" size="icon-sm" onClick={() => navigate(-1)}><ChevronLeft className="w-4 h-4" /></Button>
            <Button variant="outline" size="sm" onClick={() => setMonth(new Date(today.getFullYear(), today.getMonth(), 1))}>今天</Button>
            <Button variant="outline" size="icon-sm" onClick={() => navigate(1)}><ChevronRight className="w-4 h-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-400 gap-2"><Loader2 className="w-4 h-4 animate-spin" />加载中...</div>
          ) : (
            <div className="grid grid-cols-7 gap-px bg-gray-100 rounded-lg overflow-hidden">
              {WEEKDAYS.map((w, i) => (
                <div key={w} className={`bg-gray-50 px-3 py-2 text-xs font-medium ${i === 0 || i === 6 ? 'text-red-500' : 'text-gray-500'}`}>{w}</div>
              ))}
              {cells.map((day, i) => {
                const isToday = day === today.getDate() && m === today.getMonth() && year === today.getFullYear();
                const list = day ? dayItems(day) : [];
                return (
                  <div key={i} className={`min-h-24 bg-white p-2 ${day === null ? 'bg-gray-50' : ''}`}>
                    {day !== null && (
                      <>
                        <div className={`text-xs font-medium mb-1 ${isToday ? 'w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center' : day >= 1 && (new Date(year, m, day).getDay() === 0 || new Date(year, m, day).getDay() === 6) ? 'text-red-500' : 'text-gray-600'}`}>{day}</div>
                        <div className="space-y-1">
                          {list.slice(0, 3).map((it) => (
                            <div key={it.id} className="text-[11px] px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 truncate" title={titleField ? it[titleField.key] : it.id}>
                              {titleField ? it[titleField.key] : it.id}
                            </div>
                          ))}
                          {list.length > 3 && <div className="text-[11px] text-gray-400 px-1">+{list.length - 3} 更多</div>}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}