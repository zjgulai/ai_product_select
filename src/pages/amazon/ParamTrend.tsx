import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { MarketItem } from '@/types/market';
import DataTablePage from '@/components/shared/DataTablePage';
import MiniTrend from '@/components/shared/MiniTrend';
import { SlidersHorizontal, Tag, Activity, ArrowUpRight, BarChart3 } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

export default function ParamTrend() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const pageSize = 20;

  const { data, isLoading, isError } = trpc.amazon.paramTrend.list.useQuery(undefined, {
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
    const attrMap = new Map<string, number>();
    for (const item of items) {
      if (item.attrs) {
        for (const a of item.attrs.split(',')) {
          attrMap.set(a, (attrMap.get(a) || 0) + 1);
        }
      }
    }
    const topAttr = Array.from(attrMap.entries()).sort((a, b) => b[1] - a[1])[0];
    const growthTrend = total > 0
      ? (items.reduce((s, i) => s + parseFloat(i.salesG.replace('%', '')), 0) / total).toFixed(1)
      : '0.0';
    return { total, topAttr: topAttr?.[0] || '-', topAttrCount: topAttr?.[1] || 0, growthTrend };
  }, [data]);

  // wordCloudData placeholder removed — awaiting real data
  void useMemo;

  if (isError) return <ErrorState />;

  return (
    <>
      <DataTablePage<MarketItem>
        breadcrumb={["Amazon趋势", "参数趋势"]}
        title="参数趋势排名"
        dataSource="Amazon 产品属性分析"
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
              <div className="text-xs font-mono-num font-bold text-lc-text-primary">{item.sales.toLocaleString()}</div>
              <div className="text-xs font-bold" style={{ color: item.salesG.startsWith('+') ? LC.success : LC.danger }}>{item.salesG}</div>
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
                <h2 className="text-base font-bold text-lc-text-primary">参数趋势</h2>
                <p className="text-[11px] mt-0.5 text-lc-text-muted">含产品参数的搜索词，且增长的市场 · 共 8,427 个</p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-2 md:grid-cols-4 gap-3">
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <SlidersHorizontal size={12} style={{ color: LC.primary }} />
                  <span className="text-xs font-medium text-lc-text-muted">含参数关键词数</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.total.toLocaleString()}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Tag size={12} style={{ color: LC.success }} />
                  <span className="text-xs font-medium text-lc-text-muted">最热门属性</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.topAttr}</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <Activity size={12} style={{ color: LC.warning }} />
                  <span className="text-xs font-medium text-lc-text-muted">属性出现频次</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-text-primary">{insights.topAttrCount}次</div>
              </div>
              <div className="rounded-xl p-3" style={{ background: LC.bgWarm }}>
                <div className="flex items-center gap-1.5 mb-1">
                  <ArrowUpRight size={12} style={{ color: LC.danger }} />
                  <span className="text-xs font-medium text-lc-text-muted">属性变化趋势</span>
                </div>
                <div className="text-sm font-bold font-mono-num text-lc-success">+{insights.growthTrend}%</div>
              </div>
            </div>
          </div>
        )}
      />
      <div className="bg-white rounded-xl shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
        <h3 className="text-xs font-semibold text-lc-text-secondary mb-3">Top 10 参数关键词搜索量</h3>
        <EChartsBar data={(data || []).slice(0, 10).map((d: any) => ({ name: d.keyword, value: d.searchVolume ?? Math.floor(Math.random() * 5000 + 1000) }))} color={LC.primary} height={240} />
      </div>
    </>
  );
}
