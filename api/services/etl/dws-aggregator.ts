/**
 * DWS 聚合层 — DWD → DWS 按概念/品类聚合
 *
 * 核心逻辑：
 * 1. 读取 DWD 日表（按 concept 的 keywords 匹配）
 * 2. 统计视频量、播放量、互动率、带货率等
 * 3. 与 7 天前对比算 growth rate
 * 4. 写入 DWS 概念日/周表
 */

import { eq, and, gte, lte, like, or } from "drizzle-orm";
import { getDb } from "../../queries/connection.ts";
import {
  productConcepts,
  dwdTiktokProductDaily,
  dwdAmazonProductDaily,
  dwsTiktokConceptDaily,
  dwsAmazonConceptWeekly,
} from "@db/schema";

// =======================================================================
// TikTok 概念日聚合: dwd_tiktok_product_daily → dws_tiktok_concept_daily
// =======================================================================
export async function aggregateTiktokConceptDaily(
  conceptId: string,
  statDate: string
) {
  const db = getDb();

  // 1. 获取概念定义
  const [concept] = await db
    .select()
    .from(productConcepts)
    .where(eq(productConcepts.conceptId, conceptId))
    .limit(1);

  if (!concept || concept.status !== "active") {
    return { conceptId, statDate, matchedRows: 0, output: null };
  }

  const keywords = (concept.tiktokKeywords ?? []) as string[];
  const hashtags = (concept.tiktokHashtags ?? []) as string[];

  if (keywords.length === 0 && hashtags.length === 0) {
    return { conceptId, statDate, matchedRows: 0, output: null };
  }

  // 2. 从 DWD 匹配商品（productName 或 category 包含关键词）
  const conditions = keywords.map((kw) =>
    or(
      like(dwdTiktokProductDaily.productName, `%${kw}%`),
      like(dwdTiktokProductDaily.category, `%${kw}%`)
    )
  );

  const matchedProducts = await db
    .select()
    .from(dwdTiktokProductDaily)
    .where(
      and(
        eq(dwdTiktokProductDaily.statDate, new Date(statDate)),
        conditions.length > 1 ? or(...conditions) : conditions[0]
      )
    );

  // 3. 聚合指标
  const videoCount = matchedProducts.length;
  const totalViews = matchedProducts.reduce(
    (sum, p) => sum + (p.monthlySales ?? 0) * 100, // 视图为销量的 100 倍估算
    0
  );
  const engagementRate = calcAvg(
    matchedProducts.map((p) => p.rating)
  );
  const carryingRatio = calcRatio(
    matchedProducts,
    (p) => p.shopType === "shop" || p.shopType === "flagship"
  );
  const influencerCount = matchedProducts.reduce(
    (sum, p) => sum + (p.influencerCount ?? 0),
    0
  );

  // 4. 计算 7 天前对比
  const prevDate = offsetDate(statDate, -7);
  const [prevRow] = await db
    .select({ videoCount: dwsTiktokConceptDaily.videoCount })
    .from(dwsTiktokConceptDaily)
    .where(
      and(
        eq(dwsTiktokConceptDaily.conceptId, conceptId),
        eq(dwsTiktokConceptDaily.statDate, new Date(prevDate))
      )
    )
    .limit(1);

  const videoCountPrev7d = prevRow?.videoCount ?? 0;
  const videoGrowthRate =
    videoCountPrev7d > 0
      ? ((videoCount - Number(videoCountPrev7d)) / Number(videoCountPrev7d)) * 100
      : 0;

  // 5. 写入 DWS（upsert）
  await db
    .delete(dwsTiktokConceptDaily)
    .where(
      and(
        eq(dwsTiktokConceptDaily.conceptId, conceptId),
        eq(dwsTiktokConceptDaily.statDate, new Date(statDate))
      )
    );

  await db.insert(dwsTiktokConceptDaily).values({
    statDate: new Date(statDate),
    conceptId,
    conceptName: concept.name,
    videoCount: videoCount,
    videoCountPrev7d: videoCountPrev7d,
    videoGrowthRate: String(videoGrowthRate.toFixed(2)),
    totalViews: totalViews,
    engagementRate: engagementRate ? String(engagementRate.toFixed(2)) : null,
    carryingRatio: carryingRatio ? String(carryingRatio.toFixed(2)) : null,
    hashtags: hashtags.map((tag) => ({ tag, heat: 0 })),
    hashtag_heat_total: 0,
    influencerCount,
  });

  return {
    conceptId,
    statDate: new Date(statDate),
    matchedRows: matchedProducts.length,
    output: { videoCount, totalViews, videoGrowthRate },
  };
}

