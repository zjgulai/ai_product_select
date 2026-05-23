import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { MarketItem } from '@/types/market';
import DataTablePage from '@/components/shared/DataTablePage';
import MiniTrend from '@/components/shared/MiniTrend';
import { LC } from '@/lib/lute-colors';

export default function ParamTrend() {
  const [searchText, setSearchText] = useState("");

  const { data, isLoading, isError } = trpc.amazon.paramTrend.list.useQuery(undefined, {
    staleTime: 5 * 60 * 1000,
  });

  const filtered = searchText && data
    ? data.filter((d) => d.keyword.toLowerCase().includes(searchText.toLowerCase()))
    : (data || []);

  if (isError) return <ErrorState />;

  return (
    <DataTablePage<MarketItem>
      breadcrumb={["Amazon趋势", "参数趋势"]}
      title="参数趋势排名"
      searchPlaceholder="搜索关键词..."
      searchValue={searchText}
      onSearchChange={setSearchText}
      loading={isLoading}
      data={filtered}
      total={filtered.length}
      exportable
      columns={[
        { key: 'rank', label: '排名', align: 'left', render: (_item: MarketItem, idx: number) => (
          <span className="text-xs font-bold font-mono-num" style={{ color: idx < 3 ? LC.primary : LC.textMuted, background: idx < 3 ? LC.primaryLight : 'transparent', width: 22, height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', borderRadius: 6 }}>{idx + 1}</span>
        )},
        { key: 'keyword', label: '关键词', align: 'left', render: (item: MarketItem) => <span className="text-xs font-bold text-lc-primary">{item.keyword}</span> },
        { key: 'trend', label: '趋势', align: 'center', render: (item: MarketItem) => <MiniTrend data={item.trend} /> },
        { key: 'sales', label: '月销量', align: 'right', render: (item: MarketItem) => (
          <div>
            <div className="text-xs font-mono-num font-bold text-lc-text-primary">{item.sales.toLocaleString()}</div>
            <div className="text-[10px] font-bold" style={{ color: item.salesG.startsWith('+') ? LC.success : LC.danger }}>{item.salesG}</div>
          </div>
        )},
        { key: 'revenue', label: '月销售额($)', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num font-bold text-lc-primary">${item.revenue.toLocaleString()}</span> },
        { key: 'price', label: '均价($)', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">${item.price}</span> },
        { key: 'rating', label: '评分', align: 'right', render: (item: MarketItem) => <span className="text-xs font-bold" style={{ color: item.rating >= 4.5 ? LC.success : item.rating >= 4 ? LC.teal : LC.warning }}>{item.rating}</span> },
        { key: 'top3', label: 'TOP3占比', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num">{item.top3}</span> },
        { key: 'newP', label: '新品占比', align: 'right', render: (item: MarketItem) => <span className="text-xs font-mono-num text-lc-success">{item.newP}</span> },
        { key: 'attrs', label: '产品属性', align: 'left', render: (item: MarketItem) => (
          <div className="flex flex-wrap gap-1">{item.attrs?.split(',').map((a: string) => <span key={a} className="text-[9px] px-1.5 py-0.5 rounded font-medium" style={{ background: LC.primaryLight, color: LC.primary }}>{a}</span>)}</div>
        )},
      ]}
      extraHeader={(
        <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-bold text-lc-text-primary">参数趋势</h2>
              <p className="text-[11px] mt-0.5 text-lc-text-muted">含产品参数的搜索词，且增长的市场 · 共 8,427 个</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['全部','健康','美妆','家居','电子','运动'].map((f, i) => (
              <button key={f} className="px-3 h-7 rounded-full text-[11px] font-medium transition-all"
                style={i === 0 ? { background: LC.primary, color: LC.textInverse } : { background: LC.bgWarm, color: LC.textMuted, border: `1px solid ${LC.borderStrong}` }}>{f}</button>
            ))}
          </div>
        </div>
      )}
    />
  );
}
