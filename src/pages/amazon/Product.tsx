import { useState, useCallback } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import MiniTrend from '@/components/shared/MiniTrend';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, Star, BarChart3, ShoppingCart, X } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const PRODUCT_IMAGES = ["/assets/products/p6.jpg","/assets/products/p5.jpg","/assets/products/p1.jpg","/assets/products/p2.jpg","/assets/products/p3.jpg"];

export default function AmazonProduct() {
  const [tags, setTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedPriceMin, setAppliedPriceMin] = useState<number | undefined>(undefined);
  const [appliedPriceMax, setAppliedPriceMax] = useState<number | undefined>(undefined);

  const removeTag = (tag: string) => setTags(tags.filter(t => t !== tag));

  const handleQuery = useCallback(() => {
    setAppliedSearch(searchText);
    setAppliedPriceMin(priceMinInput ? parseFloat(priceMinInput) : undefined);
    setAppliedPriceMax(priceMaxInput ? parseFloat(priceMaxInput) : undefined);
    if (searchText.trim()) {
      setTags(prev => prev.includes(searchText.trim()) ? prev : [...prev, searchText.trim()]);
    }
  }, [searchText, priceMinInput, priceMaxInput]);

  const handleReset = () => {
    setSearchText(""); setPriceMinInput(""); setPriceMaxInput("");
    setAppliedSearch(""); setAppliedPriceMin(undefined); setAppliedPriceMax(undefined);
    setTags([]);
  };

  const { data, isLoading, isError } = trpc.amazon.products.list.useQuery({
    search: appliedSearch || undefined,
    priceMin: appliedPriceMin,
    priceMax: appliedPriceMax,
    limit: 50,
  });

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["商品榜单"]} />
      <div className="bg-white rounded-lg shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-2">
          <div className="relative flex-1 max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleQuery()}
              placeholder="请输入商品名称/ASIN/品牌" className="w-full h-9 pl-9 pr-3 rounded-l-full border border-r-0 text-xs focus:outline-none" style={{ borderColor: LC.border, color: LC.text }} />
          </div>
          <button onClick={handleQuery} className="h-9 px-6 text-white text-xs font-medium rounded-r-full bg-lc-primary">搜索</button>
          <button className="h-9 px-3 text-xs font-medium ml-2 text-lc-primary">高级搜索</button>
        </div>
      </div>
      <div className="bg-white p-3 border-b ring-1 ring-lc-border/60 border-lc-border">
        <div className="flex items-center gap-3 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${LC.primary}10`, color: LC.primary }}>
              {tag}<button onClick={() => removeTag(tag)}><X size={10} /></button>
            </span>
          ))}
          <select className="h-7 border rounded text-xs px-2 font-medium" style={{ borderColor: LC.border, color: LC.textSecondary }}><option>商品类目</option></select>
          <input type="text" defaultValue="202603" className="w-24 h-7 border rounded px-2 text-xs font-mono-num" style={{ borderColor: LC.border, color: LC.text }} />
          <span className="text-xs font-medium text-lc-text-secondary">上架时间:</span>
          <input type="date" className="h-7 border rounded text-xs px-2 border-lc-border" />
          <span className="text-xs text-lc-border-strong">-</span>
          <input type="date" className="h-7 border rounded text-xs px-2 border-lc-border" />
          <span className="text-xs font-medium text-lc-text-secondary">销量:</span>
          <input type="text" placeholder="最小值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
          <span className="text-xs text-lc-border-strong">-</span>
          <input type="text" placeholder="最大值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
          <span className="text-xs font-medium text-lc-text-secondary">价格($):</span>
          <input type="text" value={priceMinInput} onChange={e=>setPriceMinInput(e.target.value)} placeholder="最小值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
          <span className="text-xs text-lc-border-strong">-</span>
          <input type="text" value={priceMaxInput} onChange={e=>setPriceMaxInput(e.target.value)} placeholder="最大值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
          <select className="h-7 border rounded text-xs px-2 font-medium" style={{ borderColor: LC.border, color: LC.textSecondary }}><option>默认: 总销量从高到低</option></select>
          <div className="flex gap-2 ml-auto">
            <button onClick={handleQuery} className="h-7 px-5 text-white text-xs font-medium rounded-md bg-lc-primary">查询</button>
            <button onClick={handleReset} className="h-7 px-5 text-xs font-medium rounded-md border" style={{ color: LC.textSecondary, borderColor: LC.border }}>重置</button>
          </div>
        </div>
      </div>
      <div className="bg-white rounded-b-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">商品信息</h3>
          <div className="flex items-center gap-2">
            <span className="text-xs text-lc-text-muted">共 {data?.total || 0} 条</span>
            <button className="flex items-center gap-1 text-xs font-medium text-lc-primary"><Download size={12} /> 数据导出</button>
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
                  <Skeleton className="h-4 w-12" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {["商品图片","商品名称","月销量","月销售额($)","销量趋势","价格($)","ASIN","类目树","品牌","上架时间","1688货源","操作"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-xs font-semibold text-lc-text-secondary ${i===0?'text-left w-[60px]':i===1?'text-left':i===4?'text-center w-[120px]':i===11?'text-center w-[80px]':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item, idx) => (
                  <tr key={item.asin} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2.5 px-3"><img src={PRODUCT_IMAGES[idx % PRODUCT_IMAGES.length]} alt="" className="w-9 h-9 rounded object-cover ring-1 ring-lc-border"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/></td>
                    <td className="py-2.5 px-3"><div className="text-xs truncate max-w-[180px] font-medium text-lc-text-primary" title={item.title}>{item.title}</div></td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">{(item.monthlySales ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-medium text-lc-primary">${parseFloat(item.monthlyRevenue ?? '0').toLocaleString()}</td>
                    <td className="py-2.5 px-3"><div className="flex justify-center"><MiniTrend data={item.salesTrend ?? []} /></div></td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">${item.price}</td>
                    <td className="py-2.5 px-3 text-xs font-mono-num font-medium text-lc-primary">{item.asin}</td>
                    <td className="py-2.5 px-3 text-xs truncate max-w-[200px] text-lc-text-muted">{item.categoryPath || item.category}</td>
                    <td className="py-2.5 px-3 text-xs font-medium text-lc-text-primary">{item.brand}</td>
                    <td className="py-2.5 px-3 text-xs font-mono-num text-lc-text-muted">{item.launchDate?.toString()}</td>
                    <td className="py-2.5 px-3"><span className="text-xs font-medium cursor-pointer text-lc-primary">商品组(0)</span></td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center justify-center gap-1">
                        {[Star, BarChart3, ShoppingCart].map((Icon, ii) => (
                          <button key={ii} className="transition-colors text-lc-border-strong" onMouseEnter={e => e.currentTarget.classList.add('text-lc-primary')} onMouseLeave={e => e.currentTarget.classList.add('text-lc-border-strong')}><Icon size={12} /></button>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr><td colSpan={12} className="py-8 text-center text-xs text-lc-text-muted">暂无数据</td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
