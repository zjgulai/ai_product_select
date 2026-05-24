/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import EChartsHeatmap from '@/components/shared/EChartsHeatmap';
import EChartsTreemap from '@/components/shared/EChartsTreemap';
import EChartsLine from '@/components/shared/EChartsLine';
import EChartsPie from '@/components/shared/EChartsPie';
import EChartsBar from '@/components/shared/EChartsBar';
import { Skeleton } from '@/components/ui/skeleton';
import ErrorState from '@/components/shared/ErrorState';
import { LC } from '@/lib/lute-colors';
import { Download, TrendingUp, TrendingDown, Users, ShoppingBag, DollarSign, Package, Activity, Layers } from 'lucide-react';

const KPI_ICONS = [ShoppingBag, DollarSign, Package, DollarSign, Package, DollarSign];

export default function TikTokAnalysis() {
  const [timeRange, setTimeRange] = useState(0);
  const [heatmapMetric, setHeatmapMetric] = useState<'sales' | 'growth'>('sales');
  const [activeCategory, setActiveCategory] = useState<number | null>(null);

  // tRPC queries
  const { data: kpiData, isLoading: kpiLoading, isError } = trpc.tiktok.analysis.kpi.useQuery();
  const { data: heatmapData } = trpc.tiktok.analysis.heatmap.useQuery();
  const { data: gmvData } = trpc.tiktok.analysis.gmvTrend.useQuery();
  const { data: categoryShare } = trpc.tiktok.analysis.categoryShare.useQuery();
  const { data: priceDist } = trpc.tiktok.analysis.priceDistribution.useQuery();
  const { data: influencerMatrix } = trpc.tiktok.analysis.influencerMatrix.useQuery();

  // Filter heatmap data by time range
  const filteredMonths = useMemo(() => {
    if (!heatmapData) return [];
    if (timeRange === 0) return heatmapData.months.slice(-7);
    return heatmapData.months;
  }, [timeRange, heatmapData]);

  const filteredHeatmapData = useMemo(() => {
    if (!heatmapData) return [];
    const monthOffset = timeRange === 0 ? 3 : 0;
    return heatmapData.data
      .filter(d => d[1] >= monthOffset)
      .map(d => [d[0], d[1] - monthOffset, d[2]] as [number, number, number]);
  }, [timeRange, heatmapData]);

  const gmvChartData = useMemo(() => {
    if (!gmvData) return [];
    const sliceStart = timeRange === 0 ? 3 : 0;
    return gmvData.slice(sliceStart).map(d => ({ x: d.month, y: d.gmv }));
  }, [timeRange, gmvData]);

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["TikTok趋势", "大盘数据"]} />

      {/* KPI Cards */}
      <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-lc-primary">数据大盘</h3>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 p-0.5 rounded-md bg-lc-bg-warm">
              {["近7天", "近30天"].map((t, i) => (
                <button key={t} onClick={() => setTimeRange(i)}
                  className="px-3 h-7 rounded text-xs font-medium transition-all duration-200"
                  style={timeRange === i ? { background: LC.primary, color: LC.textInverse } : { color: LC.textMuted }}>{t}</button>
              ))}
            </div>
            <button className="flex items-center gap-1 text-xs font-medium px-2 h-7 rounded border transition-colors" style={{ color: LC.textMuted, borderColor: LC.border }}>
              <Download size={11} /> 导出
            </button>
          </div>
        </div>
        {kpiLoading ? (
          <div className="grid grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-lg p-3 bg-lc-bg-warm">
                <Skeleton className="h-4 w-16 mb-2" />
                <Skeleton className="h-6 w-20" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-3">
            {kpiData?.map((kpi, i) => {
              const Icon = KPI_ICONS[i];
              return (
                <div key={kpi.title} className="rounded-lg p-3 transition-all duration-200 cursor-pointer group bg-lc-bg-warm">
                  <div className="flex items-center gap-1.5 mb-2">
                    <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: `${LC.primary}10` }}>
                      <Icon size={13} className="text-lc-primary" />
                    </div>
                    <span className="text-xs font-medium text-lc-text-muted">{kpi.title}</span>
                  </div>
                  <div className="text-lg font-bold font-mono-num text-lc-primary">{kpi.value}</div>
                  <div className="text-[11px] mt-1 font-medium flex items-center gap-0.5"
                    style={{ color: kpi.up ? LC.success : LC.danger }}>
                    {kpi.up ? <TrendingUp size={10} /> : <TrendingDown size={10} />} {kpi.trend}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Category Heatmap */}
      <div className="bg-white rounded-lg shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-1">
          <div>
            <h3 className="text-sm font-semibold text-lc-primary">品类热力图</h3>
            <p className="text-[11px] mt-0.5 text-lc-text-muted">各品类月度销售热度指数（0-100），颜色越深表示销售额越高</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex gap-0.5 p-0.5 rounded bg-lc-bg-warm">
              {[{k:'sales',l:'销量'},{k:'growth',l:'增长'}].map((m) => (
                <button key={m.k} onClick={() => setHeatmapMetric(m.k as any)}
                  className="px-2.5 h-6 rounded text-xs font-medium transition-all"
                  style={heatmapMetric === m.k ? { background: LC.primary, color: LC.textInverse } : { color: LC.textMuted }}>{m.l}</button>
              ))}
            </div>
          </div>
        </div>
        {heatmapData ? (
          <EChartsHeatmap
            xLabels={filteredMonths}
            yLabels={heatmapData.categories}
            data={filteredHeatmapData}
            height={380}
          />
        ) : (
          <Skeleton className="w-full h-[380px]" />
        )}
      </div>

      {/* Category Treemap */}
      <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60 mt-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold text-lc-primary">品类树形分解</h3>
          <div className="flex items-center gap-1">
            <Layers size={12} className="text-lc-primary" />
            <span className="text-xs font-medium text-lc-text-muted">销售额 & 涨跌幅</span>
          </div>
        </div>
        <EChartsTreemap height={320} />
      </div>

      {/* GMV Trend + Category Share */}
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-lc-primary">月度GMV趋势</h3>
            <div className="flex items-center gap-1">
              <Activity size={12} className="text-lc-primary" />
              <span className="text-xs font-medium text-lc-text-muted">单位: 亿美元</span>
            </div>
          </div>
          {gmvChartData.length > 0 ? (
            <EChartsLine data={gmvChartData} color={'#E8785A'} height={260} yAxisName="GMV($B)" />
          ) : (
            <Skeleton className="w-full h-[260px]" />
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60">
          <h3 className="text-sm font-semibold mb-2 text-lc-primary">品类市场份额</h3>
          {categoryShare ? (
            <EChartsPie
              data={categoryShare.slice(0, 6).map(c => ({ name: c.name, value: c.value }))}
              height={260}
              donut
            />
          ) : (
            <Skeleton className="w-full h-[260px]" />
          )}
        </div>
      </div>

      {/* Price Distribution */}
      <div className="bg-white rounded-lg shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
        <h3 className="text-sm font-semibold mb-4 text-lc-primary">价格带分布</h3>
        {priceDist ? (
          <div className="grid grid-cols-3 gap-4">
            <EChartsBar data={priceDist.map(d => ({ label: d.range, value: d.products }))} title="商品数量" color={'#E8785A'} height={220} />
            <EChartsBar data={priceDist.map(d => ({ label: d.range, value: d.salesVolume }))} title="销量" color={'#E8785A'} height={220} />
            <EChartsBar data={priceDist.map(d => ({ label: d.range, value: d.salesRevenue }))} title="销售额($M)" color={LC.teal} height={220} />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="w-full h-[220px]" />
            ))}
          </div>
        )}
      </div>

      {/* Influencer Matrix */}
      <div className="bg-white rounded-lg shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-lc-primary">带货达人矩阵</h3>
          <div className="flex items-center gap-1">
            <Users size={12} className="text-lc-primary" />
            <span className="text-xs font-medium text-lc-text-muted">共26.4M达人</span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="overflow-x-auto">
            {influencerMatrix ? (
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-lc-bg-warm">
                    {["粉丝量级", "达人数", "占比", "总销量", "平均GPM"].map(h => (
                      <th key={h} className={`py-2.5 px-3 text-xs font-semibold text-lc-text-secondary ${h === '粉丝量级' ? 'text-left' : 'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {influencerMatrix.map((row: any) => (
                    <tr key={row.range} className="border-b transition-colors hover:bg-lc-bg-warm cursor-pointer border-lc-border-light"
                      onClick={() => setActiveCategory(activeCategory === 0 ? null : 0)}>
                      <td className="py-2.5 px-3 font-semibold text-left text-xs text-lc-primary">{row.range}</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono-num text-lc-text-primary">{(row.accounts / 1000000).toFixed(1)}M</td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center justify-end gap-2">
                          <div className="w-14 h-1.5 rounded-full overflow-hidden bg-lc-border-light">
                            <div className="h-full rounded-full" style={{ width: row.accountRatio, background: LC.primary }} />
                          </div>
                          <span className="font-mono-num text-xs text-lc-text-muted">{row.accountRatio}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">{(row.sales / 1000000).toFixed(0)}M</td>
                      <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-primary">${row.avgRevenue.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-6 w-full" />
                ))}
              </div>
            )}
          </div>
          {influencerMatrix ? (
            <EChartsBar
              data={influencerMatrix.slice().reverse().map((r: any) => ({ label: r.range, value: r.accounts }))}
              color={LC.teal}
              height={240}
              horizontal
            />
          ) : (
            <Skeleton className="w-full h-[240px]" />
          )}
        </div>
      </div>
    </div>
  );
}
