import { useState } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import MiniTrend from '@/components/shared/MiniTrend';
import { Skeleton } from '@/components/ui/skeleton';
import { LC } from '@/lib/lute-colors';
import { ChevronRight, ArrowRight } from 'lucide-react';
import { PRODUCT_IMAGES } from '@/data/assets';
import DataBadge from '@/components/shared/DataBadge';



const STAT_LINKS: Record<string, string> = {
  "参数趋势": "/amazon/param-trend",
  "品牌趋势": "/amazon/brand-trend",
  "热门市场": "/amazon/hot-market",
  "潜力市场": "/amazon/pot-market",
};

const EXAMPLE_REPORTS = [
  { keyword: "air fryer", productCount: 344, date: "2024-10-15" },
  { keyword: "vacuum", productCount: 395, date: "2024-10-15" },
  { keyword: "women tshirts", productCount: 593, date: "2024-10-15" },
  { keyword: "string trimmer", productCount: 390, date: "2024-10-15" },
  { keyword: "camping chairs", productCount: 513, date: "2024-10-15" },
  { keyword: "massage gun deep tissue", productCount: 341, date: "2024-10-15" },
];

export default function AmazonKeyword() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");
  const [hasSearched, setHasSearched] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // tRPC queries
  const { data: stats, isLoading: statsLoading, isError } = trpc.amazon.keyword.stats.useQuery();
  const { data: searchResults, isLoading: searchLoading } = trpc.amazon.keyword.search.useQuery(
    { query: searchQuery },
    { enabled: hasSearched && searchQuery.length > 0, staleTime: 5 * 60 * 1000 }
  );

  const handleSearch = () => {
    if (searchText.trim()) {
      setSearchQuery(searchText.trim());
      setHasSearched(true);
    }
  };

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["Amazon趋势", "关键词趋势"]} />

      {/* Search Section */}
      <div className="bg-white rounded-xl shadow-lc p-6 mb-4 ring-1 ring-lc-border/60 text-center" style={{ background: 'linear-gradient(180deg, #FFFFFF 0%, #FDF8F6 100%)', boxShadow: '0 12px 28px rgba(53,20,26,0.04)' }}>
        <h2 className="text-xl font-bold mb-1 text-lc-primary">产品创新加速器，亿级卖家都在用</h2>
        <p className="text-xs mb-5 text-lc-text-muted">自定义产品属性分析，细分市场趋势智能捕获，AI评价一键获取</p>
        <div className="flex items-center justify-center gap-0 max-w-[600px] mx-auto">
          <div className="flex items-center gap-1.5 px-3 h-10 border border-r-0 rounded-l-lg bg-white border-lc-border">
            <span className="text-base"><span className="text-xs">US</span></span>
            <span className="text-xs font-medium text-lc-text-secondary">美国</span>
            <ChevronRight size={12} className="text-lc-border-strong rotate-90" />
          </div>
          <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="请输入关键词" className="flex-1 h-10 px-4 border border-r-0 text-sm transition-all focus:outline-none" style={{ borderColor: LC.border, color: LC.text }} />
          <button onClick={handleSearch} className="h-10 px-6 text-white text-sm font-medium rounded-r-lg transition-all hover:brightness-110 bg-lc-primary">搜索</button>
        </div>
        {hasSearched && searchText && (
          <div className="flex items-center gap-4 mt-3 justify-center">
            <span className="text-xs text-lc-text-muted">已选关键词:</span>
            <span className="text-xs px-3 py-0.5 rounded-full font-medium" style={{ background: `${LC.primary}10`, color: LC.primary }}>{searchText}</span>
          </div>
        )}
      </div>

      {/* Stats Cards - Clickable */}
      {!hasSearched && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl shadow-lc p-4 ring-1 ring-lc-border/40">
                <Skeleton className="h-4 w-24 mb-2" />
                <Skeleton className="h-3 w-32 mb-4" />
                <Skeleton className="h-8 w-16" />
              </div>
            ))
          ) : (
            stats?.map((stat) => (
              <div key={stat.title}
                onClick={() => { const link = STAT_LINKS[stat.title]; if (link) navigate(link); }}
                className="bg-white rounded-xl shadow-lc p-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-lc-hover cursor-pointer group ring-1 ring-lc-border/40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-16 h-16 rounded-full opacity-5 group-hover:opacity-10 transition-opacity" style={{ background: LC.primary, transform: 'translate(30%, -30%)' }} />
                <h4 className="text-sm font-bold mb-0.5 text-lc-text-primary">{stat.title}</h4>
                <p className="text-[11px] mb-3 text-lc-text-muted">{stat.desc}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xl font-bold font-mono-num text-lc-primary">{stat.value}</span>
                  <ArrowRight size={16} className="transition-all group-hover:translate-x-1 text-lc-text-muted" />
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Example Reports */}
      {!hasSearched && (
        <div className="bg-white rounded-xl shadow-lc p-4 ring-1 ring-lc-border/60" style={{ boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-lc-primary">查看示例报告</h3>
            <span className="text-xs text-lc-text-muted">以下为各类目示例报告</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {EXAMPLE_REPORTS.map((report, ri) => (
              <div key={report.keyword} className="border rounded-xl p-3 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lc-hover cursor-pointer group border-lc-border">
                <div className="flex items-center justify-between mb-2">
                  <DataBadge type="real" />
                </div>
                <h4 className="text-sm font-semibold mb-2 text-lc-primary">{report.keyword}</h4>
                <img src={PRODUCT_IMAGES[ri % PRODUCT_IMAGES.length]} alt={report.keyword} loading="lazy" className="w-14 h-14 rounded object-cover mb-2 ring-1 ring-lc-border"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-size='16' fill='%23C8C3BC'%3E📷%3C/text%3E%3C/svg%3E"; }}/>
                <div className="text-[11px] font-mono-num text-lc-text-muted">商品数量: {report.productCount}</div>
                <div className="text-[11px] text-lc-text-muted">报告日期: {report.date}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <div className="bg-white rounded-xl shadow-lc overflow-hidden ring-1 ring-lc-border/60" style={{ boxShadow: '0 10px 24px rgba(53,20,26,0.04)' }}>
          <div className="p-4 border-b border-lc-border">
            <h3 className="text-sm font-semibold text-lc-primary">搜索结果</h3>
            <p className="text-xs mt-0.5 text-lc-text-muted">
              {searchLoading ? '正在搜索...' : `找到 ${searchResults?.length || 0} 条结果`}
            </p>
          </div>
          <div className="overflow-x-auto">
            {searchLoading ? (
              <div className="p-4 space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-4 w-12" />
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full min-w-[640px]">
                <thead>
                  <tr className="bg-lc-bg-warm">
                    {["排名", "关键词", "亚马逊搜索趋势", "月销量", "月销售额($)", "平均价格($)", "评分", "操作"].map((h, i) => (
                      <th key={h} className={`py-3 px-3 text-xs font-semibold text-lc-text-secondary ${i===0?'text-left w-[60px]':i===1?'text-left w-[200px]':i===2?'text-center w-[150px]':'text-right'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {searchResults?.map((item, idx) => (
                    <tr key={idx} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                      <td className="py-3 px-3 text-xs font-mono-num text-lc-text-muted">{item.rank}</td>
                      <td className="py-3 px-3">
                        <div className="text-xs font-semibold text-lc-primary">{item.keyword}</div>
                        <button className="text-xs font-medium" style={{ color: LC.teal }}>查看所属类目</button>
                      </td>
                      <td className="py-3 px-3"><div className="flex justify-center"><MiniTrend data={item.trend} /></div></td>
                      <td className="py-3 px-3 text-right">
                        <div className="text-xs font-mono-num font-semibold text-lc-text-primary">{item.monthlySales.toLocaleString()}</div>
                        <div className="text-xs font-medium" style={{ color: LC.success }}>{item.salesGrowth}</div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="text-xs font-mono-num font-semibold text-lc-primary">{item.monthlyRevenue.toLocaleString()}</div>
                        <div className="text-xs font-medium" style={{ color: LC.success }}>{item.revenueGrowth}</div>
                      </td>
                      <td className="py-3 px-3 text-right text-xs font-mono-num font-medium text-lc-text-primary">{item.avgPrice}</td>
                      <td className="py-3 px-3 text-right"><span className="text-xs font-mono-num font-semibold" style={{ color: item.avgRating >= 4.5 ? LC.success : LC.teal }}>{item.avgRating}</span></td>
                      <td className="py-3 px-3 text-center">
                        <button onClick={() => { import('sonner').then(({ toast }) => toast.info('演示环境：商品详情页')); }} className="text-xs font-medium block mb-1 text-lc-primary">查看商品</button>
                        <button onClick={() => { import('sonner').then(({ toast }) => toast.success('报告已创建（演示）')); }} className="text-xs text-white px-2 py-0.5 rounded-sm font-medium bg-lc-primary">创建报告</button>
                      </td>
                    </tr>
                  ))}
                  {searchResults?.length === 0 && (
                    <tr><td colSpan={8} className="py-8 text-center text-xs text-lc-text-muted">暂无搜索结果</td></tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
