import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';
import { TONES } from '@/config/branding';

interface StatCardProps {
  icon?: any;
  label: string;
  value: any;
  sub?: string;
  subCls?: string;
  tone?: string;
  to?: string;
  hover?: boolean;
}

export function StatCard({ icon: Icon, label, value, sub, subCls, tone = 'blue', to, hover }: StatCardProps) {
  const t = TONES[tone] || TONES.blue;
  const body = (
    <div className="flex items-center gap-3.5">
      {Icon && (
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${t.bg} ${t.text}`}>
          <Icon className="w-5 h-5" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-lg font-bold text-gray-900 truncate">{value}</p>
        <p className="text-xs text-gray-500">{label}</p>
        {sub && <p className={`text-[11px] truncate ${subCls || 'text-gray-400'}`}>{sub}</p>}
      </div>
    </div>
  );
  const cls = hover ? 'hover:shadow-md transition-shadow' : '';
  return (
    <Card className={cls}>
      <CardContent className="p-4">
        {to ? <Link href={to} className="block">{body}</Link> : body}
      </CardContent>
    </Card>
  );
}