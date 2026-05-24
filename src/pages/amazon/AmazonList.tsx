import { useState, useCallback } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import CategoryFilter from '@/components/shared/CategoryFilter';

import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router';
import { LC } from '@/lib/lute-colors';
import { Download, MessageSquare, Search } from 'lucide-react';

const TABS = ["商品热销榜", "商品飙升榜", "商品新品榜"];
const PRODUCT_IMAGES = ["/assets/products/p5.jpg","/assets/products/p1.jpg","/assets/products/p2.jpg","/assets/products/p3.jpg","/assets/products/p4.jpg"];

export default function AmazonListPage() {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [inputValue, setInputValue] = useState("");

  const handleSearch = useCallback(() => setSearchText(inputValue), [inputValue]);

  const { data, isLoading, isError } = trpc.amazon.products.list.useQuery(
    { search: searchText || undefined, limit: 50 },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["Amazon榜单"]} />
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-3">
          <div className="flex gap-6">
            {TABS.map((t, i) => (
              <button key={t} onClick={() => setTab(i)} className="pb-2.5 text-xs font-medium transition-all border-b-2"
                style={tab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{t}</button>
            ))}
          </div>
          <div className="flex items-center gap-0 mb-1">
            <div className="relative">
              <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
              <input
                type="text"
                value={inputValue}
                onChange={e => setInputValue(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSearch()}
                placeholder="搜索商品、品牌、ASIN"
                className="w-52 h-8 pl-8 pr-3 rounded-l-full border border-r-0 text-xs focus:outline-none focus:ring-1 border-lc-border text-lc-text-primary"
              />
            </div>
            <button onClick={handleSearch} className="h-8 px-4 text-white text-xs font-medium rounded-r-full bg-lc-primary hover:brightness-110">搜索</button>
          </div>
        </div>
      </div>
      <CategoryFilter />
      <div className="bg-white rounded-b-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">商品信息</h3>
          <div className="flex items-center gap-2">
            <button className="flex items-center gap-1 text-xs font-medium text-lc-primary"><Download size={12} /> 数据导出</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-4 w-8" />
                  <Skeleton className="h-9 w-9 rounded" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {["排名","商品图片","商品名称","月销量","月销售额($)","价格($)","操作"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-xs font-semibold text-lc-text-secondary ${i===0?'text-left w-[50px]':i===1?'text-left w-[60px]':i===2?'text-left':i===6?'text-center w-[80px]':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item, idx) => (
                  <tr key={item.asin} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2.5 px-3 text-xs font-mono-num font-semibold" style={{ color: idx < 3 ? LC.primary : LC.textMuted }}>{idx + 1}</td>
                    <td className="py-2.5 px-3"><img src={PRODUCT_IMAGES[idx % PRODUCT_IMAGES.length]} alt="" className="w-9 h-9 rounded object-cover ring-1 ring-lc-border"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3C/svg%3E"; }}/></td>
                    <td className="py-2.5 px-3"><div className="text-xs truncate max-w-[200px] font-medium text-lc-text-primary" title={item.title}>{item.title}</div></td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">{(item.monthlySales ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-medium text-lc-primary">${parseFloat(item.monthlyRevenue ?? '0').toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">${item.price}</td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => navigate(`/amazon/reviews/${item.asin}`)}
                          className="transition-colors text-lc-border-strong hover:text-lc-primary"
                          title="查看评论"
                        >
                          <MessageSquare size={12} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr><td colSpan={7} className="py-8 text-center text-xs text-lc-text-muted">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
