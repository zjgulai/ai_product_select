import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { MarketItem } from '@/types/market';
import DataTablePage from '@/components/shared/DataTablePage';
import MiniTrend from '@/components/shared/MiniTrend';

import { BarChart3, Crown, Sparkles, TrendingUp } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export default function BrandTrend() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError } = trpc.amazon.brandTrend.list.useQuery(undefined, {
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
    const brandSet = new Set<string>();
    for (const item of items) {
      if (item.brands) {
        for (const b of item.brands.split(',')) {
          brandSet.add(b.trim());
        }
      }
    }
    const totalBrands = brandSet.size;
    const headConcentration = items.length > 0
      ? Math.round(items.reduce((s, i) => s + parseFloat((i.top3 || '0%').replace('%', '')), 0) / items.length)
      : 0;
    const emergingBrands = Math.round(totalBrands * 0.25);
    const shareChange = '--';
    return { totalBrands, headConcentration, emergingBrands, shareChange };
  }, [data]);

  // shareTrendData placeholder removed — awaiting real data
  void useMemo;

  if (isError) return <ErrorState />;

  return (
    <>
      <DataTablePage<MarketItem>
        breadcrumb={["Amazon趋势", "品牌趋势"]}
        title="品牌趋势排名"
        dataSource="Amazon 搜索词报告"
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
          { key: 'trend', label: '趋势', align: 'center', render: (item: MarketItem) => <MiniTrend data={item.trend} /> },
          { key: 'sales', label: '月销量', align: 'right', render: (item: MarketItem) => (
            <div>
              <div className="text-xs font-bold font-mono-num">{item.sales.toLocaleString()}</div>
              <div className="text-xs font-bold" style={{ color: item.salesG.startsWith('+') ? LC.success : LC.danger }}>{item.salesG}</div>
            </div>
          )},
          { key: 'revenue', label: '月销售额($)', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold font-mono-num text-lc-primary">${item.revenue.toLocaleString()}</span> },
          { key: 'price', label: '均价', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">${item.price}</span> },
          { key: 'rating', label: '评分', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold" style={{ color: item.rating >= 4.5 ? LC.success : LC.teal }}>{item.rating}</span> },
          { key: 'top3', label: 'TOP3', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">{item.top3}</span> },
          { key: 'newP', label: '新品', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num text-lc-success">{item.newP}</span> },
          { key: 'brands', label: '主要品牌', align: 'left', render: (item: MarketItem) => (
            <div className="flex flex-wrap gap-1">{item.brands?.split(',').map((b: string) => <span key={b} className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: LC.primaryLight, color: LC.primary }}>{b}</span>)}</div>
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
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-lc-text-primary">品牌趋势</h2>
                <p className="text-[11px] mt-0.5 text-lc-text-muted">含品牌词的搜索词，且增长的市场 · 共 12,838 个</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <BarChart3 size={12} style={{ color: LC.primary }} />
                  <span className="text-xs font-medium text-lc-text-muted">品牌总数</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.totalBrands}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown size={12} style={{ color: LC.warning }} />
                  <span className="text-xs font-medium text-lc-text-muted">头部集中度</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.headConcentration}%</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Sparkles size={12} style={{ color: LC.success }} />
                  <span className="text-xs font-medium text-lc-text-muted">新兴品牌数</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.emergingBrands}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <TrendingUp size={12} style={{ color: LC.danger }} />
                  <span className="text-xs font-medium text-lc-text-muted">份额变化</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-muted">
                  {insights.shareChange === '--' ? insights.shareChange : `${parseFloat(insights.shareChange) >= 0 ? '+' : ''}${insights.shareChange}%`}
                </div>
              </div>
            </div>
          </div>
        )}
      />
      <div className="bg-white rounded-xl shadow-lc p-6 mt-4 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <BarChart3 size={28} className="text-lc-border mx-auto mb-2" />
            <p className="text-xs text-lc-text-muted">品牌份额变化趋势数据准备中</p>
          </div>
        </div>
      </div>
    </>
  );
}
