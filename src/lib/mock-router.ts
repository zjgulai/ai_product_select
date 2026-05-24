import {
  getAmazonProducts,
  getAmazonReviews,
  searchAmazonKeywords,
  getAmazonKeywordStats,
  getHotMarket,
  getPotMarket,
  getParamMarket,
  getBrandMarket,
} from "../../api/services/mockData/amazonData";

import {
  getTiktokProducts,
  getTiktokCreators,
  getTiktokVideos,
  getTiktokShops,
  getTiktokLives,
  getTiktokKpi,
  getHeatmapData,
  getGmvTrend,
  getCategoryShare,
  getInfluencerMatrix,
  getPriceDistribution,
  getTiktokHomeProducts,
  getTiktokHomeInfluencers,
  getTiktokHomeShops,
  getTiktokHomeVideos,
  getTiktokHomeLives,
} from "../../api/services/mockData/tiktokData";

import {
  getProductConcepts,
  getConceptMetrics,
  getLatestMetrics,
  getKeywordMappings,
  getFusionReports,
} from "../../api/services/mockData/fusionData";

type Input = Record<string, unknown> | undefined;

function paginate<T>(data: T[], input: Input): { items: T[]; total: number } {
  const limit = (input?.limit as number) ?? 20;
  const offset = (input?.offset as number) ?? 0;
  return { items: data.slice(offset, offset + limit), total: data.length };
}

