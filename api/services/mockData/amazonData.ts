// ========================================================================
// Amazon 数据服务层 — 优先使用真实采集数据， fallback 到 generated mock
// ========================================================================

import { AMAZON_PRODUCTS, AMAZON_REVIEWS } from "@/data/generated";

/** 在 Node.js 环境中读取真实采集数据（浏览器环境跳过） */
function readRealData<T>(sourcePrefix: string): T[] | null {
  if (typeof window !== "undefined") return null; // 浏览器环境
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

export interface AmazonProduct {
  id: number; asin: string; title: string; brand: string | null;
  category: string | null; categoryPath: string | null; price: string | null;
  monthlySales: number; monthlyRevenue: string | null; rating: string | null;
  reviewCount: number; salesTrend: number[]; priceTrend: number[];
  bsrRank: number | null; launchDate: string | null; fulfillmentType: string | null;
  images: string[]; description: string | null; bulletPoints: string[];
  tiktokVideoCount: number; tiktokHeatScore: string | null;
  vocAspects: { aspect: string; sentiment: string; count: number; ratio: string }[];
  vocSummary: string | null; scrapedAt: Date; updatedAt: Date;
}

export interface AmazonReview {
  id: number; asin: string; reviewId: string; rating: string;
  title: string; content: string; author: string; verified: boolean;
  helpfulVotes: number; reviewDate: string; sentiment: string;
  aspects: { aspect: string; sentiment: string }[];
}

export interface AmazonKeywordResult {
  keyword: string; searchVolume: number; monthlySales: number; monthlyRevenue: number;
  salesGrowth: string; revenueGrowth: string; avgPrice: string; avgRating: number;
  competition: string; trend: number[]; cpc: number; rank: number;
}

export interface MarketItem {
  rank: number;
  keyword: string;
  trend: number[];
  sales: number;
  salesG: string;
  revenue: number;
  revG?: string;
  price: number;
  rating: number;
  reviews?: number;
  competition?: string;
  top3?: string;
  newP?: string;
  attrs?: string;
  brands?: string;
  potential?: string;
}

function adaptProducts(raw: any[]): AmazonProduct[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, asin: r.asin, title: r.title, brand: r.brand,
    category: r.category, categoryPath: r.category_path,
    price: String(r.price), monthlySales: r.monthly_sales,
    monthlyRevenue: String(r.monthly_revenue), rating: String(r.rating),
    reviewCount: r.review_count,
    salesTrend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 80 + 20)),
    priceTrend: Array.from({ length: 8 }, () => Math.floor(Math.random() * 80 + 20)),
    bsrRank: r.bsr_rank, launchDate: r.launch_date,
    fulfillmentType: r.fulfillment_type,
    images: [`https://picsum.photos/400/400?random=${r.id}`],
    description: `Premium quality ${r.category} from ${r.brand}. Highly rated by parents worldwide.`,
    bulletPoints: ["Safe materials", "Easy to clean", "Portable design"],
    tiktokVideoCount: r.tiktok_video_count,
    tiktokHeatScore: String(r.tiktok_heat_score),
    vocAspects: [], vocSummary: `${r.brand} ${r.category} has great reviews.`,
    scrapedAt: new Date(), updatedAt: new Date(),
  }));
}

/**
 * 将爬虫采集的真实数据适配为 AmazonProduct 格式
 */
function adaptRealProducts(raw: any[]): AmazonProduct[] {
  return raw.map((r, i) => ({
    id: i + 1,
    asin: r.asin,
    title: r.title,
    brand: r.brand || "Unknown",
    category: r.category || "Baby Products",
    categoryPath: r.category || "Baby Products",
    price: r.price || "N/A",
    monthlySales: r.monthlySales || Math.floor(Math.random() * 5000 + 500),
    monthlyRevenue: String(Math.floor((r.monthlySales || 3000) * (parseFloat(r.price?.replace(/[^0-9.]/g, "")) || 25))),
    rating: r.rating || "4.5",
    reviewCount: r.reviewCount || Math.floor(Math.random() * 2000 + 100),
    salesTrend: Array.from({ length: 12 }, () => Math.floor(Math.random() * 80 + 20)),
    priceTrend: Array.from({ length: 8 }, () => Math.floor(Math.random() * 80 + 20)),
    bsrRank: r.rank || i + 1,
    launchDate: null,
    fulfillmentType: "FBA",
    images: r.imageUrl ? [r.imageUrl] : [`https://picsum.photos/400/400?random=${i}`],
    description: r.title,
    bulletPoints: ["Top rated", "Best seller", "Popular choice"],
    tiktokVideoCount: Math.floor(Math.random() * 50),
    tiktokHeatScore: String(Math.floor(Math.random() * 100)),
    vocAspects: [],
    vocSummary: `${r.title} is a top-selling baby product with ${r.rating || "4.5"} stars.`,
    scrapedAt: new Date(),
    updatedAt: new Date(),
  }));
}

