// ========================================================================
// TikTok 虚拟数据服务层
// ========================================================================

import { faker } from "@faker-js/faker";

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }
function pickMany<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }
function fmtGrowth() { const v = randFloat(-30, 60, 1); return (v >= 0 ? "+" : "") + v.toFixed(1) + "%"; }

const CATEGORIES = [
  "美妆个护", "健康保健", "女装内衣", "家居日用",
  "手机数码", "食品饮料", "运动户外", "男装内衣",
  "宠物用品", "玩具爱好", "家电", "时尚配饰", "厨房用品", "母婴用品",
];

const HASHTAGS = [
  "#bottlewarmertiktok", "#momhack", "#babyessential", "#amazonfinds",
  "#tiktokmademebuyit", "#musthave", "#kitchenhack", "#beautyroutine",
  "#skincare", "#workout", "#petsoftiktok", "#homeorganization",
  "#cleantok", "#selfcare", "#morningroutine", "#fyp", "#viral", "#trending",
];

// ========================================================================
// 1. TikTok Creators (50个)
// ========================================================================
let _creators: TikTokCreator[] | null = null;

export interface TikTokCreator {
  id: number;
  creatorId: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  avatar: string | null;
  followers: number | null;
  following: number | null;
  totalLikes: number | null;
  videoCount: number | null;
  productsCount: number | null;
  avgViews: number | null;
  monthlySales: number | null;
  monthlyRevenue: string | null;
  videoGpm: string | null;
  liveGpm: string | null;
  accountType: string | null;
  categories: string[] | null;
  fanGrowth: string | null;
  scrapedAt: Date | null;
}

export function getTiktokCreators(): TikTokCreator[] {
  if (_creators) return _creators;
  const creators: TikTokCreator[] = [];
  for (let i = 0; i < 50; i++) {
    const followers = randInt(1000, 10000000);
    creators.push({
      id: i + 1,
      creatorId: `creator_${faker.string.alphanumeric(10)}`,
      username: faker.internet.username().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      displayName: faker.person.fullName(),
      bio: faker.lorem.sentence(),
      avatar: faker.image.avatar(),
      followers,
      following: randInt(100, Math.min(followers, 5000)),
      totalLikes: randInt(followers * 2, followers * 20),
      videoCount: randInt(50, 5000),
      productsCount: randInt(5, 500),
      avgViews: randInt(1000, Math.min(followers, 500000)),
      monthlySales: randInt(100, 50000),
      monthlyRevenue: randFloat(1000, 500000, 2).toFixed(2),
      videoGpm: randFloat(0.5, 50, 2).toFixed(2),
      liveGpm: randFloat(0, 30, 2).toFixed(2),
      accountType: pick(["个人运营", "店铺运营"]),
      categories: pickMany(CATEGORIES, randInt(1, 4)),
      fanGrowth: (Math.random() > 0.5 ? "+" : "-") + randFloat(1, 50, 1) + "%",
      scrapedAt: new Date(),
    });
  }
  _creators = creators;
  return creators;
}

// ========================================================================
// 2. TikTok Videos (300个)
// ========================================================================
let _videos: TikTokVideo[] | null = null;

export interface TikTokVideo {
  id: number;
  videoId: string;
  creatorId: string;
  creatorName: string;
  title: string;
  description: string;
  hashtags: string[];
  duration: string;
  views: number;
  likes: number;
  shares: number;
  commentsCount: number;
  engagementRate: number;
  monthlySales: number;
  monthlyRevenue: number;
  product: string;
  date: string;
  publishDate: string;
}

export function getTiktokVideos(): TikTokVideo[] {
  if (_videos) return _videos;
  const creators = getTiktokCreators();
  const videos: TikTokVideo[] = [];
  for (let i = 0; i < 300; i++) {
    const creator = pick(creators);
    const views = randInt(1000, 50000000);
    const likes = Math.floor(views * randFloat(0.01, 0.08, 4));
    const shares = Math.floor(views * randFloat(0.001, 0.02, 4));
    const comments = Math.floor(views * randFloat(0.005, 0.03, 4));
    const durM = randInt(0, 3);
    const durS = randInt(0, 59);
    const durStr = `00:${String(durM).padStart(2, "0")}:${String(durS).padStart(2, "0")}`;
    videos.push({
      id: i + 1,
      videoId: `video_${faker.string.alphanumeric(15)}`,
      creatorId: creator.creatorId,
      creatorName: creator.displayName ?? creator.username,
      title: faker.lorem.sentence(randInt(3, 10)),
      description: faker.lorem.paragraph() + " " + pickMany(HASHTAGS, randInt(3, 8)).join(" "),
      hashtags: pickMany(HASHTAGS, randInt(3, 8)),
      duration: durStr,
      views,
      likes,
      shares,
      commentsCount: comments,
      engagementRate: parseFloat(((likes + comments + shares) / views * 100).toFixed(2)),
      monthlySales: randInt(0, Math.floor(views * 0.001)),
      monthlyRevenue: randFloat(0, views * 0.05, 2),
      product: faker.commerce.productName(),
      date: faker.date.between({ from: "2026-02-01", to: "2026-04-20" }).toISOString().split("T")[0],
      publishDate: faker.date.between({ from: "2026-02-01", to: "2026-04-20" }).toISOString().split("T")[0] + " " + String(randInt(8, 22)).padStart(2, "0") + ":" + String(randInt(0, 59)).padStart(2, "0") + ":00",
    });
  }
  _videos = videos;
  return videos;
}

