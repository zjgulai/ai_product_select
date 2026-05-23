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
              <img src="/assets/shops/s2.jpg" alt="" className="w-7 h-7 rounded object-cover ring-1 ring-lc-border" />
              <div>
                <div className="text-xs font-medium text-lc-text-primary">{item.name}</div>
                <div className="text-[10px] text-lc-text-muted">{item.country} | {item.category}</div>
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
              <div className="text-[10px] font-medium text-lc-success">{item.salesGrowth}</div>
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
              <div className="text-[10px] font-medium" style={{ color: (item.revenueGrowth ?? '').startsWith('+') ? LC.success : LC.danger }}>{item.revenueGrowth}</div>
            </div>
          ),
        },
        { key: 'activeProducts', label: '动销商品数', align: 'right' },
        { key: 'totalProducts', label: '在售商品数', align: 'right' },
        { key: 'newRatio', label: '新商品占比', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num text-lc-text-muted">{item.newRatio}</span> },
        { key: 'totalSales', label: '总销量', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num font-semibold text-lc-text-primary">{(item.totalSales ?? 0).toLocaleString()}</span> },
        { key: 'totalRevenue', label: '总销售额($)', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num font-semibold text-lc-primary">{parseFloat(item.totalRevenue ?? '0').toLocaleString()}</span> },
        { key: 'rating', label: '评分', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num font-semibold" style={{ color: parseFloat(item.rating ?? '0') >= 4.5 ? LC.success : LC.teal }}>{item.rating}</span> },
        { key: 'influencers', label: '关联达人', align: 'right', render: (item: TikTokShop) => <span className="text-xs font-mono-num text-lc-text-primary">{(item.influencers ?? 0).toLocaleString()}</span> },
        { key: 'shopType', label: '卖家类型', render: (item: TikTokShop) => <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: `${LC.teal}10`, color: LC.teal }}>{item.shopType}</span> },
        { key: 'action', label: '操作', align: 'center', width: '60px', render: () => <button className="transition-colors text-lc-border-strong hover:text-lc-primary"><Star size={13} /></button> },
      ]}
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
