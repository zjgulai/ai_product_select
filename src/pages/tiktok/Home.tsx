import { useState } from 'react';
import { useNavigate } from 'react-router';
import { trpc } from '@/providers/trpc';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search,
  ShoppingBag,
  Users,
  Store,
  Play,
  Video,
  ChevronRight,
  TrendingUp,
  Zap,
  ClipboardList,
  ArrowRight,

  Eye,
  Link2,
  Sparkles,
} from 'lucide-react';
import { LC } from '@/lib/lute-colors';

const QUICK_ENTRIES = [
  { icon: ShoppingBag, label: '找商品', path: '/tiktok/products' },
  { icon: Users, label: '找达人', path: '/tiktok/influencer' },
  { icon: Store, label: '找小店', path: '/tiktok/shop' },
  { icon: Play, label: '找视频', path: '/tiktok/video' },
  { icon: Video, label: '找直播', path: '/tiktok/live' },
];

const PRODUCT_IMAGES = [
  import.meta.env.BASE_URL + 'assets/products/p1.jpg',
  import.meta.env.BASE_URL + 'assets/products/p2.jpg',
  import.meta.env.BASE_URL + 'assets/products/p3.jpg',
  import.meta.env.BASE_URL + 'assets/products/p4.jpg',
  import.meta.env.BASE_URL + 'assets/products/p5.jpg',
];

const AVATAR_IMAGES = [
  import.meta.env.BASE_URL + 'assets/avatars/a1.jpg',
  import.meta.env.BASE_URL + 'assets/avatars/a2.jpg',
  import.meta.env.BASE_URL + 'assets/avatars/a3.jpg',
];

const TREND_ITEMS = [
  { name: '便携温奶器', change: 'SHI +15%', type: 'up' },
  { name: '婴儿背带', change: '视频 +200', type: 'up' },
  { name: '辅食料理机', change: '销量 +8%', type: 'up' },
];

const OPPORTUNITY_ITEMS = [
  { text: '3个高机会概念待评估', type: 'alert' },
  { text: '2个关注概念数据更新', type: 'update' },
];

const QUICK_TASKS = [
  { label: '关键词分析', path: '/amazon/keyword' },
  { label: '品类洞察', path: '/tiktok/analysis' },
  { label: '机会发现', path: '/fusion/opportunities' },
  { label: '生成报告', path: '/fusion/report' },
  { label: '竞品监控', path: '/tiktok/attention' },
];

const RANKING_TABS = [
  { key: 'product-hot', label: '商品热销', category: 'product' },
  { key: 'product-soar', label: '商品飙升', category: 'product' },
  { key: 'product-new', label: '商品新品', category: 'product' },
  { key: 'influencer-sales', label: '达人带货', category: 'influencer' },
  { key: 'influencer-fans', label: '达人涨粉', category: 'influencer' },
  { key: 'video-hot', label: '热门视频', category: 'video' },
];

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='40' height='40'%3E%3Crect width='40' height='40' fill='%23F5F4F2'/%3E%3C/svg%3E";

