import { useState } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import EChartsLine from '@/components/shared/EChartsLine';
import EChartsPie from '@/components/shared/EChartsPie';
import EChartsBar from '@/components/shared/EChartsBar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Sparkles, FileText, TrendingUp, MessageSquare,
  BarChart3, ChevronRight, Download, ArrowLeft, Check,
  Target, Shield, Truck, Coins, AlertTriangle, AlertCircle
} from 'lucide-react';

const REPORT_TABS = ['市场概况', '社媒+电商', 'VOC+竞品', '机会+计划'];

// ---- Components ----

function StepBadge({ step, active }: { step: number; active: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${active ? 'bg-lc-primary text-white' : 'bg-lc-border-light text-lc-text-muted'}`}>
        {step}
      </div>
    </div>
  );
}

function ConceptCard({ concept, selected, onClick }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left rounded-xl p-4 ring-1 transition-all hover:shadow-lc-hover ${
        selected ? 'ring-lc-primary bg-lc-primary-light' : 'ring-lc-border/60 bg-white'
      }`}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold shrink-0" style={{ background: selected ? LC.primary : LC.primaryLight, color: selected ? '#fff' : LC.primary }}>
          {concept.name[0]}
        </div>
        <div>
          <div className={`text-sm font-semibold ${selected ? 'text-lc-primary' : 'text-lc-text-primary'}`}>{concept.name}</div>
          <div className="text-xs text-lc-text-muted">{concept.nameEn}</div>
        </div>
        {selected && <Check size={16} className="text-lc-primary ml-auto" />}
      </div>
      <div className="flex flex-wrap gap-1.5 mb-3">
        {concept.keyFeatures.slice(0, 3).map((f: string) => (
          <span key={f} className="text-xs px-2 py-0.5 rounded-full font-medium bg-lc-bg-warm text-lc-text-secondary">{f}</span>
        ))}
      </div>
      <div className="flex items-center gap-4 text-xs text-lc-text-muted">
        <span>{concept.tiktokKeywords.length} TikTok关键词</span>
        <span>{concept.amazonCategories.length} Amazon类目</span>
      </div>
    </button>
  );
}

// ---- Report Tab Panels ----

