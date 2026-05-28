/**
 * 爬虫数据 → ODS 写入管道
 *
 * 复用 dataManagerRouter 的 ODS 写入逻辑，直接写入数据库
 */

import { getDb } from "../../../queries/connection.ts";
import {
  odsTiktokProducts,
  odsTiktokCreators,
  odsTiktokShops,
  odsTiktokVideos,
  odsTiktokLives,
  odsAmazonProducts,
  odsAmazonKeywords,
  odsAmazonReviews,
} from "@db/schema";
import { sql, eq, and, inArray } from "drizzle-orm";

export type OdsTableKey =
  | "ods_tiktok_products"
  | "ods_tiktok_creators"
  | "ods_tiktok_shops"
  | "ods_tiktok_videos"
  | "ods_tiktok_lives"
  | "ods_amazon_products"
  | "ods_amazon_keywords"
  | "ods_amazon_reviews";

interface WriteOptions {
  tableKey: OdsTableKey;
  records: Record<string, unknown>[];
  snapshotDate: string;
  sourceKey: string;
}

/**
 * 写入 ODS 表（幂等：重复 sourceRecordId + snapshotDate 自动跳过）
 */
export async function writeToODS(opts: WriteOptions): Promise<{ inserted: number; skipped: number }> {
  const db = getDb();
  const { tableKey, records, snapshotDate, sourceKey } = opts;

  if (records.length === 0) {
    return { inserted: 0, skipped: 0 };
  }

  // 生成统一的 importBatchId
  const importBatchId = Date.now();

  let inserted = 0;
  let skipped = 0;

  // 按表类型分发写入
  switch (tableKey) {
    case "ods_amazon_products": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
        asin: String(r.asin ?? r.id ?? ""),
        title: r.title ? String(r.title) : null,
        brand: r.brand ? String(r.brand) : null,
        category: r.category ? String(r.category) : null,
        categoryPath: r.category_path ?? r.categoryPath ? String(r.category_path ?? r.categoryPath) : null,
        price: r.price != null ? String(r.price).replace(/^[^\d.]+/, "").trim().replace(/,/g, "") || null : null,
        monthlySales: r.monthly_sales ?? r.monthlySales ? Number(r.monthly_sales ?? r.monthlySales) : 0,
        monthlyRevenue: r.monthly_revenue ?? r.monthlyRevenue ? String(r.monthly_revenue ?? r.monthlyRevenue) : null,
        bsrRank: r.bsr_rank ?? r.bsrRank ? Number(r.bsr_rank ?? r.bsrRank) : null,
        rating: r.rating != null ? String(r.rating).replace(/[^\d.]/g, "") || null : null,
        reviewCount: r.review_count ?? r.reviewCount ? Number(r.review_count ?? r.reviewCount) : 0,
        fulfillmentType: r.fulfillment_type ?? r.fulfillmentType ? String(r.fulfillment_type ?? r.fulfillmentType) : null,
        launchDate: r.launch_date ?? r.launchDate ? String(r.launch_date ?? r.launchDate) : null,
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      // 去重：同 snapshotDate + asin 只保留一条
      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.asin}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        // 先删除旧数据（同 asin 同日期），再插入新数据
        const asins = deduped.map((v) => v.asin);
        await db.delete(odsAmazonProducts).where(
          and(eq(odsAmazonProducts.snapshotDate, new Date(snapshotDate)), inArray(odsAmazonProducts.asin, asins))
        );
        await (db.insert(odsAmazonProducts) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    case "ods_amazon_reviews": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
        reviewId: String(r.review_id ?? r.reviewId ?? r.id ?? ""),
        asin: String(r.asin ?? ""),
        rating: r.rating != null ? String(r.rating).replace(/[^\d.]/g, "") || null : null,
        sentiment: r.sentiment ? String(r.sentiment) : null,
        content: r.content ? String(r.content) : null,
        title: r.title ? String(r.title) : null,
        reviewDate: r.review_date ?? r.reviewDate ? String(r.review_date ?? r.reviewDate) : null,
        verifiedPurchase: Boolean(r.verified_purchase ?? r.verifiedPurchase),
        helpfulCount: r.helpful_count ?? r.helpfulCount ? Number(r.helpful_count ?? r.helpfulCount) : 0,
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.reviewId}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        const reviewIds = deduped.map((v) => v.reviewId);
        await db.delete(odsAmazonReviews).where(
          and(eq(odsAmazonReviews.snapshotDate, new Date(snapshotDate)), inArray(odsAmazonReviews.reviewId, reviewIds))
        );
        await (db.insert(odsAmazonReviews) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    case "ods_amazon_keywords": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
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
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.keyword}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        const keywords = deduped.map((v) => v.keyword);
        await db.delete(odsAmazonKeywords).where(
          and(eq(odsAmazonKeywords.snapshotDate, new Date(snapshotDate)), inArray(odsAmazonKeywords.keyword, keywords))
        );
        await (db.insert(odsAmazonKeywords) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    case "ods_tiktok_videos": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
        videoId: String(r.video_id ?? r.videoId ?? r.id ?? ""),
        title: r.title ? String(r.title) : null,
        creatorId: r.creator_id ?? r.creatorId ? String(r.creator_id ?? r.creatorId) : null,
        views: r.views ? Number(r.views) : 0,
        likes: r.likes ? Number(r.likes) : 0,
        engagementRate: r.engagement_rate ?? r.engagementRate ? String(r.engagement_rate ?? r.engagementRate) : null,
        monthlySales: r.monthly_sales ?? r.monthlySales ? Number(r.monthly_sales ?? r.monthlySales) : 0,
        hashtags: Array.isArray(r.hashtags) ? r.hashtags as string[] : [],
        postedAt: r.posted_at ?? r.date ? String(r.posted_at ?? r.date) : null,
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.videoId}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        const videoIds = deduped.map((v) => v.videoId);
        await db.delete(odsTiktokVideos).where(
          and(eq(odsTiktokVideos.snapshotDate, new Date(snapshotDate)), inArray(odsTiktokVideos.videoId, videoIds))
        );
        await (db.insert(odsTiktokVideos) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    case "ods_tiktok_creators": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
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
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.creatorId}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        const creatorIds = deduped.map((v) => v.creatorId);
        await db.delete(odsTiktokCreators).where(
          and(eq(odsTiktokCreators.snapshotDate, new Date(snapshotDate)), inArray(odsTiktokCreators.creatorId, creatorIds))
        );
        await (db.insert(odsTiktokCreators) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    case "ods_tiktok_shops": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
        shopId: String(r.shop_id ?? r.shopId ?? r.id ?? ""),
        name: r.name ? String(r.name) : null,
        country: r.country ? String(r.country) : null,
        category: r.category ? String(r.category) : null,
        sales: r.sales ? Number(r.sales) : 0,
        salesGrowth: r.sales_growth ?? r.salesGrowth ? String(r.sales_growth ?? r.salesGrowth) : null,
        revenue: r.revenue ? String(r.revenue) : null,
        activeProducts: r.active_products ?? r.activeProducts ? Number(r.active_products ?? r.activeProducts) : 0,
        totalProducts: r.total_products ?? r.totalProducts ? Number(r.total_products ?? r.totalProducts) : 0,
        rating: r.rating != null ? String(r.rating).replace(/[^\d.]/g, "") || null : null,
        influencers: r.influencers ? Number(r.influencers) : 0,
        shopType: r.shop_type ?? r.shopType ? String(r.shop_type ?? r.shopType) : null,
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.shopId}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        const shopIds = deduped.map((v) => v.shopId);
        await db.delete(odsTiktokShops).where(
          and(eq(odsTiktokShops.snapshotDate, new Date(snapshotDate)), inArray(odsTiktokShops.shopId, shopIds))
        );
        await (db.insert(odsTiktokShops) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    case "ods_tiktok_lives": {
      const values = records.map((r) => ({
        snapshotDate,
        importId: importBatchId,
        liveId: String(r.live_id ?? r.id ?? ""),
        title: r.title ? String(r.title) : null,
        creatorId: r.creator_id ?? r.creatorId ? String(r.creator_id ?? r.creatorId) : null,
        viewers: r.viewers ? Number(r.viewers) : 0,
        maxOnline: r.max_online ?? r.maxOnline ? Number(r.max_online ?? r.maxOnline) : 0,
        likes: r.likes ? Number(r.likes) : 0,
        duration: r.duration ? Number(r.duration) : 0,
        gpm: r.gpm != null ? String(r.gpm) : null,
        status: r.status ? String(r.status) : null,
        rawData: { ...r, _sourceKey: sourceKey },
      }));

      const seen = new Set<string>();
      const deduped = values.filter((v) => {
        const key = `${v.snapshotDate}:${v.liveId}`;
        if (seen.has(key)) { skipped++; return false; }
        seen.add(key);
        return true;
      });

      if (deduped.length > 0) {
        const liveIds = deduped.map((v) => v.liveId);
        await db.delete(odsTiktokLives).where(
          and(eq(odsTiktokLives.snapshotDate, new Date(snapshotDate)), inArray(odsTiktokLives.liveId, liveIds))
        );
        await (db.insert(odsTiktokLives) as unknown as { values: (v: unknown[]) => Promise<unknown> }).values(deduped);
        inserted = deduped.length;
      }
      break;
    }

    default:
      throw new Error(`Unknown ODS table key: ${tableKey}`);
  }

  return { inserted, skipped };
}
