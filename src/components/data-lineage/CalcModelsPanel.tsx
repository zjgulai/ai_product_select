import { useState } from 'react';
import { BarChart3, BookOpen, ChevronDown, ChevronRight, Zap, Info } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

interface CalcModel {
  modelId: string;
  modelName: string;
  modelType: string;
  description: string;
  formula: string;
  inputs: { name: string; source: string; required: boolean }[];
  output: string;
  confidence: number;
  verifiedBy?: string;
  referenceUrl?: string;
  industryStandard?: string;
}

export default function CalcModelsPanel({ models, loading }: {
  models?: CalcModel[];
  loading: boolean;
}) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (loading || !models) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-lg bg-lc-bg-warm animate-pulse" />
        ))}
      </div>
    );
  }

  const modelTypeLabels: Record<string, string> = {
    regression: '回归模型',
    index_composite: '复合指数',
    market_sizing: '市场规模',
    sentiment_analysis: '情感分析',
    trend_forecast: '趋势预测',
  };

  const modelTypeColors: Record<string, string> = {
    regression: '#6366F1',
    index_composite: '#0891B2',
    market_sizing: '#059669',
    sentiment_analysis: '#D97706',
    trend_forecast: '#7C3AED',
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-lc-primary flex items-center gap-1.5">
          <BarChart3 size={14} /> 测算模型库
        </h3>
        <span className="text-xs text-lc-text-muted">共 {models.length} 个模型</span>
      </div>

      <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
        {models.map(model => {
          const isExpanded = expandedId === model.modelId;
          return (
            <div
              key={model.modelId}
              className="rounded-lg border transition-all"
              style={{ borderColor: isExpanded ? LC.primary : LC.border }}
            >
              <button
                onClick={() => setExpandedId(isExpanded ? null : model.modelId)}
                className="w-full text-left p-3 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span
                    className="text-[9px] px-1.5 py-0.5 rounded font-bold"
                    style={{
                      background: `${modelTypeColors[model.modelType] ?? LC.primary}15`,
                      color: modelTypeColors[model.modelType] ?? LC.primary,
                    }}
                  >
                    {modelTypeLabels[model.modelType] ?? model.modelType}
                  </span>
                  <span className="text-xs font-semibold text-lc-text-primary">{model.modelName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className="text-xs font-mono-num font-medium"
                    style={{ color: model.confidence >= 0.8 ? LC.success : model.confidence >= 0.6 ? LC.warning : LC.danger }}
                  >
                    {Math.round(model.confidence * 100)}%
                  </span>
                  {isExpanded ? <ChevronDown size={12} className="text-lc-text-muted" /> : <ChevronRight size={12} className="text-lc-text-muted" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-3 pb-3 space-y-2.5">
                  <p className="text-xs text-lc-text-secondary leading-relaxed">{model.description}</p>

                  <div className="rounded-lg bg-lc-bg-warm p-2">
                    <div className="flex items-center gap-1 mb-1">
                      <Zap size={10} className="text-lc-primary" />
                      <span className="text-[9px] font-semibold text-lc-text-secondary">公式</span>
                    </div>
                    <code className="text-[9px] font-mono text-lc-primary block whitespace-pre-wrap break-all">
                      {model.formula}
                    </code>
                  </div>

                  <div>
                    <div className="flex items-center gap-1 mb-1">
                      <Info size={10} className="text-lc-text-muted" />
                      <span className="text-[9px] font-semibold text-lc-text-secondary">输入参数</span>
                    </div>
                    <div className="space-y-1">
                      {model.inputs.map((input, i) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                          <span className="text-lc-text-primary">{input.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lc-text-muted">{input.source}</span>
                            {input.required && (
                              <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: LC.dangerLight, color: LC.danger }}>
                                必填
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-lc-text-muted">输出: <span className="text-lc-text-primary">{model.output}</span></span>
                    <span className="text-lc-text-muted">可信度: <span className="font-medium" style={{ color: model.confidence >= 0.8 ? LC.success : model.confidence >= 0.6 ? LC.warning : LC.danger }}>{Math.round(model.confidence * 100)}%</span></span>
                  </div>

                  {model.verifiedBy && (
                    <div className="flex items-center gap-1 text-[9px] text-lc-text-muted">
                      <BookOpen size={9} />
                      验证机构: <span className="text-lc-text-secondary">{model.verifiedBy}</span>
                    </div>
                  )}
                  {model.industryStandard && (
                    <div className="text-[9px] text-lc-text-muted">
                      行业标准: <span className="text-lc-text-secondary">{model.industryStandard}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
