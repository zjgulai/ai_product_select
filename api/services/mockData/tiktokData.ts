// ========================================================================
// TikTok 数据服务层 — 优先加载真实数据，fallback 到 generated mock
// ========================================================================

import {
  TIKTOK_PRODUCTS,
  TIKTOK_CREATORS,
  TIKTOK_SHOPS,
  TIKTOK_VIDEOS,
  TIKTOK_LIVES,
} from "@/data/generated";

/** 读取真实采集的 TikTok 数据（Node.js 环境） */
function readRealData<T>(sourcePrefix: string): T[] | null {
  if (typeof window !== "undefined") return null;
  try {
    const fs = require("node:fs");
    const path = require("node:path");
    const REAL_DATA_DIR = path.join(process.cwd(), "src", "data", "real");
    if (!fs.existsSync(REAL_DATA_DIR)) return null;
    const files = fs.readdirSync(REAL_DATA_DIR)
      .filter((f: string) => f.startsWith(sourcePrefix) && f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length === 0) return null;
    const content = JSON.parse(fs.readFileSync(path.join(REAL_DATA_DIR, files[0]), "utf-8"));
    return content.data as T[];
  } catch {
    return null;
  }
}

export interface TikTokCreator {
  id: number; creatorId: string; username: string; displayName: string | null;
  bio: string | null; avatar: string | null; followers: number | null;
  following: number | null; totalLikes: number | null; videoCount: number | null;
  productsCount: number | null; avgViews: number | null; monthlySales: number | null;
  monthlyRevenue: string | null; videoGpm: string | null; liveGpm: string | null;
  accountType: string | null; categories: string[] | null; fanGrowth: string | null;
}

export interface TikTokVideo {
  id: number; videoId: string; creatorId: string; title: string;
  cover: string | null; duration: string; views: number; likes: number;
  comments: number; shares: number; engagementRate: number; monthlySales: number;
  monthlyRevenue: number; creatorName: string; product: string;
  hashtags: string[]; date: string; publishDate: string;
}

export interface TikTokShop {
  id: number; shopId: string; name: string; logo: string | null;
  country: string; category: string; sales: number; salesGrowth: string;
  revenue: number; activeProducts: number; totalProducts: number;
  rating: number; influencers: number;
}

export interface TikTokLive {
  id: number; liveId: string; creatorId: string; title: string;
  cover: string | null; creator: string; viewers: number; sales: number;
  revenue: number; duration: string; date: string; startTime: string;
}

export interface TikTokProduct {
  id: number; name: string; category: string; sales: number;
  salesGrowth: string; revenue: number; trend: number[]; price: number;
  rating: number; influencers: number; date: string; shop: string; priceRange?: string;
}

// 适配 generated 数据到接口类型
function adaptProducts(raw: any[]): TikTokProduct[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, name: r.name, category: r.category, sales: r.sales,
    salesGrowth: r.sales_growth, revenue: r.revenue,
    trend: r.trend ?? [50,55,60,58,62,65,70,68,72,75,78,80],
    price: r.price, rating: r.rating, influencers: r.influencers,
    date: r.date, shop: r.shop, priceRange: r.price_range,
  }));
}

function safeParse(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function adaptCreators(raw: any[]): TikTokCreator[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, creatorId: String(r.id ?? i + 1), username: r.username,
    displayName: r.display_name, bio: null, avatar: null, followers: r.followers,
    following: null, totalLikes: null, videoCount: null, productsCount: null,
    avgViews: null, monthlySales: r.monthly_sales, monthlyRevenue: String(r.monthly_revenue),
    videoGpm: null, liveGpm: null, accountType: null,
    categories: safeParse(r.categories), fanGrowth: String(r.fan_growth_rate) + "%",
  }));
}

function adaptShops(raw: any[]): TikTokShop[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, shopId: String(r.id ?? i + 1), name: r.name, logo: null,
    country: r.country, category: r.category, sales: r.sales,
    salesGrowth: r.sales_growth, revenue: r.revenue,
    activeProducts: r.active_products, totalProducts: r.active_products + 20,
    rating: r.rating, influencers: r.influencers,
  }));
}

