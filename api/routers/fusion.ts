import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import {
  getProductConcepts,
  getConceptMetrics,
  getLatestMetrics,
  getKeywordMappings,
  getFusionReports,
} from "../services/mockData/fusionData";
import {
  dbGetProductConcepts,
  dbGetProductConceptById,
  dbGetConceptMetrics,
  dbGetLatestMetrics,
  dbGetKeywordMappings,
  dbGetFusionReports,
  dbGetFusionReportById,
} from "../services/db";

async function withFallback<T>(dbFn: () => Promise<T>, mockFn: () => unknown): Promise<T> {
  try {
    return await dbFn();
  } catch (err) {
    console.error('[DB Fallback][fusion]', err);
    return mockFn() as T;
  }
}

export const fusionRouter = createRouter({
  // ===== Product Concepts =====
  concepts: createRouter({
    list: publicQuery
      .input(
        z.object({
          search: z.string().optional(),
          category: z.string().optional(),
          limit: z.number().optional().default(20),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetProductConcepts({
            search: input?.search,
            category: input?.category,
            limit: input?.limit,
            offset: input?.offset,
          }),
          () => {
            let data = getProductConcepts();
            if (input?.search) {
              const q = input.search.toLowerCase();
              data = data.filter(
                (c) =>
                  c.name.toLowerCase().includes(q) ||
                  (c.nameEn ?? '').toLowerCase().includes(q)
              );
            }
            if (input?.category) {
              data = data.filter((c) =>
                (c.amazonCategories ?? []).includes(input.category!)
              );
            }
            return {
              items: data.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 20)),
              total: data.length,
            };
          }
        );
        return dbResult;
      }),

    getById: publicQuery
      .input(z.object({ conceptId: z.string() }))
      .query(async ({ input }) => {
        return await withFallback(
          () => dbGetProductConceptById(input.conceptId),
          () => getProductConcepts().find((c) => c.conceptId === input.conceptId) || null
        );
      }),
  }),

  // ===== Concept Metrics =====
  metrics: createRouter({
    list: publicQuery
      .input(
        z.object({
          conceptId: z.string().optional(),
          limit: z.number().optional().default(30),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetConceptMetrics(input?.conceptId, input?.limit),
          () => {
            const data = getConceptMetrics(input?.conceptId);
            return { items: data.slice(0, input?.limit || 30), total: data.length };
          }
        );
        return dbResult;
      }),

    latest: publicQuery.query(async () => {
      return await withFallback(
        () => dbGetLatestMetrics(50),
        () => getLatestMetrics()
      );
    }),

    topOpportunities: publicQuery
      .input(z.object({ limit: z.number().optional().default(20), category: z.string().optional() }))
      .query(async ({ input }) => {
        let items = await withFallback(
          () => dbGetLatestMetrics(input.limit),
          () => getLatestMetrics().slice(0, input.limit)
        );
        if (input.category) {
          const concepts = getProductConcepts();
          items = items.filter((m: any) => {
            const c = concepts.find((x: any) => x.conceptId === m.conceptId);
            return c && (c.amazonCategories ?? []).includes(input.category!);
          });
        }
        return items;
      }),
  }),

  // ===== Keyword Mappings =====
  mappings: createRouter({
    list: publicQuery
      .input(
        z.object({
          tiktokKeyword: z.string().optional(),
          amazonKeyword: z.string().optional(),
          limit: z.number().optional().default(50),
          offset: z.number().optional().default(0),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetKeywordMappings({
            tiktokKeyword: input?.tiktokKeyword,
            amazonKeyword: input?.amazonKeyword,
            limit: input?.limit,
            offset: input?.offset,
          }),
          () => {
            let data = getKeywordMappings();
            if (input?.tiktokKeyword) {
              data = data.filter((m) =>
                m.tiktokKeyword
                  .toLowerCase()
                  .includes(input.tiktokKeyword!.toLowerCase())
              );
            }
            if (input?.amazonKeyword) {
              data = data.filter((m) =>
                m.amazonKeyword
                  .toLowerCase()
                  .includes(input.amazonKeyword!.toLowerCase())
              );
            }
            return {
              items: data.slice(input?.offset || 0, (input?.offset || 0) + (input?.limit || 50)),
              total: data.length,
            };
          }
        );
        return dbResult;
      }),
  }),

  // ===== Reports =====
  reports: createRouter({
    list: publicQuery
      .input(
        z.object({
          userId: z.string().optional(),
          limit: z.number().optional().default(10),
        }).optional()
      )
      .query(async ({ input }) => {
        const dbResult = await withFallback(
          () => dbGetFusionReports({ userId: input?.userId, limit: input?.limit }),
          () => {
            let data = getFusionReports();
            if (input?.userId) {
              data = data.filter((r) => r.reportId.includes(input.userId!));
            }
            return { items: data.slice(0, input?.limit || 10), total: data.length };
          }
        );
        return dbResult;
      }),

    getById: publicQuery
      .input(z.object({ reportId: z.string() }))
      .query(async ({ input }) => {
        return await withFallback(
          () => dbGetFusionReportById(input.reportId),
          () => getFusionReports().find((r) => r.reportId === input.reportId) || null
        );
      }),
  }),
});
