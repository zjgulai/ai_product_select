// ========================================================================
// Amazon 虚拟数据服务层
// 后续替换为真实数据库查询即可
// ========================================================================

import { faker } from "@faker-js/faker";

// --- 预设数据池 ---
const CATEGORIES = [
  "美妆个护", "健康保健", "女装内衣", "家居日用",
  "手机数码", "食品饮料", "运动户外", "男装内衣",
  "宠物用品", "玩具爱好", "家电", "时尚配饰", "厨房用品", "母婴用品",
];

const BRANDS = [
  "momcozy", "Toplux", "medicube", "Halara", "Dr.Melaxin",
  "Hanes", "Gildan", "Crocs", "OEAK", "Amazon Basics",
  "Bounty", "Ninja", "COSORI", "Hydro Flask", "Medela",
  "Philips", "Nanobebe", "Oral-B", "Dyson", "Anker",
  "UGREEN", "Baseus", "OtterBox", "PopSockets",
];

const VOC_ASPECTS = [
  { aspect: "便携", desc: "方便携带，适合旅行使用" },
  { aspect: "易用", desc: "操作简单，容易上手" },
  { aspect: "味道好", desc: "产品味道好闻，体验舒适" },
  { aspect: "快速", desc: "加热/响应速度快" },
  { aspect: "温度准确", desc: "温度控制精准" },
  { aspect: "设计", desc: "外观设计美观" },
  { aspect: "物有所值", desc: "性价比高，值得购买" },
  { aspect: "材质", desc: "材质安全可靠" },
  { aspect: "容量", desc: "容量大小合适" },
  { aspect: "外观", desc: "外观好看，颜色正" },
  { aspect: "静音", desc: "运行时噪音小" },
  { aspect: "耐用", desc: "质量可靠，使用寿命长" },
  { aspect: "清洁方便", desc: "易于清洗和维护" },
  { aspect: "包装", desc: "包装精美，适合送礼" },
];

// --- 辅助函数 ---
function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }
function randTrend(len = 12) {
  let v = randInt(20, 80);
  return Array.from({ length: len }, () => { v += randInt(-15, 20); v = Math.max(5, Math.min(100, v)); return v; });
}
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }
function pickMany<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function genASIN(): string {
  const c = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "B0";
  for (let i = 0; i < 8; i++) s += c[randInt(0, c.length - 1)];
  return s;
}
function fmtGrowth() { const v = randFloat(-30, 60, 1); return (v >= 0 ? "+" : "") + v.toFixed(1) + "%"; }

// ========================================================================
// 1. Amazon Products (缓存200条)
// ========================================================================
let _amazonProducts: AmazonProduct[] | null = null;

export interface AmazonProduct {
  id: number;
  asin: string;
  title: string;
  brand: string | null;
  category: string | null;
  categoryPath: string | null;
  price: string | null;
  monthlySales: number | null;
  monthlyRevenue: string | null;
  rating: string | null;
  reviewCount: number | null;
  salesTrend: number[] | null;
  priceTrend: number[] | null;
  bsrRank: number | null;
  launchDate: string | null;
  fulfillmentType: string | null;
  images: string[] | null;
  description: string | null;
  bulletPoints: string[] | null;
  tiktokVideoCount: number | null;
  tiktokHeatScore: string | null;
  vocAspects: { aspect: string; sentiment: "positive" | "negative" | "neutral"; count: number; ratio: string }[] | null;
  vocSummary: string | null;
  scrapedAt: Date | null;
  updatedAt: Date | null;
}

export function getAmazonProducts(): AmazonProduct[] {
  if (_amazonProducts) return _amazonProducts;
  const products: AmazonProduct[] = [];
  for (let i = 0; i < 200; i++) {
    const cat = pick(CATEGORIES);
    const brand = pick(BRANDS);
    const sales = randInt(50, 50000);
    const price = randFloat(5, 150, 2);
    const rating = randFloat(3.2, 4.9, 2);
    const rvCount = randInt(5, 5000);
    const vocA = pickMany(VOC_ASPECTS, randInt(3, 8)).map(a => ({
      aspect: a.aspect,
      sentiment: pick(["positive", "negative", "neutral"] as const),
      count: randInt(10, rvCount),
      ratio: randFloat(1, 20, 1) + "%",
    }));
    products.push({
      id: i + 1,
      asin: genASIN(),
      title: faker.commerce.productName(),
      brand, category: cat,
      categoryPath: `${cat} > ${faker.commerce.productAdjective()} > ${faker.commerce.productName()}`,
      price: price.toFixed(2),
      monthlySales: sales,
      monthlyRevenue: (sales * price).toFixed(2),
      rating: rating.toFixed(2),
      reviewCount: rvCount,
      salesTrend: randTrend(12),
      priceTrend: randTrend(8),
      bsrRank: randInt(1, 50000),
      launchDate: faker.date.between({ from: "2023-01-01", to: "2026-03-01" }).toISOString().split("T")[0],
      fulfillmentType: pick(["FBA", "FBM"]),
      images: Array.from({ length: randInt(1, 5) }, () => faker.image.urlPicsumPhotos({ width: 400, height: 400 })),
      description: faker.commerce.productDescription(),
      bulletPoints: [],
      tiktokVideoCount: randInt(0, 500),
      tiktokHeatScore: randFloat(0, 100, 2).toFixed(2),
      vocAspects: vocA,
      vocSummary: `${brand} ${faker.commerce.productName()} has ${rating >= 4.5 ? "great" : rating >= 4 ? "good" : "mixed"} reviews.`,
      scrapedAt: new Date(),
      updatedAt: new Date(),
    });
  }
  _amazonProducts = products;
  return products;
}

