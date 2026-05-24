import { useState } from 'react';
import { AlertCircle, ArrowLeft, Check, ExternalLink, Search, Zap, Calculator } from 'lucide-react';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';

interface GapDetail {
  gapId: string;
  gapType: string;
  severity: 'critical' | 'warning' | 'info';
  description: string;
  impact: string;
  recommendation: string;
  calcMethod?: string;
  calcModelName?: string;
  calcModelFormula?: string;
  calcConfidence?: number;
  moduleName: string;
  entityName?: string;
  externalSources?: { name: string; url: string; reliability: number }[];
}

export default function GapDetailPanel({
  gap,
  onBack,
}: {
  gap?: GapDetail;
  onBack: () => void;
}) {
  const [activeTab, setActiveTab] = useState<'overview' | 'search' | 'calc'>('overview');

  const { data: searchResults, isLoading: searching } = trpc.dataLineage.searchExternalSources.useQuery(
    { gapId: gap?.gapId ?? '' },
    { enabled: activeTab === 'search' && !!gap?.gapId }
  );

  if (!gap) return null;

  const severityConfig = {
    critical: { color: LC.danger, bg: LC.dangerLight, label: '严重缺口' },
    warning: { color: LC.warning, bg: LC.warningLight, label: '警告缺口' },
    info: { color: LC.teal, bg: `${LC.teal}15`, label: '提示缺口' },
  };
  const sev = severityConfig[gap.severity];

  return (
    <div className="space-y-3">
      <button
        onClick={onBack}
        className="flex items-center gap-1 text-[11px] text-lc-text-muted hover:text-lc-primary transition-colors"
      >
        <ArrowLeft size={12} /> 返回模块详情
      </button>

      <div className="rounded-lg p-3 border" style={{ borderColor: sev.color, background: sev.bg }}>
        <div className="flex items-center gap-2 mb-2">
          <AlertCircle size={14} style={{ color: sev.color }} />
          <span className="text-xs px-1.5 py-0.5 rounded font-bold" style={{ background: sev.color + '20', color: sev.color }}>
            {sev.label}
          </span>
          <span className="text-xs text-lc-text-muted">{gap.gapId}</span>
        </div>
        <h3 className="text-sm font-semibold text-lc-text-primary mb-1">{gap.description}</h3>
        <p className="text-xs text-lc-text-secondary">
          <strong>模块:</strong> {gap.moduleName} {gap.entityName ? `· ${gap.entityName}` : ''}
        </p>
      </div>

      <div className="flex gap-4 border-b border-lc-border">
        {[
          { key: 'overview' as const, label: '缺口详情', icon: AlertCircle },
          { key: 'search' as const, label: '深度搜索补全', icon: Search },
          { key: 'calc' as const, label: '测算模型', icon: Calculator },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key)}
            className="flex items-center gap-1 pb-2 text-[11px] font-medium transition-all border-b-2"
            style={activeTab === t.key ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}
          >
            <t.icon size={11} />{t.label}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="space-y-3">
          <div className="rounded-lg p-3 bg-lc-bg-warm">
            <h4 className="text-[11px] font-semibold text-lc-text-secondary mb-1">影响分析</h4>
            <p className="text-xs text-lc-text-primary leading-relaxed">{gap.impact}</p>
          </div>
          <div className="rounded-lg p-3 bg-lc-bg-warm">
            <h4 className="text-[11px] font-semibold text-lc-text-secondary mb-1">修复建议</h4>
            <p className="text-xs text-lc-primary leading-relaxed">{gap.recommendation}</p>
          </div>
          {gap.calcMethod && (
            <div className="rounded-lg p-3 border" style={{ borderColor: LC.primary }}>
              <h4 className="text-[11px] font-semibold text-lc-primary mb-1 flex items-center gap-1">
                <Zap size={11} /> 推荐测算方法
              </h4>
              <p className="text-xs text-lc-text-secondary leading-relaxed">{gap.calcMethod}</p>
              {gap.calcConfidence && (
                <div className="mt-1.5 text-xs font-medium" style={{ color: gap.calcConfidence >= 0.7 ? LC.success : gap.calcConfidence >= 0.5 ? LC.warning : LC.danger }}>
                  测算可信度: {Math.round(gap.calcConfidence * 100)}%
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="space-y-3">
          <p className="text-xs text-lc-text-muted">
            基于缺口特征，系统已通过网络深度搜索识别以下可补全数据源：
          </p>
          {searching ? (
            <div className="flex items-center gap-2 py-4 text-xs text-lc-text-muted">
              <div className="w-3 h-3 border-2 border-lc-primary border-t-transparent rounded-full animate-spin" />
              正在搜索外部数据源...
            </div>
          ) : searchResults?.searchResults && searchResults.searchResults.length > 0 ? (
            <div className="space-y-2">
              {searchResults.searchResults.map((src, i) => (
                <div key={i} className="rounded-lg border p-2.5" style={{ borderColor: LC.border }}>
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-lc-text-primary">{src.name}</span>
                      <span className="text-[9px] px-1 py-0.5 rounded" style={{ background: `${LC.success}15`, color: LC.success }}>
                        可信度 {Math.round(src.reliability * 100)}%
                      </span>
                    </div>
                    <a href={src.url} target="_blank" rel="noopener noreferrer" className="text-lc-primary hover:opacity-70">
                      <ExternalLink size={11} />
                    </a>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-[9px] text-lc-text-muted">
                    <div>
                      <span className="text-lc-text-secondary">预估成本:</span> ${src.estimatedCost}/月
                    </div>
                    <div>
                      <span className="text-lc-text-secondary">集成复杂度:</span>
                      <span style={{ color: src.integrationComplexity === '高' ? LC.danger : src.integrationComplexity === '中' ? LC.warning : LC.success }}>
                        {src.integrationComplexity}
                      </span>
                    </div>
                    <div>
                      <span className="text-lc-text-secondary">数据覆盖:</span> {src.dataCoverage}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-1.5">
                    {src.apiAvailability && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: `${LC.success}12`, color: LC.success }}><Check size={9} /> API可用</span>
                    )}
                    {src.sampleDataAvailable && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded flex items-center gap-0.5" style={{ background: `${LC.teal}12`, color: LC.teal }}><Check size={9} /> 样例数据</span>
                    )}
                  </div>
                </div>
              ))}
              <div className="rounded-lg p-2.5 bg-lc-bg-warm text-xs text-lc-primary font-medium">
                {searchResults.recommendation}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-lc-text-muted">
              未找到匹配的预配置外部数据源，建议通过内部采集或定制化爬虫补全
            </div>
          )}
        </div>
      )}

      {activeTab === 'calc' && (
        <div className="space-y-3">
          {gap.calcModelName ? (
            <>
              <div className="rounded-lg p-3 border" style={{ borderColor: LC.primary }}>
                <h4 className="text-[11px] font-semibold text-lc-primary mb-1">{gap.calcModelName}</h4>
                {gap.calcModelFormula && (
                  <code className="block text-xs font-mono bg-lc-bg-warm p-2 rounded mb-2 text-lc-text-secondary">
                    {gap.calcModelFormula}
                  </code>
                )}
                <p className="text-xs text-lc-text-muted">
                  该测算模型基于咨询机构验证的方法论，可在数据缺口场景下提供可靠的估算值。
                </p>
              </div>
              <div className="rounded-lg p-3 bg-lc-bg-warm">
                <h4 className="text-[11px] font-semibold text-lc-text-secondary mb-1">模型说明</h4>
                <p className="text-xs text-lc-text-primary leading-relaxed">
                  当直接数据源不可用时，系统可通过相关可验证数据进行测算补全。
                  测算方法结合咨询机构经验证的测算模型和算法，确保结果具有业务参考价值。
                </p>
              </div>
            </>
          ) : (
            <div className="py-6 text-center text-xs text-lc-text-muted">
              该缺口暂无关联测算模型，建议优先通过外部数据源补全
            </div>
          )}
        </div>
      )}
    </div>
  );
}
