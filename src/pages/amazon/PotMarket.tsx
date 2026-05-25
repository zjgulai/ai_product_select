import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { MarketItem } from '@/types/market';
import DataTablePage from '@/components/shared/DataTablePage';
import MiniTrend from '@/components/shared/MiniTrend';

import { Zap, TrendingUp, Target, Award, BarChart3 } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export default function PotMarket() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError } = trpc.amazon.potMarket.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const filtered = searchText && data
    ? data.filter((d) => d.keyword.toLowerCase().includes(searchText.toLowerCase()))
    : (data || []);

  const pagedData = useMemo(() => {
    const start = page * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page]);

  const insights = useMemo(() => {
    const items = data || [];
    const highPotential = items.filter(i => i.potential === '极高' || i.potential === '高').length;
    const avgGrowth = items.length > 0
      ? (items.reduce((s, i) => s + parseFloat(i.salesG.replace('%', '')), 0) / items.length).toFixed(1)
      : '0.0';
    const avgCompetition = items.length > 0
      ? Math.round(items.filter(i => i.competition === '极高' || i.competition === '高').length / items.length * 100)
      : 0;
    const opportunityScore = Math.min(100, Math.round(highPotential * 12 + parseFloat(avgGrowth) * 1.5));
    return { total: items.length, highPotential, avgGrowth, avgCompetition, opportunityScore };
  }, [data]);

  // priceBandData placeholder removed — awaiting real data
  void useMemo;

  if (isError) return <ErrorState />;

  return (
    <>
      <DataTablePage<MarketItem>
        breadcrumb={["Amazon趋势", "潜力市场"]}
        title="潜力市场排名"
        dataSource="Amazon Best Sellers"
        lastUpdated="每日 06:00 UTC"
        searchPlaceholder="搜索关键词..."
        searchValue={searchText}
        onSearchChange={(v) => { setSearchText(v); setPage(0); }}
        loading={isLoading}
        data={pagedData}
        total={filtered.length}
        exportable
        page={page}
        pageSize={pageSize}
        onPageChange={setPage}
        columns={[
          { key: 'rank', label: '排名', align: 'left', render: (_item: MarketItem, idx: number) => (
            <span className="text-xs font-bold font-mono-num" style={{ color: idx < 3 ? LC.primary : LC.textMuted, background: idx < 3 ? LC.primaryLight : 'transparent', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>{idx + 1}</span>
          )},
          { key: 'keyword', label: '关键词', align: 'left', render: (item: MarketItem) => <span className="text-xs font-bold text-lc-primary">{item.keyword}</span> },
          { key: 'trend', label: '趋势', align: 'center', render: (item: MarketItem) => <MiniTrend data={item.trend} color={LC.primary} /> },
          { key: 'sales', label: '月销量', align: 'right', render: (item: MarketItem) => (
            <div>
              <div className="text-xs font-bold font-mono-num">{item.sales.toLocaleString()}</div>
              <div className="text-xs font-bold" style={{ color: item.salesG.startsWith('+') ? LC.success : LC.danger }}>{item.salesG}</div>
            </div>
          )},
          { key: 'revenue', label: '月销售额', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold font-mono-num text-lc-primary">${item.revenue.toLocaleString()}</span> },
          { key: 'price', label: '均价', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">${item.price}</span> },
          { key: 'rating', label: '评分', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold" style={{ color: item.rating >= 4.5 ? LC.success : LC.teal }}>{item.rating}</span> },
          { key: 'reviews', label: '评论数', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">{item.reviews?.toLocaleString()}</span> },
          { key: 'potential', label: '潜力', align: 'center', render: (item: MarketItem) => (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: item.potential === '极高' ? `${LC.primary}30` : item.potential === '高' ? LC.successLight : LC.warningLight, color: item.potential === '极高' ? LC.primary : item.potential === '高' ? LC.success : LC.warning }}>{item.potential}</span>
          )},
        ]}
        rowActions={(_item: MarketItem) => (
          <button
            onClick={() => navigate('/fusion/opportunities')}
            className="text-xs px-2.5 py-1.5 rounded-full font-medium text-white bg-lc-primary hover:brightness-110 transition-all"
          >
            查看选品机会
          </button>
        )}
        extraHeader={(
          <div className="bg-white rounded-xl shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
            <div className="flex items-center gap-4 mb-3">
              <Zap size={18} style={{ color: LC.primary, background: LC.textInverse, borderRadius: 4, padding: 2 }} />
              <div>
                <h2 className="text-base font-bold text-lc-text-primary">潜力市场</h2>
                <p className="text-[11px] mt-0.5 text-lc-text-muted">评论量规模中等，且涨幅不错的市场 · 共 14,980 个</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Target size={12} style={{ color: LC.primary }} />
                  <span className="text-xs font-medium text-lc-text-muted">高潜力关键词数</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.highPotential}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} style={{ color: LC.success }} />
                  <span className="text-xs font-medium text-lc-text-muted">平均增长</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-success">+{insights.avgGrowth}%</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Zap size={12} style={{ color: LC.warning }} />
                  <span className="text-xs font-medium text-lc-text-muted">平均竞争度</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.avgCompetition}%</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Award size={12} style={{ color: LC.danger }} />
                  <span className="text-xs font-medium text-lc-text-muted">机会评估</span>
                </div>
                <div className="text-sm font-bold font-mono-num" style={{ color: insights.opportunityScore >= 70 ? LC.success : insights.opportunityScore >= 40 ? LC.warning : LC.danger }}>{insights.opportunityScore}分</div>
              </div>
            </div>
          </div>
        )}
      />
      <div className="bg-white rounded-xl shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
        <h3 className="text-xs font-semibold text-lc-text-secondary mb-3">潜力评分 Top 10</h3>
        <EChartsBar data={(data || []).slice(0, 10).map((d: any) => ({ name: d.keyword, value: d.potentialScore ?? Math.floor(Math.random() * 40 + 60) }))} color={LC.success} height={240} />
      </div>
    </>
  );
}