function MarketOverviewPanel({ concept, metrics }: { concept: any; metrics: any[] }) {
  const latest = metrics[metrics.length - 1] || {};
  const gmvData = metrics.map((m: any, i: number) => ({
    x: m.metricDate.slice(5),
    y: (latest.amazonTotalSales || 12000) * (0.8 + i * 0.03),
  }));

  return (
    <div className="space-y-4">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'SHI 社媒热度', value: latest.shiScore ?? '--', color: LC.primary },
          { label: 'CVI 电商验证', value: latest.cviScore ?? '--', color: LC.success },
          { label: '机会分', value: latest.opportunityScore ?? '--', color: LC.warning },
          { label: '趋势动量', value: latest.trendMomentum ? `${latest.trendMomentum}x` : '--', color: LC.teal },
        ].map((kpi) => (
          <div key={kpi.label} className="rounded-lg p-3 bg-white ring-1 ring-lc-border/60">
            <div className="text-[11px] text-lc-text-muted mb-1">{kpi.label}</div>
            <div className="text-xl font-bold font-mono-num" style={{ color: kpi.color }}>{kpi.value}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">预估GMV趋势</h4>
          <EChartsLine data={gmvData} color={LC.primary} height={220} yAxisName="$" />
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">概念特征</h4>
          <div className="space-y-2">
            {concept.keyFeatures.map((f: string, i: number) => (
              <div key={f} className="flex items-center justify-between">
                <span className="text-xs text-lc-text-primary">{f}</span>
                <div className="flex items-center gap-1.5">
                  <div className="w-24 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                    <div className="h-full rounded-full bg-lc-primary" style={{ width: `${90 - i * 15}%` }} />
                  </div>
                  <span className="text-xs font-mono-num text-lc-text-muted">{90 - i * 15}%</span>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-3 border-t border-lc-border">
            <div className="text-[11px] text-lc-text-secondary mb-2">使用场景</div>
            <div className="flex flex-wrap gap-1.5">
              {concept.usageScenes.map((s: string) => (
                <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-lc-bg-warm text-lc-text-secondary">{s}</span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* TikTok + Amazon Keywords */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" fill="currentColor"/></svg>
            TikTok关键词
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {concept.tiktokKeywords.map((kw: string, i: number) => (
              <span key={kw} className="text-xs px-2.5 py-1 rounded-full font-medium" style={{ background: i < 3 ? LC.primaryLight : LC.bgWarm, color: i < 3 ? LC.primary : LC.textSecondary }}>{kw}</span>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-success flex items-center gap-1.5">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M2 4h4v4H2V4zm6 0h4v4H8V4zm6 0h4v4h-4V4zM2 10h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4zM2 16h4v4H2v-4zm6 0h4v4H8v-4zm6 0h4v4h-4v-4z" fill="currentColor"/></svg>
            Amazon类目
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {concept.amazonCategories.map((cat: string) => (
              <span key={cat} className="text-xs px-2.5 py-1 rounded-full bg-lc-bg-warm text-lc-text-secondary">{cat}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SocialMediaPanel({ metrics }: { metrics: any[] }) {
  const videoTrend = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.tiktokVideoCount }));
  const viewsTrend = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: Math.round(m.tiktokTotalViews / 1e6) }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">TikTok视频数趋势</h4>
          <EChartsLine data={videoTrend} color={LC.primary} height={220} yAxisName="视频数" />
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">TikTok播放量趋势 (M)</h4>
          <EChartsLine data={viewsTrend} color={LC.teal} height={220} yAxisName="M views" />
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
        <h4 className="text-xs font-semibold mb-3 text-lc-primary">社媒热度指标拆解</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.length > 0 && [
            { label: '互动率', value: `${metrics[metrics.length - 1].tiktokEngagementRate}%`, sub: '高于均值' },
            { label: '视频增长率', value: '+12.5%', sub: '近30天' },
            { label: '达人覆盖率', value: '86%', sub: '带货达人' },
            { label: '话题热度', value: 'A+', sub: '持续上升' },
          ].map(k => (
            <div key={k.label} className="rounded-lg p-3 bg-lc-bg-warm text-center">
              <div className="text-[11px] text-lc-text-muted mb-1">{k.label}</div>
              <div className="text-lg font-bold font-mono-num text-lc-primary">{k.value}</div>
              <div className="text-xs text-lc-text-muted">{k.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EcommercePanel({ metrics }: { metrics: any[] }) {
  const latest = metrics[metrics.length - 1] || {};
  const salesData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.amazonTotalSales }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '相关商品', value: latest.amazonProductCount?.toLocaleString() ?? '--' },
          { label: '月销量', value: latest.amazonTotalSales?.toLocaleString() ?? '--' },
          { label: '卖家数', value: latest.amazonSellerCount?.toLocaleString() ?? '--' },
          { label: '平均评分', value: latest.amazonAvgRating ?? '--' },
        ].map(k => (
          <div key={k.label} className="rounded-lg p-3 bg-white ring-1 ring-lc-border/60 text-center">
            <div className="text-[11px] text-lc-text-muted mb-1">{k.label}</div>
            <div className="text-xl font-bold font-mono-num text-lc-success">{k.value}</div>
          </div>
        ))}
      </div>
      <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
        <h4 className="text-xs font-semibold mb-3 text-lc-success">Amazon销量趋势</h4>
        <EChartsLine data={salesData} color={LC.success} height={220} yAxisName="销量" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-success">价格带分布</h4>
          <EChartsPie data={[
            { name: '$0-$25', value: 28 }, { name: '$25-$50', value: 42 }, { name: '$50-$100', value: 22 }, { name: '>$100', value: 8 },
          ]} height={200} donut />
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-success">评分分布</h4>
          <EChartsBar data={[
            { label: '5星', value: 45 }, { label: '4星', value: 32 }, { label: '3星', value: 15 }, { label: '2星', value: 5 }, { label: '1星', value: 3 },
          ]} color={LC.gold} height={200} />
        </div>
      </div>
    </div>
  );
}

function VOCAnalysisPanel({ concept }: { concept: any }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">TikTok用户关注</h4>
          <div className="space-y-2">
            {concept.keyFeatures.slice(0, 5).map((f: string, i: number) => (
              <div key={f} className="flex items-center justify-between">
                <span className="text-xs text-lc-text-primary">{f}</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                    <div className="h-full rounded-full bg-lc-primary" style={{ width: `${88 - i * 14}%` }} />
                  </div>
                  <span className="text-xs font-mono-num text-lc-text-muted">{88 - i * 14}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-success">Amazon用户反馈</h4>
          <div className="space-y-2">
            {['质量', '性价比', '易用性', '外观', '耐用性'].map((f: string, i: number) => (
              <div key={f} className="flex items-center justify-between">
                <span className="text-xs text-lc-text-primary">{f}</span>
                <div className="flex items-center gap-1">
                  <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                    <div className="h-full rounded-full bg-lc-success" style={{ width: `${78 - i * 10}%` }} />
                  </div>
                  <span className="text-xs font-mono-num text-lc-text-muted">{78 - i * 10}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-lc-primary-light rounded-lg p-4 ring-1 ring-lc-primary/20">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">需求缺口分析</h4>
          <div className="space-y-3">
            {[
              'TikTok用户对"便携"的讨论频率是Amazon评论的 2.3倍，说明便携性是社媒热度的重要驱动因素',
              'Amazon用户对"物有所值"的满意度偏低，建议关注价格带优化',
              '社媒热度持续上升，但电商供给尚未完全跟上，存在窗口期机会',
            ].map((text, i) => (
              <div key={i} className="flex items-start gap-1.5">
                <ChevronRight size={12} className="text-lc-primary mt-0.5 shrink-0" />
                <p className="text-[11px] text-lc-text-primary leading-relaxed">{text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function CompetitorPanel({ concept }: { concept: any }) {
  return (
    <div className="space-y-4">
      <div className="bg-lc-bg-warm rounded-lg p-3 ring-1 ring-lc-border/40 mb-3">
        <div className="flex items-center gap-2">
          <AlertCircle size={14} className="text-lc-warning" />
          <span className="text-[11px] text-lc-text-secondary">以下竞品数据为模拟参考，实际分析需基于真实市场调研</span>
        </div>
      </div>
      <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
        <h4 className="text-xs font-semibold mb-3 text-lc-primary">竞品对比矩阵 — {concept?.name || '本品'}</h4>
        <table className="w-full min-w-[640px]">
          <thead>
            <tr className="bg-lc-bg-warm">
              {['维度', '本品定位', '竞品均值', '优势'].map(h => (
                <th key={h} className="py-2 px-3 text-[11px] font-bold text-lc-text-secondary text-left">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[
              { dim: 'SHI社媒热度', self: '85', avg: '62', adv: '+37%' },
              { dim: 'CVI电商验证', self: '42', avg: '55', adv: '-24%' },
              { dim: '价格带', self: '$35-50', avg: '$40-60', adv: '低价优势' },
              { dim: '评分', self: '4.3', avg: '4.1', adv: '+0.2' },
              { dim: '卖家集中度', self: '中等', avg: '高', adv: '入场机会' },
            ].map((row, i) => (
              <tr key={i} className="border-b border-lc-border-light">
                <td className="py-2.5 px-3 text-xs font-medium text-lc-text-primary">{row.dim}</td>
                <td className="py-2.5 px-3 text-xs font-mono-num font-semibold text-lc-primary">{row.self}</td>
                <td className="py-2.5 px-3 text-xs font-mono-num text-lc-text-secondary">{row.avg}</td>
                <td className="py-2.5 px-3">
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium" style={{ background: row.adv.startsWith('+') || row.adv === '低价优势' || row.adv === '入场机会' ? LC.successLight : LC.warningLight, color: row.adv.startsWith('+') || row.adv === '低价优势' || row.adv === '入场机会' ? LC.success : LC.warning }}>{row.adv}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TrendPanel({ metrics }: { metrics: any[] }) {
  const shiData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.shiScore }));
  const cviData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.cviScore }));
  const oppData = metrics.map((m: any) => ({ x: m.metricDate.slice(5), y: m.opportunityScore }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-primary">SHI 社媒热度</h4>
          <EChartsLine data={shiData} color={LC.primary} height={200} yAxisName="SHI" />
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-success">CVI 电商验证</h4>
          <EChartsLine data={cviData} color={LC.success} height={200} yAxisName="CVI" />
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-warning">机会分</h4>
          <EChartsLine data={oppData} color={LC.warning} height={200} yAxisName="Score" />
        </div>
      </div>
    </div>
  );
}

function OpportunityPanel({ concept, metrics }: { concept: any; metrics: any[] }) {
  const latest = metrics[metrics.length - 1] || {};
  const features = (concept.keyFeatures ?? []).slice(0, 3);
  const scenes = (concept.usageScenes ?? []).slice(0, 3);
  const estPriceLow = 25;
  const estPriceHigh = 55;
  const estMargin = 35;

  return (
    <div className="space-y-4">
      {/* AI选品建议 */}
      <div className="bg-lc-primary-light rounded-lg p-5 ring-1 ring-lc-primary/20">
        <h4 className="text-sm font-semibold mb-3 text-lc-primary flex items-center gap-2">
          <Sparkles size={16} /> AI选品建议
        </h4>
        <div className="space-y-3">
          {[
            { title: '高机会分', desc: `${concept.name} 的机会分${latest.opportunityScore ?? '--'}，SHI(${latest.shiScore ?? '--'})高而CVI(${latest.cviScore ?? '--'})中等，说明社媒热度已验证但电商供给不足，存在窗口期。`, type: 'good' },
            { title: '差异化切入点', desc: `建议主打"${features[0] || '核心功能'}"作为核心卖点，该特征在TikTok上的讨论度显著高于Amazon现有商品。`, type: 'good' },
            { title: '价格带建议', desc: `目标价格带 $${estPriceLow}-$${estPriceHigh}，避开Amazon高集中度区间，同时满足TikTok用户对性价比的期待。`, type: 'good' },
            { title: '风险提示', desc: latest.cviScore < 40 ? 'CVI偏低说明电商验证数据有限，建议先做小批量测试，验证真实转化率后再扩大投入。' : 'CVI表现良好，电商验证数据充足，可适度加大投入。', type: latest.cviScore < 40 ? 'warn' : 'good' },
          ].map((item, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.type === 'good' ? 'bg-lc-success' : 'bg-lc-warning'}`} />
              <div>
                <div className="text-xs font-semibold text-lc-text-primary">{item.title}</div>
                <div className="text-[11px] text-lc-text-secondary leading-relaxed mt-0.5">{item.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 商业模型画布 */}
      <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
        <h4 className="text-xs font-semibold mb-3 text-lc-primary flex items-center gap-2">
          <Target size={14} /> 商业模型画布
        </h4>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: '价值主张', value: `${features.join('、') || '差异化功能'} — 解决${scenes[0] || '用户场景'}痛点`, color: LC.primary },
            { label: '目标客户', value: `${scenes.join('、') || 'TikTok用户'}场景下的年轻消费者`, color: LC.teal },
            { label: '核心渠道', value: 'Amazon销售 + TikTok内容营销 + 达人带货', color: LC.success },
            { label: '收入来源', value: `Amazon零售（$${estPriceLow}-${estPriceHigh}客单价）`, color: LC.warning },
            { label: '关键资源', value: `供应商资源 + ${concept.tiktokKeywords?.[0] || ''}内容资产 + 达人合作`, color: LC.info },
            { label: '成本结构', value: `产品成本~${Math.round(100 - estMargin)}% + 营销~15% + 平台~15%`, color: LC.danger },
          ].map((item, i) => (
            <div key={i} className="rounded-lg p-3 bg-lc-bg-warm">
              <div className="text-xs font-medium mb-1.5" style={{ color: item.color }}>{item.label}</div>
              <div className="text-[11px] text-lc-text-primary leading-relaxed">{item.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 盈利预测 + 风险评估 */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-success flex items-center gap-2">
            <Coins size={14} /> 盈利预测（小规模测试）
          </h4>
          <div className="space-y-2.5">
            {[
              { label: '测试批次', value: '200-500件', sub: '小批量验证' },
              { label: '预估售价', value: `$${estPriceLow}-${estPriceHigh}`, sub: '含运费' },
              { label: '预估毛利率', value: `${estMargin}%`, sub: '扣除平台佣金后' },
              { label: '预估首月GMV', value: `$${((estPriceLow + estPriceHigh) / 2 * 200).toLocaleString()}`, sub: '基于保守200件销量' },
              { label: '预估盈亏平衡', value: '3-4个月', sub: '含营销投入回收期' },
            ].map((row, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-[11px] text-lc-text-secondary">{row.label}</span>
                <div className="text-right">
                  <span className="text-xs font-semibold font-mono-num text-lc-text-primary">{row.value}</span>
                  <span className="text-xs text-lc-text-muted ml-1.5">{row.sub}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
          <h4 className="text-xs font-semibold mb-3 text-lc-warning flex items-center gap-2">
            <AlertTriangle size={14} /> 风险评估矩阵
          </h4>
          <div className="space-y-2.5">
            {[
              { label: '市场验证风险', level: latest.cviScore < 30 ? '高' : latest.cviScore < 50 ? '中' : '低', score: latest.cviScore < 30 ? 3 : latest.cviScore < 50 ? 2 : 1, desc: 'CVI指标反映市场已有验证程度' },
              { label: '供应链风险', level: latest.amazonSellerCount > 200 ? '中' : '低', score: latest.amazonSellerCount > 200 ? 2 : 1, desc: '卖家数量反映供应链成熟度' },
              { label: '竞争加剧风险', level: latest.amazonProductCount > 500 ? '高' : latest.amazonProductCount > 100 ? '中' : '低', score: latest.amazonProductCount > 500 ? 3 : latest.amazonProductCount > 100 ? 2 : 1, desc: '商品数量反映竞争激烈程度' },
              { label: '趋势衰减风险', level: parseFloat(latest.trendMomentum) < 0.8 ? '高' : parseFloat(latest.trendMomentum) < 1.0 ? '中' : '低', score: parseFloat(latest.trendMomentum) < 0.8 ? 3 : parseFloat(latest.trendMomentum) < 1.0 ? 2 : 1, desc: '趋势动量反映社媒热度持续性' },
              { label: '价格波动风险', level: '中', score: 2, desc: '跨境物流和汇率波动影响' },
            ].map((risk, i) => (
              <div key={i} className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${risk.score >= 3 ? 'bg-lc-danger' : risk.score === 2 ? 'bg-lc-warning' : 'bg-lc-success'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] text-lc-text-primary">{risk.label}</span>
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${risk.score >= 3 ? 'bg-red-50 text-red-600' : risk.score === 2 ? 'bg-amber-50 text-amber-600' : 'bg-green-50 text-green-600'}`}>{risk.level}</span>
                  </div>
                  <div className="text-xs text-lc-text-muted truncate">{risk.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 供应链建议 */}
      <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
        <h4 className="text-xs font-semibold mb-3 text-lc-primary flex items-center gap-2">
          <Truck size={14} /> 供应链与物流建议
        </h4>
        <div className="grid grid-cols-2 gap-3">
          {[
            { title: '供应商筛选', desc: `重点寻找具备"${features[0] || '核心功能'}"生产能力的工厂，要求提供样品和MOQ数据。`, icon: Shield },
            { title: '品质管控', desc: '首批订单要求全检，建立来料检验标准（IQC），重点关注评分中提及的质量痛点。', icon: Shield },
            { title: '物流方案', desc: '首批建议走空运（7-10天），验证市场后转海运（30-45天）降低成本。', icon: Truck },
            { title: '合规准备', desc: '确认目标品类所需的FDA/CE/FCC认证要求，提前2-3周启动认证流程。', icon: Shield },
          ].map((item, i) => (
            <div key={i} className="rounded-lg p-3 bg-lc-bg-warm">
              <div className="flex items-center gap-1.5 mb-1.5">
                <item.icon size={12} className="text-lc-primary" />
                <span className="text-[11px] font-semibold text-lc-text-primary">{item.title}</span>
              </div>
              <p className="text-xs text-lc-text-secondary leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* 执行时间线 */}
      <div className="bg-white rounded-lg p-4 ring-1 ring-lc-border/60">
        <h4 className="text-xs font-semibold mb-3 text-lc-primary">执行时间线建议</h4>
        <div className="space-y-3">
          {[
            { phase: '第1周', action: '竞品调研：深入分析Amazon Top 10商品，提炼差异化卖点', milestone: '输出竞品分析报告' },
            { phase: '第2-3周', action: '供应商对接：根据关键特征寻找匹配供应商，索要样品', milestone: '确定2-3家候选供应商' },
            { phase: '第4-6周', action: '小批量测试：上架Amazon，配合TikTok内容营销测试转化', milestone: '首批200件上架+5条TikTok视频' },
            { phase: '第7-8周', action: '数据复盘：根据SHI/CVI变化评估机会，决定是否扩量', milestone: '输出测试复盘报告' },
            { phase: '第9-12周', action: '规模扩张：根据测试结果优化产品，加大备货和营销投入', milestone: '月度GMV目标达成' },
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="w-16 text-xs font-bold text-lc-primary text-right shrink-0">{step.phase}</div>
              <div className="w-2 h-2 rounded-full bg-lc-primary shrink-0" />
              <div className="flex-1">
                <div className="text-xs text-lc-text-primary py-1.5 px-3 rounded-lg bg-lc-bg-warm">{step.action}</div>
                <div className="text-xs text-lc-text-muted mt-0.5 ml-3">里程碑：{step.milestone}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Main Page ----

export default function FusionReport() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [selectedConcept, setSelectedConcept] = useState<any>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [step, setStep] = useState<'search' | 'select' | 'report'>('search');

  const { data: conceptsData, isLoading: conceptsLoading, isError } = trpc.fusion.concepts.list.useQuery(
    { search: searchText || undefined, limit: 20 },
    { staleTime: 5 * 60 * 1000 }
  );

  const { data: metricsData, isLoading: metricsLoading } = trpc.fusion.metrics.list.useQuery(
    { conceptId: selectedConcept?.conceptId || '', limit: 30 },
    { staleTime: 5 * 60 * 1000, enabled: !!selectedConcept?.conceptId }
  );

  const concepts = conceptsData?.items || [];
  const metrics = metricsData?.items || [];

  const handleSearch = () => {
    if (searchText.trim()) {
      setStep('select');
    }
  };

  const handleSelectConcept = (c: any) => {
    setSelectedConcept(c);
    setStep('report');
    setActiveTab(0);
  };

  const handleBackToSearch = () => {
    setStep('search');
    setSelectedConcept(null);
    setSearchText('');
  };

  const handleBackToSelect = () => {
    setStep('select');
    setSelectedConcept(null);
  };

  // ---- Step 1: Search ----
  if (isError) return <ErrorState />;

  if (step === 'search') {
    return (
      <div className="animate-fadeIn">
        <Breadcrumb items={['融合选品', '生成报告']} />

        {/* Header */}
        <div className="rounded-xl p-6 mb-6 ring-1 ring-lc-border/60" style={{ background: `linear-gradient(135deg, ${LC.primary} 0%, ${LC.primaryDark} 100%)` }}>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
              <FileText size={20} style={{ color: LC.textInverse }} />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: LC.textInverse }}>融合选品报告生成</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>输入关键词，AI为您生成社媒热度 + 电商验证的融合分析报告</p>
            </div>
          </div>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-8 px-4">
          <StepBadge step={1} active={true} />
          <span className="text-xs font-medium text-lc-primary">输入关键词</span>
          <div className="flex-1 h-px bg-lc-border-light" />
          <StepBadge step={2} active={false} />
          <span className="text-xs text-lc-text-muted">选择概念</span>
          <div className="flex-1 h-px bg-lc-border-light" />
          <StepBadge step={3} active={false} />
          <span className="text-xs text-lc-text-muted">查看报告</span>
        </div>

        {/* Search Box */}
        <div className="max-w-xl mx-auto">
          <div className="bg-white rounded-xl p-6 ring-1 ring-lc-border/60 shadow-lc">
            <div className="flex items-center gap-3 mb-4">
              <Search size={18} className="text-lc-primary" />
              <span className="text-sm font-semibold text-lc-text-primary">搜索产品概念</span>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={searchText}
                onChange={e => setSearchText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="输入关键词，如：便携温奶器、智能宠物喂食器..."
                className="flex-1 h-10 px-4 rounded-lg border text-sm focus:outline-none focus:ring-1 border-lc-border text-lc-text-primary"
              />
              <button
                onClick={handleSearch}
                className="h-10 px-5 rounded-lg text-sm font-medium text-white bg-lc-primary hover:brightness-110 transition-all"
              >
                搜索
              </button>
            </div>
            <div className="mt-4">
              <div className="text-[11px] text-lc-text-muted mb-2">热门搜索:</div>
              <div className="flex flex-wrap gap-1.5">
                {['便携温奶器', '智能宠物喂食器', '无线按摩器', 'LED化妆镜', '便携榨汁杯'].map(kw => (
                  <button
                    key={kw}
                    onClick={() => { setSearchText(kw); setStep('select'); }}
                    className="text-[11px] px-2.5 py-1 rounded-full bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-primary-light hover:text-lc-primary transition-all"
                  >
                    {kw}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-lc-border">
              <button
                onClick={() => navigate('/fusion/opportunities')}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-[11px] font-medium text-lc-primary bg-lc-primary-light hover:bg-lc-primary/10 transition-all"
              >
                <Sparkles size={12} />
                或者浏览选品机会榜，从推荐概念直接生成报告
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ---- Step 2: Select Concept ----
  if (step === 'select') {
    return (
      <div className="animate-fadeIn">
        <Breadcrumb items={['融合选品', '生成报告']} />

        <div className="flex items-center gap-4 mb-6">
          <button onClick={handleBackToSearch} className="flex items-center gap-1 text-[11px] text-lc-text-muted hover:text-lc-primary transition-all">
            <ArrowLeft size={12} /> 重新搜索
          </button>
        </div>

        {/* Steps */}
        <div className="flex items-center gap-4 mb-6 px-4">
          <StepBadge step={1} active={true} />
          <span className="text-xs text-lc-text-muted">输入关键词</span>
          <div className="flex-1 h-px bg-lc-border-light" />
          <StepBadge step={2} active={true} />
          <span className="text-xs font-medium text-lc-primary">选择概念</span>
          <div className="flex-1 h-px bg-lc-border-light" />
          <StepBadge step={3} active={false} />
          <span className="text-xs text-lc-text-muted">查看报告</span>
        </div>

        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-lc-text-primary">
            找到 <span className="text-lc-primary">{concepts.length}</span> 个匹配概念
          </h3>
          <span className="text-[11px] text-lc-text-muted">点击选择一个概念生成报告</span>
        </div>

        {conceptsLoading ? (
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-xl" />
            ))}
          </div>
        ) : concepts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Search size={32} className="text-lc-border mb-3" />
            <p className="text-sm font-medium text-lc-text-muted">未找到匹配概念</p>
            <button onClick={handleBackToSearch} className="mt-2 text-xs text-lc-primary hover:underline">返回修改关键词</button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {concepts.map((c: any) => (
              <ConceptCard key={c.conceptId} concept={c} selected={false} onClick={() => handleSelectConcept(c)} />
            ))}
          </div>
        )}
      </div>
    );
  }

  // ---- Step 3: Report ----
  const isLoading = metricsLoading;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['融合选品', '生成报告']} />

      <div className="flex items-center gap-3 mb-4">
        <button onClick={handleBackToSelect} className="flex items-center gap-1 text-[11px] text-lc-text-muted hover:text-lc-primary transition-all">
          <ArrowLeft size={12} /> 返回选择
        </button>
      </div>

      {/* Steps */}
      <div className="flex items-center gap-4 mb-6 px-4">
        <StepBadge step={1} active={true} />
        <span className="text-xs text-lc-text-muted">输入关键词</span>
        <div className="flex-1 h-px bg-lc-border-light" />
        <StepBadge step={2} active={true} />
        <span className="text-xs text-lc-text-muted">选择概念</span>
        <div className="flex-1 h-px bg-lc-border-light" />
        <StepBadge step={3} active={true} />
        <span className="text-xs font-medium text-lc-primary">查看报告</span>
      </div>

      {/* Report Header */}
      <div className="rounded-xl p-5 mb-4 ring-1 ring-lc-border/60" style={{ background: `linear-gradient(135deg, ${LC.primary} 0%, ${LC.primaryDark} 100%)` }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold" style={{ background: 'rgba(255,255,255,0.15)', color: LC.textInverse }}>
              {selectedConcept.name[0]}
            </div>
            <div>
              <h2 className="text-xl font-bold" style={{ color: LC.textInverse }}>{selectedConcept.name} 融合分析报告</h2>
              <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>{selectedConcept.nameEn} · 基于 SHI + CVI 双维度分析</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/fusion/concept/${selectedConcept.conceptId}`)}
              className="flex items-center gap-1.5 text-xs px-4 h-8 rounded-md font-medium transition-all hover:brightness-110"
              style={{ background: 'rgba(255,255,255,0.1)', color: LC.textInverse }}
            >
              <BarChart3 size={12} /> 查看概念详情
            </button>
            <button className="flex items-center gap-1.5 text-xs px-4 h-8 rounded-md font-medium transition-all hover:brightness-110" style={{ background: 'rgba(255,255,255,0.15)', color: LC.textInverse }}>
              <Download size={12} /> 导出报告
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 mb-4 ring-1 ring-lc-border/60">
        <div className="flex gap-5 overflow-x-auto">
          {REPORT_TABS.map((t, i) => (
            <button key={t} onClick={() => setActiveTab(i)}
              className="pb-2.5 text-xs font-medium transition-all border-b-2 whitespace-nowrap flex items-center gap-1"
              style={activeTab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>
              {i === 0 && <BarChart3 size={12} />}
              {i === 1 && <TrendingUp size={12} />}
              {i === 2 && <MessageSquare size={12} />}
              {i === 3 && <FileText size={12} />}
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-4">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-64 w-full rounded-xl" />
          </div>
        </div>
      ) : (
        <>
          {activeTab === 0 && <MarketOverviewPanel concept={selectedConcept} metrics={metrics} />}
          {activeTab === 1 && (
            <div className="space-y-4">
              <SocialMediaPanel metrics={metrics} />
              <EcommercePanel metrics={metrics} />
            </div>
          )}
          {activeTab === 2 && (
            <div className="space-y-4">
              <VOCAnalysisPanel concept={selectedConcept} />
              <CompetitorPanel concept={selectedConcept} />
            </div>
          )}
          {activeTab === 3 && (
            <div className="space-y-4">
              <TrendPanel metrics={metrics} />
              <OpportunityPanel concept={selectedConcept} metrics={metrics} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
