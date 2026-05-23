import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
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
} from "../services/mockData/tiktokData";
import {
  dbGetTiktokProducts,
  dbGetTiktokCreators,
  dbGetTiktokVideos,
  dbGetTiktokShops,
  dbGetTiktokLives,
  dbGetHomeData,
  dbGetAnalysisData,
} from "../services/db";

async function withFallback<T>(dbFn: () => Promise<T>, mockFn: () => unknown): Promise<T> {
  try {
    return await dbFn();
  } catch (err) {
    console.error('[DB Fallback][tiktok]', err);
    return mockFn() as T;
  }
}

export const tiktokRouter = createRouter({
  // ===== Home Page Data =====
  home: createRouter({
    productsHot: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("productsHot", 10),
        () => getTiktokHomeProducts("hot")
      );
    }),
    productsSoaring: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("productsSoaring", 10),
        () => getTiktokHomeProducts("soaring")
      );
    }),
    productsNew: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("productsNew", 10),
        () => getTiktokHomeProducts("new")
      );
    }),
    influencersSales: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("influencersSales", 10),
        () => getTiktokHomeInfluencers("sales")
      );
    }),
    influencersFans: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("influencersFans", 10),
        () => getTiktokHomeInfluencers("fans")
      );
    }),
    shopsHot: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("shopsHot", 10),
        () => getTiktokHomeShops()
      );
    }),
    videosHot: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("videosHot", 10),
        () => getTiktokHomeVideos()
      );
    }),
    livesPopular: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetHomeData("livesPopular", 10),
        () => getTiktokHomeLives()
      );
    }),
  }),

  // ===== Analysis Dashboard =====
  analysis: createRouter({
    kpi: publicQuery.query(async (): Promise<ReturnType<typeof getTiktokKpi>> => {
      const result = await withFallback(
        () => dbGetAnalysisData("kpi"),
        () => getTiktokKpi()
      );
      return result as ReturnType<typeof getTiktokKpi>;
    }),
    heatmap: publicQuery.query(async (): Promise<ReturnType<typeof getHeatmapData>> => {
      const result = await withFallback(
        () => dbGetAnalysisData("heatmap"),
        () => getHeatmapData()
      );
      return result as ReturnType<typeof getHeatmapData>;
    }),
    gmvTrend: publicQuery.query(async (): Promise<ReturnType<typeof getGmvTrend>> => {
      const result = await withFallback(
        () => dbGetAnalysisData("gmvTrend"),
        () => getGmvTrend()
      );
      return result as ReturnType<typeof getGmvTrend>;
    }),
    categoryShare: publicQuery.query(async (): Promise<ReturnType<typeof getCategoryShare>> => {
      const result = await withFallback(
        () => dbGetAnalysisData("categoryShare"),
        () => getCategoryShare()
      );
      return result as ReturnType<typeof getCategoryShare>;
    }),
    priceDistribution: publicQuery.query(async (): Promise<ReturnType<typeof getPriceDistribution>> => {
      const result = await withFallback(
        () => dbGetAnalysisData("priceDistribution"),
        () => getPriceDistribution()
      );
      return result as ReturnType<typeof getPriceDistribution>;
    }),
    influencerMatrix: publicQuery.query(async (): Promise<ReturnType<typeof getInfluencerMatrix>> => {
      const result = await withFallback(
        () => dbGetAnalysisData("influencerMatrix"),
        () => getInfluencerMatrix()
      );
      return result as ReturnType<typeof getInfluencerMatrix>;
    }),
  }),

  // ===== Products =====
  products: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          tab: z.enum(["hot", "soaring", "new"]).optional().default("hot"),
          priceMin: z.number().optional(),
          priceMax: z.number().optional(),
          ratingMin: z.number().optional(),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetTiktokProducts({ search: input?.search, tab: input?.tab, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getTiktokProducts();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(p => p.name.toLowerCase().includes(q));
            }
            if (input?.category) data = data.filter(p => p.category === input.category);
            if (input?.priceMin !== undefined) data = data.filter(p => (p.price || 0) >= input.priceMin!);
            if (input?.priceMax !== undefined) data = data.filter(p => (p.price || 999) <= input.priceMax!);
            if (input?.ratingMin !== undefined) data = data.filter(p => p.rating >= input.ratingMin!);
            if (input?.tab === "soaring") {
              data.sort((a, b) => parseFloat(b.salesGrowth) - parseFloat(a.salesGrowth));
            } else if (input?.tab === "new") {
              data = data.filter(p => p.date?.startsWith("2026-03"));
            }
            return { items: data, total: data.length };
          }
        );
        const { items, total } = dbResult;
        return { items: items.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 20)), total };
      }),
  }),

  // ===== Creators =====
  creators: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          tab: z.enum(["sales", "fans"]).optional().default("sales"),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetTiktokCreators({ search: input?.search, tab: input?.tab, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getTiktokCreators();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(c => c.username.toLowerCase().includes(q) || (c.displayName ?? '').toLowerCase().includes(q));
            }
            return { items: data, total: data.length };
          }
        );
        const { items, total } = dbResult;
        return { items: items.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 20)), total };
      }),
  }),

  // ===== Videos =====
  videos: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          tab: z.enum(["views", "sales"]).optional().default("views"),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetTiktokVideos({ search: input?.search, tab: input?.tab, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getTiktokVideos();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(v => v.title.toLowerCase().includes(q));
            }
            return { items: data, total: data.length };
          }
        );
        const { items, total } = dbResult;
        return { items: items.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 20)), total };
      }),
  }),

  // ===== Shops =====
  shops: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetTiktokShops({ search: input?.search, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getTiktokShops();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(s => s.name.toLowerCase().includes(q));
            }
            return { items: data, total: data.length };
          }
        );
        const { items, total } = dbResult;
        return { items: items.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 20)), total };
      }),
  }),

  // ===== Lives =====
  lives: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetTiktokLives({ search: input?.search, limit: input?.limit, offset: input?.offset }),
          () => {
            let data = getTiktokLives();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(l => l.title.toLowerCase().includes(q) || (l.creator ?? '').toLowerCase().includes(q));
            }
            return { items: data, total: data.length };
          }
        );
        const { items, total } = dbResult;
        return { items: items.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 20)), total };
      }),
  }),
});