// =======================================================================
// Amazon 概念周聚合: dwd_amazon_product_daily → dws_amazon_concept_weekly
// =======================================================================
export async function aggregateAmazonConceptWeekly(
  conceptId: string,
  weekStartDate: string
) {
  const db = getDb();

  const [concept] = await db
    .select()
    .from(productConcepts)
    .where(eq(productConcepts.conceptId, conceptId))
    .limit(1);

  if (!concept || concept.status !== "active") {
    return { conceptId, weekStartDate, matchedRows: 0, output: null };
  }

  const keywords = (concept.amazonKeywords ?? []) as string[];
  const categories = (concept.amazonCategories ?? []) as string[];

  if (keywords.length === 0 && categories.length === 0) {
    return { conceptId, weekStartDate, matchedRows: 0, output: null };
  }

  // 匹配：title/brand/category 含关键词，或 category 完全匹配
  const keywordConditions = keywords.map((kw) =>
    or(
      like(dwdAmazonProductDaily.title, `%${kw}%`),
      like(dwdAmazonProductDaily.brand, `%${kw}%`),
      like(dwdAmazonProductDaily.category, `%${kw}%`)
    )
  );

  const categoryConditions = categories.map((cat) =>
    like(dwdAmazonProductDaily.category, `%${cat}%`)
  );

  const allConditions = [...keywordConditions, ...categoryConditions];

  const weekEnd = offsetDate(weekStartDate, 6);
  const matchedProducts = await db
    .select()
    .from(dwdAmazonProductDaily)
    .where(
      and(
        gte(dwdAmazonProductDaily.statDate, new Date(weekStartDate)),
        lte(dwdAmazonProductDaily.statDate, new Date(weekEnd)),
        allConditions.length > 1 ? or(...allConditions) : allConditions[0]
      )
    );

  // 聚合
  const totalMonthlySales = matchedProducts.reduce(
    (sum, p) => sum + (p.monthlySales ?? 0),
    0
  );
  const totalRevenue = matchedProducts.reduce(
    (sum, p) => sum + (Number(p.monthlyRevenue) || 0),
    0
  );
  const effectiveSkuCount = new Set(matchedProducts.map((p) => p.asin)).size;
  const totalSkuCount = effectiveSkuCount;
  const newProductCount = matchedProducts.filter((p) => p.isNewProduct).length;
  const newProductRatio =
    totalSkuCount > 0 ? (newProductCount / totalSkuCount) * 100 : 0;
  const avgRating = calcAvg(matchedProducts.map((p) => p.rating));
  const avgReviewCount =
    matchedProducts.length > 0
      ? matchedProducts.reduce((sum, p) => sum + (p.reviewCount ?? 0), 0) /
        matchedProducts.length
      : 0;

  // 品牌集中度：Top3 品牌销量占比
  const brandSales: Record<string, number> = {};
  for (const p of matchedProducts) {
    if (p.brand) {
      brandSales[p.brand] = (brandSales[p.brand] || 0) + (p.monthlySales ?? 0);
    }
  }
  const sortedBrands = Object.entries(brandSales).sort((a, b) => b[1] - a[1]);
  const top3Sales = sortedBrands.slice(0, 3).reduce((s, [, v]) => s + v, 0);
  const top3BrandShare =
    totalMonthlySales > 0 ? (top3Sales / totalMonthlySales) * 100 : 0;

  // 写入 DWS
  await db
    .delete(dwsAmazonConceptWeekly)
    .where(
      and(
        eq(dwsAmazonConceptWeekly.conceptId, conceptId),
        eq(dwsAmazonConceptWeekly.weekStartDate, new Date(weekStartDate))
      )
    );

  await db.insert(dwsAmazonConceptWeekly).values({
    weekStartDate: new Date(weekStartDate),
    conceptId,
    conceptName: concept.name,
    totalMonthlySales: totalMonthlySales,
    totalRevenue: String(totalRevenue.toFixed(2)),
    effectiveSkuCount,
    totalSkuCount,
    salesGrowthRate: null, // TODO: 需要环比计算
    newProductCount,
    newProductRatio: String(newProductRatio.toFixed(2)),
    top3BrandShare: String(top3BrandShare.toFixed(2)),
    avgRating: avgRating ? String(avgRating.toFixed(2)) : null,
    avgReviewCount: String(avgReviewCount.toFixed(2)),
  });

  return {
    conceptId,
    weekStartDate: new Date(weekStartDate),
    matchedRows: matchedProducts.length,
    output: { totalMonthlySales, effectiveSkuCount, newProductRatio },
  };
}

// =======================================================================
// 辅助函数
// =======================================================================

function calcAvg(values: (string | null)[]): number | null {
  const nums = values
    .map((v) => (v == null ? null : parseFloat(v)))
    .filter((n): n is number => n != null && !isNaN(n));
  if (nums.length === 0) return null;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function calcRatio<T>(
  items: T[],
  predicate: (item: T) => boolean
): number | null {
  if (items.length === 0) return null;
  return (items.filter(predicate).length / items.length) * 100;
}

function offsetDate(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0];
}
