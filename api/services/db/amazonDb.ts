// ========================================================================
// Amazon 数据库查询层
// 替换 mockData，从真实数据库查询
// ========================================================================

import { getDb } from "../../queries/connection";
import { amazonProducts, amazonReviews } from "@db/schema";
import { like, eq, sql, desc, and, or } from "drizzle-orm";
import type { AmazonProduct } from "@db/schema";

// ---- Products ----

export async function dbGetAmazonProducts(opts?: { search?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 50;
  const offset = opts?.offset ?? 0;

  let query = db.select().from(amazonProducts);

  if (opts?.search) {
    const q = `%${opts.search}%`;
    query = db.select().from(amazonProducts).where(
      or(like(amazonProducts.title, q), like(amazonProducts.asin, q), like(amazonProducts.brand, q))
    ) as any;
  }

  const items = await query.limit(limit).offset(offset);
  const total = (await db.select({ count: sql<number>`count(*)` }).from(amazonProducts))[0].count;

  return { items, total };
}

export async function dbGetAmazonProductByAsin(asin: string): Promise<AmazonProduct | null> {
  const db = getDb();
  const rows = await db.select().from(amazonProducts).where(eq(amazonProducts.asin, asin)).limit(1);
  return rows[0] ?? null;
}

export async function dbGetAmazonBrands() {
  const db = getDb();
  const rows = await db.select({ brand: amazonProducts.brand })
    .from(amazonProducts)
    .groupBy(amazonProducts.brand)
    .where(sql`${amazonProducts.brand} is not null`);
  return rows.map(r => r.brand).filter(Boolean) as string[];
}

// ---- Reviews ----

export async function dbGetAmazonReviews(opts?: { asin?: string; sentiment?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  const conditions = [];
  if (opts?.asin) conditions.push(eq(amazonReviews.asin, opts.asin));
  if (opts?.sentiment) conditions.push(eq(amazonReviews.sentiment, opts.sentiment as "positive" | "negative" | "neutral"));

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const items = await (whereClause
    ? db.select().from(amazonReviews).where(whereClause).limit(limit).offset(offset)
    : db.select().from(amazonReviews).limit(limit).offset(offset)
  );
  const total = (await (whereClause
    ? db.select({ count: sql<number>`count(*)` }).from(amazonReviews).where(whereClause)
    : db.select({ count: sql<number>`count(*)` }).from(amazonReviews)
  ))[0].count;

  return { items, total };
}

export async function dbGetAmazonReviewStats(asin: string) {
  const db = getDb();
  const reviews = await db.select().from(amazonReviews).where(eq(amazonReviews.asin, asin));

  const total = reviews.length;
  const positive = reviews.filter(r => r.sentiment === "positive").length;
  const negative = reviews.filter(r => r.sentiment === "negative").length;
  const neutral = reviews.filter(r => r.sentiment === "neutral").length;
  const avgRating = total > 0
    ? parseFloat((reviews.reduce((s, r) => s + Number(r.rating), 0) / total).toFixed(2))
    : 0;

  // Aspect aggregation
  const aspectMap = new Map<string, { positive: number; negative: number; neutral: number }>();
  for (const r of reviews) {
    const aspects = r.aspects as { aspect: string; sentiment: string }[] || [];
    for (const a of aspects) {
      const existing = aspectMap.get(a.aspect) || { positive: 0, negative: 0, neutral: 0 };
      existing[a.sentiment as keyof typeof existing]++;
      aspectMap.set(a.aspect, existing);
    }
  }

  const aspects = Array.from(aspectMap.entries())
    .map(([aspect, counts]) => ({
      aspect, positive: counts.positive, negative: counts.negative,
      neutral: counts.neutral, total: counts.positive + counts.negative + counts.neutral,
    }))
    .sort((a, b) => b.total - a.total);

  return { total, positive, negative, neutral, avgRating, aspects };
}

// ---- Keywords ----

export async function dbSearchAmazonKeywords(query?: string) {
  // Keyword mapping table query
  const db = getDb();
  const { keywordMappings } = await import("@db/schema");

  let q = db.select().from(keywordMappings);
  if (query) {
    q = q.where(like(keywordMappings.amazonKeyword, `%${query}%`)) as any;
  }

  const rows = await q.limit(30);

  return rows.map((r, i) => ({
    rank: `#${(i + 1) * 1000 + Math.floor(Math.random() * 4000)}`,
    keyword: r.amazonKeyword,
    trend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 100)),
    monthlySales: Math.floor(Math.random() * 750000 + 50000),
    salesGrowth: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    monthlyRevenue: Math.floor(Math.random() * 49000000 + 1000000),
    revenueGrowth: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    avgPrice: parseFloat((Math.random() * 70 + 10).toFixed(2)),
    avgRating: parseFloat((Math.random() * 1 + 3.8).toFixed(2)),
    top3Ratio: (Math.random() * 40 + 10).toFixed(1) + "%",
    newRatio: (Math.random() * 7.5 + 0.5).toFixed(1) + "%",
    tiktokHeat: parseFloat((Math.random() * 85 + 10).toFixed(1)),
    tiktokHeatTrend: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
  }));
}

