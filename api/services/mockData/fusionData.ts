// ========================================================================
// Fusion 融合数据服务层
// ========================================================================

import { faker } from "@/lib/mock-faker";

function randInt(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }
function randFloat(min: number, max: number, d = 2) { return parseFloat((Math.random() * (max - min) + min).toFixed(d)); }
function pick<T>(arr: T[]): T { return arr[randInt(0, arr.length - 1)]; }
function pickMany<T>(arr: T[], n: number): T[] { return [...arr].sort(() => Math.random() - 0.5).slice(0, n); }

// ========================================================================
// 1. Product Concepts (20个)
// ========================================================================
let _concepts: ProductConcept[] | null = null;

export interface ProductConcept {
  id: number;
  conceptId: string;
  name: string;
  nameEn: string | null;
  description: string | null;
  tiktokKeywords: string[] | null;
  tiktokHashtags: string[] | null;
  amazonKeywords: string[] | null;
  amazonCategories: string[] | null;
  keyFeatures: string[] | null;
  usageScenes: string[] | null;
  confidence: string | null;
  mappedAsins: string[] | null;
  mappedVideos: string[] | null;
  status: string | null;
  createdAt: Date | null;
}

const CONCEPT_SEED = [
  { id: "portable_bottle_warmer", name: "便携温奶器", nameEn: "Portable Bottle Warmer", features: ["USB充电", "便携", "快速加热", "恒温"], scenes: ["旅行", "户外", "车载"] },
  { id: "smart_pet_feeder", name: "智能宠物喂食器", nameEn: "Smart Pet Feeder", features: ["定时投喂", "远程控制", "摄像头", "大容量"], scenes: ["日常", "出差", "旅行"] },
  { id: "wireless_neck_massager", name: "无线颈部按摩器", nameEn: "Wireless Neck Massager", features: ["加热", "多模式", "静音", "便携"], scenes: ["办公", "居家", "车载"] },
  { id: "led_makeup_mirror", name: "LED化妆镜", nameEn: "LED Makeup Mirror", features: ["可调光", "放大", "便携", "USB充电"], scenes: ["化妆", "旅行", "日常"] },
  { id: "portable_blender", name: "便携榨汁杯", nameEn: "Portable Blender", features: ["USB充电", "小巧", "易清洗", "强劲动力"], scenes: ["健身", "办公", "旅行"] },
  { id: "baby_carrier_ergonomic", name: "人体工学婴儿背带", nameEn: "Ergonomic Baby Carrier", features: ["透气", "腰部支撑", "多档位", "易穿脱"], scenes: ["日常出行", "逛街", "旅游"] },
  { id: "car_phone_mount", name: "磁吸车载手机支架", nameEn: "Magnetic Car Phone Mount", features: ["磁吸", "360度旋转", "稳固", "不挡视线"], scenes: ["驾车", "导航"] },
  { id: "reusable_food_wrap", name: "可重复使用保鲜膜", nameEn: "Reusable Food Wrap", features: ["环保", "可水洗", "密封性好", "多种尺寸"], scenes: ["厨房", "野餐", "冰箱"] },
  { id: "standing_desk_converter", name: "站立式桌面升降台", nameEn: "Standing Desk Converter", features: ["升降", "稳固", "大桌面", "易安装"], scenes: ["办公", "居家办公"] },
  { id: "solar_outdoor_lights", name: "太阳能户外灯", nameEn: "Solar Outdoor Lights", features: ["太阳能", "防水", "自动感应", "装饰性强"], scenes: ["庭院", "阳台", "花园"] },
  { id: "pet_camera", name: "宠物摄像头", nameEn: "Pet Camera", features: ["双向语音", "夜视", "移动侦测", "零食投放"], scenes: ["居家", "外出监控"] },
  { id: "smart_garden", name: "智能种植机", nameEn: "Smart Garden", features: ["自动浇水", "LED补光", "水培", "APP控制"], scenes: ["居家", "厨房", "阳台"] },
  { id: "water_flosser", name: "水牙线", nameEn: "Water Flosser", features: ["高压脉冲", "多档位", "便携", "防水"], scenes: ["日常", "旅行", "正畸"] },
  { id: "sleep_eye_mask", name: "3D睡眠眼罩", nameEn: "3D Sleep Eye Mask", features: ["遮光", "透气", "不压眼", "可调节"], scenes: ["睡眠", "旅行", "午休"] },
  { id: "resistance_bands", name: "阻力带套装", nameEn: "Resistance Bands Set", features: ["多阻力", "防滑", "便携", "多功能"], scenes: ["健身", "居家", "旅行"] },
  { id: "portable_steam_iron", name: "手持蒸汽熨斗", nameEn: "Portable Steam Iron", features: ["快速出汽", "小巧", "杀菌", "多面料适用"], scenes: ["旅行", "居家", "出差"] },
  { id: "bamboo_charcoal_bag", name: "竹炭除味包", nameEn: "Bamboo Charcoal Bag", features: ["天然", "可重复使用", "多场景", "无香"], scenes: ["衣柜", "车内", "冰箱", "鞋柜"] },
  { id: "silicone_straw_set", name: "硅胶吸管套装", nameEn: "Silicone Straw Set", features: ["环保", "可折叠", "易清洗", "耐高温"], scenes: ["日常", "旅行", "咖啡"] },
  { id: "bedside_lamp", name: "智能床头灯", nameEn: "Smart Bedside Lamp", features: ["调光调色", "定时", "触摸", "APP控制"], scenes: ["卧室", "阅读", "起夜"] },
  { id: "yoga_wheel", name: "瑜伽轮", nameEn: "Yoga Wheel", features: ["承重强", "防滑", "辅助拉伸", "多用途"], scenes: ["瑜伽", "健身", "康复"] },
];