// ========================================================================
// 3. TikTok Shops (30个)
// ========================================================================
let _shops: TikTokShop[] | null = null;

export interface TikTokShop {
  id: number;
  shopId: string;
  name: string;
  country: string | null;
  category: string | null;
  logo: string | null;
  sales: number | null;
  salesGrowth: string | null;
  revenue: string | null;
  revenueGrowth: string | null;
  activeProducts: number | null;
  totalProducts: number | null;
  newRatio: string | null;
  totalSales: number | null;
  totalRevenue: string | null;
  rating: string | null;
  influencers: number | null;
  shopType: string | null;
  scrapedAt: Date | null;
}

export function getTiktokShops(): TikTokShop[] {
  if (_shops) return _shops;
  const shops: TikTokShop[] = [];
  for (let i = 0; i < 30; i++) {
    const sales = randInt(5000, 500000);
    const revenue = sales * randFloat(5, 50, 2);
    shops.push({
      id: i + 1,
      shopId: `shop_${faker.string.alphanumeric(8)}`,
      name: faker.company.name() + (Math.random() > 0.5 ? " Store" : ""),
      country: pick(["美国", "英国", "加拿大", "澳大利亚"]),
      category: pickMany(CATEGORIES, randInt(1, 3)).join(","),
      logo: null,
      sales,
      salesGrowth: fmtGrowth(),
      revenue: (sales * randFloat(5, 50, 2)).toFixed(2),
      revenueGrowth: fmtGrowth(),
      activeProducts: randInt(5, 500),
      totalProducts: randInt(10, 2000),
      newRatio: randFloat(0, 15, 2) + "%",
      totalSales: randInt(sales * 10, sales * 100),
      totalRevenue: (revenue * randFloat(10, 100, 2)).toFixed(2),
      rating: randFloat(3.5, 4.9, 2).toFixed(2),
      influencers: randInt(10, 5000),
      shopType: pick(["本土店", "跨境店"]),
      scrapedAt: new Date(),
    });
  }
  _shops = shops;
  return shops;
}

// ========================================================================
// 4. TikTok Lives (20个)
// ========================================================================
let _lives: TikTokLive[] | null = null;

export interface TikTokLive {
  id: string;
  title: string;
  creator: string | null;
  creatorId: string;
  creatorFollowers: number | null;
  startTime: string;
  duration: number;
  viewers: number;
  maxOnline: number;
  likes: number;
  comments: number;
  gpm: number;
  products: number;
  status: string;
}

export function getTiktokLives(): TikTokLive[] {
  if (_lives) return _lives;
  const lives: TikTokLive[] = [];
  for (let i = 0; i < 20; i++) {
    const start = new Date(faker.date.between({ from: "2026-04-01", to: "2026-04-20" }));
    const durMin = randInt(30, 300);
    lives.push({
      id: `live_${faker.string.alphanumeric(8)}`,
      title: faker.lorem.sentence(randInt(2, 6)),
      creator: faker.internet.username(),
      creatorId: `creator_${faker.string.alphanumeric(8)}`,
      creatorFollowers: randInt(100000, 20000000),
      startTime: start.toISOString().replace("T", " ").slice(0, 19),
      duration: durMin,
      viewers: randInt(10000, 10000000),
      maxOnline: randInt(500, 500000),
      likes: randInt(10000, 50000000),
      comments: randInt(1000, 10000000),
      gpm: randFloat(1, 100, 2),
      products: randInt(1, 50),
      status: pick(["ended", "live"]),
    });
  }
  _lives = lives;
  return lives;
}

