import { useState } from 'react';
import { ChevronRight, AlertCircle, CheckCircle, LayoutGrid } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

interface ModuleItem {
  moduleId: string;
  pagePath: string;
  pageName: string;
  category: string;
  description: string;
  endpointCount: number;
  gapCount: number;
  hasCriticalGap: boolean;
  priority: string;
}

export default function ModuleList({
  modules,
  selectedId,
  onSelect,
  loading,
}: {
  modules?: ModuleItem[];
  selectedId?: string;
  onSelect: (id: string) => void;
  loading: boolean;
}) {
  const [filter, setFilter] = useState<string>('all');

  if (loading || !modules) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-lc-bg-warm animate-pulse" />
        ))}
      </div>
    );
  }

  const categories = ['all', ...Array.from(new Set(modules.map(m => m.category)))];
  const filtered = filter === 'all' ? modules : modules.filter(m => m.category === filter);

  const categoryColors: Record<string, string> = {
    TikTok: '#FE2C55',
    Amazon: '#FF9900',
    Fusion: '#8B5CF6',
    Report: '#0891B2',
    User: '#6B7280',
    Data: '#059669',
    System: '#6366F1',
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-3 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            className="text-xs px-2 py-0.5 rounded-full font-medium transition-all"
            style={{
              background: filter === cat ? `${categoryColors[cat] ?? LC.primary}15` : LC.bgWarm,
              color: filter === cat ? (categoryColors[cat] ?? LC.primary) : LC.textMuted,
            }}
          >
            {cat === 'all' ? '全部' : cat}
          </button>
        ))}
      </div>

      <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
        {filtered.map(m => (
          <button
            key={m.moduleId}
            onClick={() => onSelect(m.moduleId)}
            className="w-full text-left rounded-lg p-2.5 border transition-all hover:shadow-lc-hover"
            style={{
              borderColor: selectedId === m.moduleId ? LC.primary : LC.border,
              background: selectedId === m.moduleId ? `${LC.primary}08` : 'white',
            }}
          >
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                <span
                  className="text-[9px] px-1 py-0.5 rounded font-bold"
                  style={{ background: `${categoryColors[m.category] ?? LC.primary}15`, color: categoryColors[m.category] ?? LC.primary }}
                >
                  {m.category}
                </span>
                <span className="text-xs font-semibold text-lc-text-primary">{m.pageName}</span>
              </div>
              <ChevronRight size={12} className="text-lc-text-muted" />
            </div>
            <div className="flex items-center gap-3 text-xs text-lc-text-muted">
              <span className="flex items-center gap-0.5">
                <LayoutGrid size={9} />
                {m.endpointCount}个API
              </span>
              {m.gapCount > 0 ? (
                <span className="flex items-center gap-0.5" style={{ color: m.hasCriticalGap ? LC.danger : LC.warning }}>
                  <AlertCircle size={9} />
                  {m.gapCount}个缺口
                </span>
              ) : (
                <span className="flex items-center gap-0.5" style={{ color: LC.success }}>
                  <CheckCircle size={9} />
                  正常
                </span>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