function adaptVideos(raw: any[]): TikTokVideo[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, videoId: String(r.id ?? i + 1), creatorId: String(r.creator_id ?? i + 1),
    title: r.title, cover: null, duration: "0:45", views: r.views, likes: r.likes,
    comments: Math.floor(r.likes * 0.1), shares: Math.floor(r.likes * 0.05),
    engagementRate: r.engagement_rate, monthlySales: r.monthly_sales ?? 0,
    monthlyRevenue: Math.floor((r.monthly_sales ?? 0) * 50),
    creatorName: r.creator_name ?? `达人${i + 1}`, product: r.product ?? `商品${i + 1}`,
    hashtags: safeParse(r.hashtags), date: r.date, publishDate: r.date,
  }));
}

function adaptLives(raw: any[]): TikTokLive[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, liveId: String(r.id ?? i + 1), creatorId: String(r.id ?? i + 1),
    title: r.title, cover: null, creator: r.host, viewers: r.viewers, sales: r.sales,
    revenue: r.revenue, duration: r.duration, date: r.date,
    startTime: r.date + " 20:00",
  }));
}

let _products: TikTokProduct[] | null = null;
let _creators: TikTokCreator[] | null = null;
let _shops: TikTokShop[] | null = null;
let _videos: TikTokVideo[] | null = null;
let _lives: TikTokLive[] | null = null;

/** 将真实视频数据适配为 TikTokVideo 格式 */
function adaptRealVideos(raw: any[]): TikTokVideo[] {
  return raw.map((r, i) => ({
    id: i + 1,
    videoId: r.videoId || String(i + 1),
    creatorId: r.creatorId || "unknown",
    title: r.title || "",
    cover: r.coverUrl || null,
    duration: r.duration || "0:45",
    views: r.views || 0,
    likes: r.likes || 0,
    comments: r.comments || 0,
    shares: r.shares || 0,
    engagementRate: r.likes && r.views ? parseFloat(((r.likes / r.views) * 100).toFixed(2)) : 0,
    monthlySales: r.monthlySales || 0,
    monthlyRevenue: r.monthlyRevenue || 0,
    creatorName: r.creatorName || r.creatorId || "Unknown",
    product: r.product || "",
    hashtags: r.hashtags || [],
    date: r.date || new Date().toISOString().slice(0, 10),
    publishDate: r.date || new Date().toISOString().slice(0, 10),
  }));
}

export function getTiktokProducts(): TikTokProduct[] {
  if (!_products) _products = adaptProducts(TIKTOK_PRODUCTS as any);
  return _products;
}
export function getTiktokCreators(): TikTokCreator[] {
  if (!_creators) _creators = adaptCreators(TIKTOK_CREATORS as any);
  return _creators;
}
export function getTiktokShops(): TikTokShop[] {
  if (!_shops) _shops = adaptShops(TIKTOK_SHOPS as any);
  return _shops;
}
export function getTiktokVideos(): TikTokVideo[] {
  if (!_videos) {
    const realData = readRealData<any>("tiktok_videos_manual");
    if (realData && realData.length > 0) {
      console.log(`[MockData] Using real TikTok video data: ${realData.length} videos`);
      _videos = adaptRealVideos(realData);
    } else {
      const crawledData = readRealData<any>("tiktok_videos");
      if (crawledData && crawledData.length > 0) {
        console.log(`[MockData] Using crawled TikTok video data: ${crawledData.length} videos`);
        _videos = adaptRealVideos(crawledData);
      } else {
        console.log("[MockData] No real TikTok data found, falling back to generated mock");
        _videos = adaptVideos(TIKTOK_VIDEOS as any);
      }
    }
  }
  return _videos;
}
export function getTiktokLives(): TikTokLive[] {
  if (!_lives) _lives = adaptLives(TIKTOK_LIVES as any);
  return _lives;
}

// Home 榜单
export function getTiktokHomeProducts(type: "hot" | "soaring" | "new") {
  const products = getTiktokProducts();
  const data = products.slice(0, 5);
  if (type === "soaring") {
    return data.map((p, i) => ({ rank: i + 1, name: p.name, category: p.category, sales: `+${Math.floor(Math.random() * 9000 + 1000)}%`, image: "" }));
  } else if (type === "new") {
    return data.map((p, i) => ({ rank: i + 1, name: p.name, category: p.category, sales: p.sales.toLocaleString(), image: "" }));
  }
  return data.map((p, i) => ({ rank: i + 1, name: p.name, category: p.category, sales: p.sales.toLocaleString(), image: "" }));
}

