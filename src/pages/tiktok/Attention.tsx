import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Package, Star, ShoppingBag, Users, Store, Play, Video,
  Bell, TrendingUp, TrendingDown, FileText, Eye, Sparkles,
  ArrowRight, Box, UserRound, BarChart3
} from 'lucide-react';
import { LC } from '@/lib/lute-colors';
import DataBadge from '@/components/shared/DataBadge';

const TABS = [
  { label: "商品", icon: ShoppingBag },
  { label: "达人", icon: Users },
  { label: "小店", icon: Store },
  { label: "视频", icon: Play },
  { label: "直播", icon: Video },
];

const DEFAULT_FOLLOWS = {
  products: [
    { id: 'p1', name: '便携温奶器 Pro Max', sub: '母婴用品 · $42.99 · ⭐4.7', change: '+12%', trend: 'up' as const },
    { id: 'p2', name: 'LED化妆镜 360°旋转', sub: '美妆工具 · $28.99 · ⭐4.5', change: '+5%', trend: 'up' as const },
    { id: 'p3', name: '智能宠物喂食器 5L', sub: '宠物用品 · $69.99 · ⭐4.6', change: '-3%', trend: 'down' as const },
  ],
  creators: [
    { id: 'c1', name: 'momlife_official', sub: '1.2M 粉丝 · 母婴博主', change: '+2.3K', trend: 'up' as const },
    { id: 'c2', name: 'babycare_tips', sub: '890K 粉丝 · 育儿达人', change: '+1.1K', trend: 'up' as const },
  ],
  shops: [
    { id: 's1', name: 'Momcozy Official Store', sub: '美国 · 综合评分 4.8', change: '+8%', trend: 'up' as const },
    { id: 's2', name: 'BabyGear Pro', sub: '英国 · 综合评分 4.6', change: '+3%', trend: 'up' as const },
  ],
  concepts: [],
};

type FollowItem = { id: string; name: string; sub: string; change: string; trend: 'up' | 'down' };
type ConceptFollow = { conceptId: string; name: string; nameEn: string; shiScore: string; cviScore: string };
type FollowMap = { products: FollowItem[]; creators: FollowItem[]; shops: FollowItem[]; concepts: ConceptFollow[] };

