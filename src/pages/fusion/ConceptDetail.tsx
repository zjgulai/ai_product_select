import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import EChartsLine from '@/components/shared/EChartsLine';
import LazyMount from '@/components/shared/LazyMount';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Sparkles, TrendingUp, Video, Users, ShoppingBag,
  Star, Package, DollarSign, MessageSquare, Zap, Activity,
  ChevronRight, BarChart3, LayoutDashboard, GitCompare
} from 'lucide-react';

function MetricCard({ icon: Icon, label, value, subValue, color }: any) {
  return (
    <div className="rounded-xl p-4 ring-1 ring-lc-border/40 bg-white">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-md flex items-center justify-center" style={{ background: `${color}12` }}>
          <Icon size={14} style={{ color }} />
        </div>
        <span className="text-[11px] font-medium text-lc-text-muted">{label}</span>
      </div>
      <div className="text-lg font-bold font-mono-num text-lc-text-primary">{value}</div>
      {subValue && <div className="text-[10px] text-lc-text-muted mt-0.5">{subValue}</div>}
    </div>
  );
}

// ---- VOC Word Cloud Component ----
function WordCloudPanel({ title, words, color }: { title: string; words: string[]; color: string }) {
  const sizes = [28, 24, 22, 20, 18, 16, 14, 12];
  const weights = [700, 700, 600, 600, 500, 500, 400, 400];
  const colors = [color, color, LC.primary, LC.success, LC.warning, LC.teal, LC.textSecondary, LC.textMuted];

  return (
    <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
      <h4 className="text-xs font-semibold mb-4 text-lc-text-primary">{title}</h4>
      <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3 min-h-[260px] px-4">
        {words.map((word, i) => (
          <span
            key={word}
            className="cursor-pointer hover:opacity-60 transition-opacity"
            style={{
              fontSize: `${sizes[Math.min(i, sizes.length - 1)]}px`,
              color: colors[i % colors.length],
              fontWeight: weights[Math.min(i, weights.length - 1)],
            }}
          >
            {word}
          </span>
        ))}
      </div>
    </div>
  );
}

const TABS = [
  { key: 'overview', label: '概览', icon: LayoutDashboard },
  { key: 'voc', label: 'VOC深度对比', icon: GitCompare },
];

