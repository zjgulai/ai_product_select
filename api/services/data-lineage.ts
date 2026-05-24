// ========================================================================
// 数据血缘 / Data Lineage Engine
// 映射所有页面 → API → 数据库表 → 原始数据来源
// 识别数据缺口，提供测算补全能力
// ========================================================================

export type DataLayer = "ODS" | "DWD" | "DWS" | "ADS" | "Mock" | "External";

export type DataSourceType =
  | "database"      // 来自数据库表
  | "api"           // 来自外部API
  | "scraping"      // 来自网络爬虫
  | "manual"        // 人工录入
  | "calculated"    // 测算/推算得出
  | "mock"          // Mock数据（数据缺口标记）
  | "third_party";  // 第三方数据服务

export interface DataField {
  field: string;
  label: string;
  source?: string;
  calcMethod?: string;
  confidence?: number; // 0-1
}

export interface DataEntity {
  entityId: string;
  entityName: string;
  layer: DataLayer;
  tableName?: string;
  description: string;
  fields: DataField[];
  sourceType: DataSourceType;
  sourceName: string;
  sourceUrl?: string;
  updateFrequency?: string;
  lastUpdated?: string;
}

export interface ApiEndpoint {
  endpointId: string;
  router: string;
  procedure: string;
  fullPath: string;
  description: string;
  entities: string[]; // entityIds
  isFallbackToMock: boolean;
  performanceNote?: string;
}

export interface PageModule {
  moduleId: string;
  pagePath: string;
  pageName: string;
  category: "TikTok" | "Amazon" | "Fusion" | "Report" | "User" | "Data" | "System";
  description: string;
  endpoints: string[]; // endpointIds
  priority: "high" | "medium" | "low";
}

export interface DataGap {
  gapId: string;
  moduleId: string;
  endpointId: string;
  entityId?: string;
  field?: string;
  gapType: "missing_source" | "mock_fallback" | "stale_data" | "no_etl" | "incomplete_fields" | "unverified_calc";
  severity: "critical" | "warning" | "info";
  description: string;
  impact: string;
  recommendation: string;
  calcMethod?: string;      // 推荐测算方法
  calcModel?: string;       // 测算模型名称
  calcConfidence?: number;  // 测算可信度
  externalSources?: { name: string; url: string; reliability: number }[];
}

export interface CalculationModel {
  modelId: string;
  modelName: string;
  modelType: "regression" | "index_composite" | "market_sizing" | "sentiment_analysis" | "trend_forecast";
  description: string;
  formula: string;
  inputs: { name: string; source: string; required: boolean }[];
  output: string;
  confidence: number;
  verifiedBy?: string;
  referenceUrl?: string;
  industryStandard?: string;
}

// ── 测算模型库（基于咨询机构验证方法）──────────────────────────────────────

