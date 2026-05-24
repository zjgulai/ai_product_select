/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { CATEGORIES } from '@/data/mockData';
import MiniTrend from '@/components/shared/MiniTrend';
import { Skeleton } from '@/components/ui/skeleton';
import { LC } from '@/lib/lute-colors';
import { Search, Download, Star, ShoppingCart, ChevronLeft, ChevronRight, Filter, SearchX } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';
import { PRODUCT_IMAGES } from '@/data/assets';

const TABS = ["商品热销榜", "商品飙升榜", "商品新品榜"];
const TAB_KEYS = ["hot", "soaring", "new"] as const;
const TIME_RANGES = ["全部", "日", "近7天", "近30天", "自定义"];

export default function TikTokProducts() {
  const [tab, setTab] = useState(0);
  const [timeRange, setTimeRange] = useState(2);
  const [searchText, setSearchText] = useState("");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");
  const [ratingMin, setRatingMin] = useState("");
  const [page, setPage] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const limit = 20;

  const { data, isLoading, isError } = trpc.tiktok.products.list.useQuery(
    {
      tab: TAB_KEYS[tab],
      search: searchText || undefined,
      priceMin: priceMin ? parseFloat(priceMin) : undefined,
      priceMax: priceMax ? parseFloat(priceMax) : undefined,
      ratingMin: ratingMin ? parseFloat(ratingMin) : undefined,
      limit,
      offset: page * limit,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  const toggleCategory = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn relative">
      <Breadcrumb items={["TikTok趋势", "商品"]} />

      {/* Search */}
      <div className="bg-white rounded-lg shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-0">
          <div className="relative flex-1 max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="商品标题"
              className="w-full h-9 pl-9 pr-3 rounded-l-full border border-r-0 text-xs transition-all focus:outline-none focus:ring-1"
              style={{ borderColor: LC.border, color: LC.text }} />
          </div>
          <button className="h-9 px-6 text-white text-xs font-medium rounded-r-full transition-all hover:brightness-110 bg-lc-primary">搜索</button>
          {searchText && (
            <span className="ml-2 text-xs font-medium text-lc-text-muted">找到 {total} 条</span>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 ring-1 ring-lc-border/60">
        <div className="flex gap-6">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(i); setPage(0); }} className="pb-2.5 text-xs font-medium transition-all border-b-2"
              style={tab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{t}</button>
          ))}
        </div>
      </div>

      {/* Time + Filters + Categories */}
      <div className="bg-white p-3 border-b border-lc-border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            {TIME_RANGES.map((t, i) => (
              <button key={t} onClick={() => setTimeRange(i)} className="px-3 h-7 rounded-md text-xs font-medium transition-all"
                style={timeRange === i ? { background: LC.primary, color: LC.textInverse } : { background: LC.textInverse, color: LC.textMuted }}>{t}</button>
            ))}
          </div>
          <div className="w-px h-5 bg-lc-border" />
          <div className="flex items-center gap-1.5 flex-wrap overflow-x-auto max-w-[280px]">
            <span className="text-xs font-medium text-lc-text-secondary shrink-0">类目:</span>
            {CATEGORIES.slice(0, 8).map(cat => (
              <button key={cat} onClick={() => toggleCategory(cat)}
                className="px-2 h-[22px] rounded-full text-[11px] transition-all duration-150 border font-medium shrink-0"
                style={selectedCats.includes(cat)
                  ? { backgroundColor: LC.primary, color: '#fff', borderColor: LC.primary }
                  : { backgroundColor: '#fff', color: LC.textSecondary, borderColor: LC.border }}>
                {cat}
              </button>
            ))}
          </div>
          <div className="w-px h-5 bg-lc-border" />
          <div className="flex items-center gap-1.5">
            <Filter size={11} className="text-lc-text-muted" />
            <span className="text-xs font-medium text-lc-text-secondary">价格:</span>
            <input type="number" value={priceMin} onChange={e => setPriceMin(e.target.value)} placeholder="$0" className="w-16 h-6 border rounded px-1.5 text-xs border-lc-border" />
            <span className="text-xs text-lc-border-strong">-</span>
            <input type="number" value={priceMax} onChange={e => setPriceMax(e.target.value)} placeholder="$999" className="w-16 h-6 border rounded px-1.5 text-xs border-lc-border" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-lc-text-secondary">评分:</span>
            <input type="number" value={ratingMin} onChange={e => setRatingMin(e.target.value)} placeholder="0" min="0" max="5" step="0.1" className="w-14 h-6 border rounded px-1.5 text-xs border-lc-border" />
          </div>
          <button onClick={() => { setPriceMin(""); setPriceMax(""); setRatingMin(""); setSearchText(""); setSelectedCats([]); setPage(0); }} className="ml-auto text-xs font-medium px-2 h-6 rounded transition-colors text-lc-text-muted">重置筛选</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-b-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">商品信息</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-lc-text-muted">共 {total} 条</span>
            <button className="flex items-center gap-1 text-xs font-medium transition-colors text-lc-primary">
              <Download size={12} /> 数据导出
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-9 w-9 rounded" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {["商品信息","销量","销售额($)","销量趋势","带货达人数","价格($)","评分","所属小店","操作"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-xs font-semibold text-lc-text-secondary ${i===0?'text-left w-[280px]':i===3?'text-center w-[120px]':i===8?'text-center w-[60px]':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item: any, idx: number) => (
                  <tr key={item.id ?? idx} className="border-b transition-colors hover:bg-lc-bg-warm border-lc-border-light">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2.5">
                        <img src={PRODUCT_IMAGES[idx % PRODUCT_IMAGES.length]} alt={item.title} loading="lazy" className="w-9 h-9 rounded object-cover ring-1 ring-lc-border shrink-0"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3C/svg%3E"; }}/>
                        <div>
                          <div className="text-xs truncate max-w-[200px] font-medium text-lc-text-primary" title={item.name}>{item.name}</div>
                          <span className="text-xs font-medium px-1.5 py-0.5 rounded-sm mt-0.5 inline-block" style={{ background: `${LC.primary}08`, color: LC.primary }}>{item.category}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="text-xs font-semibold font-mono-num text-lc-text-primary">{item.sales.toLocaleString()}</div>
                      <div className="text-xs font-medium" style={{ color: item.salesGrowth.startsWith('+') ? LC.success : LC.danger }}>{item.salesGrowth}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-primary">${item.revenue.toLocaleString()}</td>
                    <td className="py-2.5 px-3"><div className="flex justify-center"><MiniTrend data={item.trend} /></div></td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num text-lc-text-primary">{item.influencers.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary"
                      >{'priceRange' in item && item.priceRange ? item.priceRange : `$${item.price}`}</td>
                    <td className="py-2.5 px-3 text-right"><span className="text-xs font-mono-num font-semibold" style={{ color: item.rating >= 4.5 ? LC.success : item.rating >= 4 ? LC.teal : LC.warning }}>{item.rating}</span></td>
                    <td className="py-2.5 px-3"><div className="text-xs truncate max-w-[120px] text-lc-text-primary">{item.shop}</div></td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button className="transition-colors text-lc-border-strong hover:text-yellow-500"><Star size={13} /></button>
                        <button className="transition-colors text-lc-border-strong hover:text-lc-primary"><ShoppingCart size={13} /></button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr><td colSpan={9}><EmptyState compact icon={SearchX} title="没有找到符合条件的商品" description={searchText || selectedCats.length > 0 || priceMin || priceMax || ratingMin ? "尝试调整筛选条件或清除搜索" : undefined} primaryAction={searchText || selectedCats.length > 0 || priceMin || priceMax || ratingMin ? { label: '清除筛选', onClick: () => { setSearchText(''); setSelectedCats([]); setPriceMin(''); setPriceMax(''); setRatingMin(''); setPage(0); } } : undefined} /></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between p-3 border-t border-lc-border">
          <span className="text-xs font-medium text-lc-text-muted">共 {total} 条</span>
          <div className="flex items-center gap-1">
            <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="w-7 h-7 flex items-center justify-center rounded-md border" style={{ borderColor: LC.border, color: page === 0 ? '#D6D3D0' : LC.textMuted }}><ChevronLeft size={12} /></button>
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const p = i;
              return (
                <button key={p} onClick={() => setPage(p)} className="w-7 h-7 flex items-center justify-center rounded-md text-xs font-medium"
                  style={page === p ? { background: LC.primary, color: LC.textInverse } : { border: `1px solid ${LC.border}`, color: LC.textSecondary }}>{p + 1}</button>
              );
            })}
            <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="w-7 h-7 flex items-center justify-center rounded-md border" style={{ borderColor: LC.border, color: page >= totalPages - 1 ? '#D6D3D0' : LC.textMuted }}><ChevronRight size={12} /></button>
          </div>
        </div>
      </div>
    </div>
  );
}