// ========================================================================
// 5. TikTok 大盘 KPI
// ========================================================================
export function getTiktokKpi() {
  return [
    { title: "总销量", value: `${randInt(15000000, 20000000).toLocaleString()}`, trend: `+${randFloat(0.1, 1, 2)}%`, up: true },
    { title: "总销售额", value: `$${randInt(500, 700).toLocaleString()}M`, trend: `-${randFloat(1, 3, 2)}%`, up: false },
    { title: "动销商品数", value: `${randInt(500000, 600000).toLocaleString()}`, trend: `+${randFloat(30, 50, 2)}%`, up: true },
    { title: "平均成交价", value: `$${randFloat(30, 40, 2)}`, trend: `+${randFloat(0.5, 3, 2)}%`, up: true },
    { title: "动销新品数", value: `${randInt(20000, 30000).toLocaleString()}`, trend: `-${randFloat(20, 40, 2)}%`, up: false },
    { title: "动销新品销售额", value: `$${randInt(8, 15).toLocaleString()}M`, trend: `-${randFloat(20, 35, 2)}%`, up: false },
  ];
}

// ========================================================================
// 6. TikTok 品类热力图
// ========================================================================
const HEAT_CATS = [
  "美妆个护", "健康保健", "女装内衣", "家居日用",
  "手机数码", "食品饮料", "运动户外", "男装内衣",
  "宠物用品", "玩具爱好", "家电", "时尚配饰",
];
const HEAT_MONTHS = ["2025-06", "2025-07", "2025-08", "2025-09", "2025-10", "2025-11", "2025-12", "2026-01", "2026-02", "2026-03"];

export function getHeatmapData() {
  const data: [number, number, number][] = [];
  for (let c = 0; c < HEAT_CATS.length; c++) {
    for (let m = 0; m < HEAT_MONTHS.length; m++) {
      data.push([c, m, randInt(15, 95)]);
    }
  }
  return { categories: HEAT_CATS, months: HEAT_MONTHS, data };
}

// ========================================================================
// 7. TikTok 月度GMV
// ========================================================================
export function getGmvTrend() {
  return [
    { month: "2025-06", gmv: 8.2 + randFloat(-0.5, 0.5, 1) },
    { month: "2025-07", gmv: 7.8 + randFloat(-0.5, 0.5, 1) },
    { month: "2025-08", gmv: 8.5 + randFloat(-0.5, 0.5, 1) },
    { month: "2025-09", gmv: 9.1 + randFloat(-0.5, 0.5, 1) },
    { month: "2025-10", gmv: 9.8 + randFloat(-0.5, 0.5, 1) },
    { month: "2025-11", gmv: 12.5 + randFloat(-0.5, 0.5, 1) },
    { month: "2025-12", gmv: 13.2 + randFloat(-0.5, 0.5, 1) },
    { month: "2026-01", gmv: 8.6 + randFloat(-0.5, 0.5, 1) },
    { month: "2026-02", gmv: 9.3 + randFloat(-0.5, 0.5, 1) },
    { month: "2026-03", gmv: 10.1 + randFloat(-0.5, 0.5, 1) },
  ];
}

// ========================================================================
// 8. TikTok 品类份额
// ========================================================================
export function getCategoryShare() {
  return [
    { name: "美妆个护", value: 26.0, gmv: "$10.5B", trend: "+26%", status: "dominant" },
    { name: "健康保健", value: 15.2, gmv: "$6.1B", trend: "+38%", status: "growing" },
    { name: "女装内衣", value: 12.8, gmv: "$5.2B", trend: "+15%", status: "stable" },
    { name: "家居日用", value: 10.5, gmv: "$4.2B", trend: "+22%", status: "growing" },
    { name: "手机数码", value: 8.3, gmv: "$3.3B", trend: "+12%", status: "stable" },
    { name: "食品饮料", value: 7.6, gmv: "$3.0B", trend: "+18%", status: "growing" },
  ];
}

// ========================================================================
// 9. TikTok 达人矩阵
// ========================================================================
export function getInfluencerMatrix() {
  return [
    { range: "0-10K", accounts: 22823097, accountRatio: "84.97%", sales: 56983200, salesRatio: "44.96%", videos: 3840048598, videoRatio: "63.35%", avgRevenue: 429.714 },
    { range: "10K-100K", accounts: 3504032, accountRatio: "13.05%", sales: 52686124, salesRatio: "41.57%", videos: 1753534562, videoRatio: "28.93%", avgRevenue: 1078.593 },
    { range: "100K-1M", accounts: 488452, accountRatio: "1.82%", sales: 15413055, salesRatio: "12.16%", videos: 406884604, videoRatio: "6.71%", avgRevenue: 1622.285 },
    { range: "1M-5M", accounts: 38843, accountRatio: "0.14%", sales: 1491832, salesRatio: "1.18%", videos: 53308284, videoRatio: "0.88%", avgRevenue: 1947.035 },
    { range: ">5M", accounts: 4380, accountRatio: "0.02%", sales: 163156, salesRatio: "0.13%", videos: 7791954, videoRatio: "0.13%", avgRevenue: 1989.827 },
  ];
}

