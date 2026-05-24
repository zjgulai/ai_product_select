import { Database, Beaker, AlertCircle } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export type DataBadgeType = 'real' | 'demo' | 'sample' | 'placeholder';

interface DataBadgeProps {
  type: DataBadgeType;
  label?: string;
  className?: string;
}

const config: Record<DataBadgeType, { icon: typeof Database; color: string; bg: string; defaultLabel: string }> = {
  real: { icon: Database, color: LC.success, bg: LC.successLight, defaultLabel: '真实数据' },
  demo: { icon: Beaker, color: LC.warning, bg: LC.warningLight, defaultLabel: '演示数据' },
  sample: { icon: Beaker, color: LC.teal, bg: `${LC.teal}15`, defaultLabel: '示例数据' },
  placeholder: { icon: AlertCircle, color: LC.textMuted, bg: LC.bgWarm, defaultLabel: '占位数据' },
};

export default function DataBadge({ type, label, className = '' }: DataBadgeProps) {
  const c = config[type];
  const Icon = c.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full font-medium ${className}`}
      style={{ background: c.bg, color: c.color }}
      title={type === 'real' ? '数据来自真实数据源' : '数据仅用于演示，非真实业务数据'}
    >
      <Icon size={9} />
      {label ?? c.defaultLabel}
    </span>
  );
}

export function DataBadgeBar({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`flex items-center gap-2 px-3 py-1.5 bg-lc-bg-warm border-b border-lc-border-light ${className}`}>
      {children}
    </div>
  );
}
