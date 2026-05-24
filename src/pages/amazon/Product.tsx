import { useState, useCallback } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, X, SlidersHorizontal, BookmarkPlus, BookmarkCheck, Trash2, SearchX } from 'lucide-react';
import { PRODUCT_IMAGES } from '@/data/assets';
import EmptyState from '@/components/shared/EmptyState';
import { LC } from '@/lib/lute-colors';
import { useSavedFilters } from '@/hooks/useSavedFilters';




export default function AmazonProduct() {
  const [tags, setTags] = useState<string[]>([]);
  const [searchText, setSearchText] = useState("");
  const [priceMinInput, setPriceMinInput] = useState("");
  const [priceMaxInput, setPriceMaxInput] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [appliedPriceMin, setAppliedPriceMin] = useState<number | undefined>(undefined);
  const [appliedPriceMax, setAppliedPriceMax] = useState<number | undefined>(undefined);
  const [salesMinInput, setSalesMinInput] = useState("");
  const [salesMaxInput, setSalesMaxInput] = useState("");
  const [showAdvanced, setShowAdvanced] = useState(false);

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
    setSearchText(""); setPriceMinInput(""); setPriceMaxInput(""); setSalesMinInput(""); setSalesMaxInput("");
    setAppliedSearch(""); setAppliedPriceMin(undefined); setAppliedPriceMax(undefined);
    setTags([]); setShowAdvanced(false);
  };

  const currentFilterState = { searchText, priceMinInput, priceMaxInput, salesMinInput, salesMaxInput, tags };
  const { saved, save, remove, apply, showSaveInput, setShowSaveInput, saveName, setSaveName } = useSavedFilters('amazon_product', currentFilterState);

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
          <button onClick={handleQuery} className="h-9 px-5 text-white text-xs font-medium rounded-md bg-lc-primary">查询</button>
          <button onClick={handleReset} className="h-9 px-5 text-xs font-medium rounded-md border" style={{ color: LC.textSecondary, borderColor: LC.border }}>重置</button>
          <button onClick={() => setShowAdvanced(!showAdvanced)} className="h-9 px-3 text-xs font-medium rounded-md border flex items-center gap-1" style={{ color: LC.textSecondary, borderColor: LC.border }}>
            <SlidersHorizontal size={12} /> 高级筛选
          </button>
          {showSaveInput ? (
            <div className="flex items-center gap-1 ml-auto">
              <input
                value={saveName}
                onChange={e => setSaveName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && save(saveName)}
                placeholder="筛选器名称"
                className="h-7 w-28 px-2 text-xs rounded border"
                style={{ borderColor: LC.border }}
                autoFocus
              />
              <button onClick={() => save(saveName)} className="h-7 px-2 text-xs rounded text-white" style={{ background: LC.primary }}>保存</button>
              <button onClick={() => setShowSaveInput(false)} className="h-7 px-2 text-xs rounded border" style={{ borderColor: LC.border, color: LC.textSecondary }}>取消</button>
            </div>
          ) : (
            <button
              onClick={() => setShowSaveInput(true)}
              className="h-9 px-3 text-xs font-medium rounded-md border flex items-center gap-1 ml-auto"
              style={{ color: LC.textSecondary, borderColor: LC.border }}
            >
              <BookmarkPlus size={12} /> 保存筛选
            </button>
          )}
        </div>
      </div>
      {saved.length > 0 && (
        <div className="bg-white px-3 py-2 border-b ring-1 ring-lc-border/60 border-lc-border flex items-center gap-2 flex-wrap">
          <span className="text-xs text-lc-text-muted">快速筛选:</span>
          {saved.map(f => (
            <button
              key={f.id}
              onClick={() => {
                const a = apply(f) as typeof currentFilterState;
                setSearchText(a.searchText); setPriceMinInput(a.priceMinInput); setPriceMaxInput(a.priceMaxInput);
                setSalesMinInput(a.salesMinInput); setSalesMaxInput(a.salesMaxInput); setTags(a.tags);
              }}
              className="flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border transition-colors"
              style={{ borderColor: `${LC.primary}30`, color: LC.primary, background: LC.primaryLight }}
            >
              <BookmarkCheck size={10} />
              {f.name}
              <span onClick={(e) => { e.stopPropagation(); remove(f.id); }} className="ml-0.5 hover:text-lc-danger"><Trash2 size={9} /></span>
            </button>
          ))}
        </div>
      )}
      <div className="bg-white p-3 border-b ring-1 ring-lc-border/60 border-lc-border">
        <div className="flex items-center gap-3 flex-wrap">
          {tags.map(tag => (
            <span key={tag} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full font-medium" style={{ background: `${LC.primary}10`, color: LC.primary }}>
              {tag}<button onClick={() => removeTag(tag)}><X size={10} /></button>
            </span>
          ))}
          <input type="text" placeholder="月份" className="w-24 h-7 border rounded px-2 text-xs font-mono-num" style={{ borderColor: LC.border, color: LC.text }} />
          <span className="text-xs font-medium text-lc-text-secondary">上架时间:</span>
          <input type="date" className="h-7 border rounded text-xs px-2 border-lc-border" />
          <span className="text-xs text-lc-border-strong">-</span>
          <input type="date" className="h-7 border rounded text-xs px-2 border-lc-border" />
          <select className="h-7 border rounded text-xs px-2 font-medium" style={{ borderColor: LC.border, color: LC.textSecondary }}><option>默认: 总销量从高到低</option></select>
        </div>
        {showAdvanced && (
          <div className="flex items-center gap-3 flex-wrap mt-2 pt-2 border-t border-lc-border-light">
            <span className="text-xs font-medium text-lc-text-secondary">销量:</span>
            <input type="text" value={salesMinInput} onChange={e => setSalesMinInput(e.target.value)} placeholder="最小值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
            <span className="text-xs text-lc-border-strong">-</span>
            <input type="text" value={salesMaxInput} onChange={e => setSalesMaxInput(e.target.value)} placeholder="最大值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
            <span className="text-xs font-medium text-lc-text-secondary">价格($):</span>
            <input type="text" value={priceMinInput} onChange={e=>setPriceMinInput(e.target.value)} placeholder="最小值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
            <span className="text-xs text-lc-border-strong">-</span>
            <input type="text" value={priceMaxInput} onChange={e=>setPriceMaxInput(e.target.value)} placeholder="最大值" className="w-20 h-7 border rounded px-2 text-xs" style={{ borderColor: LC.border, color: LC.text }} />
          </div>
        )}
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
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {["商品图片","商品名称","月销量","月销售额($)","价格($)","品牌","操作"].map((h, i) => (
                    <th key={h} className={`py-2.5 px-3 text-xs font-semibold text-lc-text-secondary ${i===0?'text-left w-[60px]':i===1?'text-left':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item, idx) => (
                  <tr key={item.asin} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-2.5 px-3"><img src={PRODUCT_IMAGES[idx % PRODUCT_IMAGES.length]} alt={item.title} loading="lazy" className="w-9 h-9 rounded object-cover ring-1 ring-lc-border"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/></td>
                    <td className="py-2.5 px-3"><div className="text-xs truncate max-w-[180px] font-medium text-lc-text-primary" title={item.title}>{item.title}</div></td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">{(item.monthlySales ?? 0).toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-medium text-lc-primary">${parseFloat(item.monthlyRevenue ?? '0').toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">${item.price}</td>
                    <td className="py-2.5 px-3 text-xs font-medium text-lc-text-primary">{item.brand}</td>
                    <td className="py-2.5 px-3 text-center"><span className="text-xs font-medium text-lc-text-muted">-</span></td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr><td colSpan={7}><EmptyState compact icon={SearchX} title="没有找到符合条件的商品" description={appliedSearch || appliedPriceMin || appliedPriceMax ? "尝试调整筛选条件或清除搜索" : undefined} primaryAction={appliedSearch || appliedPriceMin || appliedPriceMax ? { label: '清除筛选', onClick: () => { setAppliedSearch(''); setSearchText(''); setAppliedPriceMin(undefined); setAppliedPriceMax(undefined); setPriceMinInput(''); setPriceMaxInput(''); } } : undefined} /></td></tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