export function getProductConcepts(): ProductConcept[] {
  if (_concepts) return _concepts;
  const HASHTAGS = ["#amazonfinds", "#tiktokmademebuyit", "#musthave", "#fyp", "#viral", "#trending"];
  const concepts: ProductConcept[] = CONCEPT_SEED.map((c, i) => ({
    id: i + 1,
    conceptId: c.id,
    name: c.name,
    nameEn: c.nameEn,
    description: `A popular ${c.nameEn.toLowerCase()} that is trending on social media. ${faker.lorem.sentence()}`,
    tiktokKeywords: c.features.map(f => `${f} ${c.nameEn.toLowerCase()}`),
    tiktokHashtags: pickMany(HASHTAGS, randInt(3, 6)),
    amazonKeywords: [c.nameEn.toLowerCase(), ...c.features.map(f => `${f} ${c.nameEn.toLowerCase()}`)],
    amazonCategories: pickMany(["美妆个护", "健康保健", "家居日用", "母婴用品", "运动户外", "厨房用品", "家电", "宠物用品"], randInt(1, 3)),
    keyFeatures: c.features,
    usageScenes: c.scenes,
    confidence: randFloat(0.7, 0.98, 3).toFixed(3),
    mappedAsins: Array.from({ length: randInt(3, 15) }, () => `B0${faker.string.alphanumeric(8).toUpperCase()}`),
    mappedVideos: Array.from({ length: randInt(5, 30) }, () => `video_${faker.string.alphanumeric(15)}`),
    status: "active",
    createdAt: new Date(),
  }));
  _concepts = concepts;
  return concepts;
}

// ========================================================================
// 2. Concept Metrics (每日指标)
// ========================================================================
let _metrics: ConceptMetric[] | null = null;

export interface ConceptMetric {
  id: number;
  conceptId: string;
  conceptName: string;
  metricDate: string;
  tiktokVideoCount: number | null;
  tiktokTotalViews: number | null;
  tiktokTotalLikes: number | null;
  tiktokEngagementRate: string | null;
  tiktokInfluencerCount: number | null;
  tiktokHashtagGrowth: string | null;
  amazonProductCount: number | null;
  amazonTotalSales: number | null;
  amazonAvgRating: string | null;
  amazonSellerCount: number | null;
  amazonRevenueEstimate: string | null;
  shiScore: string | null;
  cviScore: string | null;
  opportunityScore: string | null;
  trendMomentum: string | null;
  vocGapScore: string | null;
  createdAt: Date | null;
}

export function getConceptMetrics(conceptId?: string): ConceptMetric[] {
  if (_metrics) return conceptId ? _metrics.filter(m => m.conceptId === conceptId) : _metrics;
  const concepts = getProductConcepts();
  const metrics: ConceptMetric[] = [];

  for (const concept of concepts) {
    let shi = randFloat(20, 85, 2);
    let cvi = randFloat(10, 70, 2);
    for (let d = 0; d < 30; d++) {
      const date = new Date("2026-03-01");
      date.setDate(date.getDate() + d);
      shi += randFloat(-5, 8, 2);
      cvi += randFloat(-3, 5, 2);
      shi = Math.max(5, Math.min(100, shi));
      cvi = Math.max(5, Math.min(100, cvi));
      const sat = Math.min(1, cvi / 80);
      const opp = shi * (1 - sat) * randFloat(0.8, 1.5, 2);
      metrics.push({
        id: metrics.length + 1,
        conceptId: concept.conceptId,
        conceptName: concept.name,
        metricDate: date.toISOString().split("T")[0],
        tiktokVideoCount: randInt(10, 500),
        tiktokTotalViews: randInt(10000, 50000000),
        tiktokTotalLikes: randInt(5000, 10000000),
        tiktokEngagementRate: randFloat(1, 8, 2).toFixed(2),
        tiktokInfluencerCount: randInt(10, 5000),
        tiktokHashtagGrowth: randFloat(-10, 50, 1).toFixed(1) + "%",
        amazonProductCount: randInt(10, 200),
        amazonTotalSales: randInt(1000, 500000),
        amazonAvgRating: randFloat(3.5, 4.8, 2).toFixed(2),
        amazonSellerCount: randInt(5, 100),
        amazonRevenueEstimate: (randInt(1000, 500000) * randFloat(10, 80, 2)).toFixed(2),
        shiScore: parseFloat(shi.toFixed(2)).toFixed(2),
        cviScore: parseFloat(cvi.toFixed(2)).toFixed(2),
        opportunityScore: parseFloat(Math.min(100, opp).toFixed(2)).toFixed(2),
        trendMomentum: randFloat(0.5, 2, 2).toFixed(2),
        vocGapScore: randFloat(10, 80, 2).toFixed(2),
        createdAt: new Date(),
      });
    }
  }
  _metrics = metrics;
  return conceptId ? metrics.filter(m => m.conceptId === conceptId) : metrics;
}

