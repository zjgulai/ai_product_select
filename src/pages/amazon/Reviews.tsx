/* eslint-disable @typescript-eslint/no-explicit-any */n
import { useState, useMemo } from 'react';
import type { ReactNode } from 'react';
import { useParams, useNavigate } from 'react-router';
import ErrorState from '@/components/shared/ErrorState';
import { trpc } from '@/providers/trpc';
import { LC } from '@/lib/lute-colors';
import Breadcrumb from '@/components/shared/Breadcrumb';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, MessageSquare, ThumbsUp, Star, Filter,
  Smile, Meh, Frown, Search, X, Tag
} from 'lucide-react';

const SENTIMENT_OPTIONS = [
  { key: 'all', label: '全部', icon: null },
  { key: 'positive', label: '正面', icon: Smile, color: LC.success },
  { key: 'neutral', label: '中性', icon: Meh, color: LC.warning },
  { key: 'negative', label: '负面', icon: Frown, color: LC.danger },
];

const RATING_OPTIONS = [5, 4, 3, 2, 1];

function highlightKeywords(text: string, keywords: string[]) {
  if (!keywords || keywords.length === 0) return text;
  const parts: (string | ReactNode)[] = [];
  let lastIndex = 0;
  const sorted = [...keywords].sort((a, b) => b.length - a.length);
  const regex = new RegExp(`(${sorted.map(k => k.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  let match;
  let keyCounter = 0;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push(text.slice(lastIndex, match.index));
    }
    parts.push(
      <mark key={`kw-${keyCounter++}`} className="rounded px-0.5 font-medium" style={{ background: `${LC.primary}20`, color: LC.primary }}>
        {match[0]}
      </mark>
    );
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}

function SentimentBadge({ sentiment }: { sentiment: string }) {
  const map: Record<string, { label: string; bg: string; color: string }> = {
    positive: { label: '正面', bg: LC.successLight, color: LC.success },
    neutral: { label: '中性', bg: LC.warningLight, color: LC.warning },
    negative: { label: '负面', bg: LC.dangerLight, color: LC.danger },
  };
  const s = map[sentiment] || map.neutral;

  return (
    <span className="text-xs px-1.5 py-0.5 rounded-full font-medium" style={{ background: s.bg, color: s.color }}>
      {s.label}
    </span>
  );
}

function StarDisplay({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} size={10} className={i < Math.round(rating) ? 'text-lc-gold fill-lc-gold' : 'text-lc-border'} />
      ))}
      <span className="text-xs font-mono-num ml-0.5 text-lc-text-secondary">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function ReviewsPage() {
  const { asin } = useParams<{ asin: string }>();
  const navigate = useNavigate();

  const [sentimentFilter, setSentimentFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState<number | null>(null);
  const [aspectFilter, setAspectFilter] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [page, setPage] = useState(0);
  const PAGE_SIZE = 10;

  const { data: statsData, isLoading: statsLoading, isError } = trpc.amazon.reviews.stats.useQuery(
    { asin: asin || '' },
    { staleTime: 5 * 60 * 1000, enabled: !!asin }
  );

  const { data: reviewsData, isLoading: reviewsLoading } = trpc.amazon.reviews.list.useQuery(
    { asin: asin || undefined, sentiment: (sentimentFilter !== 'all' ? sentimentFilter : undefined) as any, limit: 200 },
    { staleTime: 5 * 60 * 1000, enabled: !!asin }
  );

  const allReviews = reviewsData?.items || [];

  // Collect all unique aspects from stats
  const allAspects = useMemo(() => {
    const aspects = new Set<string>();
    statsData?.aspects?.forEach((a: any) => aspects.add(a.aspect));
    return Array.from(aspects).slice(0, 15);
  }, [statsData]);

  // Filter reviews
  const filteredReviews = useMemo(() => {
    let items = allReviews;
    if (ratingFilter !== null) {
      items = items.filter(r => Math.round(parseFloat(r.rating ?? '0')) === ratingFilter);
    }
    if (aspectFilter) {
      items = items.filter(r => (r.aspects ?? []).some((a: { aspect: string }) => a.aspect === aspectFilter));
    }
    if (searchText.trim()) {
      const q = searchText.toLowerCase();
      items = items.filter(r =>
        (r.title ?? '').toLowerCase().includes(q) || (r.content ?? '').toLowerCase().includes(q)
      );
    }
    return items;
  }, [allReviews, ratingFilter, aspectFilter, searchText]);

  const paginatedReviews = filteredReviews.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);
  const totalPages = Math.ceil(filteredReviews.length / PAGE_SIZE);

  const isLoading = statsLoading || reviewsLoading;

  if (isError) return <ErrorState />;

  return (
    <div className="animate-fadeIn">
      <Breadcrumb items={['Amazon榜单', '评论详情']} />

      {/* Back button */}
      <div className="flex items-center gap-3 mb-4">
        <button onClick={() => navigate('/amazon/list')} className="flex items-center gap-1 text-[11px] text-lc-text-muted hover:text-lc-primary transition-all">
          <ArrowLeft size={12} /> 返回榜单
        </button>
        <span className="text-[11px] text-lc-text-muted">ASIN: <span className="font-mono-num font-medium text-lc-text-primary">{asin}</span></span>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-24 w-full rounded-xl" />
          <Skeleton className="h-64 w-full rounded-xl" />
        </div>
      ) : (
        <>
          {/* Stats Header */}
          <div className="bg-white rounded-xl p-5 mb-4 ring-1 ring-lc-border/60 shadow-lc">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: `${LC.primary}12` }}>
                <MessageSquare size={18} className="text-lc-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-lc-text-primary">评论分析</h2>
                <p className="text-xs text-lc-text-muted">基于 {statsData?.total || 0} 条评论的情感与维度分析</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              {[
                { label: '总评论', value: statsData?.total || 0, color: LC.primary },
                { label: '好评率', value: statsData?.total ? `${((statsData?.positive || 0) / statsData.total * 100).toFixed(0)}%` : '--', color: LC.success },
                { label: '差评率', value: statsData?.total ? `${((statsData?.negative || 0) / statsData.total * 100).toFixed(0)}%` : '--', color: LC.danger },
                { label: '平均评分', value: statsData?.avgRating || '--', color: LC.gold },
              ].map(s => (
                <div key={s.label} className="text-center">
                  <div className="text-xl font-bold font-mono-num" style={{ color: s.color }}>{s.value}</div>
                  <div className="text-xs text-lc-text-muted">{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Filters Bar */}
          <div className="bg-white rounded-lg shadow-lc p-3 mb-3 ring-1 ring-lc-border/60">
            <div className="flex items-center gap-4 flex-wrap">
              {/* Sentiment */}
              <div className="flex items-center gap-1.5">
                <Filter size={12} className="text-lc-text-muted" />
                <span className="text-xs font-medium text-lc-text-secondary">情感:</span>
                {SENTIMENT_OPTIONS.map(opt => (
                  <button
                    key={opt.key}
                    onClick={() => { setSentimentFilter(opt.key); setPage(0); }}
                    className={`flex items-center gap-0.5 px-2 h-6 rounded-md text-[11px] font-medium transition-all ${
                      sentimentFilter === opt.key ? 'bg-lc-primary text-white' : 'bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-border-light'
                    }`}
                  >
                    {opt.icon && <opt.icon size={11} />}
                    {opt.label}
                  </button>
                ))}
              </div>

              {/* Rating */}
              <div className="flex items-center gap-1.5">
                <Star size={12} className="text-lc-text-muted" />
                <span className="text-xs font-medium text-lc-text-secondary">星级:</span>
                {RATING_OPTIONS.map(star => (
                  <button
                    key={star}
                    onClick={() => { setRatingFilter(ratingFilter === star ? null : star); setPage(0); }}
                    className={`flex items-center gap-0.5 px-2 h-6 rounded-md text-[11px] font-medium transition-all ${
                      ratingFilter === star ? 'bg-lc-gold text-white' : 'bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-border-light'
                    }`}
                  >
                    <span className="flex items-center gap-0.5"><Star size={10} className="fill-lc-gold text-lc-gold" /> {star}</span>
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative ml-auto">
                <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-lc-text-muted" />
                <input
                  type="text"
                  value={searchText}
                  onChange={e => { setSearchText(e.target.value); setPage(0); }}
                  placeholder="搜索评论内容..."
                  className="h-7 pl-7 pr-7 rounded-md border text-[11px] focus:outline-none focus:ring-1 border-lc-border text-lc-text-primary w-48"
                />
                {searchText && (
                  <button onClick={() => setSearchText('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-lc-text-muted hover:text-lc-primary">
                    <X size={12} />
                  </button>
                )}
              </div>
            </div>

            {/* Aspect tags */}
            {allAspects.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 pt-2 border-t border-lc-border-light flex-wrap">
                <Tag size={11} className="text-lc-text-muted shrink-0" />
                <span className="text-xs font-medium text-lc-text-secondary shrink-0">方面:</span>
                {allAspects.map(aspect => (
                  <button
                    key={aspect}
                    onClick={() => { setAspectFilter(aspectFilter === aspect ? null : aspect); setPage(0); }}
                    className={`px-2 py-0.5 rounded-full text-xs font-medium transition-all ${
                      aspectFilter === aspect ? 'bg-lc-primary text-white' : 'bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-primary-light hover:text-lc-primary'
                    }`}
                  >
                    {aspect}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reviews List */}
          <div className="bg-white rounded-lg shadow-lc overflow-hidden ring-1 ring-lc-border/60">
            <div className="flex items-center justify-between p-3 border-b border-lc-border">
              <h3 className="text-sm font-semibold text-lc-primary flex items-center gap-1.5">
                <MessageSquare size={14} /> 评论列表
              </h3>
              <span className="text-xs font-medium text-lc-text-muted">
                共 {filteredReviews.length} 条
                {filteredReviews.length !== allReviews.length && ` (筛选自 ${allReviews.length})`}
              </span>
            </div>

            {paginatedReviews.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16">
                <MessageSquare size={32} className="text-lc-border mb-3" />
                <p className="text-sm font-medium text-lc-text-muted">暂无匹配的评论</p>
                <p className="text-xs text-lc-border-strong mt-1">尝试调整筛选条件</p>
              </div>
            ) : (
              <div className="divide-y divide-lc-border-light">
                {paginatedReviews.map((review: any) => (
                  <div key={review.id} className="p-4 hover:bg-lc-bg-warm transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-full bg-lc-bg-warm flex items-center justify-center text-xs font-bold text-lc-text-secondary">
                          {review.reviewerName[0]}
                        </div>
                        <div>
                          <div className="text-xs font-medium text-lc-text-primary">{review.reviewerName}</div>
                          <div className="text-xs text-lc-text-muted">{review.reviewDate}</div>
                        </div>
                        {review.verifiedPurchase && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-lc-success/10 text-lc-success font-medium">Verified</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <StarDisplay rating={review.rating} />
                        <SentimentBadge sentiment={review.sentiment} />
                      </div>
                    </div>
                    <div className="text-xs font-semibold text-lc-text-primary mb-1">{review.title}</div>
                    <div className="text-[11px] text-lc-text-secondary leading-relaxed mb-2">
                      {highlightKeywords(review.content, review.keywords)}
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {review.aspects.map((a: any) => (
                        <span key={a.aspect} className="text-[9px] px-1.5 py-0.5 rounded font-medium"
                          style={{
                            background: a.sentiment === 'positive' ? LC.successLight : a.sentiment === 'negative' ? LC.dangerLight : LC.warningLight,
                            color: a.sentiment === 'positive' ? LC.success : a.sentiment === 'negative' ? LC.danger : LC.warning,
                          }}
                        >
                          {a.aspect}
                        </span>
                      ))}
                      <span className="text-[9px] text-lc-text-muted ml-auto flex items-center gap-0.5">
                        <ThumbsUp size={9} /> {review.helpfulCount} helpful
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-1 p-3 border-t border-lc-border">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-2 h-7 rounded-md text-[11px] font-medium bg-lc-bg-warm text-lc-text-secondary disabled:opacity-40 hover:bg-lc-border-light transition-all"
                >
                  上一页
                </button>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    className={`w-7 h-7 rounded-md text-[11px] font-medium transition-all ${
                      page === i ? 'bg-lc-primary text-white' : 'bg-lc-bg-warm text-lc-text-secondary hover:bg-lc-border-light'
                    }`}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page === totalPages - 1}
                  className="px-2 h-7 rounded-md text-[11px] font-medium bg-lc-bg-warm text-lc-text-secondary disabled:opacity-40 hover:bg-lc-border-light transition-all"
                >
                  下一页
                </button>
              </div>
            )}
          </div>

          {/* Aspect Stats */}
          {statsData?.aspects && statsData.aspects.length > 0 && (
            <div className="bg-white rounded-lg shadow-lc p-4 mt-4 ring-1 ring-lc-border/60">
              <h3 className="text-sm font-semibold text-lc-primary mb-3">方面维度分析</h3>
              <div className="space-y-2">
                {statsData.aspects.slice(0, 10).map((a: any) => (
                  <div key={a.aspect} className="flex items-center gap-3">
                    <span className="text-xs font-medium text-lc-text-primary w-20 shrink-0">{a.aspect}</span>
                    <div className="flex-1 flex items-center gap-1 h-5 rounded-full overflow-hidden bg-lc-border-light">
                      <div className="h-full bg-lc-success" style={{ width: `${(a.positive / a.total) * 100}%` }} />
                      <div className="h-full bg-lc-warning" style={{ width: `${(a.neutral / a.total) * 100}%` }} />
                      <div className="h-full bg-lc-danger" style={{ width: `${(a.negative / a.total) * 100}%` }} />
                    </div>
                    <span className="text-xs font-mono-num text-lc-text-muted w-8 text-right">{a.total}</span>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-4 mt-3 pt-2 border-t border-lc-border-light">
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-lc-success" /> <span className="text-xs text-lc-text-muted">正面</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-lc-warning" /> <span className="text-xs text-lc-text-muted">中性</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-3 h-3 rounded-sm bg-lc-danger" /> <span className="text-xs text-lc-text-muted">负面</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