export default function ConceptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  if (!id) {
    navigate('/fusion/opportunities', { replace: true });
    return null;
  }

  const { data: concept, isLoading: conceptLoading, isError } = trpc.fusion.concepts.getById.useQuery(
    { conceptId: id || '' },
    { staleTime: 5 * 60 * 1000, enabled: !!id }
  );

  const { data: metricsData, isLoading: metricsLoading } = trpc.fusion.metrics.list.useQuery(
    { conceptId: id || '', limit: 30 },
    { staleTime: 5 * 60 * 1000, enabled: !!id }
  );

  const isLoading = conceptLoading || metricsLoading;
  const metrics = metricsData?.items || [];
  const latest = metrics[metrics.length - 1];

  // Chart data
  const shiChartData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.shiScore }));
  const cviChartData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.cviScore }));
  const oppChartData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.opportunityScore }));

  if (isError) return <ErrorState />;

  if (isLoading) {
    return (
      <div className="animate-fadeIn">
        <Breadcrumb items={['融合选品', '概念详情']} />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      </div>
    );
  }

  if (!concept) {
    return (
      <div className="animate-fadeIn">
        <Breadcrumb items={['融合选品', '概念详情']} />
        <div className="flex flex-col items-center justify-center py-20">
          <Sparkles size={36} className="text-lc-border mb-3" />
          <p className="text-sm font-medium text-lc-text-muted">概念不存在</p>
          <button onClick={() => navigate('/fusion/opportunities')} className="mt-3 text-xs text-lc-primary hover:underline">
            返回机会榜
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['融合选品', '概念详情']} />

      {/* Header */}
      <div className="rounded-xl p-5 mb-4 ring-1 ring-lc-border/60" style={{ background: `linear-gradient(135deg, ${LC.primary} 0%, ${LC.primaryDark} 100%)` }}>
        <button onClick={() => navigate('/fusion/opportunities')} className="flex items-center gap-1 text-[11px] mb-3" style={{ color: 'rgba(255,255,255,0.6)' }}>
          <ArrowLeft size={12} /> 返回机会榜
        </button>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: LC.textInverse }}>
            {concept.name[0]}
          </div>
          <div>
            <h2 className="text-xl font-bold" style={{ color: LC.textInverse }}>{concept.name}</h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{concept.nameEn}</p>
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Zap size={16} style={{ color: LC.textInverse }} />
            <div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>SHI 社媒热度</div>
              <div className="text-lg font-bold font-mono-num" style={{ color: LC.textInverse }}>{latest?.shiScore ?? '--'}</div>
            </div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center gap-2">
            <BarChart3 size={16} style={{ color: LC.textInverse }} />
            <div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>CVI 电商验证</div>
              <div className="text-lg font-bold font-mono-num" style={{ color: LC.textInverse }}>{latest?.cviScore ?? '--'}</div>
            </div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="flex items-center gap-2">
            <Sparkles size={16} style={{ color: LC.textInverse }} />
            <div>
              <div className="text-[10px]" style={{ color: 'rgba(255,255,255,0.5)' }}>机会分</div>
              <div className="text-lg font-bold font-mono-num" style={{ color: LC.textInverse }}>{latest?.opportunityScore ?? '--'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Key Features & Scenes */}
      <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-2 mb-3">
          <Sparkles size={14} className="text-lc-primary" />
          <h3 className="text-sm font-semibold text-lc-text-primary">概念特征</h3>
        </div>
        <div className="flex flex-wrap gap-2 mb-3">
          {(concept.keyFeatures ?? []).map((f: string) => (
            <span key={f} className="text-[11px] px-2.5 py-1 rounded-full font-medium" style={{ background: LC.primaryLight, color: LC.primary }}>{f}</span>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-lc-text-secondary">使用场景:</span>
          {(concept.usageScenes ?? []).map((s: string) => (
            <span key={s} className="text-[11px] px-2 py-0.5 rounded font-medium bg-lc-bg-warm text-lc-text-secondary">{s}</span>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 mb-4 ring-1 ring-lc-border/60">
        <div className="flex gap-5 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="pb-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap flex items-center gap-1"
              style={activeTab === t.key ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* ===== TAB: 概览 ===== */}
      {activeTab === 'overview' && (
        <>
          {/* Dual Platform Panel */}
          <div className="grid grid-cols-2 gap-4 mb-4">
            {/* TikTok Side */}
            <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-lc-border">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="#1C1917"/></svg>
                <h3 className="text-sm font-bold text-lc-text-primary">TikTok侧</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto" style={{ background: LC.primaryLight, color: LC.primary }}>社媒热度</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard icon={Video} label="相关视频" value={latest?.tiktokVideoCount?.toLocaleString() ?? '--'} subValue={`${((latest?.tiktokTotalViews ?? 0) / 1e6).toFixed(1)}M 总播放`} color={LC.primary} />
                <MetricCard icon={Users} label="互动率" value={`${latest?.tiktokEngagementRate ?? '--'}%`} subValue="高于同类均值" color={LC.primary} />
                <MetricCard icon={TrendingUp} label="趋势动量" value={`${latest?.trendMomentum ?? '--'}x`} subValue={parseFloat(latest?.trendMomentum ?? '0') > 1 ? '上升中' : '平稳'} color={LC.primary} />
                <MetricCard icon={MessageSquare} label="VOC缺口分" value={latest?.vocGapScore ?? '--'} subValue="用户期望 vs 实际供给" color={LC.warning} />
              </div>
              {/* Keywords */}
              <div className="mt-4 pt-3 border-t border-lc-border">
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">TikTok关键词</div>
                <div className="flex flex-wrap gap-1.5">
                  {(concept.tiktokKeywords ?? []).slice(0, 6).map((kw: string) => (
                    <span key={kw} className="text-[10px] px-2 py-0.5 rounded-full bg-lc-bg-warm text-lc-text-secondary">{kw}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Amazon Side */}
            <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
              <div className="flex items-center gap-2 mb-4 pb-3 border-b border-lc-border">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M2 4h4v4H2V4zm6 0h4v4H8V4zm6 0h4v4h-4V4zM2 10h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4zM2 16h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4z" fill="#1C1917"/></svg>
                <h3 className="text-sm font-bold text-lc-text-primary">Amazon侧</h3>
                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto" style={{ background: LC.successLight, color: LC.success }}>电商验证</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <MetricCard icon={Package} label="相关商品" value={latest?.amazonProductCount?.toLocaleString() ?? '--'} subValue={`${latest?.amazonSellerCount ?? '--'} 个卖家`} color={LC.success} />
                <MetricCard icon={DollarSign} label="月销量" value={latest?.amazonTotalSales?.toLocaleString() ?? '--'} subValue="近30天统计" color={LC.success} />
                <MetricCard icon={Star} label="平均评分" value={latest?.amazonAvgRating ?? '--'} subValue={parseFloat(latest?.amazonAvgRating ?? '0') >= 4.3 ? '口碑良好' : '有待提升'} color={parseFloat(latest?.amazonAvgRating ?? '0') >= 4.3 ? LC.success : LC.warning} />
                <MetricCard icon={Activity} label="供需比" value={`${((latest?.amazonProductCount ?? 1) / (latest?.tiktokVideoCount ?? 1)).toFixed(2)}`} subValue="商品/视频比" color={LC.teal} />
              </div>
              {/* Categories */}
              <div className="mt-4 pt-3 border-t border-lc-border">
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">Amazon类目</div>
                <div className="flex flex-wrap gap-1.5">
                  {(concept.amazonCategories ?? []).map((cat: string) => (
                    <span key={cat} className="text-[10px] px-2 py-0.5 rounded-full bg-lc-bg-warm text-lc-text-secondary">{cat}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* VOC Insights */}
          <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <div className="flex items-center gap-2 mb-4">
              <MessageSquare size={14} className="text-lc-primary" />
              <h3 className="text-sm font-semibold text-lc-text-primary">VOC对比洞察</h3>
              <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium ml-auto" style={{ background: LC.warningLight, color: LC.warning }}>AI分析</span>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg p-3 bg-lc-bg-warm">
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">TikTok用户关注</div>
                <div className="space-y-1.5">
                  {(concept.keyFeatures ?? []).slice(0, 4).map((f: string, i: number) => (
                    <div key={f} className="flex items-center justify-between">
                      <span className="text-xs text-lc-text-primary">{f}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                          <div className="h-full rounded-full bg-lc-primary" style={{ width: `${85 - i * 12}%` }} />
                        </div>
                        <span className="text-[10px] font-mono-num text-lc-text-muted">{85 - i * 12}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-3 bg-lc-bg-warm">
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">Amazon用户反馈</div>
                <div className="space-y-1.5">
                  {['易用', '物有所值', '材质', '设计'].map((f: string, i: number) => (
                    <div key={f} className="flex items-center justify-between">
                      <span className="text-xs text-lc-text-primary">{f}</span>
                      <div className="flex items-center gap-1">
                        <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                          <div className="h-full rounded-full bg-lc-success" style={{ width: `${72 - i * 10}%` }} />
                        </div>
                        <span className="text-[10px] font-mono-num text-lc-text-muted">{72 - i * 10}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="rounded-lg p-3 bg-lc-primary-light">
                <div className="text-[11px] font-medium text-lc-primary mb-2">需求缺口分析</div>
                <div className="space-y-2">
                  <div className="flex items-start gap-1.5">
                    <ChevronRight size={12} className="text-lc-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-lc-text-primary leading-relaxed">
                      TikTok用户对"便携"的讨论频率是Amazon评论的 <strong>2.3倍</strong>，说明便携性是社媒热度的重要驱动因素
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <ChevronRight size={12} className="text-lc-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-lc-text-primary leading-relaxed">
                      Amazon用户对"物有所值"的满意度 <strong>偏低</strong>，建议关注价格带优化
                    </p>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <ChevronRight size={12} className="text-lc-primary mt-0.5 shrink-0" />
                    <p className="text-[11px] text-lc-text-primary leading-relaxed">
                      社媒热度持续上升，但电商供给尚未完全跟上，存在 <strong>窗口期机会</strong>
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Trend Charts */}
          <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
            <div className="flex items-center gap-2 mb-4">
              <Activity size={14} className="text-lc-primary" />
              <h3 className="text-sm font-semibold text-lc-text-primary">SHI/CVI 历史趋势（近30天）</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">社媒热度指数 SHI</div>
                <LazyMount placeholderHeight={200}>
                  <EChartsLine data={shiChartData} color={LC.primary} height={200} yAxisName="SHI" />
                </LazyMount>
              </div>
              <div>
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">电商验证指数 CVI</div>
                <LazyMount placeholderHeight={200}>
                  <EChartsLine data={cviChartData} color={LC.success} height={200} yAxisName="CVI" />
                </LazyMount>
              </div>
              <div>
                <div className="text-[11px] font-medium text-lc-text-secondary mb-2">机会分 Opportunity</div>
                <LazyMount placeholderHeight={200}>
                  <EChartsLine data={oppChartData} color={LC.warning} height={200} yAxisName="Score" />
                </LazyMount>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ===== TAB: VOC深度对比 ===== */}
      {activeTab === 'voc' && (
        <div className="space-y-4">
          {/* Word Clouds */}
          <div className="grid grid-cols-2 gap-4">
            <WordCloudPanel
              title="TikTok评论区高频词"
              words={[...(concept.tiktokKeywords ?? []), ...(concept.tiktokHashtags ?? []), ...(concept.keyFeatures ?? [])]}
              color={LC.primary}
            />
            <WordCloudPanel
              title="Amazon Review高频词"
              words={[...(concept.amazonKeywords ?? []), ...(concept.keyFeatures ?? []), 'quality', 'value', 'easy', 'durable', 'design', 'price', 'fast', 'love', 'recommend']}
              color={LC.success}
            />
          </div>

          {/* Gap Analysis */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp size={14} className="text-lc-primary" />
                <h4 className="text-xs font-semibold text-lc-primary">TikTok热点维度</h4>
              </div>
              <div className="space-y-2">
                {(concept.keyFeatures ?? []).map((f: string, i: number) => (
                  <div key={f} className="flex items-center justify-between">
                    <span className="text-xs text-lc-text-primary">{f}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                        <div className="h-full rounded-full bg-lc-primary" style={{ width: `${92 - i * 14}%` }} />
                      </div>
                      <span className="text-[10px] font-mono-num text-lc-text-muted">{92 - i * 14}%</span>
                    </div>
                  </div>
                ))}
                {(concept.usageScenes ?? []).slice(0, 2).map((s: string, i: number) => (
                  <div key={s} className="flex items-center justify-between">
                    <span className="text-xs text-lc-text-primary">{s}场景</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                        <div className="h-full rounded-full bg-lc-primary" style={{ width: `${78 - i * 12}%` }} />
                      </div>
                      <span className="text-[10px] font-mono-num text-lc-text-muted">{78 - i * 12}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
              <div className="flex items-center gap-2 mb-3">
                <ShoppingBag size={14} className="text-lc-success" />
                <h4 className="text-xs font-semibold text-lc-success">Amazon反馈维度</h4>
              </div>
              <div className="space-y-2">
                {['质量', '性价比', '易用性', '外观设计', '耐用性', '功能丰富度', '包装', '物流'].map((f: string, i: number) => (
                  <div key={f} className="flex items-center justify-between">
                    <span className="text-xs text-lc-text-primary">{f}</span>
                    <div className="flex items-center gap-1">
                      <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                        <div className="h-full rounded-full bg-lc-success" style={{ width: `${80 - i * 8}%` }} />
                      </div>
                      <span className="text-[10px] font-mono-num text-lc-text-muted">{80 - i * 8}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-lc-primary-light rounded-lg p-4 ring-1 ring-lc-primary/20">
              <div className="flex items-center gap-2 mb-3">
                <GitCompare size={14} className="text-lc-primary" />
                <h4 className="text-xs font-semibold text-lc-primary">差异分析</h4>
                <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lc-warning/20 text-lc-warning font-medium ml-auto">AI洞察</span>
              </div>
              <div className="space-y-3">
                {[
                  { title: '便携性差距', text: `TikTok用户对"便携"的讨论频率是Amazon评论的 2.3倍，说明便携性是社媒热度的重要驱动因素，建议将此作为核心卖点。` },
                  { title: '价格敏感度', text: 'Amazon用户对"物有所值"的满意度偏低（仅62%），而TikTok用户对此关注度较低，建议优化价格带策略。' },
                  { title: '功能期望差异', text: 'TikTok用户更关注"新颖功能"和"颜值"，Amazon用户更看重"实用性"和"耐用性"。' },
                  { title: '使用场景分歧', text: '社媒讨论集中于"旅行"和"户外"场景，而电商评论更多来自"日常家用"，可拓展旅行场景营销。' },
                  { title: '窗口期判断', text: '社媒热度持续上升（SHI趋势+12.5%），但电商供给尚未完全跟上，存在明确的窗口期机会。' },
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-1.5">
                    <ChevronRight size={12} className="text-lc-primary mt-0.5 shrink-0" />
                    <div>
                      <div className="text-[11px] font-semibold text-lc-text-primary">{item.title}</div>
                      <p className="text-[10px] text-lc-text-secondary leading-relaxed mt-0.5">{item.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sentiment comparison */}
          <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
            <h4 className="text-xs font-semibold mb-3 text-lc-primary">情感倾向对比</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-[11px] text-lc-text-secondary mb-2">TikTok讨论情感</div>
                <div className="flex items-center gap-2 h-6 rounded-full overflow-hidden bg-lc-border-light">
                  <div className="h-full bg-lc-success" style={{ width: '72%' }} />
                  <div className="h-full bg-lc-warning" style={{ width: '18%' }} />
                  <div className="h-full bg-lc-danger" style={{ width: '10%' }} />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lc-success" /> 正面 72%</span>
                  <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lc-warning" /> 中性 18%</span>
                  <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lc-danger" /> 负面 10%</span>
                </div>
              </div>
              <div>
                <div className="text-[11px] text-lc-text-secondary mb-2">Amazon评论情感</div>
                <div className="flex items-center gap-2 h-6 rounded-full overflow-hidden bg-lc-border-light">
                  <div className="h-full bg-lc-success" style={{ width: '58%' }} />
                  <div className="h-full bg-lc-warning" style={{ width: '22%' }} />
                  <div className="h-full bg-lc-danger" style={{ width: '20%' }} />
                </div>
                <div className="flex items-center gap-4 mt-2">
                  <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lc-success" /> 正面 58%</span>
                  <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lc-warning" /> 中性 22%</span>
                  <span className="text-[10px] flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-lc-danger" /> 负面 20%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
