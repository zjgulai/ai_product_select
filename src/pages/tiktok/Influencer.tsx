/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import CategoryFilter from '@/components/shared/CategoryFilter';
import { Skeleton } from '@/components/ui/skeleton';
import { Search, Download, Star, ChevronLeft, ChevronRight } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const TABS = ["达人带货榜", "达人涨粉榜"];
const TAB_KEYS = ["sales", "fans"] as const;
const AVATAR_IMAGES = [import.meta.env.BASE_URL + "assets/avatars/a1.jpg", import.meta.env.BASE_URL + "assets/avatars/a2.jpg", import.meta.env.BASE_URL + "assets/avatars/a3.jpg"];

export default function TikTokInfluencer() {
  const [tab, setTab] = useState(0);
  const [searchText, setSearchText] = useState("");
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading, isError } = trpc.tiktok.creators.list.useQuery(
    {
      tab: TAB_KEYS[tab],
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
      <Breadcrumb items={["TikTok趋势", "达人"]} />

      {/* Search */}
      <div className="bg-white rounded-lg shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-0">
          <div className="relative flex-1 max-w-[400px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-lc-text-muted" />
            <input type="text" value={searchText} onChange={e => setSearchText(e.target.value)} placeholder="达人名称/账号"
              className="w-full h-9 pl-9 pr-3 rounded-l-full border border-r-0 text-xs transition-all focus:outline-none focus:ring-1"
              style={{ borderColor: LC.border, color: LC.text }} />
          </div>
          <button className="h-9 px-6 text-white text-xs font-medium rounded-r-full transition-all hover:brightness-110 bg-lc-primary">搜索</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-t-lg shadow-lc border-b px-4 pt-3 ring-1 ring-lc-border/60">
        <div className="flex gap-6">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => { setTab(i); setPage(0); }}
              className="pb-2.5 text-xs font-medium transition-all border-b-2"
              style={tab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{t}</button>
          ))}
        </div>
      </div>

      <CategoryFilter />

      {/* Table */}
      <div className="bg-white rounded-b-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">达人信息</h3>
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
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-32" />
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
                  {["达人信息", "带货数", "均播量", "粉丝数", "近30日销量", "近30日销售额($)", "操作"].map((h) => (
                    <th key={h} className={`py-2.5 px-3 text-xs font-semibold text-lc-text-secondary ${h === '达人信息' ? 'text-left w-[200px]' : h === '操作' ? 'text-center w-[60px]' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {data?.items.map((item: any, idx: number) => (
                  <tr key={item.creatorId ?? idx} className="border-b transition-colors hover:bg-lc-bg-warm border-lc-border-light">
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-2">
                        <img src={AVATAR_IMAGES[idx % AVATAR_IMAGES.length]} alt="" className="w-8 h-8 rounded-full object-cover ring-1 ring-lc-border shrink-0"  onError={e => { (e.target as HTMLImageElement).src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3C/svg%3E"; }}/>
                        <div>
                          <div className="text-xs font-medium text-lc-text-primary">{item.displayName || item.username}</div>
                          <div className="text-xs truncate max-w-[130px] text-lc-text-muted">{item.bio}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num text-lc-text-secondary">{item.productsCount?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num text-lc-text-secondary">{item.avgViews?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">
                      <div className="text-xs font-mono-num font-semibold text-lc-text-primary">{item.followers?.toLocaleString()}</div>
                      <div className="text-xs font-medium text-lc-success">{item.fanGrowth}</div>
                    </td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num text-lc-text-secondary">{item.monthlySales?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right text-xs font-mono-num font-semibold text-lc-primary">${item.monthlyRevenue?.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-center">
                      <button className="transition-colors text-lc-border-strong hover:text-lc-primary"><Star size={13} /></button>
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