// ========================================================================
// 10. TikTok 价格分布
// ========================================================================
export function getPriceDistribution() {
  return [
    { range: "$0-5", products: randInt(3000, 8000), salesVolume: randInt(2000, 6000), salesRevenue: randFloat(0.5, 2, 2) },
    { range: "$5-10", products: randInt(5000, 12000), salesVolume: randInt(5000, 12000), salesRevenue: randFloat(2, 8, 2) },
    { range: "$10-20", products: randInt(10000, 20000), salesVolume: randInt(8000, 18000), salesRevenue: randFloat(8, 25, 2) },
    { range: "$20-50", products: randInt(15000, 25000), salesVolume: randInt(12000, 25000), salesRevenue: randFloat(25, 80, 2) },
    { range: "$50-100", products: randInt(5000, 12000), salesVolume: randInt(3000, 8000), salesRevenue: randFloat(15, 50, 2) },
    { range: ">$100", products: randInt(1000, 5000), salesVolume: randInt(500, 3000), salesRevenue: randFloat(5, 40, 2) },
  ];
}

// ========================================================================
// 11. TikTok Products (商品列表 - 100个)
// ========================================================================
let _products: TikTokProduct[] | null = null;

export interface TikTokProduct {
  id: number;
  name: string;
  category: string;
  sales: number;
  salesGrowth: string;
  revenue: number;
  trend: number[];
  price: number;
  rating: number;
  influencers: number;
  date: string;
  shop: string;
  priceRange?: string;
}

export function getTiktokProducts(): TikTokProduct[] {
  if (_products) return _products;
  const products: TikTokProduct[] = [];
  for (let i = 0; i < 100; i++) {
    const sales = randInt(500, 50000);
    products.push({
      id: i + 1,
      name: faker.commerce.productName(),
      category: pick(CATEGORIES),
      sales,
      salesGrowth: fmtGrowth(),
      revenue: sales * randFloat(5, 60, 2),
      trend: Array.from({ length: 12 }, () => randInt(10, 100)),
      price: randFloat(5, 80, 2),
      rating: randFloat(3.5, 4.9, 2),
      influencers: randInt(5, 5000),
      date: faker.date.between({ from: "2024-01-01", to: "2026-04-01" }).toISOString().split("T")[0],
      shop: faker.company.name() + " Store",
      priceRange: Math.random() > 0.5 ? `$${randFloat(10, 20, 2)}-$${randFloat(30, 60, 2)}` : undefined,
    });
  }
  _products = products;
  return products;
}

// ========================================================================
// 12. TikTok Home 数据
// ========================================================================
export function getTiktokHomeProducts(type: "hot" | "soaring" | "new") {
  const products = getTiktokProducts();
  const data = products.slice(0, 5);
  if (type === "soaring") {
    return data.map((p, i) => ({ rank: i + 1, name: p.name, category: p.category, sales: `+${randInt(1000, 9000)}%`, image: "" }));
  } else if (type === "new") {
    return data.map((p, i) => ({ rank: i + 1, name: p.name, category: p.category, sales: randInt(5000, 50000).toLocaleString(), image: "" }));
  }
  return data.map((p, i) => ({ rank: i + 1, name: p.name, category: p.category, sales: p.sales.toLocaleString(), image: "" }));
}

export function getTiktokHomeInfluencers(type: "sales" | "fans") {
  const creators = getTiktokCreators();
  return creators.slice(0, 5).map((c, i) => ({
    rank: i + 1,
    username: c.displayName ?? c.username,
    category: (c.categories ?? []).join(","),
    sales: type === "sales" ? `$${(parseFloat(c.monthlyRevenue ?? "0") / 1000000).toFixed(2)}M` : `${((c.followers ?? 0) / 1000000).toFixed(2)}M`,
    avatar: "",
  }));
}

export function getTiktokHomeShops() {
  return getTiktokShops().slice(0, 5).map((s, i) => ({
    rank: i + 1, name: s.name, country: s.country, sales: `${((s.sales ?? 0) / 1000).toFixed(2)}K`, logo: "",
  }));
}

export function getTiktokHomeVideos() {
  return getTiktokVideos().slice(0, 5).map((v, i) => ({
    rank: i + 1, title: v.title, duration: v.duration, date: v.date, views: `${(v.views / 1000000).toFixed(2)}M`,
  }));
}

export function getTiktokHomeLives() {
  return getTiktokLives().slice(0, 5).map((l, i) => ({
    rank: i + 1, title: l.title, viewers: `${(l.viewers / 1000000).toFixed(2)}M`, newFans: `${(l.maxOnline / 1000).toFixed(1)}K`,
  }));
}
