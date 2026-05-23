// ========================================================================
// TikTok 数据库查询层
// ========================================================================

import { getDb } from "../../queries/connection";
import { tiktokVideos, tiktokCreators, tiktokShops } from "@db/schema";
import { like, sql, desc, or } from "drizzle-orm";

// ---- TikTok Products ----

export async function dbGetTiktokProducts(opts?: { search?: string; tab?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  let query = db.select().from(tiktokVideos).orderBy(desc(tiktokVideos.views));

  if (opts?.search) {
    const q = `%${opts.search}%`;
    query = db.select().from(tiktokVideos).where(
      or(like(tiktokVideos.title, q), like(tiktokVideos.creatorName, q))
    ) as any;
  }

  const items = await query.limit(limit).offset(offset);
  const total = (await db.select({ count: sql<number>`count(*)` }).from(tiktokVideos))[0].count;

  return { items, total };
}

// ---- TikTok Creators ----

export async function dbGetTiktokCreators(opts?: { search?: string; tab?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const orderCol = opts?.tab === "fans" ? tiktokCreators.followers : tiktokCreators.monthlySales;

  const items = await (opts?.search
    ? db.select().from(tiktokCreators)
        .where(or(like(tiktokCreators.displayName, `%${opts.search}%`), like(tiktokCreators.username, `%${opts.search}%`)))
        .orderBy(desc(orderCol)).limit(limit).offset(offset)
    : db.select().from(tiktokCreators)
        .orderBy(desc(orderCol)).limit(limit).offset(offset)
  );
  const total = (await db.select({ count: sql<number>`count(*)` }).from(tiktokCreators))[0].count;
  return { items, total };
}

// ---- TikTok Shops ----

export async function dbGetTiktokShops(opts?: { search?: string; tab?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;
  const orderCol = opts?.tab === "revenue" ? tiktokShops.revenue : tiktokShops.sales;

  const items = await (opts?.search
    ? db.select().from(tiktokShops)
        .where(like(tiktokShops.name, `%${opts.search}%`))
        .orderBy(desc(orderCol)).limit(limit).offset(offset)
    : db.select().from(tiktokShops)
        .orderBy(desc(orderCol)).limit(limit).offset(offset)
  );
  const total = (await db.select({ count: sql<number>`count(*)` }).from(tiktokShops))[0].count;
  return { items, total };
}

// ---- TikTok Videos ----

export async function dbGetTiktokVideos(opts?: { search?: string; tab?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  let query = db.select().from(tiktokVideos).orderBy(desc(tiktokVideos.views));

  if (opts?.search) {
    const q = `%${opts.search}%`;
    query = db.select().from(tiktokVideos).where(
      or(like(tiktokVideos.title, q), like(tiktokVideos.description, q))
    ) as any;
  }

  const items = await query.limit(limit).offset(offset);
  const total = (await db.select({ count: sql<number>`count(*)` }).from(tiktokVideos))[0].count;

  return { items, total };
}

// ---- TikTok Lives ----

export async function dbGetTiktokLives(opts?: { search?: string; limit?: number; offset?: number }) {
  const db = getDb();
  const limit = opts?.limit ?? 20;
  const offset = opts?.offset ?? 0;

  // Lives are simulated from creators for now
  let query = db.select().from(tiktokCreators).orderBy(desc(tiktokCreators.followers));

  if (opts?.search) {
    const q = `%${opts.search}%`;
    query = db.select().from(tiktokCreators).where(
      or(like(tiktokCreators.displayName, q), like(tiktokCreators.username, q))
    ) as any;
  }

  const creators = await query.limit(limit).offset(offset);
  const total = (await db.select({ count: sql<number>`count(*)` }).from(tiktokCreators))[0].count;

  // Map creators to live format
  const items = creators.map((c) => ({
    id: `live_${c.creatorId}`,
    title: `${c.displayName} 的直播`,
    creator: c.displayName,
    creatorId: c.creatorId,
    creatorFollowers: c.followers,
    startTime: new Date(Date.now() - Math.random() * 3600000).toISOString(),
    duration: Math.floor(Math.random() * 180 + 30),
    viewers: Math.floor((c.followers ?? 0) * (Math.random() * 0.05)),
    maxOnline: Math.floor((c.followers ?? 0) * (Math.random() * 0.1)),
    likes: Math.floor((c.followers ?? 0) * (Math.random() * 0.2)),
    comments: Math.floor((c.followers ?? 0) * (Math.random() * 0.05)),
    newFans: Math.floor((c.followers ?? 0) * (Math.random() * 0.02)),
    gpm: Number(c.liveGpm) || 0,
    sales: Math.floor(Math.random() * 50000),
    revenue: Math.floor(Math.random() * 500000),
    status: Math.random() > 0.3 ? "live" : "ended",
  }));

  return { items, total };
}

// ---- Home Page Data ----

export async function dbGetHomeData(type: string, limit = 10) {
  const db = getDb();

  switch (type) {
    case "productsHot":
    case "productsSoaring":
    case "productsNew": {
      const items = await db.select().from(tiktokVideos)
        .orderBy(desc(tiktokVideos.views))
        .limit(limit);
      return items;
    }
    case "influencersSales":
    case "influencersFans": {
      const items = await db.select().from(tiktokCreators)
        .orderBy(type === "influencersFans" ? desc(tiktokCreators.followers) : desc(tiktokCreators.monthlySales))
        .limit(limit);
      return items;
    }
    case "shopsHot": {
      const items = await db.select().from(tiktokShops)
        .orderBy(desc(tiktokShops.sales))
        .limit(limit);
      return items;
    }
    case "videosHot": {
      const items = await db.select().from(tiktokVideos)
        .orderBy(desc(tiktokVideos.views))
        .limit(limit);
      return items;
    }
    case "livesPopular": {
      const creators = await db.select().from(tiktokCreators)
        .orderBy(desc(tiktokCreators.followers))
        .limit(limit);
      return creators;
    }
    default:
      return [];
  }
}

// ---- Analysis Data ----

export async function dbGetAnalysisData(type: string) {
  // 大盘分析数据统一使用 mock 格式（与前端组件期望一致）
  switch (type) {
    case "kpi":
      return [
        { title: "总销量", value: `${(15000000 + Math.floor(Math.random() * 5000000)).toLocaleString()}`, trend: `+${(Math.random() * 0.9 + 0.1).toFixed(2)}%`, up: true },
        { title: "总销售额", value: `$${(500 + Math.floor(Math.random() * 200)).toLocaleString()}M`, trend: `-${(Math.random() * 2 + 1).toFixed(2)}%`, up: false },
        { title: "动销商品数", value: `${(500000 + Math.floor(Math.random() * 100000)).toLocaleString()}`, trend: `+${(Math.random() * 20 + 30).toFixed(2)}%`, up: true },
        { title: "平均成交价", value: `$${(30 + Math.random() * 10).toFixed(2)}`, trend: `+${(Math.random() * 2.5 + 0.5).toFixed(2)}%`, up: true },
        { title: "动销新品数", value: `${(20000 + Math.floor(Math.random() * 10000)).toLocaleString()}`, trend: `-${(Math.random() * 20 + 20).toFixed(2)}%`, up: false },
        { title: "动销新品销售额", value: `$${(8 + Math.floor(Math.random() * 7)).toLocaleString()}M`, trend: `-${(Math.random() * 15 + 20).toFixed(2)}%`, up: false },
      ];
    case "gmvTrend":
      return [
        { month: "2025-06", gmv: 8.2 + (Math.random() - 0.5) },
        { month: "2025-07", gmv: 7.8 + (Math.random() - 0.5) },
        { month: "2025-08", gmv: 8.5 + (Math.random() - 0.5) },
        { month: "2025-09", gmv: 9.1 + (Math.random() - 0.5) },
        { month: "2025-10", gmv: 9.8 + (Math.random() - 0.5) },
        { month: "2025-11", gmv: 12.5 + (Math.random() - 0.5) },
        { month: "2025-12", gmv: 13.2 + (Math.random() - 0.5) },
        { month: "2026-01", gmv: 8.6 + (Math.random() - 0.5) },
        { month: "2026-02", gmv: 9.3 + (Math.random() - 0.5) },
        { month: "2026-03", gmv: 10.1 + (Math.random() - 0.5) },
      ];
    case "categoryShare":
      return [
        { name: "美妆个护", value: 26.0, gmv: "$10.5B", trend: "+26%", status: "dominant" },
        { name: "健康保健", value: 15.2, gmv: "$6.1B", trend: "+38%", status: "growing" },
        { name: "女装内衣", value: 12.8, gmv: "$5.2B", trend: "+15%", status: "stable" },
        { name: "家居日用", value: 10.5, gmv: "$4.2B", trend: "+22%", status: "growing" },
        { name: "手机数码", value: 8.3, gmv: "$3.3B", trend: "+12%", status: "stable" },
        { name: "食品饮料", value: 7.6, gmv: "$3.0B", trend: "+18%", status: "growing" },
      ];
    case "heatmap": {
      const categories = [
        "美妆个护", "健康保健", "女装内衣", "家居日用",
        "手机数码", "食品饮料", "运动户外", "男装内衣",
        "宠物用品", "玩具爱好", "家电", "时尚配饰",
      ];
      const months = ["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];
      const data: [number, number, number][] = [];
      for (let c = 0; c < categories.length; c++) {
        for (let m = 0; m < months.length; m++) {
          data.push([c, m, Math.floor(Math.random() * 80 + 15)]);
        }
      }
      return { categories, months, data };
    }
    case "priceDistribution":
      return [
        { range: "$0-5", products: Math.floor(Math.random() * 5000 + 3000), salesVolume: Math.floor(Math.random() * 4000 + 2000), salesRevenue: parseFloat((Math.random() * 1.5 + 0.5).toFixed(2)) },
        { range: "$5-10", products: Math.floor(Math.random() * 7000 + 5000), salesVolume: Math.floor(Math.random() * 7000 + 5000), salesRevenue: parseFloat((Math.random() * 6 + 2).toFixed(2)) },
        { range: "$10-20", products: Math.floor(Math.random() * 10000 + 10000), salesVolume: Math.floor(Math.random() * 10000 + 8000), salesRevenue: parseFloat((Math.random() * 17 + 8).toFixed(2)) },
        { range: "$20-50", products: Math.floor(Math.random() * 10000 + 15000), salesVolume: Math.floor(Math.random() * 13000 + 12000), salesRevenue: parseFloat((Math.random() * 55 + 25).toFixed(2)) },
        { range: "$50-100", products: Math.floor(Math.random() * 7000 + 5000), salesVolume: Math.floor(Math.random() * 5000 + 3000), salesRevenue: parseFloat((Math.random() * 35 + 15).toFixed(2)) },
        { range: ">$100", products: Math.floor(Math.random() * 4000 + 1000), salesVolume: Math.floor(Math.random() * 2500 + 500), salesRevenue: parseFloat((Math.random() * 35 + 5).toFixed(2)) },
      ];
    case "influencerMatrix":
      return [
        { range: "0-10K", accounts: 22823097, accountRatio: "84.97%", sales: 56983200, salesRatio: "44.96%", videos: 3840048598, videoRatio: "63.35%", avgRevenue: 429.714 },
        { range: "10K-100K", accounts: 3504032, accountRatio: "13.05%", sales: 52686124, salesRatio: "41.57%", videos: 1753534562, videoRatio: "28.93%", avgRevenue: 1078.593 },
        { range: "100K-1M", accounts: 488452, accountRatio: "1.82%", sales: 15413055, salesRatio: "12.16%", videos: 406884604, videoRatio: "6.71%", avgRevenue: 1622.285 },
        { range: "1M-5M", accounts: 38843, accountRatio: "0.14%", sales: 1491832, salesRatio: "1.18%", videos: 53308284, videoRatio: "0.88%", avgRevenue: 1947.035 },
        { range: ">5M", accounts: 4380, accountRatio: "0.02%", sales: 163156, salesRatio: "0.13%", videos: 7791954, videoRatio: "0.13%", avgRevenue: 1989.827 },
      ];
    default:
      return [];
  }
}
