import { LucideIcon } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

interface EmptyStateProps {
  icon?: LucideIcon;
  title?: string;
  description?: string;
  primaryAction?: { label: string; onClick: () => void; icon?: LucideIcon };
  secondaryAction?: { label: string; onClick: () => void };
  compact?: boolean;
}

export default function EmptyState({
  icon: Icon,
  title = '暂无数据',
  description,
  primaryAction,
  secondaryAction,
  compact = false,
}: EmptyStateProps) {
  if (compact) {
    return (
      <div className="py-8 flex flex-col items-center justify-center text-center">
        {Icon && (
          <div className="w-9 h-9 rounded-full flex items-center justify-center mb-2" style={{ background: `${LC.primary}10` }}>
            <Icon size={16} style={{ color: LC.primary }} />
          </div>
        )}
        <p className="text-xs font-medium text-lc-text-secondary mb-0.5">{title}</p>
        {description && <p className="text-[11px] text-lc-text-muted mb-2">{description}</p>}
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="text-[11px] font-medium px-3 h-6 rounded-md transition-colors"
            style={{ background: `${LC.primary}10`, color: LC.primary }}
          >
            {primaryAction.label}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="py-12 flex flex-col items-center justify-center text-center">
      {Icon && (
        <div className="w-12 h-12 rounded-full flex items-center justify-center mb-3" style={{ background: `${LC.primary}10` }}>
          <Icon size={20} style={{ color: LC.primary }} />
        </div>
      )}
      <p className="text-sm font-semibold text-lc-text-primary mb-1">{title}</p>
      {description && <p className="text-xs text-lc-text-muted mb-3 max-w-[280px]">{description}</p>}
      <div className="flex items-center gap-2">
        {primaryAction && (
          <button
            onClick={primaryAction.onClick}
            className="flex items-center gap-1.5 text-xs font-medium px-4 h-8 rounded-md text-white transition-colors hover:opacity-90"
            style={{ background: LC.primary }}
          >
            {primaryAction.icon && <primaryAction.icon size={13} />}
            {primaryAction.label}
          </button>
        )}
        {secondaryAction && (
          <button
            onClick={secondaryAction.onClick}
            className="text-xs font-medium px-4 h-8 rounded-md transition-colors"
            style={{ color: LC.textSecondary, border: `1px solid ${LC.border}` }}
          >
            {secondaryAction.label}
          </button>
        )}
      </div>
    </div>
  );
}
