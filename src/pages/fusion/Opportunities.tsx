/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, Minus, ArrowUpDown, Zap, Sparkles } from 'lucide-react';

const SORT_OPTIONS = [
  { key: 'opportunityScore', label: '机会分' },
  { key: 'shiScore', label: 'SHI' },
  { key: 'cviScore', label: 'CVI' },
  { key: 'trendMomentum', label: '趋势动量' },
];

const CATEGORIES = ['全部', '美妆个护', '健康保健', '家居日用', '母婴用品', '运动户外', '厨房用品', '家电', '宠物用品'];

function formatViews(v: number) {
  if (v >= 1e6) return (v / 1e6).toFixed(1) + 'M';
  if (v >= 1e3) return (v / 1e3).toFixed(0) + 'K';
  return v.toLocaleString();
}

function TrendIcon({ value }: { value: number }) {
  if (value > 1.0) return <TrendingUp size={14} className="text-lc-success" />;
  if (value < 0.8) return <TrendingDown size={14} className="text-lc-danger" />;
  return <Minus size={14} className="text-lc-text-muted" />;
}

export default function FusionOpportunities() {
  const navigate = useNavigate();
  const [searchText, setSearchText] = useState('');
  const [category, setCategory] = useState('全部');
  const [sortBy, setSortBy] = useState('opportunityScore');
  const [sortDesc, setSortDesc] = useState(true);

  const { data, isLoading, isError } = trpc.fusion.metrics.topOpportunities.useQuery(
    { limit: 50 },
    { staleTime: 5 * 60 * 1000 }
  );

  const filtered = useMemo(() => {
    let items = data || [];
    if (searchText) {
      const q = searchText.toLowerCase();
      items = items.filter((d: any) =>
        d.conceptName?.toLowerCase().includes(q) ||
        d.conceptId?.toLowerCase().includes(q)
      );
    }
    // TODO: category filtering requires backend data enrichment
    if (category !== '全部') {
      // 类目过滤
    }
    // Sort
    items = [...items].sort((a: any, b: any) => {
      const va = a[sortBy] ?? 0;
      const vb = b[sortBy] ?? 0;
      return sortDesc ? vb - va : va - vb;
    });
    return items;
  }, [data, searchText, category, sortBy, sortDesc]);

  const handleSort = (key: string) => {
    if (sortBy === key) {
      setSortDesc(!sortDesc);
    } else {
      setSortBy(key);
      setSortDesc(true);
    }
  };

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['融合选品', '机会榜']} />

      {/* Header Card */}
      <div className="rounded-xl p-5 mb-4 ring-1 ring-lc-border/60" style={{ background: `linear-gradient(135deg, ${LC.primary} 0%, ${LC.primaryDark} 100%)` }}>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(255,255,255,0.15)' }}>
            <Sparkles size={18} style={{ color: LC.textInverse }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: LC.textInverse }}>融合选品机会榜</h2>
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.6)' }}>
              基于SHI（社媒热度指数）+ CVI（电商验证指数）双维度交叉分析，发现高潜力选品机会
            </p>
          </div>
        </div>
        <div className="flex items-center gap-6 mt-3">
          <div className="text-center">
            <div className="text-xl font-bold font-mono-num" style={{ color: LC.textInverse }}>{data?.length || 0}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>可挖掘机会</div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="text-center">
            <div className="text-xl font-bold font-mono-num" style={{ color: LC.textInverse }}>{Math.round((data || []).filter((d: any) => d.opportunityScore >= 70).length)}</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>高机会分(≥70)</div>
          </div>
          <div className="w-px h-8" style={{ background: 'rgba(255,255,255,0.15)' }} />
          <div className="text-center">
            <div className="text-xl font-bold font-mono-num" style={{ color: LC.textInverse }}>{Math.round((data || []).reduce((s: number, d: any) => s + (d.tiktokVideoCount || 0), 0) / 1000)}K</div>
            <div className="text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>关联视频总数</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
        <div className="flex items-center gap-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 max-w-[320px]">
            <input
              type="text"
              value={searchText}
              onChange={e => setSearchText(e.target.value)}
              placeholder="搜索产品概念..."
              className="w-full h-8 pl-3 pr-3 rounded-full border text-xs focus:outline-none focus:ring-1 border-lc-border text-lc-text-primary"
            />
          </div>
          {/* Category */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-lc-text-secondary">类目:</span>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="h-7 border rounded-md text-[11px] px-2 border-lc-border text-lc-text-primary bg-white"
            >
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          {/* Sort */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className="text-xs font-medium text-lc-text-secondary">排序:</span>
            {SORT_OPTIONS.map(opt => (
              <button
                key={opt.key}
                onClick={() => handleSort(opt.key)}
                className={`flex items-center gap-0.5 px-2 h-6 rounded-md text-[11px] font-medium transition-all ${
                  sortBy === opt.key ? 'bg-lc-primary text-white' : 'bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-border-light'
                }`}
              >
                {opt.label}
                {sortBy === opt.key && (
                  <ArrowUpDown size={10} className={sortDesc ? '' : 'rotate-180'} />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
        <div className="flex items-center justify-between p-3 border-b border-lc-border">
          <h3 className="text-sm font-semibold text-lc-primary">选品机会排名</h3>
          <span className="text-xs font-medium text-lc-text-muted">共 {filtered.length} 条</span>
        </div>
        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 items-center">
                  <Skeleton className="h-6 w-6 rounded" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : (
            <table className="w-full min-w-[640px]">
              <thead>
                <tr className="bg-lc-bg-warm">
                  {['排名', '产品概念', 'SHI', 'CVI', '机会分', 'TikTok视频', 'Amazon商品', '趋势', '操作'].map(h => (
                    <th key={h} className="py-2.5 px-3 text-[11px] font-bold text-lc-text-secondary text-left">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item: any, idx: number) => (
                  <tr key={item.conceptId} className="border-b border-lc-border-light hover:bg-lc-bg-warm transition-colors cursor-pointer" onClick={() => navigate(`/fusion/concept/${item.conceptId}`)}>
                    <td className="py-3 px-3">
                      <span className="text-xs font-bold font-mono-num w-6 h-6 rounded-md flex items-center justify-center" style={{
                        color: idx < 3 ? LC.textInverse : LC.textMuted,
                        background: idx < 3 ? LC.primary : 'transparent',
                      }}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded flex items-center justify-center text-xs font-bold shrink-0" style={{ background: LC.primaryLight, color: LC.primary }}>
                          {item.conceptName?.[0] || '?'}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-lc-text-primary">{item.conceptName}</div>
                          <div className="text-xs text-lc-text-muted">{item.conceptId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.shiScore}%`, background: item.shiScore >= 60 ? LC.primary : LC.warning }} />
                        </div>
                        <span className="text-xs font-mono-num font-semibold text-lc-text-primary">{item.shiScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <div className="w-16 h-1.5 rounded-full bg-lc-border-light overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${item.cviScore}%`, background: item.cviScore >= 40 ? LC.success : LC.teal }} />
                        </div>
                        <span className="text-xs font-mono-num font-semibold text-lc-text-primary">{item.cviScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <Zap size={14} className="text-lc-primary" />
                        <span className="text-sm font-bold font-mono-num text-lc-primary">{item.opportunityScore}</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-mono-num text-lc-text-primary">{item.tiktokVideoCount.toLocaleString()}</div>
                      <div className="text-xs text-lc-text-muted">{formatViews(item.tiktokTotalViews)} 播放</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="text-xs font-mono-num text-lc-text-primary">{item.amazonProductCount}</div>
                      <div className="text-xs text-lc-text-muted">{item.amazonTotalSales.toLocaleString()} 销量</div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        <TrendIcon value={item.trendMomentum} />
                        <span className="text-xs font-medium text-lc-text-secondary">{item.trendMomentum}x</span>
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          className="text-xs px-3 h-6 rounded-full font-medium text-white bg-lc-primary hover:brightness-110 transition-all"
                          onClick={(e) => { e.stopPropagation(); navigate(`/fusion/concept/${item.conceptId}`); }}
                        >
                          查看详情
                        </button>
                        <button
                          className="text-xs px-3 h-6 rounded-full font-medium border transition-all hover:bg-lc-primary hover:text-white"
                          style={{ borderColor: `${LC.primary}40`, color: LC.primary, background: LC.primaryLight }}
                          onClick={(e) => { e.stopPropagation(); navigate(`/fusion/report?conceptId=${item.conceptId}`); }}
                        >
                          生成报告
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-12 text-center">
                      <div className="flex flex-col items-center gap-2">
                        <Sparkles size={28} className="text-lc-border" />
                        <p className="text-sm font-medium text-lc-text-muted">暂无匹配的机会</p>
                        <p className="text-xs text-lc-border-strong">尝试调整筛选条件或搜索关键词</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
