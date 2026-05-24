import { z } from "zod";
import { createRouter, publicQuery } from "../middleware";
import { getDb } from "../queries/connection";
import { triggerETL } from "../services/etl/pipeline";
import {
  dataFiles, dataTemplates, dynamicData, importLogs,
  odsTiktokProducts, odsTiktokCreators, odsTiktokShops,
  odsTiktokVideos, odsTiktokLives,
  odsAmazonProducts, odsAmazonKeywords, odsAmazonReviews,
} from "@db/schema";
import { eq, desc, like, and, sql } from "drizzle-orm";
import { mkdir, unlink } from "fs/promises";
import { join } from "path";

const UPLOAD_DIR = join(process.cwd(), "uploads");
try { await mkdir(UPLOAD_DIR, { recursive: true }); } catch { /* exists */ }

// ── ODS 写入分发器 ─────────────────────────────────────────────────────────
// targetLayer=ods 时，按 targetTable 分发到对应 ODS 表

type RawRecord = Record<string, unknown>;

const ODS_WRITERS: Record<string, (db: ReturnType<typeof getDb>, rows: { snapshotDate: string; importId: number; record: RawRecord }[]) => Promise<void>> = {
  ods_tiktok_products: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      productId: String(r.product_id ?? r.productId ?? r.id ?? ""),
      productName: r.product_name ?? r.productName ?? r.name ? String(r.product_name ?? r.productName ?? r.name) : null,
      category: r.category ? String(r.category) : null,
      price: r.price != null ? String(r.price) : null,
      salesGrowth: r.sales_growth ?? r.salesGrowth ? String(r.sales_growth ?? r.salesGrowth) : null,
      monthlySales: r.monthly_sales ?? r.monthlySales ? Number(r.monthly_sales ?? r.monthlySales) : 0,
      monthlyRevenue: r.monthly_revenue ?? r.monthlyRevenue ? String(r.monthly_revenue ?? r.monthlyRevenue) : null,
      rating: r.rating != null ? String(r.rating) : null,
      influencerCount: r.influencer_count ?? r.influencers ? Number(r.influencer_count ?? r.influencers) : 0,
      shopType: r.shop_type ?? r.shopType ? String(r.shop_type ?? r.shopType) : null,
      date: r.date ? String(r.date) : null,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsTiktokProducts) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_tiktok_creators: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      creatorId: String(r.creator_id ?? r.creatorId ?? r.id ?? ""),
      username: r.username ? String(r.username) : null,
      displayName: r.display_name ?? r.displayName ? String(r.display_name ?? r.displayName) : null,
      followers: r.followers ? Number(r.followers) : 0,
      monthlySales: r.monthly_sales ?? r.monthlySales ? Number(r.monthly_sales ?? r.monthlySales) : 0,
      monthlyRevenue: r.monthly_revenue ?? r.monthlyRevenue ? String(r.monthly_revenue ?? r.monthlyRevenue) : null,
      videoGpm: r.video_gpm ?? r.videoGpm ? String(r.video_gpm ?? r.videoGpm) : null,
      liveGpm: r.live_gpm ?? r.liveGpm ? String(r.live_gpm ?? r.liveGpm) : null,
      categories: Array.isArray(r.categories) ? r.categories as string[] : [],
      fanGrowthRate: r.fan_growth_rate ?? r.fanGrowth ? String(r.fan_growth_rate ?? r.fanGrowth) : null,
      accountType: r.account_type ?? r.accountType ? String(r.account_type ?? r.accountType) : null,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsTiktokCreators) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_tiktok_shops: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      shopId: String(r.shop_id ?? r.shopId ?? r.id ?? ""),
      name: r.name ? String(r.name) : null,
      country: r.country ? String(r.country) : null,
      category: r.category ? String(r.category) : null,
      sales: r.sales ? Number(r.sales) : 0,
      salesGrowth: r.sales_growth ?? r.salesGrowth ? String(r.sales_growth ?? r.salesGrowth) : null,
      revenue: r.revenue ? String(r.revenue) : null,
      activeProducts: r.active_products ?? r.activeProducts ? Number(r.active_products ?? r.activeProducts) : 0,
      totalProducts: r.total_products ?? r.totalProducts ? Number(r.total_products ?? r.totalProducts) : 0,
      rating: r.rating != null ? String(r.rating) : null,
      influencers: r.influencers ? Number(r.influencers) : 0,
      shopType: r.shop_type ?? r.shopType ? String(r.shop_type ?? r.shopType) : null,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsTiktokShops) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_tiktok_videos: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      videoId: String(r.video_id ?? r.videoId ?? r.id ?? ""),
      title: r.title ? String(r.title) : null,
      creatorId: r.creator_id ?? r.creatorId ? String(r.creator_id ?? r.creatorId) : null,
      views: r.views ? Number(r.views) : 0,
      likes: r.likes ? Number(r.likes) : 0,
      engagementRate: r.engagement_rate ?? r.engagementRate ? String(r.engagement_rate ?? r.engagementRate) : null,
      monthlySales: r.monthly_sales ?? r.monthlySales ? Number(r.monthly_sales ?? r.monthlySales) : 0,
      hashtags: Array.isArray(r.hashtags) ? r.hashtags as string[] : [],
      postedAt: r.posted_at ?? r.date ? String(r.posted_at ?? r.date) : null,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsTiktokVideos) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_tiktok_lives: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      liveId: String(r.live_id ?? r.id ?? ""),
      title: r.title ? String(r.title) : null,
      creatorId: r.creator_id ?? r.creatorId ? String(r.creator_id ?? r.creatorId) : null,
      viewers: r.viewers ? Number(r.viewers) : 0,
      maxOnline: r.max_online ?? r.maxOnline ? Number(r.max_online ?? r.maxOnline) : 0,
      likes: r.likes ? Number(r.likes) : 0,
      duration: r.duration ? Number(r.duration) : 0,
      gpm: r.gpm != null ? String(r.gpm) : null,
      status: r.status ? String(r.status) : null,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsTiktokLives) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_amazon_products: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      asin: String(r.asin ?? ""),
      title: r.title ? String(r.title) : null,
      brand: r.brand ? String(r.brand) : null,
      category: r.category ? String(r.category) : null,
      categoryPath: r.category_path ?? r.categoryPath ? String(r.category_path ?? r.categoryPath) : null,
      price: r.price != null ? String(r.price) : null,
      monthlySales: r.monthly_sales ?? r.monthlySales ? Number(r.monthly_sales ?? r.monthlySales) : 0,
      monthlyRevenue: r.monthly_revenue ?? r.monthlyRevenue ? String(r.monthly_revenue ?? r.monthlyRevenue) : null,
      bsrRank: r.bsr_rank ?? r.bsrRank ? Number(r.bsr_rank ?? r.bsrRank) : null,
      rating: r.rating != null ? String(r.rating) : null,
      reviewCount: r.review_count ?? r.reviewCount ? Number(r.review_count ?? r.reviewCount) : 0,
      fulfillmentType: r.fulfillment_type ?? r.fulfillmentType ? String(r.fulfillment_type ?? r.fulfillmentType) : null,
      launchDate: r.launch_date ?? r.launchDate ? String(r.launch_date ?? r.launchDate) : null,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsAmazonProducts) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_amazon_keywords: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      keyword: String(r.keyword ?? ""),
      searchVolume: r.search_volume ?? r.searchVolume ? Number(r.search_volume ?? r.searchVolume) : 0,
      monthlyRevenue: r.monthly_revenue ?? r.monthlyRevenue ? String(r.monthly_revenue ?? r.monthlyRevenue) : null,
      monthlySales: r.monthly_sales ?? r.monthlySales ?? r.sales ? Number(r.monthly_sales ?? r.monthlySales ?? r.sales) : 0,
      avgPrice: r.avg_price ?? r.price ? String(r.avg_price ?? r.price) : null,
      avgRating: r.avg_rating ?? r.rating ? String(r.avg_rating ?? r.rating) : null,
      top3Share: r.top3_share ?? r.top3 ? String(r.top3_share ?? r.top3) : null,
      newProductShare: r.new_product_share ?? r.newP ? String(r.new_product_share ?? r.newP) : null,
      competitionLevel: r.competition_level ?? r.competition ? String(r.competition_level ?? r.competition) : null,
      topBrands: Array.isArray(r.top_brands) ? r.top_brands as string[] : [],
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsAmazonKeywords) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },

  ods_amazon_reviews: async (db, rows) => {
    const values = rows.map(({ snapshotDate, importId, record: r }) => ({
      snapshotDate,
      importId,
      reviewId: String(r.review_id ?? r.reviewId ?? r.id ?? ""),
      asin: String(r.asin ?? ""),
      rating: r.rating != null ? String(r.rating) : null,
      sentiment: r.sentiment ? String(r.sentiment) : null,
      content: r.content ? String(r.content) : null,
      title: r.title ? String(r.title) : null,
      reviewDate: r.review_date ?? r.reviewDate ? String(r.review_date ?? r.reviewDate) : null,
      verifiedPurchase: Boolean(r.verified_purchase ?? r.verifiedPurchase),
      helpfulCount: r.helpful_count ?? r.helpfulCount ? Number(r.helpful_count ?? r.helpfulCount) : 0,
      rawData: r,
    }));
    if (values.length > 0) await (db.insert(odsAmazonReviews) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
  },
};