// ========================================================================
// 2. Amazon Reviews (每个商品5-20条)
// ========================================================================
let _amazonReviews: AmazonReview[] | null = null;

export interface AmazonReview {
  id: number;
  asin: string;
  reviewId: string;
  reviewerName: string | null;
  rating: string | null;
  title: string | null;
  content: string | null;
  helpfulCount: number | null;
  verifiedPurchase: boolean | null;
  reviewDate: string | null;
  sentiment: "positive" | "negative" | "neutral" | null;
  aspects: { aspect: string; sentiment: "positive" | "negative" | "neutral" }[] | null;
  keywords: string[] | null;
  isPositive: boolean | null;
  isNegative: boolean | null;
  isCritical: boolean | null;
  scrapedAt: Date | null;
  analyzedAt: Date | null;
}

export function getAmazonReviews(asin?: string): AmazonReview[] {
  if (_amazonReviews) return asin ? _amazonReviews.filter(r => r.asin === asin) : _amazonReviews;
  const reviews: AmazonReview[] = [];
  const products = getAmazonProducts();
  let id = 1;
  for (const p of products) {
    const cnt = randInt(5, Math.min(p.reviewCount ?? 20, 20));
    for (let i = 0; i < cnt; i++) {
      const rating = randFloat(1, 5, 1);
      const asp = pickMany(VOC_ASPECTS, randInt(1, 4)).map(a => ({
        aspect: a.aspect,
        sentiment: (rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral") as "positive" | "negative" | "neutral",
      }));
      reviews.push({
        id: id++,
        asin: p.asin,
        reviewId: `R${faker.string.alphanumeric(12).toUpperCase()}`,
        reviewerName: faker.person.fullName(),
        rating: rating.toFixed(1),
        title: faker.commerce.productDescription().slice(0, 80),
        content: faker.lorem.paragraphs(randInt(1, 3)),
        helpfulCount: randInt(0, 200),
        verifiedPurchase: Math.random() > 0.3,
        reviewDate: faker.date.between({ from: "2024-01-01", to: "2026-04-01" }).toISOString().split("T")[0],
        sentiment: rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral",
        aspects: asp,
        keywords: asp.map(a => a.aspect),
        isPositive: rating >= 4,
        isNegative: rating <= 2,
        isCritical: rating <= 2,
        scrapedAt: new Date(),
        analyzedAt: new Date(),
      });
    }
  }
  _amazonReviews = reviews;
  return asin ? reviews.filter(r => r.asin === asin) : reviews;
}

// ========================================================================
// 3. Amazon Keywords (搜索结果)
// ========================================================================
export interface AmazonKeywordResult {
  rank: string;
  keyword: string;
  trend: number[];
  monthlySales: number;
  salesGrowth: string;
  monthlyRevenue: number;
  revenueGrowth: string;
  avgPrice: number;
  avgRating: number;
  top3Ratio: string;
  newRatio: string;
  tiktokHeat?: number;
  tiktokHeatTrend?: number[];
}

const KEYWORD_LIST = [
  "momcozy", "bottle washer", "air fryer", "vacuum", "women tshirts",
  "massage gun", "camping chair", "yoga mat", "sunscreen", "lipstick",
  "water bottle", "coffee maker", "blender", "toothbrush", "hair dryer",
  "phone case", "laptop stand", "desk organizer", "led strip", "portable charger",
  "sneakers", "backpack", "watch", "sunglasses", "wallet",
  "kitchen knife", "cutting board", "spice rack", "food container", "coffee mug",
];

export function searchAmazonKeywords(query?: string): AmazonKeywordResult[] {
  let keywords = [...KEYWORD_LIST];
  if (query) {
    keywords = keywords.filter(k => k.toLowerCase().includes(query.toLowerCase()));
  }
  // 如果搜索词不在列表中，也生成一些结果
  if (keywords.length === 0 && query) {
    keywords = [query, query + " set", query + " kit", query + " pro", query + " premium"];
  }

  return keywords.map((kw, i) => ({
    rank: `#${(i + 1) * randInt(1000, 5000)}`,
    keyword: kw,
    trend: randTrend(12),
    monthlySales: randInt(50000, 800000),
    salesGrowth: fmtGrowth(),
    monthlyRevenue: randInt(1000000, 50000000),
    revenueGrowth: fmtGrowth(),
    avgPrice: randFloat(10, 80, 2),
    avgRating: randFloat(3.8, 4.8, 2),
    top3Ratio: randFloat(10, 50, 1) + "%",
    newRatio: randFloat(0.5, 8, 1) + "%",
    tiktokHeat: randFloat(10, 95, 1),
    tiktokHeatTrend: randTrend(10),
  }));
}

// ========================================================================
// 4. Amazon 统计卡片
// ========================================================================
export function getAmazonKeywordStats() {
  return [
    { title: "参数趋势", desc: "含产品参数的搜索词，且增长的市场", value: `${randInt(5000, 10000).toLocaleString()}` },
    { title: "品牌趋势", desc: "含品牌词的搜索词，且增长的市场", value: `${randInt(10000, 20000).toLocaleString()}` },
    { title: "热门市场", desc: "评论量较大且增长的市场", value: `${randInt(800000, 1200000).toLocaleString()}` },
    { title: "潜力市场", desc: "评论量规模中等，且涨幅不错的市场", value: `${randInt(10000, 20000).toLocaleString()}` },
  ];
}

// ========================================================================
// 5. 热门/潜力/参数/品牌市场数据
// ========================================================================
const MARKET_KEYWORDS = [
  "kitchen organizer", "car accessories", "baby products", "phone accessories",
  "home decor", "dog supplies", "makeup tools", "camping gear",
  "wireless earbuds", "sunscreen spf 50", "portable charger", "neck massager",
  "body wash", "running shoes", "yoga mat", "smart garden",
  "solar lights", "pet camera", "standing desk", "reusable wrap",
];

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

export function getHotMarket(): MarketItem[] {
  return MARKET_KEYWORDS.slice(0, 8).map((kw, i) => ({
    rank: i + 1, keyword: kw,
    trend: randTrend(10),
    sales: randInt(300000, 1300000),
    salesG: fmtGrowth(),
    revenue: randInt(5000000, 30000000),
    price: randFloat(10, 50, 2),
    rating: randFloat(3.8, 4.7, 2),
    reviews: randInt(10000, 60000),
    competition: pick(["极高", "高", "中高", "中"]),
  }));
}

export function getPotMarket(): MarketItem[] {
  return MARKET_KEYWORDS.slice(8).map((kw, i) => ({
    rank: i + 1, keyword: kw,
    trend: randTrend(10),
    sales: randInt(50000, 300000),
    salesG: (randFloat(15, 60, 1)) + "%",
    revenue: randInt(1000000, 6000000),
    price: randFloat(15, 50, 2),
    rating: randFloat(3.8, 4.7, 2),
    reviews: randInt(3000, 20000),
    potential: pick(["极高", "高", "中高", "中"]),
  }));
}

export function getParamMarket(): MarketItem[] {
  return MARKET_KEYWORDS.slice(0, 8).map((kw, i) => ({
    rank: i + 1, keyword: kw,
    trend: randTrend(10),
    sales: randInt(200000, 700000),
    salesG: fmtGrowth(),
    revenue: randInt(3000000, 20000000),
    revG: fmtGrowth(),
    price: randFloat(15, 80, 2),
    rating: randFloat(3.5, 4.6, 2),
    top3: randFloat(15, 45, 1) + "%",
    newP: randFloat(1, 6, 1) + "%",
    competition: pick(["高", "中高", "中"]),
    attrs: ["portable", "durable", "waterproof", "fast", "compact"].slice(0, randInt(2, 4)).join(","),
  }));
}

export function getBrandMarket(): MarketItem[] {
  return MARKET_KEYWORDS.slice(0, 5).map((kw, i) => ({
    rank: i + 1, keyword: kw,
    trend: randTrend(10),
    sales: randInt(400000, 1000000),
    salesG: fmtGrowth(),
    revenue: randInt(5000000, 25000000),
    revG: fmtGrowth(),
    price: randFloat(10, 40, 2),
    rating: randFloat(3.8, 4.7, 2),
    top3: randFloat(20, 55, 1) + "%",
    newP: randFloat(0.5, 5, 1) + "%",
    brands: pickMany(BRANDS, randInt(2, 4)).join(","),
  }));
}