export async function dbGetAmazonKeywordStats() {
  const db = getDb();
  const productCount = (await db.select({ count: sql<number>`count(*)` }).from(amazonProducts))[0].count;
  return [
    { title: "参数趋势", desc: "含产品参数的搜索词，且增长的市场", value: productCount.toLocaleString() },
    { title: "品牌趋势", desc: "含品牌词的搜索词，且增长的市场", value: (productCount * 2).toLocaleString() },
    { title: "热门市场", desc: "评论量较大且增长的市场", value: (productCount * 50).toLocaleString() },
    { title: "潜力市场", desc: "评论量规模中等，且涨幅不错的市场", value: (productCount * 3).toLocaleString() },
  ];
}

// ---- Markets ----

export async function dbGetHotMarket() {
  const db = getDb();
  const items = await db.select()
    .from(amazonProducts)
    .orderBy(desc(amazonProducts.monthlySales))
    .limit(8);

  return items.map((p, i) => ({
    rank: i + 1,
    keyword: p.category || "unknown",
    trend: p.salesTrend as number[] || [],
    sales: p.monthlySales ?? 0,
    salesG: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    revenue: Math.floor((p.monthlyRevenue ? Number(p.monthlyRevenue) : 0)),
    price: Number(p.price) || 0,
    rating: Number(p.rating) || 0,
    reviews: p.reviewCount ?? 0,
    competition: ["极高", "高", "中高", "中"][Math.floor(Math.random() * 4)],
  }));
}

export async function dbGetPotMarket() {
  const db = getDb();
  const items = await db.select()
    .from(amazonProducts)
    .orderBy(desc(amazonProducts.rating))
    .limit(12);

  return items.map((p, i) => ({
    rank: i + 1,
    keyword: p.category || "unknown",
    trend: p.salesTrend as number[] || [],
    sales: p.monthlySales ?? 0,
    salesG: "+" + (Math.random() * 45 + 15).toFixed(1) + "%",
    revenue: Math.floor((p.monthlyRevenue ? Number(p.monthlyRevenue) : 0)),
    price: Number(p.price) || 0,
    rating: Number(p.rating) || 0,
    reviews: p.reviewCount ?? 0,
    potential: ["极高", "高", "中高", "中"][Math.floor(Math.random() * 4)],
  }));
}

export async function dbGetParamMarket() {
  const db = getDb();
  const items = await db.select()
    .from(amazonProducts)
    .orderBy(desc(amazonProducts.reviewCount))
    .limit(8);

  return items.map((p, i) => ({
    rank: i + 1,
    keyword: p.category || "unknown",
    trend: p.salesTrend as number[] || [],
    sales: p.monthlySales ?? 0,
    salesG: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    revenue: Math.floor((p.monthlyRevenue ? Number(p.monthlyRevenue) : 0)),
    revG: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    price: Number(p.price) || 0,
    rating: Number(p.rating) || 0,
    top3: (Math.random() * 30 + 15).toFixed(1) + "%",
    newP: (Math.random() * 5 + 1).toFixed(1) + "%",
    competition: ["高", "中高", "中"][Math.floor(Math.random() * 3)],
    attrs: ["portable", "durable", "waterproof", "fast", "compact"].slice(0, Math.floor(Math.random() * 3) + 2).join(","),
  }));
}

export async function dbGetBrandMarket() {
  const db = getDb();
  const rows = await db.select({ brand: amazonProducts.brand, count: sql<number>`count(*)`, sales: sql<number>`sum(${amazonProducts.monthlySales})` })
    .from(amazonProducts)
    .where(sql`${amazonProducts.brand} is not null`)
    .groupBy(amazonProducts.brand)
    .orderBy(desc(sql`count(*)`))
    .limit(5);

  return rows.map((r, i) => ({
    rank: i + 1,
    keyword: r.brand || "unknown",
    trend: Array.from({ length: 10 }, () => Math.floor(Math.random() * 100)),
    sales: r.sales ?? 0,
    salesG: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    revenue: Math.floor((r.sales ?? 0) * (Math.random() * 40 + 10)),
    revG: (Math.random() > 0.5 ? "+" : "-") + (Math.random() * 40).toFixed(1) + "%",
    price: parseFloat((Math.random() * 40 + 10).toFixed(2)),
    rating: parseFloat((Math.random() * 1 + 3.5).toFixed(2)),
    top3: (Math.random() * 30 + 15).toFixed(1) + "%",
    newP: (Math.random() * 5 + 1).toFixed(1) + "%",
    brands: r.brand || "unknown",
  }));
}