// ── 字段校验引擎 ───────────────────────────────────────────────────────────

interface ColumnDef {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "json" | "date";
  required?: boolean;
  aliasFor?: string;
  validRange?: [number, number];
}

interface ValidationError { row: number; field: string; message: string }

function validateAndMap(
  records: RawRecord[],
  columns: ColumnDef[]
): { mapped: RawRecord[]; errors: ValidationError[] } {
  const errors: ValidationError[] = [];
  const mapped = records.map((raw, rowIdx) => {
    const out: RawRecord = {};
    for (const col of columns) {
      const aliases = [col.key, col.aliasFor].filter(Boolean) as string[];
      let val: unknown = undefined;
      for (const alias of aliases) {
        if (raw[alias] !== undefined) { val = raw[alias]; break; }
      }
      if (val === undefined || val === null || val === "") {
        if (col.required) {
          errors.push({ row: rowIdx + 2, field: col.key, message: `必填字段缺失` });
        }
        out[col.key] = null;
        continue;
      }
      if (col.type === "number") {
        const n = Number(val);
        if (isNaN(n)) {
          errors.push({ row: rowIdx + 2, field: col.key, message: `期望数字，得到: ${val}` });
          out[col.key] = null;
        } else {
          if (col.validRange) {
            const [min, max] = col.validRange;
            if (n < min || n > max) {
              errors.push({ row: rowIdx + 2, field: col.key, message: `值 ${n} 超出范围 [${min}, ${max}]` });
            }
          }
          out[col.key] = n;
        }
      } else if (col.type === "boolean") {
        out[col.key] = val === true || val === "true" || val === 1 || val === "1" || val === "yes";
      } else {
        out[col.key] = String(val);
      }
    }
    return out;
  });
  return { mapped, errors };
}

