import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  getAmazonProducts,
  getAmazonReviews,
  searchAmazonKeywords,
  getAmazonKeywordStats,
  getHotMarket,
  getPotMarket,
  getParamMarket,
  getBrandMarket,
} from "../services/mockData/amazonData";
import {
  dbGetAmazonProducts,
  dbGetAmazonProductByAsin,
  dbGetAmazonBrands,
  dbGetAmazonReviews,
  dbGetAmazonReviewStats,
  dbSearchAmazonKeywords,
  dbGetAmazonKeywordStats,
  dbGetHotMarket,
  dbGetPotMarket,
  dbGetParamMarket,
  dbGetBrandMarket,
} from "../services/db";

// Helper: try DB first, fallback to mockData
async function withFallback<T>(dbFn: () => Promise<T>, mockFn: () => unknown): Promise<T> {
  try {
    return await dbFn();
  } catch (err) {
    console.error('[DB Fallback][amazon]', err);
    return mockFn() as T;
  }
}

export const amazonRouter = createRouter({
  // ===== Products =====
  products: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          brand: z.string().optional(),
          priceMin: z.number().optional(),
          priceMax: z.number().optional(),
          salesMin: z.number().optional(),
          salesMax: z.number().optional(),
          ratingMin: z.number().optional(),
          sortBy: z.enum(["sales", "rating", "price", "reviews", "heat"]).optional().default("sales"),
          sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetAmazonProducts({ search: input?.search, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getAmazonProducts();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(p => p.title.toLowerCase().includes(q) || (p.brand ?? '').toLowerCase().includes(q) || p.asin.toLowerCase().includes(q));
            }
            if (input?.category) data = data.filter(p => p.category === input.category);
            if (input?.brand) data = data.filter(p => p.brand === input.brand);
            if (input?.priceMin !== undefined) data = data.filter(p => parseFloat(p.price ?? '0') >= input.priceMin!);
            if (input?.priceMax !== undefined) data = data.filter(p => parseFloat(p.price ?? '0') <= input.priceMax!);
            if (input?.salesMin !== undefined) data = data.filter(p => (p.monthlySales ?? 0) >= input.salesMin!);
            if (input?.salesMax !== undefined) data = data.filter(p => (p.monthlySales ?? 0) <= input.salesMax!);
            if (input?.ratingMin !== undefined) data = data.filter(p => parseFloat(p.rating ?? '0') >= input.ratingMin!);
            const sortField = input?.sortBy || "sales";
            const sortDir = input?.sortOrder === "asc" ? 1 : -1;
            data.sort((a, b) => {
              const va = parseFloat(String((a as unknown as Record<string, unknown>)[sortField] ?? 0)) || 0;
              const vb = parseFloat(String((b as unknown as Record<string, unknown>)[sortField] ?? 0)) || 0;
              return (va - vb) * sortDir;
            });
            return { items: data, total: data.length };
          }
        );

        const { items, total } = dbResult;
        const limit = input?.limit || 50;
        const offset = input?.offset || 0;
        return { items: items.slice(offset, offset + limit), total };
      }),

    getByAsin: publicQuery
      .input(z.object({ asin: z.string() }))
      .query(async ({ input }) => {
        return await withFallback(
          () => dbGetAmazonProductByAsin(input.asin),
          () => getAmazonProducts().find(p => p.asin === input.asin) || null
        );
      }),

    brands: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetAmazonBrands(),
        () => {
          const products = getAmazonProducts();
          const brandSet = new Set(products.map(p => p.brand));
          return Array.from(brandSet).sort();
        }
      );
    }),
  }),

  // ===== Reviews (VOC) =====
  reviews: createRouter({
    list: publicQuery
      .input(
        z.object({
          asin: z.string().optional(),
          sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetAmazonReviews({ asin: input?.asin, sentiment: input?.sentiment, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getAmazonReviews(input?.asin);
            if (input?.sentiment) data = data.filter(r => r.sentiment === input.sentiment);
            return { items: data, total: data.length };
          }
        );
        return dbResult;
      }),

    stats: publicQuery
      .input(z.object({ asin: z.string() }))
      .query(async ({ input }) => {
        return await withFallback(
          () => dbGetAmazonReviewStats(input.asin),
          () => {
            const reviews = getAmazonReviews(input.asin);
            const total = reviews.length;
            const positive = reviews.filter(r => r.sentiment === "positive").length;
            const negative = reviews.filter(r => r.sentiment === "negative").length;
            const neutral = reviews.filter(r => r.sentiment === "neutral").length;
            const avgRating = total > 0 ? reviews.reduce((s, r) => s + parseFloat(r.rating ?? '0'), 0) / total : 0;
            const aspectMap = new Map<string, { positive: number; negative: number; neutral: number }>();
            for (const r of reviews) {
              for (const a of (r.aspects ?? [])) {
                const existing = aspectMap.get(a.aspect) || { positive: 0, negative: 0, neutral: 0 };
                existing[a.sentiment as keyof typeof existing]++;
                aspectMap.set(a.aspect, existing);
              }
            }
            const aspects = Array.from(aspectMap.entries()).map(([aspect, counts]) => ({
              aspect, positive: counts.positive, negative: counts.negative,
              neutral: counts.neutral, total: counts.positive + counts.negative + counts.neutral,
            })).sort((a, b) => b.total - a.total);
            return { total, positive, negative, neutral, avgRating: parseFloat(avgRating.toFixed(2)), aspects };
          }
        );
      }),
  }),

  // ===== Keywords =====
  keyword: createRouter({
    search: publicQuery
      .input(z.object({ query: z.string().optional() }))
      .query(async ({ input }) => {
        return await withFallback(
          () => dbSearchAmazonKeywords(input.query),
          () => searchAmazonKeywords(input.query)
        );
      }),

    stats: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetAmazonKeywordStats(),
        () => getAmazonKeywordStats()
      );
    }),
  }),

  // ===== Markets =====
  hotMarket: createRouter({
    list: publicQuery.query(async () => {
      return await withFallback(() => dbGetHotMarket(), () => getHotMarket());
    }),
  }),

  potMarket: createRouter({
    list: publicQuery.query(async () => {
      return await withFallback(() => dbGetPotMarket(), () => getPotMarket());
    }),
  }),

  paramTrend: createRouter({
    list: publicQuery.query(async () => {
      return await withFallback(() => dbGetParamMarket(), () => getParamMarket());
    }),
  }),

  brandTrend: createRouter({
    list: publicQuery.query(async () => {
      return await withFallback(() => dbGetBrandMarket(), () => getBrandMarket());
    }),
  }),
});
