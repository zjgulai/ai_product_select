import { getDb } from "../api/queries/connection";
import { dataTemplates } from "./schema";

// All data templates for the frontend pages
// These define what data keys users can upload Excel data for
const TEMPLATES = [
  // === TikTok Home Page ===
  {
    dataKey: "tiktok_home_products_hot",
    name: "TikTok首页-商品热销榜",
    description: "TikTok首页商品热销排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "name", label: "商品名称", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "销量", type: "string" as const }, { key: "image", label: "图片URL", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_products_soaring",
    name: "TikTok首页-商品飙升榜",
    description: "TikTok首页商品飙升排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "name", label: "商品名称", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "增长率", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_products_new",
    name: "TikTok首页-商品新品榜",
    description: "TikTok首页新品销售榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "name", label: "商品名称", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "销量", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_influencers_sales",
    name: "TikTok首页-达人带货榜",
    description: "TikTok首页达人带货排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "username", label: "达人名称", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "带货额", type: "string" as const }, { key: "avatar", label: "头像URL", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_influencers_fans",
    name: "TikTok首页-达人涨粉榜",
    description: "TikTok首页达人涨粉排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "username", label: "达人名称", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "粉丝数", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_shops_hot",
    name: "TikTok首页-小店热销榜",
    description: "TikTok首页小店热销排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "name", label: "店铺名称", type: "string" as const }, { key: "country", label: "国家", type: "string" as const }, { key: "sales", label: "销量", type: "string" as const }, { key: "logo", label: "Logo URL", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_videos_hot",
    name: "TikTok首页-视频热播榜",
    description: "TikTok首页视频播放排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "title", label: "视频标题", type: "string" as const }, { key: "duration", label: "时长", type: "string" as const }, { key: "date", label: "日期", type: "string" as const }, { key: "views", label: "播放量", type: "string" as const }],
  },
  {
    dataKey: "tiktok_home_lives_popular",
    name: "TikTok首页-直播人气榜",
    description: "TikTok首页直播人气排行榜",
    page: "tiktok", module: "home",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "title", label: "直播标题", type: "string" as const }, { key: "viewers", label: "观看人次", type: "string" as const }, { key: "newFans", label: "涨粉数", type: "string" as const }],
  },

  // === TikTok Analysis Page ===
  {
    dataKey: "tiktok_analysis_kpi",
    name: "大盘分析-KPI指标",
    description: "大盘数据KPI指标卡片",
    page: "tiktok", module: "analysis",
    columns: [{ key: "title", label: "指标名称", type: "string" as const }, { key: "value", label: "数值", type: "string" as const }, { key: "trend", label: "涨跌幅", type: "string" as const }, { key: "up", label: "是否上涨", type: "boolean" as const }],
  },
  {
    dataKey: "tiktok_analysis_heatmap",
    name: "大盘分析-品类热力图",
    description: "品类×月份销售热力指数",
    page: "tiktok", module: "analysis",
    columns: [{ key: "category", label: "品类", type: "string" as const }, { key: "month", label: "月份", type: "string" as const }, { key: "value", label: "热度指数", type: "number" as const }],
  },
  {
    dataKey: "tiktok_analysis_gmv_trend",
    name: "大盘分析-月度GMV趋势",
    description: "月度GMV金额趋势",
    page: "tiktok", module: "analysis",
    columns: [{ key: "month", label: "月份", type: "string" as const }, { key: "gmv", label: "GMV(亿美元)", type: "number" as const }],
  },
  {
    dataKey: "tiktok_analysis_category_share",
    name: "大盘分析-品类市场份额",
    description: "各品类市场份额占比",
    page: "tiktok", module: "analysis",
    columns: [{ key: "name", label: "品类", type: "string" as const }, { key: "value", label: "份额(%)", type: "number" as const }, { key: "gmv", label: "GMV", type: "string" as const }],
  },
  {
    dataKey: "tiktok_analysis_price_distribution",
    name: "大盘分析-价格分布",
    description: "商品价格带分布数据",
    page: "tiktok", module: "analysis",
    columns: [{ key: "range", label: "价格区间", type: "string" as const }, { key: "productCount", label: "商品数", type: "number" as const }, { key: "salesVolume", label: "销量", type: "number" as const }],
  },

  // === TikTok Products Page ===
  {
    dataKey: "tiktok_products_list",
    name: "商品列表-商品数据",
    description: "商品详细列表数据",
    page: "tiktok", module: "products",
    columns: [{ key: "name", label: "商品名称", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "销量", type: "number" as const }, { key: "salesGrowth", label: "销量增长", type: "string" as const }, { key: "revenue", label: "销售额", type: "number" as const }, { key: "price", label: "价格", type: "number" as const }, { key: "rating", label: "评分", type: "number" as const }, { key: "shop", label: "店铺", type: "string" as const }, { key: "date", label: "上架日期", type: "string" as const }],
  },

  // === TikTok Influencer Page ===
  {
    dataKey: "tiktok_influencer_list",
    name: "达人列表-达人数据",
    description: "达人详细列表数据",
    page: "tiktok", module: "influencer",
    columns: [{ key: "username", label: "达人账号", type: "string" as const }, { key: "desc", label: "简介", type: "string" as const }, { key: "products", label: "带货数", type: "number" as const }, { key: "avgViews", label: "均播量", type: "number" as const }, { key: "followers", label: "粉丝数", type: "number" as const }, { key: "fanGrowth", label: "涨粉", type: "string" as const }, { key: "monthlySales", label: "月销量", type: "number" as const }, { key: "monthlyRevenue", label: "月销售额", type: "number" as const }, { key: "videoGPM", label: "视频GPM", type: "number" as const }, { key: "type", label: "账号类型", type: "string" as const }],
  },

  // === TikTok Shop Page ===
  {
    dataKey: "tiktok_shop_list",
    name: "小店列表-店铺数据",
    description: "小店详细列表数据",
    page: "tiktok", module: "shop",
    columns: [{ key: "name", label: "店铺名称", type: "string" as const }, { key: "country", label: "国家", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "sales", label: "销量", type: "number" as const }, { key: "salesGrowth", label: "销量增长", type: "string" as const }, { key: "revenue", label: "销售额", type: "number" as const }, { key: "activeProducts", label: "活跃商品", type: "number" as const }, { key: "rating", label: "评分", type: "number" as const }, { key: "influencers", label: "合作达人", type: "number" as const }],
  },

  // === TikTok Video Page ===
  {
    dataKey: "tiktok_video_list",
    name: "视频列表-视频数据",
    description: "视频详细列表数据",
    page: "tiktok", module: "video",
    columns: [{ key: "title", label: "标题", type: "string" as const }, { key: "duration", label: "时长", type: "string" as const }, { key: "date", label: "日期", type: "string" as const }, { key: "monthlySales", label: "月销量", type: "number" as const }, { key: "views", label: "播放量", type: "number" as const }, { key: "likes", label: "点赞", type: "number" as const }, { key: "engagement", label: "互动率", type: "string" as const }, { key: "creator", label: "创作者", type: "string" as const }],
  },

  // === TikTok Live Page ===
  {
    dataKey: "tiktok_live_list",
    name: "直播列表-直播数据",
    description: "直播详细列表数据",
    page: "tiktok", module: "live",
    columns: [{ key: "title", label: "标题", type: "string" as const }, { key: "startTime", label: "开始时间", type: "string" as const }, { key: "duration", label: "时长", type: "string" as const }, { key: "viewers", label: "观看人次", type: "number" as const }, { key: "peakOnline", label: "峰值在线", type: "number" as const }, { key: "likes", label: "点赞", type: "number" as const }, { key: "newFans", label: "涨粉", type: "number" as const }, { key: "creator", label: "创作者", type: "string" as const }],
  },

  // === Amazon Keyword Page ===
  {
    dataKey: "amazon_keyword_results",
    name: "Amazon-关键词搜索结果",
    description: "Amazon关键词搜索分析数据",
    page: "amazon", module: "keyword",
    columns: [{ key: "rank", label: "排名", type: "string" as const }, { key: "keyword", label: "关键词", type: "string" as const }, { key: "monthlySales", label: "月销量", type: "number" as const }, { key: "salesGrowth", label: "销量增长", type: "string" as const }, { key: "monthlyRevenue", label: "月收入", type: "number" as const }, { key: "avgPrice", label: "均价", type: "number" as const }, { key: "avgRating", label: "评分", type: "number" as const }],
  },

  // === Amazon List Page ===
  {
    dataKey: "amazon_list_products",
    name: "Amazon-榜单商品",
    description: "Amazon榜单商品数据",
    page: "amazon", module: "list",
    columns: [{ key: "rank", label: "排名", type: "number" as const }, { key: "name", label: "商品名称", type: "string" as const }, { key: "monthlySales", label: "月销量", type: "number" as const }, { key: "monthlyRevenue", label: "月收入", type: "number" as const }, { key: "price", label: "价格", type: "number" as const }, { key: "asin", label: "ASIN", type: "string" as const }, { key: "category", label: "品类", type: "string" as const }, { key: "brand", label: "品牌", type: "string" as const }],
  },

  // === Report Analysis Page ===
  {
    dataKey: "report_kpi",
    name: "报告分析-KPI指标",
    description: "产品分析报告KPI指标",
    page: "report", module: "analysis",
    columns: [{ key: "label", label: "指标", type: "string" as const }, { key: "value", label: "数值", type: "string" as const }],
  },
  {
    dataKey: "report_keywords",
    name: "报告分析-关键词数据",
    description: "产品分析关键词数据",
    page: "report", module: "analysis",
    columns: [{ key: "keyword", label: "关键词", type: "string" as const }, { key: "rank", label: "排名", type: "string" as const }, { key: "ctr", label: "CTR", type: "string" as const }],
  },
  {
    dataKey: "report_review_aspects",
    name: "报告分析-评论维度",
    description: "评论维度分析数据",
    page: "report", module: "analysis",
    columns: [{ key: "aspect", label: "维度", type: "string" as const }, { key: "ratio", label: "占比", type: "string" as const }, { key: "count", label: "数量", type: "number" as const }],
  },
];

async function seed() {
  const db = getDb();

  // Clear existing templates
  await db.delete(dataTemplates);

  // Insert all templates
  for (const tmpl of TEMPLATES) {
    await db.insert(dataTemplates).values(tmpl);
  }

  console.log(`Seeded ${TEMPLATES.length} data templates`);
}

seed().catch(console.error);
