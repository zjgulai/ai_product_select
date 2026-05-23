import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Package } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const TABS = ["商品", "达人", "小店", "视频", "直播"];

export default function TikTokAttention() {
  const [tab, setTab] = useState(0);

  // 使用 fusion concepts 作为关注数据（暂时没有专门的关注接口）
  const { data, isLoading, isError } = trpc.fusion.concepts.list.useQuery(
    { limit: 20 },
    { staleTime: 5 * 60 * 1000 }
  );

  const items = data?.items || [];

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["TikTok趋势", "关注"]} />
      <div className="bg-white rounded-lg shadow-lc p-6 ring-1 ring-lc-border/60">
        <h2 className="text-base font-semibold mb-4 text-lc-primary">我的关注</h2>
        <div className="flex gap-6 border-b mb-8 border-lc-border">
          {TABS.map((t, i) => (
            <button key={t} onClick={() => setTab(i)}
              className="pb-2.5 text-xs font-medium transition-all border-b-2"
              style={tab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>{t}</button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-9 w-9 rounded" />
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        ) : items.length > 0 ? (
          <div className="space-y-2">
            {items.map((item: any) => (
              <div key={item.conceptId} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-lc-bg-warm transition-colors border-lc-border">
                <div className="w-9 h-9 rounded flex items-center justify-center text-xs font-bold" style={{ background: LC.primaryLight, color: LC.primary }}>
                  {item.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-[10px] truncate text-lc-text-muted">{item.nameEn}</div>
                </div>
                <div className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ background: LC.successLight, color: LC.success }}>
                  已关注
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center mb-4 border-lc-border">
              <Package size={28} className="text-lc-border" />
            </div>
            <p className="text-sm font-medium text-lc-text-muted">暂无数据</p>
            <p className="text-xs mt-1 text-lc-border-strong">您关注的内容将显示在这里</p>
          </div>
        )}
      </div>
    </div>
  );
}
