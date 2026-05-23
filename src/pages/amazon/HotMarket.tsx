import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { MarketItem } from '@/types/market';
import DataTablePage from '@/components/shared/DataTablePage';
import MiniTrend from '@/components/shared/MiniTrend';
import { Flame } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export default function HotMarket() {
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, isError } = trpc.amazon.hotMarket.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const filtered = searchText && data
    ? data.filter((d) => d.keyword.toLowerCase().includes(searchText.toLowerCase()))
    : (data || []);

  if (isError) return <ErrorState />;

  return (
    <DataTablePage<MarketItem>
      breadcrumb={["Amazon趋势", "热门市场"]}
      title="热门市场排名"
      searchPlaceholder="搜索关键词..."
      searchValue={searchText}
      onSearchChange={setSearchText}
      loading={isLoading}
      data={filtered}
      total={filtered.length}
      exportable
      columns={[
        { key: 'rank', label: '排名', align: 'left', render: (item: MarketItem, idx: number) => (
          <span className="text-xs font-bold font-mono-num" style={{ color: idx < 3 ? LC.primary : LC.textMuted, background: idx < 3 ? LC.primaryLight : 'transparent', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>{item.rank}</span>
        )},
        { key: 'keyword', label: '关键词', align: 'left', render: (item: MarketItem) => <span className="text-xs font-bold text-lc-primary">{item.keyword}</span> },
        { key: 'trend', label: '趋势', align: 'center', render: (item: MarketItem) => <MiniTrend data={item.trend} /> },
        { key: 'sales', label: '月销量', align: 'right', render: (item: MarketItem) => (
          <div>
            <div className="text-xs font-bold font-mono-num">{item.sales.toLocaleString()}</div>
            <div className="text-[10px] font-bold" style={{ color: item.salesG.startsWith('+') ? LC.success : LC.danger }}>{item.salesG}</div>
          </div>
        )},
        { key: 'revenue', label: '月销售额', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold font-mono-num text-lc-primary">${item.revenue.toLocaleString()}</span> },
        { key: 'price', label: '均价', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">${item.price}</span> },
        { key: 'rating', label: '评分', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold" style={{ color: item.rating >= 4.5 ? LC.success : LC.teal }}>{item.rating}</span> },
        { key: 'reviews', label: '评论数', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">{item.reviews?.toLocaleString()}</span> },
        { key: 'competition', label: '竞争度', align: 'center', render: (item: MarketItem) => (
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ background: item.competition === '极高' ? LC.dangerLight : item.competition === '高' ? LC.warningLight : LC.successLight, color: item.competition === '极高' ? LC.danger : item.competition === '高' ? LC.warning : LC.success }}>{item.competition}</span>
        )},
      ]}
      extraHeader={(
        <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
          <div className="flex items-center gap-2 mb-3">
            <Flame size={18} className="text-lc-danger" />
            <div>
              <h2 className="text-base font-bold text-lc-text-primary">热门市场</h2>
              <p className="text-[11px] mt-0.5 text-lc-text-muted">评论量较大且增长的市场 · 共 1,058,913 个</p>
            </div>
          </div>
        </div>
      )}
    />
  );
}
