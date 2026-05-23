import { getDb } from "../api/queries/connection";
import {
  amazonProducts,
  amazonReviews,
  tiktokVideos,
  tiktokCreators,
  tiktokShops,
  keywordMappings,
  productConcepts,
  conceptMetrics,
  userFavorites,
  fusionReports,
} from "./schema";
import { faker } from "@faker-js/faker";

// ========================================================================
// 虚拟数据生成器 —— 让平台"活"起来
// ========================================================================

const db = getDb();

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
  "UGREEN", "Baseus", "OtterBox", "PopSockets", "lululemon",
  "Gymshark", "Fabletics", "CeraVe", "La Roche-Posay", "The Ordinary",
  "e.l.f.", "Maybelline", "L'Oreal", "Neutrogena", "Aveeno",
];

const ASPECTS_POOL = [
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
  { aspect: "客服", desc: "客服态度好，售后有保障" },
];

const TIKTOK_HASHTAGS = [
  "#bottlewarmertiktok", "#momhack", "#babyessential", "#amazonfinds",
  "#tiktokmademebuyit", "#musthave", "#kitchenhack", "#beautyroutine",
  "#skincare", "#workout", "#petsoftiktok", "#homeorganization",
  "#cleantok", "#selfcare", "#morningroutine", "#nightroutine",
  "#fyp", "#viral", "#trending", "#useful",
];

const CONCEPTS = [
  { id: "portable_bottle_warmer", name: "便携温奶器", nameEn: "Portable Bottle Warmer",
    features: ["USB充电", "便携", "快速加热", "恒温"], scenes: ["旅行", "户外", "车载"] },
  { id: "smart_pet_feeder", name: "智能宠物喂食器", nameEn: "Smart Pet Feeder",
    features: ["定时投喂", "远程控制", "摄像头", "大容量"], scenes: ["日常", "出差", "旅行"] },
  { id: "wireless_neck_massager", name: "无线颈部按摩器", nameEn: "Wireless Neck Massager",
    features: ["加热", "多模式", "静音", "便携"], scenes: ["办公", "居家", "车载"] },
  { id: "led_makeup_mirror", name: "LED化妆镜", nameEn: "LED Makeup Mirror",
    features: ["可调光", "放大", "便携", "USB充电"], scenes: ["化妆", "旅行", "日常"] },
  { id: "portable_blender", name: "便携榨汁杯", nameEn: "Portable Blender",
    features: ["USB充电", "小巧", "易清洗", "强劲动力"], scenes: ["健身", "办公", "旅行"] },
  { id: "baby_carrier_ergonomic", name: "人体工学婴儿背带", nameEn: "Ergonomic Baby Carrier",
    features: ["透气", "腰部支撑", "多档位", "易穿脱"], scenes: ["日常出行", "逛街", "旅游"] },
  { id: "car_phone_mount", name: "磁吸车载手机支架", nameEn: "Magnetic Car Phone Mount",
    features: ["磁吸", "360度旋转", "稳固", "不挡视线"], scenes: ["驾车", "导航"] },
  { id: "reusable_food_wrap", name: "可重复使用保鲜膜", nameEn: "Reusable Food Wrap",
    features: ["环保", "可水洗", "密封性好", "多种尺寸"], scenes: ["厨房", "野餐", "冰箱"] },
  { id: "standing_desk_converter", name: "站立式桌面升降台", nameEn: "Standing Desk Converter",
    features: ["升降", "稳固", "大桌面", "易安装"], scenes: ["办公", "居家办公"] },
  { id: "solar_outdoor_lights", name: "太阳能户外灯", nameEn: "Solar Outdoor Lights",
    features: ["太阳能", "防水", "自动感应", "装饰性强"], scenes: ["庭院", "阳台", "花园"] },
  { id: "pet_camera", name: "宠物摄像头", nameEn: "Pet Camera",
    features: ["双向语音", "夜视", "移动侦测", "零食投放"], scenes: ["居家", "外出监控"] },
  { id: "smart_garden", name: "智能种植机", nameEn: "Smart Garden",
    features: ["自动浇水", "LED补光", "水培", "APP控制"], scenes: ["居家", "厨房", "阳台"] },
  { id: "water_flosser", name: "水牙线", nameEn: "Water Flosser",
    features: ["高压脉冲", "多档位", "便携", "防水"], scenes: ["日常", "旅行", "正畸"] },
  { id: "sleep_eye_mask", name: "3D睡眠眼罩", nameEn: "3D Sleep Eye Mask",
    features: ["遮光", "透气", "不压眼", "可调节"], scenes: ["睡眠", "旅行", "午休"] },
  { id: " Resistance_bands", name: "阻力带套装", nameEn: "Resistance Bands Set",
    features: ["多阻力", "防滑", "便携", "多功能"], scenes: ["健身", "居家", "旅行"] },
  { id: "portable_steam_iron", name: "手持蒸汽熨斗", nameEn: "Portable Steam Iron",
    features: ["快速出汽", "小巧", "杀菌", "多面料适用"], scenes: ["旅行", "居家", "出差"] },
  { id: "bamboo_charcoal_bag", name: "竹炭除味包", nameEn: "Bamboo Charcoal Bag",
    features: ["天然", "可重复使用", "多场景", "无香"], scenes: ["衣柜", "车内", "冰箱", "鞋柜"] },
  { id: "silicone_straw_set", name: "硅胶吸管套装", nameEn: "Silicone Straw Set",
    features: ["环保", "可折叠", "易清洗", "耐高温"], scenes: ["日常", "旅行", "咖啡"] },
  { id: "bedside_lamp", name: "智能床头灯", nameEn: "Smart Bedside Lamp",
    features: ["调光调色", "定时", "触摸", "APP控制"], scenes: ["卧室", "阅读", "起夜"] },
  { id: "yoga_wheel", name: "瑜伽轮", nameEn: "Yoga Wheel",
    features: ["承重强", "防滑", "辅助拉伸", "多用途"], scenes: ["瑜伽", "健身", "康复"] },
];

