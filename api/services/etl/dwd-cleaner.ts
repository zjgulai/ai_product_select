/**
 * DWD 清洗层 — ODS → DWD
 *
 * 核心逻辑：
 * 1. 按 snapshot_date 从 ODS 读取原始数据
 * 2. 类型标准化（string → decimal/int/boolean，null 填充）
 * 3. 去重（同主键记录取最新 import_id）
 * 4. 写入 DWD 日/周分区表
 */

import { eq, desc, sql, and } from "drizzle-orm";
import { getDb } from "../../queries/connection";
import {
  odsTiktokProducts,
  odsAmazonProducts,
  dwdTiktokProductDaily,
  dwdAmazonProductDaily,
} from "@db/schema";

// =======================================================================
// TikTok Products: ODS → dwd_tiktok_product_daily
// =======================================================================
export async function cleanTiktokProducts(snapshotDate: string) {
  const db = getDb();

  // 1. 读取 ODS 原始数据
  const rawRows = await db
    .select()
    .from(odsTiktokProducts)
    .where(eq(odsTiktokProducts.snapshotDate, snapshotDate))
    .orderBy(desc(odsTiktokProducts.importId));

  if (rawRows.length === 0) return { inputRows: 0, outputRows: 0 };

  // 2. 去重：同 product_id 取最新 import_id
  const seen = new Set<string>();
  const deduped = rawRows.filter((r) => {
    if (seen.has(r.productId)) return false;
    seen.add(r.productId);
    return true;
  });

  // 3. 先删除该日期的旧 DWD 数据（幂等）
  await db
    .delete(dwdTiktokProductDaily)
    .where(eq(dwdTiktokProductDaily.statDate, snapshotDate));

  // 4. 标准化写入
  const values = deduped.map((r) => ({
    statDate: snapshotDate,
    productId: r.productId,
    productName: r.productName ?? null,
    category: r.category ?? null,
    price: r.price ? sql`${r.price}` : null,
    monthlySales: r.monthlySales ?? 0,
    monthlyRevenue: r.monthlyRevenue ? sql`${r.monthlyRevenue}` : null,
    salesGrowthRate: parseGrowthRate(r.salesGrowth),
    rating: r.rating ? sql`${r.rating}` : null,
    influencerCount: r.influencerCount ?? 0,
    shopType: r.shopType ?? null,
    isCarrying: false, // ODS 无此字段，默认 false
  }));

  const batchSize = 500;
  for (let i = 0; i < values.length; i += batchSize) {
    await db.insert(dwdTiktokProductDaily).values(values.slice(i, i + batchSize));
  }

  return { inputRows: rawRows.length, outputRows: values.length };
}

// =======================================================================
// Amazon Products: ODS → dwd_amazon_product_daily
// =======================================================================
export async function cleanAmazonProducts(snapshotDate: string) {
  const db = getDb();

  const rawRows = await db
    .select()
    .from(odsAmazonProducts)
    .where(eq(odsAmazonProducts.snapshotDate, snapshotDate))
    .orderBy(desc(odsAmazonProducts.importId));

  if (rawRows.length === 0) return { inputRows: 0, outputRows: 0 };

  const seen = new Set<string>();
  const deduped = rawRows.filter((r) => {
    if (seen.has(r.asin)) return false;
    seen.add(r.asin);
    return true;
  });

  await db
    .delete(dwdAmazonProductDaily)
    .where(eq(dwdAmazonProductDaily.statDate, snapshotDate));

  const values = deduped.map((r) => ({
    statDate: snapshotDate,
    asin: r.asin,
    title: r.title ?? null,
    brand: r.brand ?? null,
    category: r.category ?? null,
    categoryPath: r.categoryPath ?? null,
    price: r.price ? sql`${r.price}` : null,
    monthlySales: r.monthlySales ?? 0,
    monthlyRevenue: r.monthlyRevenue ? sql`${r.monthlyRevenue}` : null,
    bsrRank: r.bsrRank ?? null,
    rating: r.rating ? sql`${r.rating}` : null,
    reviewCount: r.reviewCount ?? 0,
    fulfillmentType: r.fulfillmentType ?? null,
    launchDate: r.launchDate ?? null,
    isNewProduct: isNewProduct(r.launchDate),
    salesGrowthMom: parseGrowthRate(r.salesTrend?.at(-1)),
  }));

  const batchSize = 500;
  for (let i = 0; i < values.length; i += batchSize) {
    await db.insert(dwdAmazonProductDaily).values(values.slice(i, i + batchSize));
  }

  return { inputRows: rawRows.length, outputRows: values.length };
}

// =======================================================================
// 辅助函数
// =======================================================================

function parseGrowthRate(val: unknown): string | null {
  if (val == null) return null;
  const s = String(val).replace(/[%+]/g, "");
  const n = parseFloat(s);
  return isNaN(n) ? null : String(n);
}

function isNewProduct(launchDate: string | null): boolean {
  if (!launchDate) return false;
  try {
    const launched = new Date(launchDate).getTime();
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1000;
    return launched > ninetyDaysAgo;
  } catch {
    return false;
  }
}
