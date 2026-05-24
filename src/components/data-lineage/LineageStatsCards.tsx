import { Database, Link2, BarChart3, CheckCircle, XCircle } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

interface StatsData {
  totalModules: number;
  totalEndpoints: number;
  totalEntities: number;
  totalGaps: number;
  criticalGaps: number;
  warningGaps: number;
  mockEndpoints: number;
  coverageRate: number;
  modelsAvailable: number;
}

export default function LineageStatsCards({ stats, loading }: { stats?: StatsData; loading: boolean }) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="rounded-lg p-3 bg-lc-bg-warm animate-pulse h-20" />
        ))}
      </div>
    );
  }

  const items = [
    { label: '页面模块', value: stats.totalModules, icon: Database, color: LC.primary, suffix: '个' },
    { label: '数据实体', value: stats.totalEntities, icon: Link2, color: LC.teal, suffix: '个' },
    { label: '数据覆盖率', value: stats.coverageRate, icon: CheckCircle, color: LC.success, suffix: '%' },
    { label: '严重缺口', value: stats.criticalGaps, icon: XCircle, color: LC.danger, suffix: '个' },
    { label: '测算模型', value: stats.modelsAvailable, icon: BarChart3, color: LC.warning, suffix: '个' },
  ];

  return (
    <div className="grid grid-cols-5 gap-3">
      {items.map(({ label, value, icon: Icon, color, suffix }) => (
        <div key={label} className="rounded-lg p-3 bg-lc-bg-warm">
          <div className="flex items-center gap-1.5 mb-1">
            <Icon size={12} style={{ color }} />
            <span className="text-xs font-medium text-lc-text-muted">{label}</span>
          </div>
          <div className="text-lg font-bold font-mono-num" style={{ color }}>
            {value}{suffix}
          </div>
        </div>
      ))}
    </div>
  );
}
