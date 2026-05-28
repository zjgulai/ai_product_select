import { AlertCircle, Database, Link2, Zap } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

interface GapItem {
  gapId: string;
  gapType: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  impact: string;
  recommendation: string;
  calcMethod?: string;
  calcModelName?: string;
  calcConfidence?: number;
  externalSources?: { name: string; url: string; reliability: number }[];
}

interface EndpointItem {
  endpointId: string;
  fullPath: string;
  description: string;
  isFallbackToMock: boolean;
  entities: Array<{
    entityId: string;
    entityName: string;
    layer: string;
    sourceType: string;
  }>;
}

interface ModuleDetailData {
  module: {
    moduleId: string;
    pagePath: string;
    pageName: string;
    category: string;
    description: string;
    priority: string;
  };
  endpoints: EndpointItem[];
  gaps: GapItem[];
  healthScore: number;
}

export default function ModuleDetail({ data, onGapClick }: { data?: ModuleDetailData; onGapClick?: (gapId: string) => void }) {
  if (!data) {
    return (
      <div className="flex items-center justify-center h-64 text-lc-text-muted text-xs">
        选择一个模块查看详情
      </div>
    );
  }

  const { module, endpoints, gaps, healthScore } = data;

  const severityConfig = {
    critical: { color: LC.danger, bg: LC.dangerLight, label: '严重' },
    warning: { color: LC.warning, bg: LC.warningLight, label: '警告' },
    info: { color: LC.teal, bg: `${LC.teal}15`, label: '提示' },
  };

  const layerColors: Record<string, string> = {
    ODS: '#A98795',
    DWD: '#8FA59A',
    DWS: '#6E966E',
    ADS: '#D8BE78',
    Mock: LC.danger,
    External: LC.info,
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-sm font-semibold text-lc-primary">{module.pageName}</h3>
            <span className="text-xs px-1.5 py-0.5 rounded font-medium" style={{ background: LC.bgWarm, color: LC.textMuted }}>
              {module.pagePath}
            </span>
          </div>
          <p className="text-[11px] text-lc-text-secondary">{module.description}</p>
        </div>
        <div className="text-right">
          <div className="text-xs text-lc-text-muted mb-0.5">健康度</div>
          <div
            className="text-lg font-bold font-mono-num"
            style={{ color: healthScore >= 80 ? LC.success : healthScore >= 50 ? LC.warning : LC.danger }}
          >
            {healthScore}
          </div>
        </div>
      </div>

      {/* Endpoints */}
      <div>
        <h4 className="text-[11px] font-semibold text-lc-text-secondary mb-2 flex items-center gap-1">
          <Link2 size={11} /> API端点 ({endpoints.length})
        </h4>
        <div className="space-y-2">
          {endpoints.map(ep => (
            <div key={ep.endpointId} className="rounded-lg border p-2.5" style={{ borderColor: LC.border }}>
              <div className="flex items-center justify-between mb-1.5">
                <code className="text-xs font-mono bg-lc-bg-warm px-1.5 py-0.5 rounded text-lc-primary">
                  {ep.fullPath}
                </code>
                {ep.isFallbackToMock && (
                  <span className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: LC.dangerLight, color: LC.danger }}>
                    Mock回退
                  </span>
                )}
              </div>
              <p className="text-xs text-lc-text-muted mb-1.5">{ep.description}</p>
              <div className="flex flex-wrap gap-1.5">
                {ep.entities.map(ent => (
                  <span
                    key={ent.entityId}
                    className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1"
                    style={{ background: `${layerColors[ent.layer] ?? LC.primary}12`, color: layerColors[ent.layer] ?? LC.primary }}
                  >
                    <Database size={8} />
                    {ent.entityName}
                    <span className="opacity-60">({ent.layer})</span>
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Gaps */}
      {gaps.length > 0 && (
        <div>
          <h4 className="text-[11px] font-semibold text-lc-text-secondary mb-2 flex items-center gap-1">
            <AlertCircle size={11} /> 数据缺口 ({gaps.length})
          </h4>
          <div className="space-y-2">
            {gaps.map(gap => {
              const sev = severityConfig[gap.severity];
              return (
                <div
                  key={gap.gapId}
                  className="rounded-lg p-2.5 border cursor-pointer transition-all hover:shadow-lc-hover"
                  style={{ borderColor: sev.color, background: sev.bg }}
                  onClick={() => onGapClick?.(gap.gapId)}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[9px] px-1.5 py-0.5 rounded font-bold" style={{ background: sev.color + '20', color: sev.color }}>
                        {sev.label}
                      </span>
                      <span className="text-xs font-medium text-lc-text-primary">{gap.gapId}</span>
                    </div>
                    {gap.calcModelName && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-1" style={{ background: LC.primary + '15', color: LC.primary }}>
                        <Zap size={8} />
                        {gap.calcModelName}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-lc-text-secondary mb-1">{gap.description}</p>
                  <div className="text-[9px] text-lc-text-muted mb-1">
                    <strong>影响:</strong> {gap.impact}
                  </div>
                  <div className="text-[9px]" style={{ color: LC.primary }}>
                    <strong>建议:</strong> {gap.recommendation}
                  </div>
                  {gap.calcMethod && (
                    <div className="mt-1.5 p-1.5 rounded bg-white/50 text-[9px] text-lc-text-secondary">
                      <strong>测算方法:</strong> {gap.calcMethod}
                      {gap.calcConfidence && (
                        <span className="ml-2" style={{ color: gap.calcConfidence >= 0.7 ? LC.success : gap.calcConfidence >= 0.5 ? LC.warning : LC.danger }}>
                          可信度: {Math.round(gap.calcConfidence * 100)}%
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
