import { useState } from 'react';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { Package, Star, ShoppingBag, Users, Store, Play, Video } from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const TABS = [
  { label: "商品", icon: ShoppingBag },
  { label: "达人", icon: Users },
  { label: "小店", icon: Store },
  { label: "视频", icon: Play },
  { label: "直播", icon: Video },
];

const MOCK_PRODUCTS = [
  { id: 'p1', name: '便携温奶器 Pro Max', sub: '母婴用品 · $42.99 · ⭐4.7' },
  { id: 'p2', name: 'LED化妆镜 360°旋转', sub: '美妆工具 · $28.99 · ⭐4.5' },
  { id: 'p3', name: '智能宠物喂食器 5L', sub: '宠物用品 · $69.99 · ⭐4.6' },
];
const MOCK_CREATORS = [
  { id: 'c1', name: 'momlife_official', sub: '1.2M 粉丝 · 母婴博主' },
  { id: 'c2', name: 'babycare_tips', sub: '890K 粉丝 · 育儿达人' },
];
const MOCK_SHOPS = [
  { id: 's1', name: 'Momcozy Official Store', sub: '美国 · 综合评分 4.8' },
  { id: 's2', name: 'BabyGear Pro', sub: '英国 · 综合评分 4.6' },
];

export default function TikTokAttention() {
  const [tab, setTab] = useState(0);

  const { data, isLoading, isError } = trpc.fusion.concepts.list.useQuery(
    { limit: 20 },
    { staleTime: 5 * 60 * 1000 }
  );

  if (isError) return <ErrorState />;

  const concepts = data?.items || [];

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={["TikTok趋势", "关注"]} />
      <div className="bg-white rounded-lg shadow-lc p-6 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-lc-primary">我的关注</h2>
          <span className="text-[10px] text-lc-text-muted">关注商品、达人、小店，实时追踪动态</span>
        </div>
        <div className="flex gap-6 border-b mb-6 border-lc-border">
          {TABS.map((t, i) => (
            <button key={t.label} onClick={() => setTab(i)}
              className="pb-2.5 text-xs font-medium transition-all border-b-2 flex items-center gap-1"
              style={tab === i ? { color: LC.primary, borderColor: LC.primary } : { color: LC.textMuted, borderColor: 'transparent' }}>
              <t.icon size={11} /> {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex gap-4 items-center">
                <Skeleton className="h-9 w-9 rounded" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-3 w-24" />
                </div>
              </div>
            ))}
          </div>
        ) : tab === 0 ? (
          <div className="space-y-2">
            {MOCK_PRODUCTS.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border">
                <div className="w-9 h-9 rounded flex items-center justify-center text-lg bg-lc-bg-warm">📦</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-[10px] text-lc-text-muted">{item.sub}</div>
                </div>
                <button className="text-lc-primary"><Star size={13} /></button>
              </div>
            ))}
            <div className="pt-3 border-t border-lc-border">
              <p className="text-[11px] font-medium text-lc-text-secondary mb-2">关注的选品概念</p>
              {concepts.slice(0, 3).map((item: any) => (
                <div key={item.conceptId} className="flex items-center gap-3 p-2.5 rounded-lg border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border mb-1.5">
                  <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
                    {(item.name ?? '?')[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                    <div className="text-[10px] truncate text-lc-text-muted">{item.nameEn}</div>
                  </div>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-full font-medium shrink-0" style={{ background: LC.successLight, color: LC.success }}>已关注</span>
                </div>
              ))}
            </div>
          </div>
        ) : tab === 1 ? (
          <div className="space-y-2">
            {MOCK_CREATORS.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg bg-lc-bg-warm">👤</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-[10px] text-lc-text-muted">{item.sub}</div>
                </div>
                <button className="text-lc-primary"><Star size={13} /></button>
              </div>
            ))}
          </div>
        ) : tab === 2 ? (
          <div className="space-y-2">
            {MOCK_SHOPS.map(item => (
              <div key={item.id} className="flex items-center gap-3 p-3 rounded-lg border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border">
                <div className="w-9 h-9 rounded flex items-center justify-center text-lg bg-lc-bg-warm">🏪</div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-[10px] text-lc-text-muted">{item.sub}</div>
                </div>
                <button className="text-lc-primary"><Star size={13} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-lg border-2 border-dashed flex items-center justify-center mb-3 border-lc-border">
              <Package size={24} className="text-lc-border" />
            </div>
            <p className="text-sm font-medium text-lc-text-muted">暂无关注的{TABS[tab].label}</p>
            <p className="text-xs mt-1 text-lc-border-strong">在{TABS[tab].label}列表中点击 ☆ 即可关注</p>
          </div>
        )}
      </div>
    </div>
  );
}