export default function TikTokAttention() {
  const navigate = useNavigate();
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

      {/* Overview Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
        {[
          { label: '关注概念', value: concepts.length, sub: '实时追踪中', icon: Sparkles, color: LC.primary },
          { label: 'SHI变化提醒', value: concepts.filter((c: any) => c.shiScore > 60).length, sub: '需要关注', icon: TrendingUp, color: LC.success },
          { label: 'CVI变化提醒', value: concepts.filter((c: any) => c.cviScore > 30).length, sub: '需要关注', icon: BarChart3, color: LC.warning },
          { label: '未读提醒', value: 3, sub: '今日更新', icon: Bell, color: LC.teal },
        ].map((card, i) => (
          <div key={i} className="bg-white rounded-xl p-3 ring-1 ring-lc-border/60 shadow-lc">
            <div className="flex items-center gap-4 mb-1.5">
              <card.icon size={13} style={{ color: card.color }} />
              <span className="text-xs text-lc-text-muted">{card.label}</span>
            </div>
            <div className="text-lg font-bold font-mono-num text-lc-text-primary">{card.value}</div>
            <div className="text-xs text-lc-text-muted">{card.sub}</div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="bg-white rounded-xl shadow-lc p-6 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-semibold text-lc-primary">我的关注</h2>
            <DataBadge type="demo" />
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/fusion/opportunities')}
              className="text-xs px-3 h-6 rounded-full font-medium border transition-all hover:bg-lc-primary hover:text-white"
              style={{ borderColor: `${LC.primary}40`, color: LC.primary, background: LC.primaryLight }}
            >
              <span className="flex items-center gap-1">
                <Sparkles size={10} /> 发现新机会
              </span>
            </button>
            <span className="text-xs text-lc-text-muted">关注商品、达人、小店，实时追踪动态</span>
          </div>
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
            {/* Section: 关注商品 */}
            <p className="text-[11px] font-medium text-lc-text-secondary mb-1">关注的商品</p>
            {follows.products.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border">
                <div className="w-9 h-9 rounded flex items-center justify-center bg-lc-primary-light"><Box size={18} className="text-lc-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-xs text-lc-text-muted">{item.sub}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono-num shrink-0">
                  {item.trend === 'up' ? <TrendingUp size={10} className="text-lc-success" /> : <TrendingDown size={10} className="text-lc-danger" />}
                  <span className={item.trend === 'up' ? 'text-lc-success' : 'text-lc-danger'}>{item.change}</span>
                </div>
                <button onClick={() => toggleFollow('products', item.id)} className="text-lc-primary hover:scale-110 transition-transform" title="取消关注"><Star size={13} fill={LC.primary} /></button>
              </div>
            ))}

            {/* Section: 关注的选品概念 */}
            <div className="pt-3 border-t border-lc-border mt-3">
              <div className="flex items-center justify-between mb-2">
                <p className="text-[11px] font-medium text-lc-text-secondary">关注的选品概念</p>
                <button
                  onClick={() => navigate('/fusion/opportunities')}
                  className="text-xs text-lc-primary flex items-center gap-0.5 hover:underline"
                >
                  浏览更多 <ArrowRight size={10} />
                </button>
              </div>
              {follows.concepts.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-xs text-lc-text-muted">暂无关注概念</p>
                  <button
                    onClick={() => navigate('/fusion/opportunities')}
                    className="mt-2 text-xs px-3 py-1 rounded-full bg-lc-primary text-white font-medium"
                  >
                    去机会榜发现
                  </button>
                </div>
              ) : (
                follows.concepts.slice(0, 5).map((item: any) => (
                  <div key={item.conceptId} className="flex items-center gap-4 p-2.5 rounded-xl border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border mb-1.5">
                    <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
                      {(item.name ?? '?')[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                      <div className="text-xs truncate text-lc-text-muted">{item.nameEn} · SHI {item.shiScore} · CVI {item.cviScore}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/fusion/concept/${item.conceptId}`); }}
                        className="text-[9px] px-2.5 py-1.5 rounded border transition-colors"
                        style={{ borderColor: LC.border, color: LC.textSecondary }}
                      >
                        <span className="flex items-center gap-0.5"><Eye size={9} />详情</span>
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate('/fusion/report'); }}
                        className="text-[9px] px-2.5 py-1.5 rounded border transition-colors"
                        style={{ borderColor: `${LC.primary}40`, color: LC.primary, background: LC.primaryLight }}
                      >
                        <span className="flex items-center gap-0.5"><FileText size={9} />报告</span>
                      </button>
                    </div>
                    <button onClick={(e) => { e.stopPropagation(); toggleFollow('concepts', item.conceptId); }} className="text-lc-primary hover:scale-110 transition-transform" title="取消关注"><Star size={13} fill={LC.primary} /></button>
                  </div>
                ))
              )}
            </div>
          </div>
        ) : tab === 1 ? (
          <div className="space-y-2">
            {follows.creators.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border">
                <div className="w-9 h-9 rounded-full flex items-center justify-center bg-lc-primary-light"><UserRound size={18} className="text-lc-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-xs text-lc-text-muted">{item.sub}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono-num shrink-0">
                  <TrendingUp size={10} className="text-lc-success" />
                  <span className="text-lc-success">{item.change}</span>
                </div>
                <button onClick={() => toggleFollow('creators', item.id)} className="text-lc-primary hover:scale-110 transition-transform" title="取消关注"><Star size={13} fill={LC.primary} /></button>
              </div>
            ))}
          </div>
        ) : tab === 2 ? (
          <div className="space-y-2">
            {follows.shops.map(item => (
              <div key={item.id} className="flex items-center gap-4 p-3 rounded-xl border hover:bg-lc-bg-warm transition-colors cursor-pointer border-lc-border">
                <div className="w-9 h-9 rounded flex items-center justify-center bg-lc-primary-light"><Store size={18} className="text-lc-primary" /></div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium truncate text-lc-text-primary">{item.name}</div>
                  <div className="text-xs text-lc-text-muted">{item.sub}</div>
                </div>
                <div className="flex items-center gap-1 text-xs font-mono-num shrink-0">
                  <TrendingUp size={10} className="text-lc-success" />
                  <span className="text-lc-success">{item.change}</span>
                </div>
                <button onClick={() => toggleFollow('shops', item.id)} className="text-lc-primary hover:scale-110 transition-transform" title="取消关注"><Star size={13} fill={LC.primary} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="w-14 h-14 rounded-xl border-2 border-dashed flex items-center justify-center mb-3 border-lc-border">
              <Package size={24} className="text-lc-border" />
            </div>
            <p className="text-sm font-medium text-lc-text-muted">暂无关注的{TABS[tab].label}</p>
            <p className="text-xs mt-1 text-lc-border-strong">在{TABS[tab].label}列表中点击 ☆ 即可关注</p>
            <button
              onClick={() => {
                if (tab === 0) navigate('/tiktok/products');
                if (tab === 1) navigate('/tiktok/influencer');
                if (tab === 2) navigate('/tiktok/shop');
                if (tab === 3) navigate('/tiktok/video');
                if (tab === 4) navigate('/tiktok/live');
              }}
              className="mt-3 text-xs px-3 py-1.5 rounded-full bg-lc-primary text-white font-medium transition-all hover:brightness-110"
            >
              去浏览{TABS[tab].label}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
