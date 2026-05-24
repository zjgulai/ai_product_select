import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import type { TikTokShop } from '@/types';
import DataTablePage from '@/components/shared/DataTablePage';
import CategoryFilter from '@/components/shared/CategoryFilter';
import { Star } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const TABS = [
  { key: 'hot', label: '小店热销榜' },
  { key: 'soaring', label: '小店飙升榜' },
];

const TIME_RANGES = ['全部', '日', '近7天', '近30天', '自定义'];

export default function TikTokShop() {
  const [activeTab, setActiveTab] = useState('hot');
  const [timeRange, setTimeRange] = useState(2);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isError } = trpc.tiktok.shops.list.useQuery(
    {
      search: searchText || undefined,
      limit,
      offset: page * limit,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isError) return <ErrorState />;

  return (
    <DataTablePage<TikTokShop>
      breadcrumb={['TikTok趋势', '小店']}
      title="小店信息"
      dataSource="TikTok Shop API"
      lastUpdated="每日 06:00 UTC"
      searchPlaceholder="小店名称"
      searchValue={searchText}
      onSearchChange={setSearchText}
      tabs={TABS}
      activeTab={activeTab}
      onTabChange={(key) => { setActiveTab(key); setPage(0); }}
      loading={isLoading}
      data={data?.items || []}
      total={data?.total || 0}
      page={page}
      pageSize={limit}
      onPageChange={setPage}
      exportable
      columns={[
        {
          key: 'name',
          label: '小店信息',
          width: '200px',
          render: (item: TikTokShop) => (
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
                {(item.name ?? '?')[0]}
              </div>
              <div>
                <div className="text-xs font-medium text-lc-text-primary">{item.name}</div>
                <div className="text-xs text-lc-text-muted">{item.country} | {item.category}</div>
              </div>
            </div>
          ),
        },
        {
          key: 'sales',
          label: '销量',
          align: 'right',
          render: (item: TikTokShop) => (
            <div>
              <div className="text-xs font-mono-num font-semibold text-lc-text-primary">{(item.sales ?? 0).toLocaleString()}</div>
              <div className="text-xs font-medium text-lc-success">{item.salesGrowth}</div>
            </div>
          ),
        },
        {
          key: 'revenue',
          label: '销售额($)',
          align: 'right',
          render: (item: TikTokShop) => (
            <div>
              <div className="text-xs font-mono-num font-semibold text-lc-text-primary">{parseFloat(item.revenue ?? '0').toLocaleString()}</div>
              <div className="text-xs font-medium" style={{ color: (item.revenueGrowth ?? '').startsWith('+') ? LC.success : LC.danger }}>{item.revenueGrowth}</div>
            </div>
          ),
        },
        { key: 'totalSales', label: '总销量', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num font-semibold text-lc-text-primary">{(item.totalSales ?? 0).toLocaleString()}</span> },
        { key: 'rating', label: '评分', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num font-semibold" style={{ color: parseFloat(item.rating ?? '0') >= 4.5 ? LC.success : LC.teal }}>{item.rating}</span> },
        { key: 'influencers', label: '关联达人', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num text-lc-text-primary">{(item.influencers ?? 0).toLocaleString()}</span> },
      ]}
      rowActions={() => (
        <button className="transition-colors text-lc-border-strong hover:text-lc-primary"><Star size={13} /></button>
      )}
      extraHeader={
        <>
          <CategoryFilter />
          <div className="bg-white p-3 border-b border-lc-border">
            <div className="flex items-center gap-2">
              {TIME_RANGES.map((t, i) => (
                <button key={t} onClick={() => setTimeRange(i)} className="px-3 h-7 rounded-md text-xs font-medium transition-all"
                  style={timeRange === i ? { background: LC.primary, color: LC.textInverse } : { background: LC.textInverse, color: LC.textMuted }}>{t}</button>
              ))}
            </div>
          </div>
        </>
      }
    />
  );
}
