import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { MarketItem } from '@/types/market';
import DataTablePage from '@/components/shared/DataTablePage';
import MiniTrend from '@/components/shared/MiniTrend';

import { Flame, TrendingUp, Star, Shield, BarChart3 } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export default function HotMarket() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError } = trpc.amazon.hotMarket.list.useQuery(undefined, {
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
    const total = items.length;
    const avgSales = total > 0 ? Math.round(items.reduce((s, i) => s + i.sales, 0) / total) : 0;
    const avgRating = total > 0 ? (items.reduce((s, i) => s + i.rating, 0) / total).toFixed(2) : '0.00';
    const top3Concentration = total > 0 ? Math.round(items.slice(0, 3).reduce((s, i) => s + i.sales, 0) / items.reduce((s, i) => s + i.sales, 0) * 100) : 0;
    return { total, avgSales, avgRating, top3Concentration };
  }, [data]);

  // categoryData placeholder removed — awaiting real data
  void useMemo;

  if (isError) return <ErrorState />;

  return (
    <>
      <DataTablePage<MarketItem>
        breadcrumb={["Amazon趋势", "热门市场"]}
        title="热门市场排名"
        dataSource="Amazon 评论量 + 增长率"
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
          { key: 'rank', label: '排名', align: 'left', render: (item: MarketItem, idx: number) => (
            <span className="text-xs font-bold font-mono-num" style={{ color: idx < 3 ? LC.primary : LC.textMuted, background: idx < 3 ? LC.primaryLight : 'transparent', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>{item.rank}</span>
          )},
          { key: 'keyword', label: '关键词', align: 'left', render: (item: MarketItem) => <span className="text-xs font-bold text-lc-primary">{item.keyword}</span> },
          { key: 'trend', label: '趋势', align: 'center', render: (item: MarketItem) => <MiniTrend data={item.trend} /> },
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
          { key: 'competition', label: '竞争度', align: 'center', render: (item: MarketItem) => (
            <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ background: item.competition === '极高' ? LC.dangerLight : item.competition === '高' ? LC.warningLight : LC.successLight, color: item.competition === '极高' ? LC.danger : item.competition === '高' ? LC.warning : LC.success }}>{item.competition}</span>
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
              <Flame size={18} className="text-lc-danger" />
              <div>
                <h2 className="text-base font-bold text-lc-text-primary">热门市场</h2>
                <p className="text-[11px] mt-0.5 text-lc-text-muted">评论量较大且增长的市场 · 共 1,058,913 个</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} style={{ color: LC.primary }} />
                  <span className="text-xs font-medium text-lc-text-muted">总关键词数</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.total.toLocaleString()}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Flame size={12} style={{ color: LC.danger }} />
                  <span className="text-xs font-medium text-lc-text-muted">平均月销量</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.avgSales.toLocaleString()}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Star size={12} style={{ color: LC.warning }} />
                  <span className="text-xs font-medium text-lc-text-muted">平均评分</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.avgRating}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Shield size={12} style={{ color: LC.success }} />
                  <span className="text-xs font-medium text-lc-text-muted">TOP3品牌集中度</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.top3Concentration}%</div>
              </div>
            </div>
          </div>
        )}
      />
      <div className="bg-white rounded-xl shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
        <h3 className="text-xs font-semibold text-lc-text-secondary mb-3">热门市场竞争度分布</h3>
        <EChartsBar data={(data || []).slice(0, 10).map((d: any) => ({ name: d.keyword, value: d.competitionLevel === '高' ? 80 : d.competitionLevel === '中' ? 50 : 20 }))} color={LC.warning} height={240} />
      </div>
    </>
  );
}