function adaptReviews(raw: any[]): AmazonReview[] {
  return raw.map((r, i) => ({
    id: r.id ?? i + 1, asin: r.asin, reviewId: r.review_id,
    rating: String(r.rating), title: r.title, content: r.content,
    author: `User${Math.floor(Math.random() * 9999)}`,
    verified: r.verified, helpfulVotes: r.helpful_votes,
    reviewDate: r.review_date, sentiment: r.sentiment, aspects: [],
  }));
}

let _products: AmazonProduct[] | null = null;
let _reviews: AmazonReview[] | null = null;

export function getAmazonProducts(): AmazonProduct[] {
  if (!_products) {
    // 优先级：enriched > best sellers > generated mock
    const enrichedData = readRealData<any>("amazon_bestsellers_enriched");
    if (enrichedData && enrichedData.length > 0) {
      console.log(`[MockData] Using enriched real data: ${enrichedData.length} products`);
      _products = adaptRealProducts(enrichedData);
    } else {
      const realData = readRealData<any>("amazon_bestsellers");
      if (realData && realData.length > 0) {
        console.log(`[MockData] Using best sellers real data: ${realData.length} products`);
        _products = adaptRealProducts(realData);
      } else {
        console.log("[MockData] No real data found, falling back to generated mock");
        _products = adaptProducts(AMAZON_PRODUCTS as any);
      }
    }
  }
  return _products;
}

export function getAmazonReviews(asin?: string): AmazonReview[] {
  if (!_reviews) _reviews = adaptReviews(AMAZON_REVIEWS as any);
  if (asin) return _reviews.filter(r => r.asin === asin);
  return _reviews;
}

export function searchAmazonKeywords(query?: string): AmazonKeywordResult[] {
  const keywords = [
    "baby bottle", "diapers", "stroller", "car seat", "baby monitor",
    "pacifier", "breast pump", "baby carrier", "play mat", "swaddle",
    "baby lotion", "wipes", "formula", "bib", "sippy cup",
  ];
  const results = keywords.map((k, i) => {
    const monthlySales = Math.floor(Math.random() * 20000 + 1000);
    const avgPrice = parseFloat((Math.random() * 40 + 10).toFixed(2));
    return {
      keyword: k, searchVolume: Math.floor(Math.random() * 50000 + 5000),
      monthlySales, monthlyRevenue: Math.floor(monthlySales * avgPrice),
      salesGrowth: `+${(Math.random() * 30).toFixed(1)}%`,
      revenueGrowth: `+${(Math.random() * 25).toFixed(1)}%`,
      avgPrice: `$${avgPrice}`, avgRating: parseFloat((3.8 + Math.random() * 1.5).toFixed(1)),
      competition: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
      trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 100)),
      cpc: parseFloat((Math.random() * 2 + 0.5).toFixed(2)),
      rank: i + 1,
    };
  });
  if (query) {
    return results.filter(r => r.keyword.toLowerCase().includes(query.toLowerCase()));
  }
  return results;
}

export function getAmazonKeywordStats() {
  return [
    { title: "参数趋势", desc: "含产品参数的搜索词，且增长的市场", value: `${(5000 + Math.floor(Math.random() * 5000)).toLocaleString()}` },
    { title: "品牌趋势", desc: "含品牌词的搜索词，且增长的市场", value: `${(10000 + Math.floor(Math.random() * 10000)).toLocaleString()}` },
    { title: "热门市场", desc: "评论量较大且增长的市场", value: `${(800000 + Math.floor(Math.random() * 400000)).toLocaleString()}` },
    { title: "潜力市场", desc: "评论量规模中等，且涨幅不错的市场", value: `${(10000 + Math.floor(Math.random() * 10000)).toLocaleString()}` },
  ];
}