// ── Template Router ────────────────────────────────────────────────────────

const templateRouter = createRouter({
  list: publicQuery.query(async () => {
    const db = getDb();
    return db.select().from(dataTemplates).orderBy(dataTemplates.page, dataTemplates.module);
  }),

  getByKey: publicQuery
    .input(z.object({ dataKey: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [t] = await db.select().from(dataTemplates)
        .where(eq(dataTemplates.dataKey, input.dataKey)).limit(1);
      return t ?? null;
    }),

  upsert: publicQuery
    .input(z.object({
      dataKey: z.string(),
      name: z.string(),
      description: z.string().optional(),
      page: z.string(),
      module: z.string(),
      targetLayer: z.enum(["ods", "dwd", "custom"]).default("custom"),
      targetTable: z.string().optional(),
      columns: z.array(z.object({
        key: z.string(),
        label: z.string(),
        type: z.enum(["string", "number", "boolean", "json", "date"]),
        required: z.boolean().optional(),
        aliasFor: z.string().optional(),
        validRange: z.tuple([z.number(), z.number()]).optional(),
      })),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const existing = await db.select({ id: dataTemplates.id })
        .from(dataTemplates).where(eq(dataTemplates.dataKey, input.dataKey)).limit(1);
      if (existing.length > 0) {
        await db.update(dataTemplates).set({
          name: input.name,
          description: input.description,
          page: input.page,
          module: input.module,
          targetLayer: input.targetLayer,
          targetTable: input.targetTable ?? null,
          columns: input.columns,
        }).where(eq(dataTemplates.dataKey, input.dataKey));
      } else {
        await db.insert(dataTemplates).values(input);
      }
      return { success: true };
    }),
});

// ── Import Router ──────────────────────────────────────────────────────────

const importRouter = createRouter({
  ingest: publicQuery
    .input(z.object({
      dataKey: z.string(),
      snapshotDate: z.string(),
      records: z.array(z.record(z.string(), z.unknown())),
      dryRun: z.boolean().optional().default(false),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();

      const [template] = await db.select().from(dataTemplates)
        .where(eq(dataTemplates.dataKey, input.dataKey)).limit(1);

      const { mapped, errors } = template
        ? validateAndMap(input.records as RawRecord[], template.columns as ColumnDef[])
        : { mapped: input.records as RawRecord[], errors: [] };

      if (input.dryRun) {
        return {
          dryRun: true,
          totalRows: input.records.length,
          successRows: mapped.length - errors.length,
          failedRows: errors.length,
          errorSummary: errors.slice(0, 50),
        };
      }

      const [logResult] = await db.insert(importLogs).values({
        sourceType: "excel",
        dataKey: input.dataKey,
        targetLayer: (template?.targetLayer ?? "custom") as "ods" | "dwd" | "custom",
        targetTable: template?.targetTable ?? null,
        totalRows: input.records.length,
        successRows: 0,
        failedRows: errors.length,
        errorSummary: errors.slice(0, 100),
        status: "running",
      });
      const logId = Number(logResult.insertId);

      let successRows = 0;
      const targetTable = template?.targetTable;
      const targetLayer = template?.targetLayer ?? "custom";

      if (targetLayer === "ods" && targetTable && ODS_WRITERS[targetTable]) {
        const rowsToWrite = mapped
          .filter((_, i) => !errors.find(e => e.row === i + 2))
          .map(record => ({
            snapshotDate: input.snapshotDate,
            importId: logId,
            record,
          }));
        await ODS_WRITERS[targetTable](db, rowsToWrite);
        successRows = rowsToWrite.length;
      } else {
        await db.delete(dynamicData).where(eq(dynamicData.dataKey, input.dataKey));
        const values = mapped.map((r, i) => ({
          dataKey: input.dataKey,
          recordData: r,
          sortOrder: i,
        }));
        if (values.length > 0) await (db.insert(dynamicData) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
        successRows = values.length;
      }

      await db.update(importLogs).set({
        successRows,
        failedRows: errors.length,
        status: errors.length === 0 ? "success" : successRows > 0 ? "partial" : "failed",
        completedAt: new Date(),
      }).where(eq(importLogs.id, logId));

      // Trigger ETL pipeline asynchronously (don't block response)
      if (successRows > 0 && targetLayer === "ods") {
        triggerETL(input.dataKey, input.snapshotDate).catch((err) => {
          console.error(`[ETL] Failed for ${input.dataKey}:`, err);
        });
      }

      return {
        dryRun: false,
        importId: logId,
        totalRows: input.records.length,
        successRows,
        failedRows: errors.length,
        errorSummary: errors.slice(0, 50),
      };
    }),

  logs: publicQuery
    .input(z.object({
      dataKey: z.string().optional(),
      limit: z.number().optional().default(20),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = input?.dataKey
        ? [eq(importLogs.dataKey, input.dataKey)]
        : [];
      const rows = await db.select().from(importLogs)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(importLogs.triggeredAt))
        .limit(input?.limit ?? 20);
      return rows;
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const rows = await db.select({
      total: sql<number>`count(*)`,
      success: sql<number>`sum(case when status = 'success' then 1 else 0 end)`,
      failed: sql<number>`sum(case when status = 'failed' then 1 else 0 end)`,
      totalRows: sql<number>`sum(success_rows)`,
    }).from(importLogs);
    return rows[0] ?? { total: 0, success: 0, failed: 0, totalRows: 0 };
  }),
});

// ── Dynamic Data Router（保留，向后兼容）────────────────────────────────────

const dynamicRouter = createRouter({
  queryByKey: publicQuery
    .input(z.object({ dataKey: z.string() }))
    .query(async ({ input }) => {
      const db = getDb();
      const rows = await db.select().from(dynamicData)
        .where(eq(dynamicData.dataKey, input.dataKey))
        .orderBy(dynamicData.sortOrder);
      return rows.map(r => r.recordData);
    }),

  getActiveKeys: publicQuery.query(async () => {
    const db = getDb();
    const result = await db.selectDistinct({ dataKey: dynamicData.dataKey }).from(dynamicData);
    return result.map(r => r.dataKey);
  }),

  bulkInsert: publicQuery
    .input(z.object({
      dataKey: z.string(),
      records: z.array(z.record(z.string(), z.unknown())),
    }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(dynamicData).where(eq(dynamicData.dataKey, input.dataKey));
      const values = input.records.map((r, i) => ({
        dataKey: input.dataKey,
        recordData: r as Record<string, unknown>,
        sortOrder: i,
      }));
      if (values.length > 0) await (db.insert(dynamicData) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(values);
      return { success: true, inserted: values.length };
    }),

  deleteByKey: publicQuery
    .input(z.object({ dataKey: z.string() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(dynamicData).where(eq(dynamicData.dataKey, input.dataKey));
      return { success: true };
    }),

  _deleteById: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.delete(dynamicData).where(eq(dynamicData.id, input.id));
      return { success: true };
    }),
});

// ── ODS Query Router ───────────────────────────────────────────────────────

const odsRouter = createRouter({
  latestDates: publicQuery.query(async () => {
    const db = getDb();
    const tables = [
      { name: "ods_tiktok_products", table: odsTiktokProducts },
      { name: "ods_tiktok_creators", table: odsTiktokCreators },
      { name: "ods_tiktok_shops", table: odsTiktokShops },
      { name: "ods_amazon_products", table: odsAmazonProducts },
      { name: "ods_amazon_keywords", table: odsAmazonKeywords },
    ] as const;

    const results: Record<string, { latestDate: string | null; rowCount: number }> = {};
    for (const { name, table } of tables) {
      const rows = await db.select({
        latestDate: sql<string>`max(snapshot_date)`,
        rowCount: sql<number>`count(*)`,
      }).from(table);
      results[name] = { latestDate: rows[0]?.latestDate ?? null, rowCount: rows[0]?.rowCount ?? 0 };
    }
    return results;
  }),
});

// ── File Router（保留）────────────────────────────────────────────────────

const fileRouter = createRouter({
  list: publicQuery
    .input(z.object({
      search: z.string().optional(),
      status: z.enum(["active", "archived", "deleted"]).optional(),
    }).optional())
    .query(async ({ input }) => {
      const db = getDb();
      const conditions = [];
      if (input?.status) conditions.push(eq(dataFiles.status, input.status));
      else conditions.push(eq(dataFiles.status, "active"));
      if (input?.search) conditions.push(like(dataFiles.originalName, `%${input.search}%`));
      const files = await db.select().from(dataFiles)
        .where(conditions.length > 0 ? and(...conditions) : undefined)
        .orderBy(desc(dataFiles.uploadedAt));
      return { files, total: files.length };
    }),

  getById: publicQuery
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const db = getDb();
      const [f] = await db.select().from(dataFiles).where(eq(dataFiles.id, input.id)).limit(1);
      return f ?? null;
    }),

  delete: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      const [f] = await db.select().from(dataFiles).where(eq(dataFiles.id, input.id)).limit(1);
      if (!f) return { success: false };
      await db.update(dataFiles).set({ status: "deleted" }).where(eq(dataFiles.id, input.id));
      try { await unlink(join(UPLOAD_DIR, f.fileName)); } catch { /* ok */ }
      return { success: true };
    }),

  archive: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(dataFiles).set({ status: "archived" }).where(eq(dataFiles.id, input.id));
      return { success: true };
    }),

  restore: publicQuery
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      const db = getDb();
      await db.update(dataFiles).set({ status: "active" }).where(eq(dataFiles.id, input.id));
      return { success: true };
    }),

  stats: publicQuery.query(async () => {
    const db = getDb();
    const all = await db.select().from(dataFiles);
    return {
      totalFiles: all.length,
      activeFiles: all.filter(f => f.status === "active").length,
      totalSize: all.reduce((s, f) => s + f.fileSize, 0),
      totalRows: all.reduce((s, f) => s + (f.rowCount ?? 0), 0),
    };
  }),
});

// ── 主路由 ─────────────────────────────────────────────────────────────────

export const dataManagerRouter = createRouter({
  template: templateRouter,
  import: importRouter,
  dynamic: dynamicRouter,
  ods: odsRouter,
  file: fileRouter,
});
