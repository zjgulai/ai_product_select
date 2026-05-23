import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  int,
  json,
  text,
  decimal,
  boolean,
  date,
  index,
  uniqueIndex,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

// ========================================================================
// 保留现有表（DataManager依赖）
// ========================================================================

export const dataFiles = mysqlTable("data_files", {
  id: serial("id").primaryKey(),
  originalName: varchar("original_name", { length: 255 }).notNull(),
  fileName: varchar("file_name", { length: 255 }).notNull(),
  fileType: varchar("file_type", { length: 50 }).notNull(),
  fileSize: int("file_size").notNull(),
  rowCount: int("row_count").default(0),
  sheetNames: json("sheet_names").$type<string[]>().default([]),
  columns: json("columns").$type<{ name: string; type: string }[]>().default([]),
  status: varchar("status", { length: 20 }).notNull().default("active"),
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DataFile = typeof dataFiles.$inferSelect;

export const dataTemplates = mysqlTable("data_templates", {
  id: serial("id").primaryKey(),
  dataKey: varchar("data_key", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 100 }).notNull(),
  description: varchar("description", { length: 255 }),
  page: varchar("page", { length: 50 }).notNull(),
  module: varchar("module", { length: 50 }).notNull(),
  columns: json("columns").$type<{ key: string; label: string; type: "string" | "number" | "boolean" | "json" | "date" }[]>().notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type DataTemplate = typeof dataTemplates.$inferSelect;

export const dynamicData = mysqlTable("dynamic_data", {
  id: serial("id").primaryKey(),
  dataKey: varchar("data_key", { length: 100 }).notNull(),
  recordData: json("record_data").$type<Record<string, any>>().notNull(),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});

export type DynamicData = typeof dynamicData.$inferSelect;

// ========================================================================
// 新增业务表：Amazon商品
// ========================================================================

export const amazonProducts = mysqlTable("amazon_products", {
  id: serial("id").primaryKey(),
  asin: varchar("asin", { length: 20 }).notNull().unique(),
  title: text("title").notNull(),
  brand: varchar("brand", { length: 255 }),
  category: varchar("category", { length: 255 }),
  categoryPath: text("category_path"),
  price: decimal("price", { precision: 10, scale: 2 }),
  monthlySales: int("monthly_sales").default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 14, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("review_count").default(0),
  salesTrend: json("sales_trend").$type<number[]>().default([]),
  priceTrend: json("price_trend").$type<number[]>().default([]),
  bsrRank: int("bsr_rank"),              // Best Seller Rank
  launchDate: date("launch_date"),
  fulfillmentType: varchar("fulfillment_type", { length: 10 }), // FBA / FBM
  images: json("images").$type<string[]>().default([]),
  description: text("description"),
  bulletPoints: json("bullet_points").$type<string[]>().default([]),
  // TikTok关联
  tiktokVideoCount: int("tiktok_video_count").default(0),
  tiktokHeatScore: decimal("tiktok_heat_score", { precision: 5, scale: 2 }),
  // VOC分析结果（由NLP Pipeline填充）
  vocAspects: json("voc_aspects").$type<{ aspect: string; sentiment: "positive" | "negative" | "neutral"; count: number; ratio: string }[]>().default([]),
  vocSummary: text("voc_summary"),       // LLM生成的评论摘要
  // 时序
  scrapedAt: timestamp("scraped_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_amazon_category").on(table.category),
  index("idx_amazon_brand").on(table.brand),
  index("idx_amazon_monthly_sales").on(table.monthlySales),
  index("idx_amazon_rating").on(table.rating),
  index("idx_amazon_heat").on(table.tiktokHeatScore),
]);

export type AmazonProduct = typeof amazonProducts.$inferSelect;

// ========================================================================
// 新增业务表：Amazon评论（VOC核心）
// ========================================================================

export const amazonReviews = mysqlTable("amazon_reviews", {
  id: serial("id").primaryKey(),
  asin: varchar("asin", { length: 20 }).notNull(),
  reviewId: varchar("review_id", { length: 50 }).notNull().unique(),
  reviewerName: varchar("reviewer_name", { length: 255 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  title: text("title"),
  content: text("content"),
  helpfulCount: int("helpful_count").default(0),
  verifiedPurchase: boolean("verified_purchase").default(false),
  reviewDate: date("review_date"),
  // NLP分析结果
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral"]),
  aspects: json("aspects").$type<{ aspect: string; sentiment: "positive" | "negative" | "neutral" }[]>().default([]),
  keywords: json("keywords").$type<string[]>().default([]),
  // 分类标签
  isPositive: boolean("is_positive").default(false),
  isNegative: boolean("is_negative").default(false),
  isCritical: boolean("is_critical").default(false), // 1-2星评论标记为critical
  // 时序
  scrapedAt: timestamp("scraped_at").defaultNow(),
  analyzedAt: timestamp("analyzed_at"),
}, (table) => [
  index("idx_review_asin").on(table.asin),
  index("idx_review_sentiment").on(table.sentiment),
  index("idx_review_rating").on(table.rating),
  index("idx_review_date").on(table.reviewDate),
]);

export type AmazonReview = typeof amazonReviews.$inferSelect;

// ========================================================================
// 新增业务表：TikTok视频
// ========================================================================

export const tiktokVideos = mysqlTable("tiktok_videos", {
  id: serial("id").primaryKey(),
  videoId: varchar("video_id", { length: 100 }).notNull().unique(),
  creatorId: varchar("creator_id", { length: 100 }),
  creatorName: varchar("creator_name", { length: 255 }),
  title: text("title"),
  description: text("description"),
  hashtags: json("hashtags").$type<string[]>().default([]),
  duration: int("duration"), // 秒
  views: int("views").default(0),
  likes: int("likes").default(0),
  shares: int("shares").default(0),
  commentsCount: int("comments_count").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  monthlySales: int("monthly_sales").default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 14, scale: 2 }),
  // 产品关联
  productMentioned: json("product_mentioned").$type<{ name: string; asin?: string }[]>().default([]),
  // Amazon关联
  amazonAsins: json("amazon_asins").$type<string[]>().default([]),
  amazonCategoryMatch: varchar("amazon_category_match", { length: 255 }),
  // 时序
  postedAt: timestamp("posted_at"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
}, (table) => [
  index("idx_tiktok_creator").on(table.creatorId),
  index("idx_tiktok_views").on(table.views),
  index("idx_tiktok_engagement").on(table.engagementRate),
  index("idx_tiktok_posted").on(table.postedAt),
]);

export type TikTokVideo = typeof tiktokVideos.$inferSelect;

// ========================================================================
// 新增业务表：TikTok达人
// ========================================================================

export const tiktokCreators = mysqlTable("tiktok_creators", {
  id: serial("id").primaryKey(),
  creatorId: varchar("creator_id", { length: 100 }).notNull().unique(),
  username: varchar("username", { length: 255 }).notNull(),
  displayName: varchar("display_name", { length: 255 }),
  bio: text("bio"),
  avatar: text("avatar"),
  followers: int("followers").default(0),
  following: int("following").default(0),
  totalLikes: int("total_likes").default(0),
  videoCount: int("video_count").default(0),
  // 带货数据
  productsCount: int("products_count").default(0),
  avgViews: int("avg_views").default(0),
  monthlySales: int("monthly_sales").default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 14, scale: 2 }),
  videoGpm: decimal("video_gpm", { precision: 10, scale: 2 }),
  liveGpm: decimal("live_gpm", { precision: 10, scale: 2 }),
  // 分类
  accountType: varchar("account_type", { length: 20 }), // 个人运营 / 店铺运营
  categories: json("categories").$type<string[]>().default([]),
  // 时序
  fanGrowth: varchar("fan_growth", { length: 20 }),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});

export type TikTokCreator = typeof tiktokCreators.$inferSelect;

// ========================================================================
// 新增业务表：TikTok小店
// ========================================================================

export const tiktokShops = mysqlTable("tiktok_shops", {
  id: serial("id").primaryKey(),
  shopId: varchar("shop_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  country: varchar("country", { length: 50 }),
  category: varchar("category", { length: 255 }),
  logo: text("logo"),
  sales: int("sales").default(0),
  salesGrowth: varchar("sales_growth", { length: 20 }),
  revenue: decimal("revenue", { precision: 14, scale: 2 }),
  revenueGrowth: varchar("revenue_growth", { length: 20 }),
  activeProducts: int("active_products").default(0),
  totalProducts: int("total_products").default(0),
  newRatio: varchar("new_ratio", { length: 20 }),
  totalSales: int("total_sales").default(0),
  totalRevenue: decimal("total_revenue", { precision: 14, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  influencers: int("influencers").default(0),
  shopType: varchar("shop_type", { length: 20 }), // 本土店 / 跨境店
  scrapedAt: timestamp("scraped_at").defaultNow(),
});

export type TikTokShop = typeof tiktokShops.$inferSelect;

// ========================================================================
// 新增业务表：关键词映射（L1）
// ========================================================================

export const keywordMappings = mysqlTable("keyword_mappings", {
  id: serial("id").primaryKey(),
  tiktokKeyword: varchar("tiktok_keyword", { length: 255 }).notNull(),
  amazonKeyword: varchar("amazon_keyword", { length: 255 }).notNull(),
  similarityScore: decimal("similarity_score", { precision: 4, scale: 3 }),
  mappingType: mysqlEnum("mapping_type", ["auto", "manual", "confirmed"]).default("auto"),
  frequency: int("frequency").default(1),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_mapping_pair").on(table.tiktokKeyword, table.amazonKeyword),
  index("idx_mapping_tiktok").on(table.tiktokKeyword),
  index("idx_mapping_amazon").on(table.amazonKeyword),
]);

export type KeywordMapping = typeof keywordMappings.$inferSelect;

// ========================================================================
// 新增业务表：产品概念（L2）
// ========================================================================

export const productConcepts = mysqlTable("product_concepts", {
  id: serial("id").primaryKey(),
  conceptId: varchar("concept_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  description: text("description"),
  // TikTok侧
  tiktokKeywords: json("tiktok_keywords").$type<string[]>().default([]),
  tiktokHashtags: json("tiktok_hashtags").$type<string[]>().default([]),
  // Amazon侧
  amazonKeywords: json("amazon_keywords").$type<string[]>().default([]),
  amazonCategories: json("amazon_categories").$type<string[]>().default([]),
  // 属性
  keyFeatures: json("key_features").$type<string[]>().default([]),
  usageScenes: json("usage_scenes").$type<string[]>().default([]),
  // 映射质量
  confidence: decimal("confidence", { precision: 4, scale: 3 }),
  mappedAsins: json("mapped_asins").$type<string[]>().default([]),
  mappedVideos: json("mapped_videos").$type<string[]>().default([]),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});

export type ProductConcept = typeof productConcepts.$inferSelect;

// ========================================================================
// 新增业务表：概念指标（融合分析核心）
// ========================================================================

export const conceptMetrics = mysqlTable("concept_metrics", {
  id: serial("id").primaryKey(),
  conceptId: varchar("concept_id", { length: 100 }).notNull(),
  metricDate: date("metric_date").notNull(),
  // TikTok侧指标（SHI组成）
  tiktokVideoCount: int("tiktok_video_count").default(0),
  tiktokTotalViews: int("tiktok_total_views").default(0),
  tiktokTotalLikes: int("tiktok_total_likes").default(0),
  tiktokEngagementRate: decimal("tiktok_engagement_rate", { precision: 5, scale: 2 }),
  tiktokInfluencerCount: int("tiktok_influencer_count").default(0),
  tiktokHashtagGrowth: decimal("tiktok_hashtag_growth", { precision: 6, scale: 2 }),
  // Amazon侧指标（CVI组成）
  amazonProductCount: int("amazon_product_count").default(0),
  amazonTotalSales: int("amazon_total_sales").default(0),
  amazonAvgRating: decimal("amazon_avg_rating", { precision: 3, scale: 2 }),
  amazonReviewGrowth: decimal("amazon_review_growth", { precision: 6, scale: 2 }),
  amazonSellerCount: int("amazon_seller_count").default(0),
  amazonNewProductRatio: decimal("amazon_new_product_ratio", { precision: 5, scale: 2 }),
  // 融合指标
  shiScore: decimal("shi_score", { precision: 6, scale: 2 }),
  cviScore: decimal("cvi_score", { precision: 6, scale: 2 }),
  opportunityScore: decimal("opportunity_score", { precision: 6, scale: 2 }),
  trendMomentum: decimal("trend_momentum", { precision: 5, scale: 2 }),
  // VOC差异
  vocGapScore: decimal("voc_gap_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_metrics_concept_date").on(table.conceptId, table.metricDate),
  index("idx_metrics_opportunity").on(table.opportunityScore),
  index("idx_metrics_date").on(table.metricDate),
]);

export type ConceptMetric = typeof conceptMetrics.$inferSelect;

// ========================================================================
// 新增业务表：用户收藏
// ========================================================================

export const userFavorites = mysqlTable("user_favorites", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id", { length: 100 }).notNull(),
  itemType: mysqlEnum("item_type", ["amazon_product", "tiktok_video", "tiktok_creator", "tiktok_shop", "concept"]).notNull(),
  itemId: varchar("item_id", { length: 255 }).notNull(),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_fav_user_item").on(table.userId, table.itemType, table.itemId),
  index("idx_fav_user").on(table.userId),
]);

export type UserFavorite = typeof userFavorites.$inferSelect;

// ========================================================================
// 新增业务表：融合报告
// ========================================================================

export const fusionReports = mysqlTable("fusion_reports", {
  id: serial("id").primaryKey(),
  reportId: varchar("report_id", { length: 100 }).notNull().unique(),
  userId: varchar("user_id", { length: 100 }),
  title: varchar("title", { length: 500 }),
  queryKeyword: varchar("query_keyword", { length: 255 }),
  conceptId: varchar("concept_id", { length: 100 }),
  // 报告数据
  reportData: json("report_data").$type<Record<string, any>>().default({}),
  // 状态
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating"),
  // 文件
  pdfUrl: text("pdf_url"),
  // 时序
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});

export type FusionReport = typeof fusionReports.$inferSelect;