// 全量接口映射表：tRPC 路径 → (input?) => data
const mockHandlers: Record<string, (input: Input) => unknown> = {
  // ─── ping ───────────────────────────────────────────────
  "ping": () => ({ ok: true, ts: Date.now() }),

  // ─── TikTok Home ─────────────────────────────────────────
  "tiktok.home.productsHot":     () => getTiktokHomeProducts("hot"),
  "tiktok.home.productsSoaring": () => getTiktokHomeProducts("soaring"),
  "tiktok.home.productsNew":     () => getTiktokHomeProducts("new"),
  "tiktok.home.influencersSales":() => getTiktokHomeInfluencers("sales"),
  "tiktok.home.influencersFans": () => getTiktokHomeInfluencers("fans"),
  "tiktok.home.shopsHot":        () => getTiktokHomeShops(),
  "tiktok.home.videosHot":       () => getTiktokHomeVideos(),
  "tiktok.home.livesPopular":    () => getTiktokHomeLives(),

  // ─── TikTok Analysis ─────────────────────────────────────
  "tiktok.analysis.kpi":               () => getTiktokKpi(),
  "tiktok.analysis.heatmap":           () => getHeatmapData(),
  "tiktok.analysis.gmvTrend":          () => getGmvTrend(),
  "tiktok.analysis.categoryShare":     () => getCategoryShare(),
  "tiktok.analysis.priceDistribution": () => getPriceDistribution(),
  "tiktok.analysis.influencerMatrix":  () => getInfluencerMatrix(),

  // ─── TikTok Products ─────────────────────────────────────
  "tiktok.products.list": (input) => {
    let data = getTiktokProducts();
    const i = input as { search?: string; category?: string; tab?: string; priceMin?: number; priceMax?: number; ratingMin?: number; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(p => p.name.toLowerCase().includes(q));
    }
    if (i?.category) data = data.filter(p => p.category === i.category);
    if (i?.tab === "soaring") data.sort((a, b) => parseFloat(b.salesGrowth) - parseFloat(a.salesGrowth));
    else if (i?.tab === "new") data = data.filter(p => p.date?.startsWith("2026-03"));
    return paginate(data, i);
  },

  // ─── TikTok Creators ─────────────────────────────────────
  "tiktok.creators.list": (input) => {
    let data = getTiktokCreators();
    const i = input as { search?: string; tab?: string; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(c => c.username.toLowerCase().includes(q) || (c.displayName ?? "").toLowerCase().includes(q));
    }
    if (i?.tab === "fans") data.sort((a, b) => (b.followers ?? 0) - (a.followers ?? 0));
    return paginate(data, i);
  },

  // ─── TikTok Videos ───────────────────────────────────────
  "tiktok.videos.list": (input) => {
    let data = getTiktokVideos();
    const i = input as { search?: string; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(v => v.title.toLowerCase().includes(q));
    }
    return paginate(data, i);
  },

  // ─── TikTok Shops ────────────────────────────────────────
  "tiktok.shops.list": (input) => {
    let data = getTiktokShops();
    const i = input as { search?: string; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(s => s.name.toLowerCase().includes(q));
    }
    return paginate(data, i);
  },

  // ─── TikTok Lives ────────────────────────────────────────
  "tiktok.lives.list": (input) => {
    let data = getTiktokLives();
    const i = input as { search?: string; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(l => l.title.toLowerCase().includes(q) || (l.creator ?? "").toLowerCase().includes(q));
    }
    return paginate(data, i);
  },

  // ─── Amazon Products ──────────────────────────────────────
  "amazon.products.list": (input) => {
    let data = getAmazonProducts();
    const i = input as { search?: string; category?: string; brand?: string; priceMin?: number; priceMax?: number; ratingMin?: number; sortBy?: string; sortOrder?: string; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(p => p.title.toLowerCase().includes(q) || (p.brand ?? "").toLowerCase().includes(q) || p.asin.toLowerCase().includes(q));
    }
    if (i?.category) data = data.filter(p => p.category === i.category);
    if (i?.brand) data = data.filter(p => p.brand === i.brand);
    if (i?.priceMin !== undefined) data = data.filter(p => parseFloat(p.price ?? "0") >= i.priceMin!);
    if (i?.priceMax !== undefined) data = data.filter(p => parseFloat(p.price ?? "0") <= i.priceMax!);
    if (i?.ratingMin !== undefined) data = data.filter(p => parseFloat(p.rating ?? "0") >= i.ratingMin!);
    const sortDir = i?.sortOrder === "asc" ? 1 : -1;
    const sortField = i?.sortBy ?? "sales";
    data.sort((a, b) => {
      const va = parseFloat(String((a as unknown as Record<string, unknown>)[sortField] ?? 0)) || 0;
      const vb = parseFloat(String((b as unknown as Record<string, unknown>)[sortField] ?? 0)) || 0;
      return (va - vb) * sortDir;
    });
    return paginate(data, i);
  },

  "amazon.products.getByAsin": (input) => {
    const i = input as { asin: string };
    return getAmazonProducts().find(p => p.asin === i.asin) ?? null;
  },

  "amazon.products.brands": () => {
    const brandSet = new Set(getAmazonProducts().map(p => p.brand));
    return Array.from(brandSet).sort();
  },

  // ─── Amazon Reviews ───────────────────────────────────────
  "amazon.reviews.list": (input) => {
    const i = input as { asin?: string; sentiment?: string; limit?: number; offset?: number } | undefined;
    let data = getAmazonReviews(i?.asin);
    if (i?.sentiment) data = data.filter(r => r.sentiment === i.sentiment);
    return paginate(data, i);
  },

  "amazon.reviews.stats": (input) => {
    const i = input as { asin: string };
    const reviews = getAmazonReviews(i.asin);
    const total = reviews.length;
    const positive = reviews.filter(r => r.sentiment === "positive").length;
    const negative = reviews.filter(r => r.sentiment === "negative").length;
    const neutral = reviews.filter(r => r.sentiment === "neutral").length;
    const avgRating = total > 0 ? reviews.reduce((s, r) => s + parseFloat(r.rating ?? "0"), 0) / total : 0;
    const aspectMap = new Map<string, { positive: number; negative: number; neutral: number }>();
    for (const r of reviews) {
      for (const a of (r.aspects ?? [])) {
        const existing = aspectMap.get(a.aspect) ?? { positive: 0, negative: 0, neutral: 0 };
        existing[a.sentiment as keyof typeof existing]++;
        aspectMap.set(a.aspect, existing);
      }
    }
    const aspects = Array.from(aspectMap.entries())
      .map(([aspect, counts]) => ({ aspect, ...counts, total: counts.positive + counts.negative + counts.neutral }))
      .sort((a, b) => b.total - a.total);
    return { total, positive, negative, neutral, avgRating: parseFloat(avgRating.toFixed(2)), aspects };
  },

  // ─── Amazon Keywords ──────────────────────────────────────
  "amazon.keyword.search": (input) => {
    const i = input as { query?: string } | undefined;
    return searchAmazonKeywords(i?.query);
  },
  "amazon.keyword.stats": () => getAmazonKeywordStats(),

  // ─── Amazon Markets ───────────────────────────────────────
  "amazon.hotMarket.list":  () => getHotMarket(),
  "amazon.potMarket.list":  () => getPotMarket(),
  "amazon.paramTrend.list": () => getParamMarket(),
  "amazon.brandTrend.list": () => getBrandMarket(),

  // ─── Fusion Concepts ──────────────────────────────────────
  "fusion.concepts.list": (input) => {
    let data = getProductConcepts();
    const i = input as { search?: string; category?: string; limit?: number; offset?: number } | undefined;
    if (i?.search) {
      const q = i.search.toLowerCase();
      data = data.filter(c => c.name.toLowerCase().includes(q) || (c.nameEn ?? "").toLowerCase().includes(q));
    }
    if (i?.category) data = data.filter(c => (c.amazonCategories ?? []).includes(i.category!));
    return paginate(data, i);
  },

  "fusion.concepts.getById": (input) => {
    const i = input as { conceptId: string };
    return getProductConcepts().find(c => c.conceptId === i.conceptId) ?? null;
  },

  // ─── Fusion Metrics ───────────────────────────────────────
  "fusion.metrics.list": (input) => {
    const i = input as { conceptId?: string; limit?: number } | undefined;
    const data = getConceptMetrics(i?.conceptId);
    return { items: data.slice(0, i?.limit ?? 30), total: data.length };
  },

  "fusion.metrics.latest": () => getLatestMetrics(),

  "fusion.metrics.topOpportunities": (input) => {
    const i = input as { limit?: number } | undefined;
    return getLatestMetrics().slice(0, i?.limit ?? 20);
  },

  // ─── Fusion Mappings ──────────────────────────────────────
  "fusion.mappings.list": (input) => {
    let data = getKeywordMappings();
    const i = input as { tiktokKeyword?: string; amazonKeyword?: string; limit?: number; offset?: number } | undefined;
    if (i?.tiktokKeyword) data = data.filter(m => m.tiktokKeyword.toLowerCase().includes(i.tiktokKeyword!.toLowerCase()));
    if (i?.amazonKeyword) data = data.filter(m => m.amazonKeyword.toLowerCase().includes(i.amazonKeyword!.toLowerCase()));
    return paginate(data, i);
  },

  // ─── Fusion Reports ───────────────────────────────────────
  "fusion.reports.list": (input) => {
    let data = getFusionReports();
    const i = input as { userId?: string; limit?: number } | undefined;
    if (i?.userId) data = data.filter(r => r.reportId.includes(i.userId!));
    return { items: data.slice(0, i?.limit ?? 10), total: data.length };
  },

  "fusion.reports.getById": (input) => {
    const i = input as { reportId: string };
    return getFusionReports().find(r => r.reportId === i.reportId) ?? null;
  },

  // ─── IPMS ────────────────────────────────────────────────
  "ipms.list": () => ({ items: [], total: 0 }),
  "ipms.getById": () => null,
  "ipms.create": () => ({ insertId: 0 }),
  "ipms.updateStage": () => ({ success: true }),
  "ipms.updateStatus": () => ({ success: true }),
  "ipms.addStageHistory": () => ({ insertId: 0 }),
  "ipms.delete": () => ({ success: true }),

  // ─── DataManager (演示实现，静态部署下展示完整体验) ────────────
  "dataManager.template.list": () => [],
  "dataManager.template.getByKey": () => null,
  "dataManager.template.upsert": () => ({ success: true }),
  "dataManager.dynamic.queryByKey": () => [],
  "dataManager.dynamic.getActiveKeys": () => [],
  "dataManager.dynamic.bulkInsert": () => ({ success: true, inserted: 0 }),
  "dataManager.dynamic.deleteByKey": () => ({ success: true }),
  "dataManager.import.ingest": (input) => {
    const records = (input as any)?.records ?? [];
    const total = records.length;
    const failed = total > 0 ? Math.floor(Math.random() * Math.min(3, total * 0.1)) : 0;
    return { dryRun: (input as any)?.dryRun ?? false, importId: Date.now(), totalRows: total, successRows: total - failed, failedRows: failed, errorSummary: failed > 0 ? [{ row: 2, field: 'price', message: '价格格式异常' }] : [] };
  },
  "dataManager.import.logs": () => [
    { id: 1, dataKey: 'tiktok_products', targetLayer: 'ods', targetTable: 'tiktok_products', status: 'completed', totalRows: 12450, successRows: 12450, failedRows: 0, triggeredAt: '2026-05-20T09:30:00Z', completedAt: '2026-05-20T09:32:15Z' },
    { id: 2, dataKey: 'amazon_products', targetLayer: 'ods', targetTable: 'amazon_products', status: 'completed', totalRows: 8320, successRows: 8318, failedRows: 2, triggeredAt: '2026-05-18T14:20:00Z', completedAt: '2026-05-18T14:21:40Z' },
    { id: 3, dataKey: 'tiktok_creators', targetLayer: 'ods', targetTable: 'tiktok_creators', status: 'completed', totalRows: 5600, successRows: 5600, failedRows: 0, triggeredAt: '2026-05-15T11:00:00Z', completedAt: '2026-05-15T11:01:30Z' },
  ],
  "dataManager.import.stats": () => ({ total: 12, success: 11, failed: 1, totalRows: 186370 }),
  "dataManager.ods.latestDates": () => ({ tiktok_products: '2026-05-20', amazon_products: '2026-05-18', tiktok_creators: '2026-05-15' }),
  "dataManager.file.list": () => ({ files: [], total: 0 }),
  "dataManager.file.stats": () => ({ totalFiles: 0, activeFiles: 0, totalSize: 0, totalRows: 0 }),
};

/**
 * 根据 tRPC 路径调用对应 mock 函数。
 * path 形如 "tiktok.home.productsHot"
 */
export function callMock(path: string, input: Input): unknown {
  const handler = mockHandlers[path];
  if (!handler) {
    console.warn(`[MockRouter] No handler for path: ${path}`);
    return null;
  }
  try {
    return handler(input);
  } catch (err) {
    console.error(`[MockRouter] Handler error for ${path}:`, err);
    return null;
  }
}