export function getTiktokHomeInfluencers(type: "sales" | "fans") {
  const creators = getTiktokCreators();
  return creators.slice(0, 5).map((c, i) => ({
    rank: i + 1, username: c.displayName || c.username,
    category: (c.categories || []).join(","),
    sales: type === "sales" ? "$" + ((c.monthlySales || 0) / 1000000).toFixed(2) + "M" : ((c.followers || 0) / 1000000).toFixed(2) + "M",
    avatar: "",
  }));
}

export function getTiktokHomeShops() {
  return getTiktokShops().slice(0, 5).map((s, i) => ({
    rank: i + 1, name: s.name, country: s.country, sales: "$" + ((s.sales || 0) / 1000).toFixed(2) + "K", logo: "",
  }));
}

export function getTiktokHomeVideos() {
  return getTiktokVideos().slice(0, 5).map((v, i) => ({
    rank: i + 1, title: v.title, duration: v.duration, date: v.date, views: (v.views / 1000000).toFixed(2) + "M",
  }));
}

export function getTiktokHomeLives() {
  return getTiktokLives().slice(0, 5).map((l, i) => ({
    rank: i + 1, title: l.title, host: l.creator, viewers: l.viewers, sales: l.sales,
  }));
}

// Analysis 固定数据
export function getTiktokKpi() {
  return [
    { title: "GMV", value: "¥2.8B", trend: "+18.5%", up: true },
    { title: "订单量", value: "45.2M", trend: "+12.3%", up: true },
    { title: "客单价", value: "¥62", trend: "+5.1%", up: true },
    { title: "活跃店铺", value: "128K", trend: "+8.7%", up: true },
    { title: "带货达人", value: "86K", trend: "+15.2%", up: true },
    { title: "直播场次", value: "1.2M", trend: "+9.8%", up: true },
  ];
}

export function getHeatmapData() {
  const categories = ["美妆个护", "健康保健", "女装内衣", "家居日用", "手机数码", "食品饮料"];
  const months = ["1月", "2月", "3月", "4月", "5月", "6月", "7月", "8月", "9月", "10月", "11月", "12月"];
  const data: [number, number, number][] = [];
  for (let c = 0; c < categories.length; c++) {
    for (let m = 0; m < months.length; m++) {
      data.push([c, m, Math.floor(Math.random() * 80 + 20)]);
    }
  }
  return { categories, months, data };
}

export function getGmvTrend() {
  return Array.from({ length: 10 }, (_, i) => ({
    month: `${i + 1}月`,
    gmv: Math.floor(Math.random() * 50 + 80),
    orders: Math.floor(Math.random() * 30 + 50),
  }));
}

export function getCategoryShare() {
  return [
    { name: "母婴用品", value: 28.5 }, { name: "美妆个护", value: 22.3 },
    { name: "家居日用", value: 18.7 }, { name: "健康保健", value: 15.2 },
    { name: "食品饮料", value: 10.8 }, { name: "其他", value: 4.5 },
  ];
}

export function getInfluencerMatrix() {
  return [
    { range: "1万-5万", accounts: 3200000, accountRatio: "32%", sales: 2800000, avgRevenue: 450 },
    { range: "5万-10万", accounts: 1800000, accountRatio: "18%", sales: 5200000, avgRevenue: 890 },
    { range: "10万-50万", accounts: 950000, accountRatio: "9.5%", sales: 7800000, avgRevenue: 1520 },
    { range: "50万-100万", accounts: 420000, accountRatio: "4.2%", sales: 9200000, avgRevenue: 2450 },
    { range: "100万+", accounts: 150000, accountRatio: "1.5%", sales: 12500000, avgRevenue: 5200 },
  ];
}

export function getPriceDistribution() {
  return Array.from({ length: 8 }, (_, i) => ({
    range: `¥${i * 20}-¥${(i + 1) * 20}`,
    products: Math.floor(Math.random() * 500 + 100),
    salesVolume: Math.floor(Math.random() * 8000 + 2000),
    salesRevenue: parseFloat((Math.random() * 0.5 + 0.1).toFixed(2)),
  }));
}