export default function TikTokHome() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('product-hot');

  // tRPC queries — all in parallel
  const { data: productsHot, isLoading: pHotLoading } = trpc.tiktok.home.productsHot.useQuery();
  const { data: productsSoaring, isLoading: pSoarLoading } = trpc.tiktok.home.productsSoaring.useQuery();
  const { data: productsNew, isLoading: pNewLoading } = trpc.tiktok.home.productsNew.useQuery();
  const { data: influencersSales, isLoading: iSalesLoading } = trpc.tiktok.home.influencersSales.useQuery();
  const { data: influencersFans, isLoading: iFansLoading } = trpc.tiktok.home.influencersFans.useQuery();
  const { data: videosHot, isLoading: vLoading } = trpc.tiktok.home.videosHot.useQuery();

  const isLoadingMap: Record<string, boolean> = {
    'product-hot': pHotLoading,
    'product-soar': pSoarLoading,
    'product-new': pNewLoading,
    'influencer-sales': iSalesLoading,
    'influencer-fans': iFansLoading,
    'video-hot': vLoading,
  };

  const dataMap: Record<string, any[]> = {
    'product-hot': productsHot || [],
    'product-soar': productsSoaring || [],
    'product-new': productsNew || [],
    'influencer-sales': influencersSales || [],
    'influencer-fans': influencersFans || [],
    'video-hot': videosHot || [],
  };

  const currentLoading = isLoadingMap[activeTab];
  const currentData = dataMap[activeTab];
  const currentCategory = RANKING_TABS.find((t) => t.key === activeTab)?.category || 'product';

  const onItemClick = (_item: any) => {
    if (currentCategory === 'product') navigate('/tiktok/products');
    if (currentCategory === 'influencer') navigate('/tiktok/influencer');
    if (currentCategory === 'video') navigate('/tiktok/video');
  };

  const onFullListClick = () => {
    if (currentCategory === 'product') navigate('/tiktok/products');
    if (currentCategory === 'influencer') navigate('/tiktok/influencer');
    if (currentCategory === 'video') navigate('/tiktok/video');
  };

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['TikTok趋势', '首页']} />

      {/* ── Top: Unified Search + Quick Entries ── */}
      <div className="bg-white rounded-lg shadow-lc p-5 mb-4 ring-1 ring-lc-border/60">
        <div className="max-w-2xl mx-auto">
          <div className="relative mb-4">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-lc-text-muted" />
            <input
              type="text"
              placeholder="搜索商品、达人、视频、小店、直播..."
              className="w-full h-11 pl-11 pr-4 rounded-full border text-sm transition-all focus:outline-none focus:ring-2 focus:ring-[#E8785A]/20"
              style={{
                borderColor: LC.border,
                color: LC.text,
                background: LC.textInverse,
              }}
              onFocus={(e) => {
                e.target.style.borderColor = LC.primary;
              }}
              onBlur={(e) => {
                e.target.style.borderColor = LC.border;
              }}
            />
          </div>
          <div className="flex items-center justify-center gap-3">
            {QUICK_ENTRIES.map((entry) => (
              <button
                key={entry.label}
                onClick={() => navigate(entry.path)}
                className="flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-medium transition-all hover:-translate-y-0.5 hover:shadow-lc-hover"
                style={{
                  borderColor: LC.border,
                  color: LC.textSecondary,
                  background: LC.bgWarm,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = LC.primary;
                  e.currentTarget.style.color = LC.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LC.border;
                  e.currentTarget.style.color = LC.textSecondary;
                }}
              >
                <entry.icon size={14} />
                {entry.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Core: Today's Overview (3 columns) ── */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        {/* 趋势变化 */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60 hover:shadow-lc-hover transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${LC.primary}12` }}
            >
              <TrendingUp size={16} className="text-lc-primary" />
            </div>
            <h3 className="text-sm font-semibold text-lc-primary">趋势变化</h3>
          </div>
          <div className="space-y-3">
            {TREND_ITEMS.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-medium text-lc-text-primary">{item.name}</div>
                  <div
                    className="text-[11px] mt-0.5 flex items-center gap-1"
                    style={{ color: LC.success }}
                  >
                    <TrendingUp size={10} />
                    {item.change}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/tiktok/analysis')}
            className="mt-4 flex items-center gap-1 text-[11px] font-medium transition-colors text-lc-primary hover:text-lc-primary-dark"
          >
            查看全部 <ArrowRight size={12} />
          </button>
        </div>

        {/* 机会提醒 */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60 hover:shadow-lc-hover transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${LC.gold}15` }}
            >
              <Zap size={16} style={{ color: LC.gold }} />
            </div>
            <h3 className="text-sm font-semibold text-lc-primary">机会提醒</h3>
          </div>
          <div className="space-y-3">
            {OPPORTUNITY_ITEMS.map((item, i) => (
              <div key={i} className="flex items-start gap-2">
                <div
                  className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0"
                  style={{
                    background: item.type === 'alert' ? LC.accent : LC.info,
                  }}
                />
                <span className="text-xs text-lc-text-primary">{item.text}</span>
              </div>
            ))}
          </div>
          <button
            onClick={() => navigate('/fusion/opportunities')}
            className="mt-4 flex items-center gap-1 text-[11px] font-medium transition-colors text-lc-primary hover:text-lc-primary-dark"
          >
            查看全部 <ArrowRight size={12} />
          </button>
        </div>

        {/* 快捷任务 */}
        <div className="bg-white rounded-lg shadow-lc p-4 ring-1 ring-lc-border/60 hover:shadow-lc-hover transition-shadow duration-200">
          <div className="flex items-center gap-2 mb-3">
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center"
              style={{ backgroundColor: `${LC.teal}12` }}
            >
              <ClipboardList size={16} style={{ color: LC.teal }} />
            </div>
            <h3 className="text-sm font-semibold text-lc-primary">快捷任务</h3>
          </div>
          <div className="space-y-2">
            {QUICK_TASKS.map((task) => (
              <button
                key={task.label}
                onClick={() => navigate(task.path)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-md text-xs font-medium transition-all border"
                style={{
                  borderColor: LC.border,
                  color: LC.textSecondary,
                  background: LC.bgWarm,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = LC.primary;
                  e.currentTarget.style.color = LC.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = LC.border;
                  e.currentTarget.style.color = LC.textSecondary;
                }}
              >
                <span>{task.label}</span>
                <ChevronRight size={12} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Key Rankings (unified tabs) ── */}
      <div className="bg-white rounded-lg shadow-lc p-4 mb-4 ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-lc-primary">关键榜单</h3>
          <button
            onClick={onFullListClick}
            className="text-xs font-medium flex items-center gap-0.5 transition-colors text-lc-primary hover:text-lc-primary-dark"
          >
            查看完整榜单 <ChevronRight size={12} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b mb-3 border-lc-border overflow-x-auto">
          {RANKING_TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="pb-2 px-3 text-xs font-medium transition-all border-b-2 whitespace-nowrap"
              style={{
                color: activeTab === tab.key ? LC.primary : LC.textMuted,
                borderColor: activeTab === tab.key ? LC.primary : 'transparent',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {currentLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : (
          <table className="w-full min-w-[640px]">
            <tbody>
              {currentData.map((item: any) => (
                <tr
                  key={item.rank}
                  className="border-b last:border-0 transition-colors hover:bg-lc-bg-warm border-lc-border-light cursor-pointer"
                  onClick={() => onItemClick(item)}
                >
                  <td className="py-2.5 w-10">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                        item.rank <= 3 ? 'text-white' : 'text-lc-text-muted'
                      }`}
                      style={{
                        background:
                          item.rank <= 3
                            ? item.rank === 1
                              ? LC.gold
                              : item.rank === 2
                                ? '#D6D3D0'
                                : '#D4A080'
                            : LC.border,
                      }}
                    >
                      {item.rank}
                    </span>
                  </td>

                  {/* Content cell — varies by category */}
                  <td className="py-2.5">
                    <div className="flex items-center gap-2.5">
                      {currentCategory === 'product' && (
                        <>
                          <img
                            src={PRODUCT_IMAGES[(item.rank - 1) % PRODUCT_IMAGES.length]}
                            alt=""
                            className="w-9 h-9 rounded object-cover ring-1 ring-lc-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_IMG;
                            }}
                          />
                          <div>
                            <div
                              className="text-xs truncate max-w-[180px] text-lc-text-primary"
                              title={item.name}
                            >
                              {item.name}
                            </div>
                            <div className="text-xs text-lc-text-muted">{item.category}</div>
                          </div>
                        </>
                      )}

                      {currentCategory === 'influencer' && (
                        <>
                          <img
                            src={AVATAR_IMAGES[(item.rank - 1) % AVATAR_IMAGES.length]}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover ring-1 ring-lc-border"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = FALLBACK_IMG;
                            }}
                          />
                          <div>
                            <div className="text-xs text-lc-text-primary">{item.username}</div>
                            <div className="text-xs text-lc-text-muted">
                              {activeTab === 'influencer-sales' ? '带货达人' : '涨粉达人'}
                            </div>
                          </div>
                        </>
                      )}

                      {currentCategory === 'video' && (
                        <>
                          <div className="w-10 h-[30px] rounded flex items-center justify-center text-xs ring-1 ring-lc-border relative overflow-hidden bg-lc-bg-warm">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white">
                              <path d="M8 5v14l11-7z" />
                            </svg>
                            <span
                              className="absolute bottom-0 right-0 text-[7px] px-1 rounded-tl"
                              style={{
                                background: 'rgba(0,0,0,0.7)',
                                color: LC.textInverse,
                              }}
                            >
                              {item.duration}
                            </span>
                          </div>
                          <div>
                            <div
                              className="text-xs truncate max-w-[180px] text-lc-text-primary"
                              title={item.title}
                            >
                              {item.title}
                            </div>
                            <div className="text-xs text-lc-text-muted">{item.date}</div>
                          </div>
                        </>
                      )}
                    </div>
                  </td>

                  {/* Metric */}
                  <td className="py-2.5 text-right text-xs font-semibold font-mono-num text-lc-text-primary">
                    {currentCategory === 'video' ? item.views : item.sales}
                  </td>

                  {/* Actions */}
                  <td className="py-2.5 pl-4">
                    <div className="flex items-center gap-1.5 justify-end">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onItemClick(item);
                        }}
                        className="px-2 py-1 rounded text-xs font-medium transition-colors border"
                        style={{
                          borderColor: LC.border,
                          color: LC.textSecondary,
                          background: LC.bgWarm,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = LC.primary;
                          e.currentTarget.style.color = LC.primary;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = LC.border;
                          e.currentTarget.style.color = LC.textSecondary;
                        }}
                      >
                        <span className="flex items-center gap-0.5">
                          <Eye size={10} />
                          查看详情
                        </span>
                      </button>
                      {currentCategory === 'product' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate('/tiktok/influencer');
                          }}
                          className="px-2 py-1 rounded text-xs font-medium transition-colors border"
                          style={{
                            borderColor: LC.border,
                            color: LC.textSecondary,
                            background: LC.bgWarm,
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.borderColor = LC.primary;
                            e.currentTarget.style.color = LC.primary;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.borderColor = LC.border;
                            e.currentTarget.style.color = LC.textSecondary;
                          }}
                        >
                          <span className="flex items-center gap-0.5">
                            <Link2 size={10} />
                            关联达人
                          </span>
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate('/fusion/opportunities');
                        }}
                        className="px-2 py-1 rounded text-xs font-medium transition-colors border"
                        style={{
                          borderColor: `${LC.primary}40`,
                          color: LC.primary,
                          background: LC.primaryLight,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = LC.primary;
                          e.currentTarget.style.color = LC.textInverse;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = LC.primaryLight;
                          e.currentTarget.style.color = LC.primary;
                        }}
                      >
                        <span className="flex items-center gap-0.5">
                          <Sparkles size={10} />
                          分析机会
                        </span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── Bottom spacer ── */}
      <div className="h-4" />
    </div>
  );
}