export function getHotMarket(): MarketItem[] {
  return Array.from({ length: 15 }, (_, i) => ({
    rank: i + 1,
    keyword: ["baby bottle", "diapers", "stroller", "car seat", "baby monitor", "pacifier", "breast pump", "baby carrier", "play mat", "swaddle", "baby lotion", "wipes", "formula", "bib", "sippy cup"][i],
    trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 20)),
    sales: Math.floor(Math.random() * 100000 + 10000),
    salesG: `+${Math.floor(Math.random() * 40 + 5)}%`,
    revenue: Math.floor(Math.random() * 500000 + 50000),
    revG: `+${Math.floor(Math.random() * 30 + 5)}%`,
    price: parseFloat((Math.random() * 50 + 20).toFixed(2)),
    rating: parseFloat((Math.random() * 0.5 + 4.0).toFixed(2)),
    reviews: Math.floor(Math.random() * 2000 + 100),
    competition: ["High", "Medium", "Low"][Math.floor(Math.random() * 3)],
    top3: `${Math.floor(Math.random() * 20 + 30)}%`,
    newP: `${Math.floor(Math.random() * 20 + 5)}%`,
    attrs: "safe, portable",
    brands: "Philips Avent, Dr. Brown's",
  }));
}

export function getPotMarket(): MarketItem[] {
  return Array.from({ length: 15 }, (_, i) => ({
    rank: i + 1,
    keyword: ["anti lost backpack", "nursing pillow", "belly band", "food maker", "bottle warmer", "sterilizer", "sleep sack", "baby rocker", "cloth book", "walker", "safety gate", "thermometer", "crawling mat", "rattle", "play gym"][i],
    trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 20)),
    sales: Math.floor(Math.random() * 50000 + 5000),
    salesG: `+${Math.floor(Math.random() * 60 + 20)}%`,
    revenue: Math.floor(Math.random() * 200000 + 20000),
    revG: `+${Math.floor(Math.random() * 50 + 15)}%`,
    price: parseFloat((Math.random() * 40 + 15).toFixed(2)),
    rating: parseFloat((Math.random() * 0.5 + 4.0).toFixed(2)),
    reviews: Math.floor(Math.random() * 1000 + 50),
    competition: ["Low", "Medium", "Low"][Math.floor(Math.random() * 3)],
    top3: `${Math.floor(Math.random() * 15 + 20)}%`,
    newP: `${Math.floor(Math.random() * 30 + 10)}%`,
    attrs: "innovative, eco-friendly",
    brands: "Munchkin, OXO Tot",
    potential: "高",
  }));
}

export function getParamMarket(): MarketItem[] {
  return Array.from({ length: 12 }, (_, i) => ({
    rank: i + 1,
    keyword: ["baby bottle", "diapers", "stroller", "car seat", "baby monitor", "pacifier", "breast pump", "baby carrier", "play mat", "swaddle", "baby lotion", "wipes"][i],
    trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 20)),
    sales: Math.floor(Math.random() * 100000 + 10000),
    salesG: `+${Math.floor(Math.random() * 20 + 2)}%`,
    revenue: Math.floor(Math.random() * 500000 + 50000),
    revG: `+${Math.floor(Math.random() * 15 + 2)}%`,
    price: parseFloat((Math.random() * 10 + 25).toFixed(2)),
    rating: parseFloat((Math.random() * 0.5 + 4.0).toFixed(2)),
    reviews: Math.floor(Math.random() * 500 + 100),
    competition: "Medium",
  }));
}

export function getBrandMarket(): MarketItem[] {
  return Array.from({ length: 12 }, (_, i) => ({
    rank: i + 1,
    keyword: ["Philips Avent", "Dr. Brown's", "Graco", "Britax", "Fisher-Price"][i % 5],
    trend: Array.from({ length: 7 }, () => Math.floor(Math.random() * 80 + 20)),
    sales: Math.floor(Math.random() * 200000 + 20000),
    salesG: `+${Math.floor(Math.random() * 25 + 5)}%`,
    revenue: Math.floor(Math.random() * 1000000 + 100000),
    revG: `+${Math.floor(Math.random() * 20 + 5)}%`,
    price: parseFloat((Math.random() * 20 + 30).toFixed(2)),
    rating: parseFloat((Math.random() * 0.3 + 4.2).toFixed(2)),
    reviews: Math.floor(Math.random() * 3000 + 500),
    competition: "High",
    top3: `${Math.floor(Math.random() * 20 + 30)}%`,
  }));
}
