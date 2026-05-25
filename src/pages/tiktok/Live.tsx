/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { CATEGORIES } from '@/data/mockData';
import { Skeleton } from '@/components/ui/skeleton';
import { LC } from '@/lib/lute-colors';
import { Search, Download, Star, ChevronLeft, ChevronRight, SearchX } from 'lucide-react';
import EmptyState from '@/components/shared/EmptyState';

const TABS = ["直播人气榜", "直播涨粉榜"];
const TIME_RANGES = ["全部", "日", "近7天", "近30天", "自定义"];

export default function TikTokLive() {
  const [tab, setTab] = useState(0);
  const [timeRange, setTimeRange] = useState(2);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const [selectedCats, setSelectedCats] = useState<string[]>([]);
  const limit = 20;

  const toggleCategory = (cat: string) => {
    setSelectedCats(prev => prev.includes(cat) ? prev.filter(c => c !== cat) : [...prev, cat]);
  };

  const { data, isLoading, isError } = trpc.tiktok.lives.list.useQuery(
    {
      search: searchText || undefined,
      limit,
      offset: page * limit,
    },
    { staleTime: 5 * 60 * 1000 }
  );

  const total = data?.total || 0;
  const totalPages = Math.ceil(total / limit);

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["TikTok趋势", "直播"]} />
      <div className="bg-white rounded-xl shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-0">
          <div className="relative flex-1 max-w-[500px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="商品名称、达人名称、达人账号、直播标题"
              className="w-full h-9 pl-9 pr-3 rounded-l-full border border-r-0 text-xs focus:outline-none"
              style={{ borderColor: LC.border, color: LC.text }} />
          </div>
          <button className="h-9 px-6 text-white text-xs font-medium rounded-r-full bg-lc-primary">搜索</button>
        </div>
      </div>
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 ring-1 ring-lc-border/60">
        <div className="flex gap-6">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(i); setPage(0); }} className="pb-2.5 text-xs font-medium transition-all border-b-2"
              style={tab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{t}</button>
          ))}
        </div>
      </div>
      {/* Filters + Categories */}
      <div className="bg-white p-3 border-b border-lc-border">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-lc-text-secondary">开播时间:</span>
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
        </div>
      </div>
      <div className="bg-white rounded-b-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">直播信息</h3>
          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-lc-text-muted">共 {total} 条</span>
            <button className="flex items-center gap-1 text-xs font-medium text-lc-primary"><Download size={12} /> 数据导出</button>
          </div>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-8 w-10 rounded" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {["直播信息", "开播时间", "累计观看人次", "最高在线人数", "总点赞数", "总回复数", "涨粉数", "达人信息", "操作"].map((h, i) => (
                    <th key={h} className={`py-3 px-3 text-xs font-semibold text-lc-text-secondary ${i===0?'text-left w-[200px]':i===1?'text-left w-[200px]':i===8?'text-center w-[60px]':'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item: any, idx: number) => (
                  <tr key={item.id ?? idx} className="border-b hover:bg-lc-bg-warm transition-colors border-lc-border-light">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-10 h-8 rounded flex items-center justify-center shrink-0 ring-1 ring-lc-border bg-lc-primary-light"><span className="text-xs"><div className="w-2 h-2 rounded-full bg-lc-primary" /></span></div>
                        <span className="text-xs truncate max-w-[140px] text-lc-text-primary" title={item.title}>{item.title}</span>
                      </div>
                    </td>
                     <td className="py-3 px-3">
                       <div className="text-xs space-y-0.5 text-lc-text-muted">
                         <div>开播 {item.startTime}</div>
                         <div className="font-medium text-lc-text-secondary">时长 {typeof item.duration === 'number' ? `${Math.floor(item.duration/60)}h${item.duration%60}m` : item.duration}</div>
                       </div>
                     </td>
                     <td className="py-3 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">{(item.viewers ?? 0).toLocaleString()}</td>
                     <td className="py-3 px-3 text-right text-xs font-mono-num font-semibold text-lc-text-primary">{(item.maxOnline ?? item.peakOnline ?? 0).toLocaleString()}</td>
                     <td className="py-3 px-3 text-right text-xs font-mono-num text-lc-text-primary">{(item.likes ?? 0).toLocaleString()}</td>
                     <td className="py-3 px-3 text-right text-xs font-mono-num text-lc-text-secondary">{(item.comments ?? item.replies ?? 0).toLocaleString()}</td>
                     <td className="py-3 px-3 text-right"><span className="text-xs font-mono-num font-semibold" style={{ color: LC.success }}>{(item.newFans ?? 0).toLocaleString()}</span></td>
                     <td className="py-3 px-3">
                       <div className="flex items-center gap-1.5">
                         <div className="w-6 h-6 rounded-full flex items-center justify-center text-[8px] font-semibold ring-1 ring-lc-border" style={{ background: `${LC.primary}10`, color: LC.primary }}>{(item.creator ?? '?')[0]?.toUpperCase()}</div>
                         <div><div className="text-xs truncate max-w-[70px] text-lc-text-primary">{item.creator ?? '未知达人'}</div><div className="text-xs font-mono-num text-lc-text-muted">{((item.creatorFollowers ?? 0)/1000000).toFixed(0)}M粉</div></div>
                       </div>
                     </td>
                     <td className="py-3 px-3 text-center"><button className="transition-colors text-lc-border-strong hover:text-lc-primary"><Star size={13} /></button></td>
                  </tr>
                ))}
                {(!data?.items || data.items.length === 0) && (
                  <tr><td colSpan={9}><EmptyState compact icon={SearchX} title="没有找到符合条件的直播" description={searchText || selectedCats.length > 0 ? "尝试调整筛选条件或清除搜索" : undefined} primaryAction={searchText || selectedCats.length > 0 ? { label: '清除筛选', onClick: () => { setSearchText(''); setSelectedCats([]); setPage(0); } } : undefined} /></td></tr>
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