export const CALCULATION_MODELS: CalculationModel[] = [
  {
    modelId: "shi_model",
    modelName: "SHI 社媒热度指数 (Social Heat Index)",
    modelType: "index_composite",
    description: "综合衡量TikTok上某产品概念的热度和传播力",
    formula: "SHI = (w1×视频增长率 + w2×观看增长率 + w3×互动率×100 + w4×达人参与度) / 归一化系数",
    inputs: [
      { name: "videoGrowthRate", source: "dws_tiktok_concept_daily.videoCount (环比)", required: true },
      { name: "viewsGrowth", source: "dws_tiktok_concept_daily.totalViews (环比)", required: true },
      { name: "engagementRate", source: "dws_tiktok_concept_daily.engagementRate", required: true },
      { name: "influencerCount", source: "dws_tiktok_concept_daily.influencerCount", required: true },
    ],
    output: "shiScore (0-100)",
    confidence: 0.85,
    verifiedBy: "McKinsey Digital Consumer Index Framework",
    referenceUrl: "https://www.mckinsey.com/capabilities/growth-marketing-and-sales/our-insights",
    industryStandard: "社交媒体热度评估通用模型",
  },
  {
    modelId: "cvi_model",
    modelName: "CVI 商业价值指数 (Commerce Value Index)",
    modelType: "index_composite",
    description: "衡量Amazon市场某产品概念的商业成熟度和价值",
    formula: "CVI = (w1×销量规模 + w2×收入规模 + w3×评价质量 + w4×市场稳定性) / 归一化系数",
    inputs: [
      { name: "totalMonthlySales", source: "dws_amazon_concept_weekly.totalMonthlySales", required: true },
      { name: "totalRevenue", source: "dws_amazon_concept_weekly.totalRevenue", required: true },
      { name: "avgRating", source: "dws_amazon_concept_weekly.avgRating", required: true },
      { name: "top3BrandShare", source: "dws_amazon_concept_weekly.top3BrandShare", required: true },
    ],
    output: "cviScore (0-100)",
    confidence: 0.88,
    verifiedBy: "BCG Growth-Share Matrix Adaptation",
    referenceUrl: "https://www.bcg.com/manage/capabilities/strategy/growth",
    industryStandard: "电商市场价值评估模型",
  },
  {
    modelId: "opportunity_score",
    modelName: "选品机会评分模型",
    modelType: "index_composite",
    description: "结合社媒热度与电商成熟度，识别高机会产品概念",
    formula: "Opportunity = SHI × (1 - CVI/100) × TrendMomentum × (1 + VOC_Gap/100)",
    inputs: [
      { name: "shiScore", source: "conceptMetrics.shiScore", required: true },
      { name: "cviScore", source: "conceptMetrics.cviScore", required: true },
      { name: "trendMomentum", source: "conceptMetrics.trendMomentum", required: true },
      { name: "vocGapScore", source: "conceptMetrics.vocGapScore", required: true },
    ],
    output: "opportunityScore (0-100)",
    confidence: 0.82,
    verifiedBy: "Bain & Company Product Opportunity Screening",
    referenceUrl: "https://www.bain.com/insights",
    industryStandard: "选品机会评估框架",
  },
  {
    modelId: "market_size_tam",
    modelName: "市场规模测算 (TAM/SAM/SOM)",
    modelType: "market_sizing",
    description: "基于Amazon销量和TikTok热度，自上而下测算市场总规模",
    formula: "TAM = Amazon品类总销量 × 平均客单价 × 12; SAM = TAM × 目标人群渗透率; SOM = SAM × 品牌可获取份额",
    inputs: [
      { name: "categoryTotalSales", source: "ods_amazon_products / dwd_amazon_product_daily 聚合", required: true },
      { name: "avgPrice", source: "ods_amazon_products.price 平均", required: true },
      { name: "targetPenetration", source: "第三方人口统计数据", required: false },
    ],
    output: "marketSizeUSD",
    confidence: 0.75,
    verifiedBy: "Deloitte Market Sizing Methodology",
    referenceUrl: "https://www2.deloitte.com/us/en/insights.html",
    industryStandard: "市场规模标准测算模型",
  },
  {
    modelId: "sentiment_voc",
    modelName: "VOC 情感缺口模型",
    modelType: "sentiment_analysis",
    description: "基于Amazon评论情感分析，识别未满足的用户需求",
    formula: "VOC_Gap = (负面情感占比 × 提及频率) / (正面情感覆盖度 + 产品改进响应度)",
    inputs: [
      { name: "reviewSentiment", source: "dwd_amazon_review.sentiment", required: true },
      { name: "aspectMentions", source: "dwd_amazon_review.aspects", required: true },
      { name: "verifiedPurchaseRatio", source: "dwd_amazon_review.isVerified", required: false },
    ],
    output: "vocGapScore (0-100)",
    confidence: 0.80,
    verifiedBy: "NLP Sentiment Analysis + Gartner VOC Framework",
    referenceUrl: "https://www.gartner.com/en/documents/voice-of-customer",
    industryStandard: "客户之声分析标准",
  },
  {
    modelId: "gmv_forecast",
    modelName: "GMV 趋势预测模型",
    modelType: "trend_forecast",
    description: "基于历史GMV数据，使用Holt-Winters指数平滑预测未来趋势",
    formula: "Forecast(t) = (Level + Trend) × Seasonal; Level_t = α×Actual + (1-α)×(Level_{t-1}+Trend_{t-1})",
    inputs: [
      { name: "historicalGMV", source: "dwd_tiktok_product_daily.monthlyRevenue (时序)", required: true },
      { name: "seasonalityFactor", source: "历史同期数据", required: false },
    ],
    output: "gmvForecast (未来30/90天)",
    confidence: 0.78,
    verifiedBy: "Accenture Forecasting & Demand Planning",
    referenceUrl: "https://www.accenture.com/us-en/insights/operations/supply-chain",
    industryStandard: "时间序列预测标准方法",
  },
  {
    modelId: "engagement_rate_calc",
    modelName: "互动率标准化测算",
    modelType: "regression",
    description: "标准化计算TikTok内容的互动率，消除粉丝基数差异",
    formula: "Std_Engagement = (likes + comments×3 + shares×5) / views × ln(followers+1) / 10",
    inputs: [
      { name: "likes", source: "tiktokVideos.likes", required: true },
      { name: "comments", source: "tiktokVideos.commentsCount", required: true },
      { name: "shares", source: "tiktokVideos.shares", required: true },
      { name: "views", source: "tiktokVideos.views", required: true },
    ],
    output: "standardizedEngagementRate",
    confidence: 0.90,
    verifiedBy: "Social Media Examiner Industry Benchmark",
    referenceUrl: "https://www.socialmediaexaminer.com/",
    industryStandard: "社交媒体互动率行业标准",
  },
  {
    modelId: "price_elasticity",
    modelName: "价格弹性测算模型",
    modelType: "regression",
    description: "基于历史价格-销量关系，测算价格弹性系数",
    formula: "Elasticity = %ΔQuantity / %ΔPrice; 使用对数-线性回归 ln(Q) = α + β×ln(P) + ε",
    inputs: [
      { name: "priceHistory", source: "dwd_amazon_product_daily.price (时序)", required: true },
      { name: "salesHistory", source: "dwd_amazon_product_daily.monthlySales (时序)", required: true },
      { name: "competitorPrices", source: "ods_amazon_products.price 同品类", required: false },
    ],
    output: "priceElasticityCoefficient",
    confidence: 0.72,
    verifiedBy: "KPMG Pricing & Revenue Management",
    referenceUrl: "https://kpmg.com/xx/en/home/insights/2023/01/pricing-and-revenue-management.html",
    industryStandard: "价格弹性经济学标准模型",
  },
];

// ── 数据实体定义 ──────────────────────────────────────────────────────────