// ========================================================================
// 辅助函数
// ========================================================================

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals = 2): number {
  const val = Math.random() * (max - min) + min;
  return parseFloat(val.toFixed(decimals));
}

function randomTrend(length = 12): number[] {
  let val = randomInt(20, 80);
  return Array.from({ length }, () => {
    val += randomInt(-15, 20);
    val = Math.max(5, Math.min(100, val));
    return val;
  });
}

function pickOne<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function pickMany<T>(arr: T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function generateASIN(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let asin = "B0";
  for (let i = 0; i < 8; i++) asin += chars[randomInt(0, chars.length - 1)];
  return asin;
}

function formatGrowth(): string {
  const val = randomFloat(-30, 60, 1);
  return (val >= 0 ? "+" : "") + val.toFixed(1) + "%";
}

// ========================================================================
// 1. 生成 Amazon Products (200个)
// ========================================================================
async function seedAmazonProducts() {
  console.log("🛒 生成 Amazon Products...");
  const products: (typeof amazonProducts.$inferInsert)[] = [];

  for (let i = 0; i < 200; i++) {
    const concept = pickOne(CONCEPTS);
    const category = pickOne(CATEGORIES);
    const brand = pickOne(BRANDS);
    const monthlySales = randomInt(50, 50000);
    const price = randomFloat(5, 150, 2);
    const rating = randomFloat(3.2, 4.9, 2);
    const reviewCount = randomInt(5, 5000);

    // 生成VOC aspects
    const vocAspects = pickMany(ASPECTS_POOL, randomInt(3, 8)).map((a) => ({
      aspect: a.aspect,
      sentiment: pickOne(["positive", "negative", "neutral"] as const),
      count: randomInt(10, reviewCount),
      ratio: (randomFloat(1, 20, 1)) + "%",
    }));

    products.push({
      asin: generateASIN(),
      title: faker.commerce.productName() + " — " + concept.nameEn,
      brand,
      category,
      categoryPath: `${category} > ${faker.commerce.productAdjective()} > ${concept.name}`,
      price,
      monthlySales,
      monthlyRevenue: parseFloat((monthlySales * price).toFixed(2)),
      rating,
      reviewCount,
      salesTrend: randomTrend(12),
      priceTrend: randomTrend(8),
      bsrRank: randomInt(1, 50000),
      launchDate: faker.date.between({ from: "2023-01-01", to: "2026-03-01" }),
      fulfillmentType: pickOne(["FBA", "FBM"]),
      images: Array.from({ length: randomInt(1, 5) }, () => faker.image.urlPicsumPhotos({ width: 400, height: 400 })),
      description: faker.commerce.productDescription(),
      bulletPoints: Array.from({ length: randomInt(3, 6) }, () => faker.commerce.productMaterial()),
      tiktokVideoCount: randomInt(0, 500),
      tiktokHeatScore: randomFloat(0, 100, 2),
      vocAspects,
      vocSummary: `This ${concept.nameEn.toLowerCase()} has ${rating >= 4.5 ? "great" : rating >= 4 ? "good" : "mixed"} reviews. Users frequently mention ${vocAspects[0]?.aspect || "quality"} and ${vocAspects[1]?.aspect || "value"}.`,
    });
  }

  // Batch insert
  const chunkSize = 50;
  for (let i = 0; i < products.length; i += chunkSize) {
    await db.insert(amazonProducts).values(products.slice(i, i + chunkSize));
  }
  console.log(`   ✅ ${products.length} 个 Amazon Products 已生成`);
  return products;
}

// ========================================================================
// 2. 生成 Amazon Reviews (2000条)
// ========================================================================
async function seedAmazonReviews(products: typeof amazonProducts.$inferInsert[]) {
  console.log("📝 生成 Amazon Reviews...");
  const reviews: (typeof amazonReviews.$inferInsert)[] = [];

  for (const product of products.slice(0, 100)) { // 前100个商品生成评论
    const reviewCount = Math.min(product.reviewCount || randomInt(5, 50), 50);
    for (let i = 0; i < reviewCount; i++) {
      const rating = randomFloat(1, 5, 1);
      const aspects = pickMany(ASPECTS_POOL, randomInt(1, 4)).map((a) => ({
        aspect: a.aspect,
        sentiment: rating >= 4 ? "positive" : rating <= 2 ? "negative" : "neutral" as const,
      }));

      const isPositive = rating >= 4;
      const isNegative = rating <= 2;
      const isCritical = rating <= 2;

      reviews.push({
        asin: product.asin,
        reviewId: `R${faker.string.alphanumeric(12).toUpperCase()}`,
        reviewerName: faker.person.fullName(),
        rating,
        title: faker.commerce.productDescription().slice(0, 100),
        content: faker.lorem.paragraphs(randomInt(1, 3)),
        helpfulCount: randomInt(0, 200),
        verifiedPurchase: Math.random() > 0.3,
        reviewDate: faker.date.between({ from: "2024-01-01", to: "2026-04-01" }),
        sentiment: isPositive ? "positive" : isNegative ? "negative" : "neutral",
        aspects,
        keywords: aspects.map((a) => a.aspect),
        isPositive,
        isNegative,
        isCritical,
      });
    }
  }

  const chunkSize = 100;
  for (let i = 0; i < reviews.length; i += chunkSize) {
    await db.insert(amazonReviews).values(reviews.slice(i, i + chunkSize));
  }
  console.log(`   ✅ ${reviews.length} 条 Amazon Reviews 已生成`);
}

// ========================================================================
// 3. 生成 TikTok Creators (50个)
// ========================================================================
async function seedTiktokCreators() {
  console.log("👤 生成 TikTok Creators...");
  const creators: (typeof tiktokCreators.$inferInsert)[] = [];

  for (let i = 0; i < 50; i++) {
    const followers = randomInt(1000, 10000000);
    creators.push({
      creatorId: `creator_${faker.string.alphanumeric(10)}`,
      username: faker.internet.userName().toLowerCase().replace(/[^a-z0-9_]/g, ""),
      displayName: faker.person.fullName(),
      bio: faker.lorem.sentence(),
      avatar: faker.image.avatar(),
      followers,
      following: randomInt(100, Math.min(followers, 5000)),
      totalLikes: randomInt(followers * 2, followers * 20),
      videoCount: randomInt(50, 5000),
      productsCount: randomInt(5, 500),
      avgViews: randomInt(1000, Math.min(followers, 500000)),
      monthlySales: randomInt(100, 50000),
      monthlyRevenue: randomFloat(1000, 500000, 2),
      videoGpm: randomFloat(0.5, 50, 2),
      liveGpm: randomFloat(0, 30, 2),
      accountType: pickOne(["个人运营", "店铺运营"]),
      categories: pickMany(CATEGORIES, randomInt(1, 4)),
      fanGrowth: (Math.random() > 0.5 ? "+" : "-") + randomFloat(1, 50, 1) + "%",
    });
  }

  await db.insert(tiktokCreators).values(creators);
  console.log(`   ✅ ${creators.length} 个 TikTok Creators 已生成`);
  return creators;
}

// ========================================================================
// 4. 生成 TikTok Videos (300个)
// ========================================================================
async function seedTiktokVideos(creators: typeof tiktokCreators.$inferInsert[]) {
  console.log("🎬 生成 TikTok Videos...");
  const videos: (typeof tiktokVideos.$inferInsert)[] = [];

  for (let i = 0; i < 300; i++) {
    const creator = pickOne(creators);
    const views = randomInt(1000, 50000000);
    const likes = Math.floor(views * randomFloat(0.01, 0.08, 4));
    const shares = Math.floor(views * randomFloat(0.001, 0.02, 4));
    const comments = Math.floor(views * randomFloat(0.005, 0.03, 4));
    const concept = pickOne(CONCEPTS);

    videos.push({
      videoId: `video_${faker.string.alphanumeric(15)}`,
      creatorId: creator.creatorId,
      creatorName: creator.displayName,
      title: faker.lorem.sentence(randomInt(3, 10)),
      description: faker.lorem.paragraph() + " " + pickMany(TIKTOK_HASHTAGS, randomInt(3, 8)).join(" "),
      hashtags: pickMany(TIKTOK_HASHTAGS, randomInt(3, 8)),
      duration: randomInt(5, 180),
      views,
      likes,
      shares,
      commentsCount: comments,
      engagementRate: parseFloat(((likes + comments + shares) / views * 100).toFixed(2)),
      monthlySales: randomInt(0, Math.floor(views * 0.001)),
      monthlyRevenue: randomFloat(0, views * 0.05, 2),
      productMentioned: [{ name: concept.name, asin: undefined }],
      amazonAsins: [],
      amazonCategoryMatch: pickOne(CATEGORIES),
      postedAt: faker.date.between({ from: "2025-06-01", to: "2026-04-20" }),
    });
  }

  const chunkSize = 50;
  for (let i = 0; i < videos.length; i += chunkSize) {
    await db.insert(tiktokVideos).values(videos.slice(i, i + chunkSize));
  }
  console.log(`   ✅ ${videos.length} 个 TikTok Videos 已生成`);
  return videos;
}

// ========================================================================
// 5. 生成 TikTok Shops (30个)
// ========================================================================
async function seedTiktokShops() {
  console.log("🏪 生成 TikTok Shops...");
  const shops: (typeof tiktokShops.$inferInsert)[] = [];

  for (let i = 0; i < 30; i++) {
    const sales = randomInt(5000, 500000);
    const revenue = sales * randomFloat(5, 50, 2);
    shops.push({
      shopId: `shop_${faker.string.alphanumeric(10)}`,
      name: faker.company.name() + (Math.random() > 0.5 ? " Store" : ""),
      country: pickOne(["美国", "英国", "加拿大", "澳大利亚"]),
      category: pickMany(CATEGORIES, randomInt(1, 3)).join(","),
      logo: faker.image.urlPicsumPhotos({ width: 100, height: 100 }),
      sales,
      salesGrowth: formatGrowth(),
      revenue,
      revenueGrowth: formatGrowth(),
      activeProducts: randomInt(5, 500),
      totalProducts: randomInt(10, 2000),
      newRatio: randomFloat(0, 15, 2) + "%",
      totalSales: randomInt(sales * 10, sales * 100),
      totalRevenue: revenue * randomFloat(10, 100, 2),
      rating: randomFloat(3.5, 4.9, 2),
      influencers: randomInt(10, 5000),
      shopType: pickOne(["本土店", "跨境店"]),
    });
  }

  await db.insert(tiktokShops).values(shops);
  console.log(`   ✅ ${shops.length} 个 TikTok Shops 已生成`);
}

// ========================================================================
// 6. 生成 Keyword Mappings (100个)
// ========================================================================
async function seedKeywordMappings() {
  console.log("🔗 生成 Keyword Mappings...");
  const mappings: (typeof keywordMappings.$inferInsert)[] = [];

  const tiktokWords = [
    "bottle warmer", "pet feeder", "neck massager", "makeup mirror", "blender",
    "baby carrier", "phone mount", "food wrap", "desk converter", "solar lights",
    "pet camera", "smart garden", "water flosser", "eye mask", "resistance bands",
    "steam iron", "charcoal bag", "silicone straw", "bedside lamp", "yoga wheel",
    "air fryer", "vacuum", "massage gun", "camping chair", "yoga mat",
    "sunscreen", "lipstick", "face cream", "hair dryer", "toothbrush",
  ];

  const amazonWords = [
    "baby bottle warmer", "automatic pet feeder", "neck and shoulder massager",
    "led vanity mirror", "portable smoothie blender", "ergonomic baby carrier",
    "car phone holder", "beeswax food wrap", "standing desk riser",
    "solar garden lights", "dog camera", "indoor herb garden", "water pick flosser",
    "sleep eye mask", "exercise resistance bands", "travel steam iron",
    "bamboo charcoal air purifier", "reusable silicone straws",
    "smart table lamp", "back wheel for yoga", "air fryer oven",
    "robot vacuum", "percussion massager", "folding camp chair",
    "thick yoga mat", "spf 50 sunscreen", "matte lipstick", "anti aging cream",
    "ionic hair dryer", "electric toothbrush",
  ];

  for (let i = 0; i < 100; i++) {
    const tk = pickOne(tiktokWords);
    const amz = pickOne(amazonWords);
    mappings.push({
      tiktokKeyword: tk,
      amazonKeyword: amz,
      similarityScore: randomFloat(0.65, 0.98, 3),
      mappingType: pickOne(["auto", "manual", "confirmed"]),
      frequency: randomInt(1, 50),
    });
  }

  // Deduplicate
  const seen = new Set<string>();
  const unique = mappings.filter((m) => {
    const key = `${m.tiktokKeyword}::${m.amazonKeyword}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  await db.insert(keywordMappings).values(unique);
  console.log(`   ✅ ${unique.length} 个 Keyword Mappings 已生成`);
}

// ========================================================================
// 7. 生成 Product Concepts (20个)
// ========================================================================
async function seedProductConcepts() {
  console.log("💡 生成 Product Concepts...");
  const concepts: (typeof productConcepts.$inferInsert)[] = [];

  for (const c of CONCEPTS) {
    concepts.push({
      conceptId: c.id,
      name: c.name,
      nameEn: c.nameEn,
      description: `A popular ${c.nameEn.toLowerCase()} that is trending on social media. ${faker.lorem.sentence()}`,
      tiktokKeywords: c.features.map((f) => `${f} ${c.nameEn.toLowerCase()}`),
      tiktokHashtags: pickMany(TIKTOK_HASHTAGS, randomInt(3, 6)),
      amazonKeywords: [c.nameEn.toLowerCase(), ...c.features.map((f) => `${f} ${c.nameEn.toLowerCase()}`)],
      amazonCategories: pickMany(CATEGORIES, randomInt(1, 3)),
      keyFeatures: c.features,
      usageScenes: c.scenes,
      confidence: randomFloat(0.7, 0.98, 3),
      mappedAsins: Array.from({ length: randomInt(3, 15) }, () => generateASIN()),
      mappedVideos: Array.from({ length: randomInt(5, 30) }, () => `video_${faker.string.alphanumeric(15)}`),
      status: "active",
    });
  }

  await db.insert(productConcepts).values(concepts);
  console.log(`   ✅ ${concepts.length} 个 Product Concepts 已生成`);
  return concepts;
}

// ========================================================================
// 8. 生成 Concept Metrics (20概念 × 30天 = 600条)
// ========================================================================
async function seedConceptMetrics(concepts: typeof productConcepts.$inferInsert[]) {
  console.log("📊 生成 Concept Metrics...");
  const metrics: (typeof conceptMetrics.$inferInsert)[] = [];

  const startDate = new Date("2026-03-01");
  for (const concept of concepts) {
    let shiBase = randomFloat(20, 80, 2);
    let cviBase = randomFloat(10, 70, 2);

    for (let d = 0; d < 30; d++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + d);

      // 模拟趋势
      shiBase += randomFloat(-5, 8, 2);
      cviBase += randomFloat(-3, 5, 2);
      shiBase = Math.max(5, Math.min(100, shiBase));
      cviBase = Math.max(5, Math.min(100, cviBase));

      const saturation = Math.min(1, cviBase / 80);
      const opportunity = shiBase * (1 - saturation) * randomFloat(0.8, 1.5, 2);
      const momentum = randomFloat(0.5, 2, 2);
      const vocGap = randomFloat(10, 80, 2);

      metrics.push({
        conceptId: concept.conceptId,
        metricDate: date,
        tiktokVideoCount: randomInt(10, 500),
        tiktokTotalViews: randomInt(10000, 50000000),
        tiktokTotalLikes: randomInt(1000, 5000000),
        tiktokEngagementRate: randomFloat(1, 8, 2),
        tiktokInfluencerCount: randomInt(5, 200),
        tiktokHashtagGrowth: randomFloat(-10, 50, 2),
        amazonProductCount: randomInt(10, 200),
        amazonTotalSales: randomInt(1000, 500000),
        amazonAvgRating: randomFloat(3.5, 4.8, 2),
        amazonReviewGrowth: randomFloat(-5, 30, 2),
        amazonSellerCount: randomInt(5, 100),
        amazonNewProductRatio: randomFloat(0, 20, 2),
        shiScore: parseFloat(shiBase.toFixed(2)),
        cviScore: parseFloat(cviBase.toFixed(2)),
        opportunityScore: parseFloat(Math.min(100, opportunity).toFixed(2)),
        trendMomentum: momentum,
        vocGapScore: vocGap,
      });
    }
  }

  const chunkSize = 100;
  for (let i = 0; i < metrics.length; i += chunkSize) {
    await db.insert(conceptMetrics).values(metrics.slice(i, i + chunkSize));
  }
  console.log(`   ✅ ${metrics.length} 条 Concept Metrics 已生成`);
}

// ========================================================================
// 9. 生成 User Favorites (20条)
// ========================================================================
async function seedUserFavorites(products: typeof amazonProducts.$inferInsert[]) {
  console.log("⭐ 生成 User Favorites...");
  const favorites: (typeof userFavorites.$inferInsert)[] = [];

  const userId = "user_demo_001";
  const types = ["amazon_product", "tiktok_video", "concept"] as const;

  for (let i = 0; i < 20; i++) {
    const type = pickOne(types);
    let itemId: string;
    if (type === "amazon_product") {
      itemId = pickOne(products).asin;
    } else if (type === "tiktok_video") {
      itemId = `video_${faker.string.alphanumeric(15)}`;
    } else {
      itemId = pickOne(CONCEPTS).id;
    }

    favorites.push({
      userId,
      itemType: type,
      itemId,
      notes: Math.random() > 0.5 ? faker.lorem.sentence() : undefined,
    });
  }

  await db.insert(userFavorites).values(favorites);
  console.log(`   ✅ ${favorites.length} 条 User Favorites 已生成`);
}

// ========================================================================
// 10. 生成 Fusion Reports (5条)
// ========================================================================
async function seedFusionReports(concepts: typeof productConcepts.$inferInsert[]) {
  console.log("📋 生成 Fusion Reports...");
  const reports: (typeof fusionReports.$inferInsert)[] = [];

  for (let i = 0; i < 5; i++) {
    const concept = pickOne(concepts);
    const status = pickOne(["completed", "completed", "completed", "generating"] as const);

    reports.push({
      reportId: `report_${faker.string.alphanumeric(12)}`,
      userId: "user_demo_001",
      title: `${concept.name} 融合选品分析报告`,
      queryKeyword: concept.nameEn,
      conceptId: concept.conceptId,
      reportData: {
        marketOverview: {
          totalProducts: randomInt(50, 200),
          avgRating: randomFloat(3.8, 4.7, 2),
          avgPrice: randomFloat(15, 80, 2),
          totalReviews: randomInt(1000, 50000),
        },
        painPoints: pickMany(ASPECTS_POOL, 5).map((a) => ({
          aspect: a.aspect,
          negativeCount: randomInt(50, 500),
          mentionRate: randomFloat(5, 25, 1) + "%",
        })),
        opportunities: [
          "社媒讨论热度持续上升，电商供给尚未跟上",
          "现有商品痛点集中在" + pickOne(ASPECTS_POOL).aspect,
          "价格带存在空白区间",
        ],
        tiktokInsights: {
          totalVideos: randomInt(100, 1000),
          totalViews: randomInt(1000000, 50000000),
          topHashtags: pickMany(TIKTOK_HASHTAGS, 5),
        },
        amazonInsights: {
          topBrands: pickMany(BRANDS, 5),
          priceDistribution: [
            { range: "$0-20", count: randomInt(10, 50) },
            { range: "$20-50", count: randomInt(20, 80) },
            { range: "$50+", count: randomInt(5, 30) },
          ],
        },
      },
      status,
      completedAt: status === "completed" ? new Date() : undefined,
    });
  }

  await db.insert(fusionReports).values(reports);
  console.log(`   ✅ ${reports.length} 条 Fusion Reports 已生成`);
}

// ========================================================================
// 主执行流程
// ========================================================================
async function main() {
  console.log("🚀 开始生成虚拟数据...\n");
  const startTime = Date.now();

  try {
    // 按依赖顺序生成
    const products = await seedAmazonProducts();
    await seedAmazonReviews(products);
    const creators = await seedTiktokCreators();
    await seedTiktokVideos(creators);
    await seedTiktokShops();
    await seedKeywordMappings();
    const concepts = await seedProductConcepts();
    await seedConceptMetrics(concepts);
    await seedUserFavorites(products);
    await seedFusionReports(concepts);

    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✨ 虚拟数据生成完成！耗时 ${elapsed}s`);
    console.log("\n📦 数据汇总:");
    console.log("   • Amazon Products: 200");
    console.log("   • Amazon Reviews: ~2000");
    console.log("   • TikTok Creators: 50");
    console.log("   • TikTok Videos: 300");
    console.log("   • TikTok Shops: 30");
    console.log("   • Keyword Mappings: ~100");
    console.log("   • Product Concepts: 20");
    console.log("   • Concept Metrics: 600 (20概念×30天)");
    console.log("   • User Favorites: 20");
    console.log("   • Fusion Reports: 5");
  } catch (error) {
    console.error("❌ 生成失败:", error);
    process.exit(1);
  }
}

main();