// 获取最新的每日指标（用于排行榜）
export function getLatestMetrics(): ConceptMetric[] {
  const all = getConceptMetrics();
  const latestDate = all.reduce((max, m) => m.metricDate > max ? m.metricDate : max, all[0]?.metricDate || "");
  return all.filter(m => m.metricDate === latestDate).sort((a, b) => parseFloat(b.opportunityScore ?? '0') - parseFloat(a.opportunityScore ?? '0'));
}

// ========================================================================
// 3. Keyword Mappings (100个)
// ========================================================================
let _mappings: KeywordMapping[] | null = null;

export interface KeywordMapping {
  id: number;
  tiktokKeyword: string;
  amazonKeyword: string;
  similarityScore: string | null;
  mappingType: "auto" | "manual" | "confirmed" | null;
  frequency: number | null;
  createdAt: Date | null;
}

export function getKeywordMappings(): KeywordMapping[] {
  if (_mappings) return _mappings;
  const tk = ["bottle warmer", "pet feeder", "neck massager", "makeup mirror", "blender", "baby carrier", "phone mount", "food wrap", "desk converter", "solar lights"];
  const amz = ["baby bottle warmer", "automatic pet feeder", "neck and shoulder massager", "led vanity mirror", "portable smoothie blender", "ergonomic baby carrier", "car phone holder", "beeswax food wrap", "standing desk riser", "solar garden lights"];
  const maps: KeywordMapping[] = [];
  for (let i = 0; i < 100; i++) {
    const t = pick(tk);
    const a = pick(amz);
    if (!maps.find(m => m.tiktokKeyword === t && m.amazonKeyword === a)) {
      maps.push({ id: i + 1, tiktokKeyword: t, amazonKeyword: a, similarityScore: randFloat(0.65, 0.98, 3).toFixed(3), mappingType: pick(["auto", "manual", "confirmed"] as const), frequency: randInt(1, 50), createdAt: new Date() });
    }
  }
  _mappings = maps;
  return maps;
}

// ========================================================================
// 4. Fusion Reports (5个)
// ========================================================================
let _reports: FusionReport[] | null = null;

export interface FusionReport {
  id: number;
  reportId: string;
  userId: string | null;
  title: string | null;
  queryKeyword: string | null;
  conceptId: string | null;
  conceptName: string;
  reportData: Record<string, unknown> | null;
  status: "generating" | "completed" | "failed" | null;
  pdfUrl: string | null;
  createdAt: Date | null;
  completedAt: Date | null;
}

export function getFusionReports(): FusionReport[] {
  if (_reports) return _reports;
  const concepts = getProductConcepts();
  const reports: FusionReport[] = [];
  for (let i = 0; i < 5; i++) {
    const c = pick(concepts);
    reports.push({
      id: i + 1,
      reportId: `report_${faker.string.alphanumeric(12)}`,
      userId: null,
      title: `${c.name} 融合选品分析报告`,
      queryKeyword: c.nameEn,
      conceptId: c.conceptId,
      conceptName: c.name,
      status: pick(["completed", "completed", "completed", "generating"] as const),
      pdfUrl: null,
      createdAt: faker.date.between({ from: "2026-04-01", to: "2026-04-20" }),
      completedAt: new Date(),
      reportData: {
        marketOverview: { totalProducts: randInt(50, 200), avgRating: randFloat(3.8, 4.7, 2), avgPrice: randFloat(15, 80, 2), totalReviews: randInt(1000, 50000) },
        painPoints: pickMany(["便携", "易用", "味道好", "快速", "温度准确", "设计", "物有所值", "材质", "容量", "外观"], 5).map(a => ({ aspect: a, negativeCount: randInt(50, 500), mentionRate: randFloat(5, 25, 1) + "%" })),
        opportunities: ["社媒讨论热度持续上升，电商供给尚未跟上", "现有商品痛点集中在便携性和容量", "价格带存在空白区间"],
        tiktokInsights: { totalVideos: randInt(100, 1000), totalViews: randInt(1000000, 50000000), topHashtags: pickMany(["#amazonfinds", "#tiktokmademebuyit", "#musthave", "#fyp", "#viral"], 5) },
        amazonInsights: { topBrands: pickMany(["momcozy", "Toplux", "medicube", "Ninja", "COSORI", "Philips", "Dyson", "Anker"], 5), priceDistribution: [{ range: "$0-20", count: randInt(10, 50) }, { range: "$20-50", count: randInt(20, 80) }, { range: "$50+", count: randInt(5, 30) }] },
      },
    });
  }
  _reports = reports;
  return reports;
}