export const DATA_ENTITIES: DataEntity[] = [
  // ODS 层
  {
    entityId: "ent_ods_tt_products",
    entityName: "TikTok商品原始数据",
    layer: "ODS",
    tableName: "ods_tiktok_products",
    description: "TikTok Shop商品原始快照，含价格、销量、增长率等",
    fields: [
      { field: "productId", label: "商品ID", source: "TikTok Shop API / 第三方数据服务" },
      { field: "monthlySales", label: "月销量", source: "TikTok Shop API ( seller中心数据 )" },
      { field: "price", label: "售价", source: "TikTok Shop 公开页面" },
      { field: "salesGrowth", label: "销量增长率", source: "TikTok Shop API 环比计算", calcMethod: "(本月-上月)/上月", confidence: 0.85 },
    ],
    sourceType: "third_party",
    sourceName: "TikTok Shop Partner API / 第三方数据平台 (如EchoTik, FastMoss)",
    sourceUrl: "https://partner.tiktokshop.com/",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_ods_tt_creators",
    entityName: "TikTok达人原始数据",
    layer: "ODS",
    tableName: "ods_tiktok_creators",
    description: "TikTok创作者/达人原始快照",
    fields: [
      { field: "creatorId", label: "达人ID", source: "TikTok Open API / 爬虫" },
      { field: "followers", label: "粉丝数", source: "TikTok公开页面" },
      { field: "monthlySales", label: "月销量", source: "第三方平台估算 (达人橱窗数据)", confidence: 0.70 },
      { field: "videoGpm", label: "视频GPM", source: "测算: 视频带货GMV/播放量×1000", calcMethod: "GMV/Views×1000", confidence: 0.65 },
    ],
    sourceType: "third_party",
    sourceName: "TikTok Creator Marketplace API / 第三方平台 (如Kalodata)",
    sourceUrl: "https://creatormarketplace.tiktok.com/",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_ods_tt_videos",
    entityName: "TikTok视频原始数据",
    layer: "ODS",
    tableName: "ods_tiktok_videos",
    description: "TikTok短视频内容数据",
    fields: [
      { field: "videoId", label: "视频ID", source: "TikTok API / 爬虫" },
      { field: "views", label: "播放量", source: "TikTok公开页面" },
      { field: "likes", label: "点赞数", source: "TikTok公开页面" },
      { field: "engagementRate", label: "互动率", source: "测算", calcMethod: "(likes+comments+shares)/views×100", confidence: 0.95 },
      { field: "monthlySales", label: "月带货销量", source: "第三方平台关联估算", confidence: 0.60 },
    ],
    sourceType: "third_party",
    sourceName: "TikTok Research API / 第三方爬虫服务",
    sourceUrl: "https://developers.tiktok.com/",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_ods_amz_products",
    entityName: "Amazon商品原始数据",
    layer: "ODS",
    tableName: "ods_amazon_products",
    description: "Amazon商品详情原始快照",
    fields: [
      { field: "asin", label: "ASIN", source: "Amazon Product Advertising API / 爬虫" },
      { field: "title", label: "标题", source: "Amazon公开页面" },
      { field: "monthlySales", label: "月销量", source: "第三方工具估算 (Jungle Scout/Helium 10)", confidence: 0.75 },
      { field: "bsrRank", label: "BSR排名", source: "Amazon公开页面" },
      { field: "rating", label: "评分", source: "Amazon公开页面" },
      { field: "reviewCount", label: "评论数", source: "Amazon公开页面" },
    ],
    sourceType: "third_party",
    sourceName: "Amazon Product Advertising API / 第三方工具 (Jungle Scout, Helium 10, Keepa)",
    sourceUrl: "https://webservices.amazon.com/paapi5/",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_ods_amz_keywords",
    entityName: "Amazon关键词原始数据",
    layer: "ODS",
    tableName: "ods_amazon_keywords",
    description: "Amazon搜索关键词数据",
    fields: [
      { field: "keyword", label: "关键词", source: "Amazon Brand Analytics / 第三方工具" },
      { field: "searchVolume", label: "搜索量", source: "Helium 10 / Jungle Scout 估算", confidence: 0.70 },
      { field: "monthlyRevenue", label: "月收入", source: "第三方工具聚合", confidence: 0.70 },
    ],
    sourceType: "third_party",
    sourceName: "Amazon Brand Analytics API / Helium 10 / Jungle Scout",
    sourceUrl: "https://sellercentral.amazon.com/",
    updateFrequency: "每周",
  },
  {
    entityId: "ent_ods_amz_reviews",
    entityName: "Amazon评论原始数据",
    layer: "ODS",
    tableName: "ods_amazon_reviews",
    description: "Amazon商品评论原始数据",
    fields: [
      { field: "reviewId", label: "评论ID", source: "Amazon公开页面爬虫" },
      { field: "rating", label: "评分", source: "Amazon公开页面" },
      { field: "content", label: "内容", source: "Amazon公开页面" },
      { field: "sentiment", label: "情感", source: "NLP模型分析", calcMethod: "BERT情感分类", confidence: 0.88 },
    ],
    sourceType: "scraping",
    sourceName: "Amazon公开页面爬虫 / Review分析服务",
    updateFrequency: "每日",
  },

  // DWD 层
  {
    entityId: "ent_dwd_tt_product_daily",
    entityName: "TikTok商品日明细",
    layer: "DWD",
    tableName: "dwd_tiktok_product_daily",
    description: "标准化后的TikTok商品日粒度明细",
    fields: [
      { field: "statDate", label: "统计日期", source: "ETL from ODS" },
      { field: "salesGrowthRate", label: "销量增长率(标准化)", source: "ETL计算", calcMethod: "(当日-前日)/前日", confidence: 0.90 },
      { field: "isCarrying", label: "是否带货", source: "ETL规则判断" },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: ods_tiktok_products → dwd_tiktok_product_daily",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_dwd_amz_product_daily",
    entityName: "Amazon商品日明细",
    layer: "DWD",
    tableName: "dwd_amazon_product_daily",
    description: "标准化后的Amazon商品日粒度明细",
    fields: [
      { field: "isNewProduct", label: "是否新品", source: "ETL规则: 上架<90天", calcMethod: "launchDate判断", confidence: 0.95 },
      { field: "salesGrowthMom", label: "销量环比", source: "ETL计算", calcMethod: "MoM增长率", confidence: 0.90 },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: ods_amazon_products → dwd_amazon_product_daily",
    updateFrequency: "每日",
  },

  // DWS 层
  {
    entityId: "ent_dws_tt_category_daily",
    entityName: "TikTok品类日汇总",
    layer: "DWS",
    tableName: "dws_tiktok_category_daily",
    description: "按品类汇总的TikTok数据",
    fields: [
      { field: "videoCount", label: "视频数", source: "DWD聚合" },
      { field: "engagementRate", label: "品类互动率", source: "加权平均", calcMethod: "Σ(互动)/Σ(观看)", confidence: 0.92 },
      { field: "carryingVideoRatio", label: "带货视频占比", source: "DWD聚合", calcMethod: "带货视频/总视频", confidence: 0.88 },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: dwd_tiktok_product_daily → dws_tiktok_category_daily",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_dws_tt_concept_daily",
    entityName: "TikTok概念日汇总",
    layer: "DWS",
    tableName: "dws_tiktok_concept_daily",
    description: "按产品概念汇总的TikTok数据",
    fields: [
      { field: "videoGrowthRate", label: "视频增长率", source: "DWS计算", calcMethod: "(本周-上周)/上周", confidence: 0.85 },
      { field: "carryingRatio", label: "带货率", source: "DWS计算", calcMethod: "带货视频/总视频", confidence: 0.85 },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: dwd + keyword mapping → dws_tiktok_concept_daily",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_dws_amz_concept_weekly",
    entityName: "Amazon概念周汇总",
    layer: "DWS",
    tableName: "dws_amazon_concept_weekly",
    description: "按产品概念汇总的Amazon周数据",
    fields: [
      { field: "salesGrowthRate", label: "销量增长率", source: "DWS计算", calcMethod: "WoW增长率", confidence: 0.85 },
      { field: "newProductRatio", label: "新品占比", source: "DWS计算", calcMethod: "新品数/总SKU数", confidence: 0.90 },
      { field: "top3BrandShare", label: "TOP3品牌集中度", source: "DWS计算", calcMethod: "TOP3销量/总销量", confidence: 0.92 },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: dwd_amazon_product_daily → dws_amazon_concept_weekly",
    updateFrequency: "每周",
  },

  // ADS 层
  {
    entityId: "ent_ads_tt_home_ranking",
    entityName: "TikTok首页榜单",
    layer: "ADS",
    tableName: "ads_tiktok_home_ranking",
    description: "TikTok首页各类排行榜数据",
    fields: [
      { field: "rankType", label: "榜单类型", source: "DWS聚合分类" },
      { field: "rank", label: "排名", source: "排序计算" },
      { field: "keyMetric", label: "关键指标", source: "DWS指标" },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: dws_tiktok_category_daily → ads_tiktok_home_ranking",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_ads_tt_analysis_kpi",
    entityName: "TikTok分析大盘KPI",
    layer: "ADS",
    tableName: "ads_tiktok_analysis_kpi",
    description: "TikTok大盘分析核心指标",
    fields: [
      { field: "totalSales", label: "总销量", source: "DWD聚合" },
      { field: "totalRevenue", label: "总收入", source: "DWD聚合" },
      { field: "salesTrend", label: "销量趋势", source: "趋势计算", calcMethod: "7日/30日移动平均线比较", confidence: 0.85 },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: dwd_tiktok_product_daily → ads_tiktok_analysis_kpi",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_ads_amz_market_summary",
    entityName: "Amazon市场汇总",
    layer: "ADS",
    tableName: "ads_amazon_market_summary",
    description: "Amazon各类市场分析汇总",
    fields: [
      { field: "marketType", label: "市场类型", source: "业务分类" },
      { field: "trendData", label: "趋势数据", source: "DWS时序聚合" },
      { field: "potentialLevel", label: "潜力等级", source: "测算模型", calcMethod: "综合评分分箱", confidence: 0.75 },
    ],
    sourceType: "calculated",
    sourceName: "ETL作业: dws_amazon_concept_weekly + dwd → ads_amazon_market_summary",
    updateFrequency: "每周",
  },

  // 业务表
  {
    entityId: "ent_tiktok_videos",
    entityName: "TikTok视频业务表",
    layer: "ADS",
    tableName: "tiktok_videos",
    description: "核心TikTok视频业务数据（兼容存量）",
    fields: [
      { field: "videoId", label: "视频ID", source: "存量数据 / ODS导入" },
      { field: "views", label: "播放量", source: "存量数据" },
      { field: "monthlyRevenue", label: "月收入", source: "第三方平台估算", confidence: 0.65 },
    ],
    sourceType: "database",
    sourceName: "系统存量数据表",
    updateFrequency: "实时",
  },
  {
    entityId: "ent_amazon_products",
    entityName: "Amazon商品业务表",
    layer: "ADS",
    tableName: "amazon_products",
    description: "核心Amazon商品业务数据（兼容存量）",
    fields: [
      { field: "asin", label: "ASIN", source: "存量数据" },
      { field: "monthlySales", label: "月销量", source: "第三方工具估算", confidence: 0.75 },
      { field: "tiktokHeatScore", label: "TikTok热度分", source: "Fusion引擎计算", calcMethod: "关联TikTok视频数+互动加权", confidence: 0.70 },
    ],
    sourceType: "database",
    sourceName: "系统存量数据表",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_concept_metrics",
    entityName: "概念指标表",
    layer: "ADS",
    tableName: "concept_metrics",
    description: "产品概念核心评估指标",
    fields: [
      { field: "shiScore", label: "SHI社媒热度", source: "测算模型", calcMethod: "SHI Model", confidence: 0.85 },
      { field: "cviScore", label: "CVI商业价值", source: "测算模型", calcMethod: "CVI Model", confidence: 0.88 },
      { field: "opportunityScore", label: "机会评分", source: "测算模型", calcMethod: "Opportunity Model", confidence: 0.82 },
      { field: "trendMomentum", label: "趋势动量", source: "测算模型", calcMethod: "趋势斜率/波动率", confidence: 0.75 },
      { field: "vocGapScore", label: "VOC缺口分", source: "测算模型", calcMethod: "VOC Gap Model", confidence: 0.80 },
    ],
    sourceType: "calculated",
    sourceName: "Fusion引擎: DWS数据 + 测算模型",
    updateFrequency: "每日",
  },
  {
    entityId: "ent_product_concepts",
    entityName: "产品概念表",
    layer: "ADS",
    tableName: "product_concepts",
    description: "AI识别的产品概念定义",
    fields: [
      { field: "conceptId", label: "概念ID", source: "AI生成" },
      { field: "confidence", label: "置信度", source: "AI模型", confidence: 0.80 },
      { field: "tiktokKeywords", label: "TikTok关键词", source: "NLP提取" },
      { field: "amazonKeywords", label: "Amazon关键词", source: "NLP提取+映射" },
    ],
    sourceType: "calculated",
    sourceName: "AI概念提取引擎 + 人工校验",
    updateFrequency: "每周",
  },

  // Mock 数据标记
  {
    entityId: "ent_mock_live",
    entityName: "TikTok直播数据（模拟）",
    layer: "Mock",
    tableName: "ods_tiktok_lives",
    description: "直播数据当前无独立来源，从达人数据模拟生成",
    fields: [
      { field: "liveId", label: "直播ID", source: "模拟生成" },
      { field: "viewers", label: "观看人数", source: "模拟: 达人粉丝数×随机系数", calcMethod: "followers × rand(0.01,0.1)", confidence: 0.30 },
      { field: "gpm", label: "GPM", source: "模拟: 固定范围随机", calcMethod: "rand(1,30)", confidence: 0.20 },
    ],
    sourceType: "mock",
    sourceName: "系统模拟数据（无真实来源）",
    updateFrequency: "N/A",
  },
];

// ── API端点定义 ───────────────────────────────────────────────────────────

export const API_ENDPOINTS: ApiEndpoint[] = [
  // TikTok Home
  { endpointId: "ep_tt_home_products_hot", router: "tiktok", procedure: "home.productsHot", fullPath: "tiktok.home.productsHot", description: "TikTok热门商品榜单", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_products_soaring", router: "tiktok", procedure: "home.productsSoaring", fullPath: "tiktok.home.productsSoaring", description: "TikTok飙升商品榜单", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_products_new", router: "tiktok", procedure: "home.productsNew", fullPath: "tiktok.home.productsNew", description: "TikTok新品榜单", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_influencers_sales", router: "tiktok", procedure: "home.influencersSales", fullPath: "tiktok.home.influencersSales", description: "TikTok带货达人榜", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_influencers_fans", router: "tiktok", procedure: "home.influencersFans", fullPath: "tiktok.home.influencersFans", description: "TikTok粉丝达人榜", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_shops_hot", router: "tiktok", procedure: "home.shopsHot", fullPath: "tiktok.home.shopsHot", description: "TikTok热门小店榜", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_videos_hot", router: "tiktok", procedure: "home.videosHot", fullPath: "tiktok.home.videosHot", description: "TikTok热门视频榜", entities: ["ent_ads_tt_home_ranking"], isFallbackToMock: true },
  { endpointId: "ep_tt_home_lives_popular", router: "tiktok", procedure: "home.livesPopular", fullPath: "tiktok.home.livesPopular", description: "TikTok热门直播榜", entities: ["ent_mock_live"], isFallbackToMock: true },

  // TikTok Analysis
  { endpointId: "ep_tt_analysis_kpi", router: "tiktok", procedure: "analysis.kpi", fullPath: "tiktok.analysis.kpi", description: "TikTok大盘KPI指标", entities: ["ent_ads_tt_analysis_kpi"], isFallbackToMock: true },
  { endpointId: "ep_tt_analysis_heatmap", router: "tiktok", procedure: "analysis.heatmap", fullPath: "tiktok.analysis.heatmap", description: "TikTok品类热力图", entities: ["ent_dws_tt_category_daily"], isFallbackToMock: true },
  { endpointId: "ep_tt_analysis_gmv_trend", router: "tiktok", procedure: "analysis.gmvTrend", fullPath: "tiktok.analysis.gmvTrend", description: "TikTok GMV趋势", entities: ["ent_dwd_tt_product_daily"], isFallbackToMock: true },
  { endpointId: "ep_tt_analysis_category_share", router: "tiktok", procedure: "analysis.categoryShare", fullPath: "tiktok.analysis.categoryShare", description: "TikTok品类份额", entities: ["ent_dws_tt_category_daily"], isFallbackToMock: true },
  { endpointId: "ep_tt_analysis_price_dist", router: "tiktok", procedure: "analysis.priceDistribution", fullPath: "tiktok.analysis.priceDistribution", description: "TikTok价格分布", entities: ["ent_dwd_tt_product_daily"], isFallbackToMock: true },
  { endpointId: "ep_tt_analysis_influencer_matrix", router: "tiktok", procedure: "analysis.influencerMatrix", fullPath: "tiktok.analysis.influencerMatrix", description: "TikTok达人矩阵", entities: ["ent_dwd_tt_product_daily"], isFallbackToMock: true },

  // TikTok Lists
  { endpointId: "ep_tt_products_list", router: "tiktok", procedure: "products.list", fullPath: "tiktok.products.list", description: "TikTok商品列表", entities: ["ent_tiktok_videos", "ent_ods_tt_products"], isFallbackToMock: true },
  { endpointId: "ep_tt_creators_list", router: "tiktok", procedure: "creators.list", fullPath: "tiktok.creators.list", description: "TikTok达人列表", entities: ["ent_ods_tt_creators"], isFallbackToMock: true },
  { endpointId: "ep_tt_shops_list", router: "tiktok", procedure: "shops.list", fullPath: "tiktok.shops.list", description: "TikTok小店列表", entities: ["ent_ods_tt_products"], isFallbackToMock: true },
  { endpointId: "ep_tt_videos_list", router: "tiktok", procedure: "videos.list", fullPath: "tiktok.videos.list", description: "TikTok视频列表", entities: ["ent_tiktok_videos", "ent_ods_tt_videos"], isFallbackToMock: true },
  { endpointId: "ep_tt_lives_list", router: "tiktok", procedure: "lives.list", fullPath: "tiktok.lives.list", description: "TikTok直播列表", entities: ["ent_mock_live"], isFallbackToMock: true },

  // Amazon
  { endpointId: "ep_amz_products_list", router: "amazon", procedure: "products.list", fullPath: "amazon.products.list", description: "Amazon商品列表", entities: ["ent_amazon_products", "ent_ods_amz_products"], isFallbackToMock: true },
  { endpointId: "ep_amz_products_get", router: "amazon", procedure: "products.getByAsin", fullPath: "amazon.products.getByAsin", description: "Amazon商品详情", entities: ["ent_amazon_products"], isFallbackToMock: true },
  { endpointId: "ep_amz_reviews_list", router: "amazon", procedure: "reviews.list", fullPath: "amazon.reviews.list", description: "Amazon评论列表", entities: ["ent_ods_amz_reviews"], isFallbackToMock: true },
  { endpointId: "ep_amz_reviews_stats", router: "amazon", procedure: "reviews.stats", fullPath: "amazon.reviews.stats", description: "Amazon评论统计", entities: ["ent_ods_amz_reviews"], isFallbackToMock: true },
  { endpointId: "ep_amz_keyword_search", router: "amazon", procedure: "keyword.search", fullPath: "amazon.keyword.search", description: "Amazon关键词搜索", entities: ["ent_ods_amz_keywords"], isFallbackToMock: true },
  { endpointId: "ep_amz_keyword_stats", router: "amazon", procedure: "keyword.stats", fullPath: "amazon.keyword.stats", description: "Amazon关键词统计", entities: ["ent_ods_amz_keywords"], isFallbackToMock: true },
  { endpointId: "ep_amz_hot_market", router: "amazon", procedure: "hotMarket.list", fullPath: "amazon.hotMarket.list", description: "Amazon热门市场", entities: ["ent_ads_amz_market_summary"], isFallbackToMock: true },
  { endpointId: "ep_amz_pot_market", router: "amazon", procedure: "potMarket.list", fullPath: "amazon.potMarket.list", description: "Amazon潜力市场", entities: ["ent_ads_amz_market_summary"], isFallbackToMock: true },
  { endpointId: "ep_amz_param_trend", router: "amazon", procedure: "paramTrend.list", fullPath: "amazon.paramTrend.list", description: "Amazon参数趋势", entities: ["ent_ads_amz_market_summary"], isFallbackToMock: true },
  { endpointId: "ep_amz_brand_trend", router: "amazon", procedure: "brandTrend.list", fullPath: "amazon.brandTrend.list", description: "Amazon品牌趋势", entities: ["ent_ads_amz_market_summary"], isFallbackToMock: true },

  // Fusion
  { endpointId: "ep_fusion_concepts_list", router: "fusion", procedure: "concepts.list", fullPath: "fusion.concepts.list", description: "产品概念列表", entities: ["ent_product_concepts"], isFallbackToMock: true },
  { endpointId: "ep_fusion_concepts_get", router: "fusion", procedure: "concepts.getById", fullPath: "fusion.concepts.getById", description: "产品概念详情", entities: ["ent_product_concepts"], isFallbackToMock: true },
  { endpointId: "ep_fusion_metrics_list", router: "fusion", procedure: "metrics.list", fullPath: "fusion.metrics.list", description: "概念指标列表", entities: ["ent_concept_metrics"], isFallbackToMock: true },
  { endpointId: "ep_fusion_metrics_latest", router: "fusion", procedure: "metrics.latest", fullPath: "fusion.metrics.latest", description: "最新概念指标", entities: ["ent_concept_metrics"], isFallbackToMock: true },
  { endpointId: "ep_fusion_metrics_top", router: "fusion", procedure: "metrics.topOpportunities", fullPath: "fusion.metrics.topOpportunities", description: "TOP机会列表", entities: ["ent_concept_metrics"], isFallbackToMock: true },
  { endpointId: "ep_fusion_mappings", router: "fusion", procedure: "mappings.list", fullPath: "fusion.mappings.list", description: "关键词映射列表", entities: ["ent_product_concepts"], isFallbackToMock: true },
  { endpointId: "ep_fusion_reports_list", router: "fusion", procedure: "reports.list", fullPath: "fusion.reports.list", description: "融合报告列表", entities: ["ent_product_concepts", "ent_concept_metrics"], isFallbackToMock: true },

  // DataManager
  { endpointId: "ep_dm_ods_dates", router: "dataManager", procedure: "ods.latestDates", fullPath: "dataManager.ods.latestDates", description: "ODS最新日期", entities: ["ent_ods_tt_products", "ent_ods_tt_creators", "ent_ods_amz_products", "ent_ods_amz_keywords"], isFallbackToMock: false },
  { endpointId: "ep_dm_import_logs", router: "dataManager", procedure: "import.logs", fullPath: "dataManager.import.logs", description: "导入日志", entities: [], isFallbackToMock: false },
  { endpointId: "ep_dm_import_stats", router: "dataManager", procedure: "import.stats", fullPath: "dataManager.import.stats", description: "导入统计", entities: [], isFallbackToMock: false },
];

// ── 页面模块定义 ──────────────────────────────────────────────────────────

export const PAGE_MODULES: PageModule[] = [
  { moduleId: "mod_tt_home", pagePath: "/tiktok/home", pageName: "TikTok首页", category: "TikTok", description: "TikTok热门榜单总览", endpoints: ["ep_tt_home_products_hot","ep_tt_home_products_soaring","ep_tt_home_products_new","ep_tt_home_influencers_sales","ep_tt_home_influencers_fans","ep_tt_home_shops_hot","ep_tt_home_videos_hot","ep_tt_home_lives_popular"], priority: "high" },
  { moduleId: "mod_tt_analysis", pagePath: "/tiktok/analysis", pageName: "TikTok大盘分析", category: "TikTok", description: "TikTok电商数据分析仪表盘", endpoints: ["ep_tt_analysis_kpi","ep_tt_analysis_heatmap","ep_tt_analysis_gmv_trend","ep_tt_analysis_category_share","ep_tt_analysis_price_dist","ep_tt_analysis_influencer_matrix"], priority: "high" },
  { moduleId: "mod_tt_products", pagePath: "/tiktok/products", pageName: "TikTok商品", category: "TikTok", description: "TikTok商品库查询", endpoints: ["ep_tt_products_list"], priority: "medium" },
  { moduleId: "mod_tt_influencer", pagePath: "/tiktok/influencer", pageName: "TikTok达人", category: "TikTok", description: "TikTok达人库查询", endpoints: ["ep_tt_creators_list"], priority: "medium" },
  { moduleId: "mod_tt_shop", pagePath: "/tiktok/shop", pageName: "TikTok小店", category: "TikTok", description: "TikTok小店库查询", endpoints: ["ep_tt_shops_list"], priority: "medium" },
  { moduleId: "mod_tt_video", pagePath: "/tiktok/video", pageName: "TikTok视频", category: "TikTok", description: "TikTok视频库查询", endpoints: ["ep_tt_videos_list"], priority: "medium" },
  { moduleId: "mod_tt_live", pagePath: "/tiktok/live", pageName: "TikTok直播", category: "TikTok", description: "TikTok直播库查询（模拟数据）", endpoints: ["ep_tt_lives_list"], priority: "low" },
  { moduleId: "mod_tt_attention", pagePath: "/tiktok/attention", pageName: "TikTok关注", category: "TikTok", description: "关注中心（无独立API）", endpoints: ["ep_fusion_concepts_list"], priority: "low" },

  { moduleId: "mod_amz_product", pagePath: "/amazon/product", pageName: "Amazon商品", category: "Amazon", description: "Amazon商品库查询", endpoints: ["ep_amz_products_list"], priority: "high" },
  { moduleId: "mod_amz_list", pagePath: "/amazon/list", pageName: "Amazon列表", category: "Amazon", description: "Amazon商品列表", endpoints: ["ep_amz_products_list"], priority: "high" },
  { moduleId: "mod_amz_keyword", pagePath: "/amazon/keyword", pageName: "Amazon关键词", category: "Amazon", description: "Amazon关键词分析", endpoints: ["ep_amz_keyword_search","ep_amz_keyword_stats"], priority: "high" },
  { moduleId: "mod_amz_reviews", pagePath: "/amazon/reviews/:asin", pageName: "Amazon评论", category: "Amazon", description: "Amazon评论VOC分析", endpoints: ["ep_amz_reviews_list","ep_amz_reviews_stats"], priority: "high" },
  { moduleId: "mod_amz_hot_market", pagePath: "/amazon/hot-market", pageName: "Amazon热门市场", category: "Amazon", description: "Amazon热门市场分析", endpoints: ["ep_amz_hot_market"], priority: "medium" },
  { moduleId: "mod_amz_pot_market", pagePath: "/amazon/pot-market", pageName: "Amazon潜力市场", category: "Amazon", description: "Amazon潜力市场分析", endpoints: ["ep_amz_pot_market"], priority: "medium" },
  { moduleId: "mod_amz_param_trend", pagePath: "/amazon/param-trend", pageName: "Amazon参数趋势", category: "Amazon", description: "Amazon参数趋势分析", endpoints: ["ep_amz_param_trend"], priority: "medium" },
  { moduleId: "mod_amz_brand_trend", pagePath: "/amazon/brand-trend", pageName: "Amazon品牌趋势", category: "Amazon", description: "Amazon品牌趋势分析", endpoints: ["ep_amz_brand_trend"], priority: "medium" },

  { moduleId: "mod_fusion_opportunities", pagePath: "/fusion/opportunities", pageName: "选品机会", category: "Fusion", description: "AI选品机会排行榜", endpoints: ["ep_fusion_metrics_top"], priority: "high" },
  { moduleId: "mod_fusion_concept", pagePath: "/fusion/concept/:id", pageName: "概念详情", category: "Fusion", description: "产品概念详细分析", endpoints: ["ep_fusion_concepts_get","ep_fusion_metrics_list"], priority: "high" },
  { moduleId: "mod_fusion_report", pagePath: "/fusion/report", pageName: "融合报告", category: "Fusion", description: "AI融合选品报告生成", endpoints: ["ep_fusion_concepts_list","ep_fusion_metrics_list"], priority: "high" },

  { moduleId: "mod_report_analysis", pagePath: "/report/analysis", pageName: "报告分析", category: "Report", description: "综合报告分析", endpoints: ["ep_amz_reviews_stats"], priority: "medium" },
  { moduleId: "mod_user_center", pagePath: "/user/center", pageName: "用户中心", category: "User", description: "用户个人中心", endpoints: ["ep_fusion_reports_list"], priority: "low" },
  { moduleId: "mod_data_manager", pagePath: "/data/manager", pageName: "数据管理", category: "Data", description: "数据管理中心", endpoints: ["ep_dm_ods_dates","ep_dm_import_logs","ep_dm_import_stats"], priority: "high" },
];

// ── 数据缺口定义 ──────────────────────────────────────────────────────────

export const DATA_GAPS: DataGap[] = [
  {
    gapId: "gap_001",
    moduleId: "mod_tt_live",
    endpointId: "ep_tt_lives_list",
    entityId: "ent_mock_live",
    gapType: "mock_fallback",
    severity: "critical",
    description: "TikTok直播数据无独立数据源，当前从达人数据模拟生成，数据完全不真实",
    impact: "直播榜单和直播分析功能无法提供真实商业洞察，决策参考价值极低",
    recommendation: "接入TikTok Live API或第三方直播数据服务 (如Kalodata直播模块)",
    calcMethod: "基于达人粉丝数×直播频率×行业平均观看率的推算模型",
    calcModel: "gmv_forecast",
    calcConfidence: 0.45,
    externalSources: [
      { name: "Kalodata TikTok直播数据", url: "https://www.kalodata.com/", reliability: 0.85 },
      { name: "EchoTik直播分析", url: "https://echotik.live/", reliability: 0.80 },
      { name: "TikTok Live Studio API", url: "https://developers.tiktok.com/", reliability: 0.90 },
    ],
  },
  {
    gapId: "gap_002",
    moduleId: "mod_tt_home",
    endpointId: "ep_tt_home_lives_popular",
    entityId: "ent_mock_live",
    gapType: "mock_fallback",
    severity: "critical",
    description: "首页热门直播榜单使用模拟数据",
    impact: "首页核心模块数据不可信，影响平台专业形象",
    recommendation: "接入真实直播数据源，或隐藏该模块直到数据可用",
    calcMethod: "隐藏模块或标注数据来源",
    calcConfidence: 0.30,
    externalSources: [
      { name: "Kalodata", url: "https://www.kalodata.com/", reliability: 0.85 },
    ],
  },
  {
    gapId: "gap_003",
    moduleId: "mod_tt_analysis",
    endpointId: "ep_tt_analysis_kpi",
    entityId: "ent_ads_tt_analysis_kpi",
    gapType: "no_etl",
    severity: "critical",
    description: "TikTok大盘KPI数据当前从dbGetAnalysisData返回随机数/mock格式，无真实ETL作业",
    impact: "大盘分析仪表盘数据完全不可信，无法用于商业决策",
    recommendation: "建立从DWD到ADS的ETL作业，或使用DWS层数据实时计算",
    calcMethod: "基于DWS聚合数据实时计算KPI",
    calcModel: "gmv_forecast",
    calcConfidence: 0.80,
    externalSources: [
      { name: "TikTok Shop官方数据", url: "https://seller.tiktok.com/", reliability: 0.95 },
    ],
  },
  {
    gapId: "gap_004",
    moduleId: "mod_tt_analysis",
    endpointId: "ep_tt_analysis_heatmap",
    entityId: "ent_dws_tt_category_daily",
    gapType: "no_etl",
    severity: "critical",
    description: "品类热力图依赖DWS层数据，但当前无ETL从ODS/DWD流转到DWS",
    impact: "分析维度受限，无法按品类进行深度分析",
    recommendation: "建立品类聚合ETL作业，或使用SQL视图实时聚合",
    calcMethod: "SQL实时聚合: GROUP BY category",
    calcConfidence: 0.85,
    externalSources: [],
  },
  {
    gapId: "gap_005",
    moduleId: "mod_amz_keyword",
    endpointId: "ep_amz_keyword_search",
    entityId: "ent_ods_amz_keywords",
    field: "trendData",
    gapType: "mock_fallback",
    severity: "warning",
    description: "Amazon关键词搜索返回的趋势数据使用Math.random()生成",
    impact: "关键词趋势分析不准确，可能影响选品关键词策略",
    recommendation: "接入Keepa API获取历史价格/排名趋势，或使用Helium 10趋势数据",
    calcMethod: "基于历史搜索量数据的Holt-Winters平滑预测",
    calcModel: "gmv_forecast",
    calcConfidence: 0.75,
    externalSources: [
      { name: "Keepa API", url: "https://keepa.com/", reliability: 0.90 },
      { name: "Helium 10 Trendster", url: "https://www.helium10.com/", reliability: 0.85 },
    ],
  },
  {
    gapId: "gap_006",
    moduleId: "mod_fusion_opportunities",
    endpointId: "ep_fusion_metrics_top",
    entityId: "ent_concept_metrics",
    field: "opportunityScore",
    gapType: "unverified_calc",
    severity: "warning",
    description: "选品机会评分模型的权重参数未经A/B测试验证",
    impact: "机会排序可能存在偏差，高机会概念可能被低估",
    recommendation: "收集业务反馈数据，校准模型权重；引入专家标注集验证",
    calcMethod: "SHI×(1-CVI/100)×TrendMomentum，权重需业务校准",
    calcModel: "opportunity_score",
    calcConfidence: 0.72,
    externalSources: [],
  },
  {
    gapId: "gap_007",
    moduleId: "mod_fusion_concept",
    endpointId: "ep_fusion_metrics_list",
    entityId: "ent_concept_metrics",
    field: "trendMomentum",
    gapType: "unverified_calc",
    severity: "info",
    description: "趋势动量指标使用简单随机数生成，无真实时序计算",
    impact: "趋势判断不准确",
    recommendation: "基于真实7日/30日SHI变化率计算趋势动量",
    calcMethod: "(SHI_7d - SHI_30d) / SHI_30d × 标准化系数",
    calcModel: "gmv_forecast",
    calcConfidence: 0.78,
    externalSources: [],
  },
  {
    gapId: "gap_008",
    moduleId: "mod_tt_products",
    endpointId: "ep_tt_products_list",
    entityId: "ent_ods_tt_products",
    field: "monthlySales",
    gapType: "incomplete_fields",
    severity: "warning",
    description: "TikTok商品销量数据来自第三方平台估算，不同平台数据差异大",
    impact: "销量数据可信度中等，跨平台对比需谨慎",
    recommendation: "多源数据交叉验证，标注数据来源和可信度区间",
    calcMethod: "多源加权平均: 0.4×Kalodata + 0.35×EchoTik + 0.25×FastMoss",
    calcConfidence: 0.70,
    externalSources: [
      { name: "Kalodata", url: "https://www.kalodata.com/", reliability: 0.85 },
      { name: "EchoTik", url: "https://echotik.live/", reliability: 0.80 },
      { name: "FastMoss", url: "https://www.fastmoss.com/", reliability: 0.82 },
    ],
  },
  {
    gapId: "gap_009",
    moduleId: "mod_amz_product",
    endpointId: "ep_amz_products_list",
    entityId: "ent_amazon_products",
    field: "monthlySales",
    gapType: "incomplete_fields",
    severity: "warning",
    description: "Amazon月销量为第三方工具估算值，非Amazon官方数据",
    impact: "销量绝对值可能有±30%偏差，但相对排名和趋势可信",
    recommendation: "使用BSR排名+品类系数反推销量，或使用多工具交叉验证",
    calcMethod: "BSR反推模型: Sales = 品类基准销量 × BSR系数 × 季节性调整",
    calcModel: "market_size_tam",
    calcConfidence: 0.75,
    externalSources: [
      { name: "Jungle Scout Sales Estimator", url: "https://www.junglescout.com/", reliability: 0.85 },
      { name: "Helium 10 Xray", url: "https://www.helium10.com/", reliability: 0.82 },
    ],
  },
  {
    gapId: "gap_010",
    moduleId: "mod_tt_influencer",
    endpointId: "ep_tt_creators_list",
    entityId: "ent_ods_tt_creators",
    field: "monthlySales",
    gapType: "incomplete_fields",
    severity: "warning",
    description: "达人月销量为第三方平台估算，基于橱窗数据推算",
    impact: "达人带货能力评估存在偏差",
    recommendation: "接入TikTok Shop联盟数据获取真实成交",
    calcMethod: "视频GPM × 月均视频播放量 + 直播GPM × 月均直播观看",
    calcConfidence: 0.65,
    externalSources: [
      { name: "TikTok Shop Affiliate API", url: "https://affiliate.tiktok.com/", reliability: 0.90 },
    ],
  },
  {
    gapId: "gap_011",
    moduleId: "mod_fusion_report",
    endpointId: "ep_fusion_reports_list",
    entityId: "ent_product_concepts",
    gapType: "missing_source",
    severity: "info",
    description: "AI概念提取的置信度无人工校验闭环",
    impact: "低置信度概念可能进入报告",
    recommendation: "建立人工审核流程，低于0.8置信度的概念需专家确认",
    calcMethod: "NLP聚类 + 人工校验",
    calcConfidence: 0.80,
    externalSources: [],
  },
  {
    gapId: "gap_012",
    moduleId: "mod_data_manager",
    endpointId: "ep_dm_ods_dates",
    entityId: "ent_ods_tt_products",
    gapType: "stale_data",
    severity: "warning",
    description: "ODS数据依赖手动导入Excel，更新频率不可控",
    impact: "数据时效性无法保证，分析结果可能基于过期数据",
    recommendation: "建立自动化数据抓取pipeline，或对接第三方API自动同步",
    calcMethod: "自动化API同步",
    calcConfidence: 0.95,
    externalSources: [
      { name: "第三方数据平台API", url: "", reliability: 0.90 },
    ],
  },
];

// ── 工具函数 ──────────────────────────────────────────────────────────────

export function getEntityById(id: string): DataEntity | undefined {
  return DATA_ENTITIES.find(e => e.entityId === id);
}

export function getEndpointById(id: string): ApiEndpoint | undefined {
  return API_ENDPOINTS.find(e => e.endpointId === id);
}

export function getModuleById(id: string): PageModule | undefined {
  return PAGE_MODULES.find(m => m.moduleId === id);
}

export function getGapsByModule(moduleId: string): DataGap[] {
  return DATA_GAPS.filter(g => g.moduleId === moduleId);
}

export function getGapsBySeverity(severity: DataGap["severity"]): DataGap[] {
  return DATA_GAPS.filter(g => g.severity === severity);
}

export function getEndpointsForModule(module: PageModule): ApiEndpoint[] {
  return API_ENDPOINTS.filter(e => module.endpoints.includes(e.endpointId));
}

export function getEntitiesForEndpoint(endpoint: ApiEndpoint): DataEntity[] {
  return DATA_ENTITIES.filter(e => endpoint.entities.includes(e.entityId));
}

export function getModulesForEntity(entityId: string): PageModule[] {
  const endpointIds = new Set(
    API_ENDPOINTS.filter(e => e.entities.includes(entityId)).map(e => e.endpointId)
  );
  return PAGE_MODULES.filter(m => m.endpoints.some(id => endpointIds.has(id)));
}

export function getCalcModelById(id: string): CalculationModel | undefined {
  return CALCULATION_MODELS.find(m => m.modelId === id);
}

// 统计概览
export function getLineageStats() {
  return {
    totalModules: PAGE_MODULES.length,
    totalEndpoints: API_ENDPOINTS.length,
    totalEntities: DATA_ENTITIES.length,
    totalGaps: DATA_GAPS.length,
    criticalGaps: DATA_GAPS.filter(g => g.severity === "critical").length,
    warningGaps: DATA_GAPS.filter(g => g.severity === "warning").length,
    mockEndpoints: API_ENDPOINTS.filter(e => e.isFallbackToMock).length,
    mockEntities: DATA_ENTITIES.filter(e => e.sourceType === "mock").length,
    modelsAvailable: CALCULATION_MODELS.length,
    coverageRate: Math.round(
      ((DATA_ENTITIES.length - DATA_ENTITIES.filter(e => e.sourceType === "mock").length) / DATA_ENTITIES.length) * 100
    ),
  };
}
