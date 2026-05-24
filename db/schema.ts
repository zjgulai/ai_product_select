import {
  mysqlTable,
  serial,
  varchar,
  timestamp,
  int,
  bigint,
  json,
  text,
  decimal,
  boolean,
  date,
  index,
  uniqueIndex,
  mysqlEnum,
} from "drizzle-orm/mysql-core";

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
  columns: json("columns").$type<{
    key: string;
    label: string;
    type: "string" | "number" | "boolean" | "json" | "date";
    required?: boolean;
    aliasFor?: string;
    validRange?: [number, number];
  }[]>().notNull(),
  targetLayer: mysqlEnum("target_layer", ["ods", "dwd", "custom"]).default("custom"),
  targetTable: varchar("target_table", { length: 100 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type DataTemplate = typeof dataTemplates.$inferSelect;

export const dynamicData = mysqlTable("dynamic_data", {
  id: serial("id").primaryKey(),
  dataKey: varchar("data_key", { length: 100 }).notNull(),
  recordData: json("record_data").$type<Record<string, unknown>>().notNull(),
  sortOrder: int("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
}, (table) => [
  index("idx_dynamic_data_key").on(table.dataKey),
]);
export type DynamicData = typeof dynamicData.$inferSelect;

export const importLogs = mysqlTable("import_logs", {
  id: serial("id").primaryKey(),
  sourceType: mysqlEnum("source_type", ["excel", "api", "manual"]).notNull().default("excel"),
  dataKey: varchar("data_key", { length: 100 }).notNull(),
  targetLayer: mysqlEnum("target_layer", ["ods", "dwd", "custom"]).notNull().default("custom"),
  targetTable: varchar("target_table", { length: 100 }),
  fileRef: varchar("file_ref", { length: 255 }),
  totalRows: int("total_rows").default(0),
  successRows: int("success_rows").default(0),
  failedRows: int("failed_rows").default(0),
  errorSummary: json("error_summary").$type<{ row: number; field: string; message: string }[]>().default([]),
  status: mysqlEnum("status", ["pending", "running", "success", "partial", "failed"]).notNull().default("pending"),
  triggeredAt: timestamp("triggered_at").notNull().defaultNow(),
  completedAt: timestamp("completed_at"),
}, (table) => [
  index("idx_import_log_key").on(table.dataKey),
  index("idx_import_log_date").on(table.triggeredAt),
]);
export type ImportLog = typeof importLogs.$inferSelect;

// ============================================================
// 保留：现有业务表（ADS 层 + 现有功能依赖）
// ============================================================

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
  bsrRank: int("bsr_rank"),
  launchDate: date("launch_date"),
  fulfillmentType: varchar("fulfillment_type", { length: 10 }),
  images: json("images").$type<string[]>().default([]),
  description: text("description"),
  bulletPoints: json("bullet_points").$type<string[]>().default([]),
  tiktokVideoCount: int("tiktok_video_count").default(0),
  tiktokHeatScore: decimal("tiktok_heat_score", { precision: 5, scale: 2 }),
  vocAspects: json("voc_aspects").$type<{ aspect: string; sentiment: "positive" | "negative" | "neutral"; count: number; ratio: string }[]>().default([]),
  vocSummary: text("voc_summary"),
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
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral"]),
  aspects: json("aspects").$type<{ aspect: string; sentiment: "positive" | "negative" | "neutral" }[]>().default([]),
  keywords: json("keywords").$type<string[]>().default([]),
  isPositive: boolean("is_positive").default(false),
  isNegative: boolean("is_negative").default(false),
  isCritical: boolean("is_critical").default(false),
  scrapedAt: timestamp("scraped_at").defaultNow(),
  analyzedAt: timestamp("analyzed_at"),
}, (table) => [
  index("idx_review_asin").on(table.asin),
  index("idx_review_sentiment").on(table.sentiment),
  index("idx_review_rating").on(table.rating),
  index("idx_review_date").on(table.reviewDate),
]);
export type AmazonReview = typeof amazonReviews.$inferSelect;

export const tiktokVideos = mysqlTable("tiktok_videos", {
  id: serial("id").primaryKey(),
  videoId: varchar("video_id", { length: 100 }).notNull().unique(),
  creatorId: varchar("creator_id", { length: 100 }),
  creatorName: varchar("creator_name", { length: 255 }),
  title: text("title"),
  description: text("description"),
  hashtags: json("hashtags").$type<string[]>().default([]),
  duration: int("duration"),
  views: int("views").default(0),
  likes: int("likes").default(0),
  shares: int("shares").default(0),
  commentsCount: int("comments_count").default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  monthlySales: int("monthly_sales").default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 14, scale: 2 }),
  productMentioned: json("product_mentioned").$type<{ name: string; asin?: string }[]>().default([]),
  amazonAsins: json("amazon_asins").$type<string[]>().default([]),
  amazonCategoryMatch: varchar("amazon_category_match", { length: 255 }),
  postedAt: timestamp("posted_at"),
  scrapedAt: timestamp("scraped_at").defaultNow(),
}, (table) => [
  index("idx_tiktok_creator").on(table.creatorId),
  index("idx_tiktok_views").on(table.views),
  index("idx_tiktok_engagement").on(table.engagementRate),
  index("idx_tiktok_posted").on(table.postedAt),
]);
export type TikTokVideo = typeof tiktokVideos.$inferSelect;

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
  productsCount: int("products_count").default(0),
  avgViews: int("avg_views").default(0),
  monthlySales: int("monthly_sales").default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 14, scale: 2 }),
  videoGpm: decimal("video_gpm", { precision: 10, scale: 2 }),
  liveGpm: decimal("live_gpm", { precision: 10, scale: 2 }),
  accountType: varchar("account_type", { length: 20 }),
  categories: json("categories").$type<string[]>().default([]),
  fanGrowth: varchar("fan_growth", { length: 20 }),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});
export type TikTokCreator = typeof tiktokCreators.$inferSelect;

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
  shopType: varchar("shop_type", { length: 20 }),
  scrapedAt: timestamp("scraped_at").defaultNow(),
});
export type TikTokShop = typeof tiktokShops.$inferSelect;

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

export const productConcepts = mysqlTable("product_concepts", {
  id: serial("id").primaryKey(),
  conceptId: varchar("concept_id", { length: 100 }).notNull().unique(),
  name: varchar("name", { length: 255 }).notNull(),
  nameEn: varchar("name_en", { length: 255 }),
  description: text("description"),
  tiktokKeywords: json("tiktok_keywords").$type<string[]>().default([]),
  tiktokHashtags: json("tiktok_hashtags").$type<string[]>().default([]),
  amazonKeywords: json("amazon_keywords").$type<string[]>().default([]),
  amazonCategories: json("amazon_categories").$type<string[]>().default([]),
  keyFeatures: json("key_features").$type<string[]>().default([]),
  usageScenes: json("usage_scenes").$type<string[]>().default([]),
  confidence: decimal("confidence", { precision: 4, scale: 3 }),
  mappedAsins: json("mapped_asins").$type<string[]>().default([]),
  mappedVideos: json("mapped_videos").$type<string[]>().default([]),
  status: mysqlEnum("status", ["draft", "active", "archived"]).default("draft"),
  createdAt: timestamp("created_at").defaultNow(),
});
export type ProductConcept = typeof productConcepts.$inferSelect;

export const conceptMetrics = mysqlTable("concept_metrics", {
  id: serial("id").primaryKey(),
  conceptId: varchar("concept_id", { length: 100 }).notNull(),
  metricDate: date("metric_date").notNull(),
  tiktokVideoCount: int("tiktok_video_count").default(0),
  tiktokTotalViews: int("tiktok_total_views").default(0),
  tiktokTotalLikes: int("tiktok_total_likes").default(0),
  tiktokEngagementRate: decimal("tiktok_engagement_rate", { precision: 5, scale: 2 }),
  tiktokInfluencerCount: int("tiktok_influencer_count").default(0),
  tiktokHashtagGrowth: decimal("tiktok_hashtag_growth", { precision: 6, scale: 2 }),
  amazonProductCount: int("amazon_product_count").default(0),
  amazonTotalSales: int("amazon_total_sales").default(0),
  amazonAvgRating: decimal("amazon_avg_rating", { precision: 3, scale: 2 }),
  amazonReviewGrowth: decimal("amazon_review_growth", { precision: 6, scale: 2 }),
  amazonSellerCount: int("amazon_seller_count").default(0),
  amazonNewProductRatio: decimal("amazon_new_product_ratio", { precision: 5, scale: 2 }),
  amazonRevenueEstimate: decimal("amazon_revenue_estimate", { precision: 16, scale: 2 }),
  shiScore: decimal("shi_score", { precision: 6, scale: 2 }),
  cviScore: decimal("cvi_score", { precision: 6, scale: 2 }),
  opportunityScore: decimal("opportunity_score", { precision: 6, scale: 2 }),
  trendMomentum: decimal("trend_momentum", { precision: 5, scale: 2 }),
  vocGapScore: decimal("voc_gap_score", { precision: 5, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_metrics_concept_date").on(table.conceptId, table.metricDate),
  index("idx_metrics_opportunity").on(table.opportunityScore),
  index("idx_metrics_date").on(table.metricDate),
  index("idx_metrics_shi").on(table.shiScore),
  index("idx_metrics_cvi").on(table.cviScore),
]);
export type ConceptMetric = typeof conceptMetrics.$inferSelect;

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

export const fusionReports = mysqlTable("fusion_reports", {
  id: serial("id").primaryKey(),
  reportId: varchar("report_id", { length: 100 }).notNull().unique(),
  userId: varchar("user_id", { length: 100 }),
  title: varchar("title", { length: 500 }),
  queryKeyword: varchar("query_keyword", { length: 255 }),
  conceptId: varchar("concept_id", { length: 100 }),
  reportData: json("report_data").$type<Record<string, unknown>>().default({}),
  status: mysqlEnum("status", ["generating", "completed", "failed"]).default("generating"),
  pdfUrl: text("pdf_url"),
  createdAt: timestamp("created_at").defaultNow(),
  completedAt: timestamp("completed_at"),
});
export type FusionReport = typeof fusionReports.$inferSelect;

// ============================================================
// 新增：ODS 原始数据层（Raw 快照，按 snapshot_date 分区）
// ============================================================

export const odsTiktokProducts = mysqlTable("ods_tiktok_products", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  productId: varchar("product_id", { length: 100 }).notNull(),
  productName: text("product_name"),
  category: varchar("category", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  salesGrowth: varchar("sales_growth", { length: 20 }),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  influencerCount: int("influencer_count").default(0),
  shopType: varchar("shop_type", { length: 20 }),
  date: varchar("date", { length: 20 }),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_tt_products_date").on(table.snapshotDate),
  index("idx_ods_tt_products_id").on(table.productId),
  index("idx_ods_tt_products_import").on(table.importId),
]);
export type OdsTiktokProduct = typeof odsTiktokProducts.$inferSelect;

export const odsTiktokCreators = mysqlTable("ods_tiktok_creators", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  creatorId: varchar("creator_id", { length: 100 }).notNull(),
  username: varchar("username", { length: 255 }),
  displayName: varchar("display_name", { length: 255 }),
  followers: bigint("followers", { mode: "number" }).default(0),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  videoGpm: decimal("video_gpm", { precision: 10, scale: 2 }),
  liveGpm: decimal("live_gpm", { precision: 10, scale: 2 }),
  categories: json("categories").$type<string[]>().default([]),
  fanGrowthRate: decimal("fan_growth_rate", { precision: 6, scale: 2 }),
  accountType: varchar("account_type", { length: 20 }),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_tt_creators_date").on(table.snapshotDate),
  index("idx_ods_tt_creators_id").on(table.creatorId),
]);
export type OdsTiktokCreator = typeof odsTiktokCreators.$inferSelect;

export const odsTiktokShops = mysqlTable("ods_tiktok_shops", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  shopId: varchar("shop_id", { length: 100 }).notNull(),
  name: varchar("name", { length: 255 }),
  country: varchar("country", { length: 50 }),
  category: varchar("category", { length: 255 }),
  sales: bigint("sales", { mode: "number" }).default(0),
  salesGrowth: varchar("sales_growth", { length: 20 }),
  revenue: decimal("revenue", { precision: 16, scale: 2 }),
  activeProducts: int("active_products").default(0),
  totalProducts: int("total_products").default(0),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  influencers: int("influencers").default(0),
  shopType: varchar("shop_type", { length: 20 }),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_tt_shops_date").on(table.snapshotDate),
  index("idx_ods_tt_shops_id").on(table.shopId),
]);
export type OdsTiktokShop = typeof odsTiktokShops.$inferSelect;

export const odsTiktokVideos = mysqlTable("ods_tiktok_videos", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  videoId: varchar("video_id", { length: 100 }).notNull(),
  title: text("title"),
  creatorId: varchar("creator_id", { length: 100 }),
  views: bigint("views", { mode: "number" }).default(0),
  likes: bigint("likes", { mode: "number" }).default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  hashtags: json("hashtags").$type<string[]>().default([]),
  postedAt: varchar("posted_at", { length: 30 }),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_tt_videos_date").on(table.snapshotDate),
  index("idx_ods_tt_videos_id").on(table.videoId),
]);
export type OdsTiktokVideo = typeof odsTiktokVideos.$inferSelect;

export const odsTiktokLives = mysqlTable("ods_tiktok_lives", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  liveId: varchar("live_id", { length: 100 }).notNull(),
  title: text("title"),
  creatorId: varchar("creator_id", { length: 100 }),
  viewers: bigint("viewers", { mode: "number" }).default(0),
  maxOnline: int("max_online").default(0),
  likes: bigint("likes", { mode: "number" }).default(0),
  duration: int("duration").default(0),
  gpm: decimal("gpm", { precision: 10, scale: 2 }),
  status: varchar("status", { length: 20 }),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_tt_lives_date").on(table.snapshotDate),
]);
export type OdsTiktokLive = typeof odsTiktokLives.$inferSelect;

export const odsAmazonProducts = mysqlTable("ods_amazon_products", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  asin: varchar("asin", { length: 20 }).notNull(),
  title: text("title"),
  brand: varchar("brand", { length: 255 }),
  category: varchar("category", { length: 255 }),
  categoryPath: text("category_path"),
  price: decimal("price", { precision: 10, scale: 2 }),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  bsrRank: int("bsr_rank"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("review_count").default(0),
  fulfillmentType: varchar("fulfillment_type", { length: 10 }),
  launchDate: varchar("launch_date", { length: 20 }),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_amz_products_date").on(table.snapshotDate),
  index("idx_ods_amz_products_asin").on(table.asin),
  index("idx_ods_amz_products_category").on(table.category),
  index("idx_ods_amz_products_brand").on(table.brand),
]);
export type OdsAmazonProduct = typeof odsAmazonProducts.$inferSelect;

export const odsAmazonKeywords = mysqlTable("ods_amazon_keywords", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  searchVolume: bigint("search_volume", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  top3Share: decimal("top3_share", { precision: 5, scale: 2 }),
  newProductShare: decimal("new_product_share", { precision: 5, scale: 2 }),
  competitionLevel: varchar("competition_level", { length: 20 }),
  topBrands: json("top_brands").$type<string[]>().default([]),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_amz_kw_date").on(table.snapshotDate),
  index("idx_ods_amz_kw_keyword").on(table.keyword),
]);
export type OdsAmazonKeyword = typeof odsAmazonKeywords.$inferSelect;

export const odsAmazonReviews = mysqlTable("ods_amazon_reviews", {
  id: serial("id").primaryKey(),
  snapshotDate: date("snapshot_date").notNull(),
  importId: int("import_id"),
  reviewId: varchar("review_id", { length: 100 }).notNull(),
  asin: varchar("asin", { length: 20 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  sentiment: varchar("sentiment", { length: 20 }),
  content: text("content"),
  title: text("title"),
  reviewDate: varchar("review_date", { length: 20 }),
  verifiedPurchase: boolean("verified_purchase").default(false),
  helpfulCount: int("helpful_count").default(0),
  rawData: json("raw_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ods_amz_reviews_date").on(table.snapshotDate),
  index("idx_ods_amz_reviews_asin").on(table.asin),
]);
export type OdsAmazonReview = typeof odsAmazonReviews.$inferSelect;

// ============================================================
// 新增：DWD 标准化明细层
// ============================================================

export const dwdTiktokProductDaily = mysqlTable("dwd_tiktok_product_daily", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  productId: varchar("product_id", { length: 100 }).notNull(),
  productName: text("product_name"),
  category: varchar("category", { length: 255 }),
  price: decimal("price", { precision: 10, scale: 2 }),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  salesGrowthRate: decimal("sales_growth_rate", { precision: 6, scale: 2 }),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  influencerCount: int("influencer_count").default(0),
  shopType: varchar("shop_type", { length: 20 }),
  isCarrying: boolean("is_carrying").default(false),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dwd_tt_prod_date_id").on(table.statDate, table.productId),
  index("idx_dwd_tt_prod_date").on(table.statDate),
  index("idx_dwd_tt_prod_category").on(table.category),
]);
export type DwdTiktokProductDaily = typeof dwdTiktokProductDaily.$inferSelect;

export const dwdTiktokCreatorDaily = mysqlTable("dwd_tiktok_creator_daily", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  creatorId: varchar("creator_id", { length: 100 }).notNull(),
  username: varchar("username", { length: 255 }),
  followers: bigint("followers", { mode: "number" }).default(0),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  videoGpm: decimal("video_gpm", { precision: 10, scale: 2 }),
  liveGpm: decimal("live_gpm", { precision: 10, scale: 2 }),
  fanGrowthRate: decimal("fan_growth_rate", { precision: 6, scale: 2 }),
  primaryCategory: varchar("primary_category", { length: 100 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dwd_tt_cre_date_id").on(table.statDate, table.creatorId),
  index("idx_dwd_tt_cre_date").on(table.statDate),
]);
export type DwdTiktokCreatorDaily = typeof dwdTiktokCreatorDaily.$inferSelect;

export const dwdAmazonProductDaily = mysqlTable("dwd_amazon_product_daily", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  asin: varchar("asin", { length: 20 }).notNull(),
  title: text("title"),
  brand: varchar("brand", { length: 255 }),
  category: varchar("category", { length: 255 }),
  categoryPath: text("category_path"),
  price: decimal("price", { precision: 10, scale: 2 }),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  bsrRank: int("bsr_rank"),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  reviewCount: int("review_count").default(0),
  fulfillmentType: varchar("fulfillment_type", { length: 10 }),
  launchDate: varchar("launch_date", { length: 20 }),
  isNewProduct: boolean("is_new_product").default(false),
  salesGrowthMom: decimal("sales_growth_mom", { precision: 6, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dwd_amz_prod_date_asin").on(table.statDate, table.asin),
  index("idx_dwd_amz_prod_date").on(table.statDate),
  index("idx_dwd_amz_prod_category").on(table.category),
  index("idx_dwd_amz_prod_brand").on(table.brand),
  index("idx_dwd_amz_prod_sales").on(table.monthlySales),
]);
export type DwdAmazonProductDaily = typeof dwdAmazonProductDaily.$inferSelect;

export const dwdAmazonKeywordWeekly = mysqlTable("dwd_amazon_keyword_weekly", {
  id: serial("id").primaryKey(),
  weekStartDate: date("week_start_date").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  searchVolume: bigint("search_volume", { mode: "number" }).default(0),
  monthlySalesTotal: bigint("monthly_sales_total", { mode: "number" }).default(0),
  totalRevenue: decimal("total_revenue", { precision: 16, scale: 2 }),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  top3Share: decimal("top3_share", { precision: 5, scale: 2 }),
  newProductShare: decimal("new_product_share", { precision: 5, scale: 2 }),
  competitionLevel: varchar("competition_level", { length: 20 }),
  effectiveSkuCount: int("effective_sku_count").default(0),
  topBrands: json("top_brands").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dwd_amz_kw_week_kw").on(table.weekStartDate, table.keyword),
  index("idx_dwd_amz_kw_week").on(table.weekStartDate),
  index("idx_dwd_amz_kw_keyword").on(table.keyword),
]);
export type DwdAmazonKeywordWeekly = typeof dwdAmazonKeywordWeekly.$inferSelect;

export const dwdAmazonReview = mysqlTable("dwd_amazon_review", {
  id: serial("id").primaryKey(),
  reviewId: varchar("review_id", { length: 100 }).notNull().unique(),
  asin: varchar("asin", { length: 20 }).notNull(),
  rating: decimal("rating", { precision: 3, scale: 2 }),
  sentiment: mysqlEnum("sentiment", ["positive", "negative", "neutral"]),
  aspects: json("aspects").$type<{ aspect: string; sentiment: "positive" | "negative" | "neutral" }[]>().default([]),
  keywords: json("keywords").$type<string[]>().default([]),
  reviewDate: varchar("review_date", { length: 20 }),
  isVerified: boolean("is_verified").default(false),
  helpfulCount: int("helpful_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_dwd_review_asin").on(table.asin),
  index("idx_dwd_review_sentiment").on(table.sentiment),
  index("idx_dwd_review_date").on(table.reviewDate),
]);
export type DwdAmazonReview = typeof dwdAmazonReview.$inferSelect;

// ============================================================
// 新增：DWS 汇总层（支撑 SHI/CVI 计算）
// ============================================================

export const dwsTiktokCategoryDaily = mysqlTable("dws_tiktok_category_daily", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  category: varchar("category", { length: 255 }).notNull(),
  videoCount: bigint("video_count", { mode: "number" }).default(0),
  totalViews: bigint("total_views", { mode: "number" }).default(0),
  totalLikes: bigint("total_likes", { mode: "number" }).default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  videoGrowthRate: decimal("video_growth_rate", { precision: 6, scale: 2 }),
  carryingVideoCount: int("carrying_video_count").default(0),
  carryingVideoRatio: decimal("carrying_video_ratio", { precision: 5, scale: 2 }),
  shopProductCount: int("shop_product_count").default(0),
  hashtags: json("hashtags").$type<{ tag: string; heat: number }[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dws_tt_cat_date_cat").on(table.statDate, table.category),
  index("idx_dws_tt_cat_date").on(table.statDate),
]);
export type DwsTiktokCategoryDaily = typeof dwsTiktokCategoryDaily.$inferSelect;

export const dwsTiktokConceptDaily = mysqlTable("dws_tiktok_concept_daily", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  conceptId: varchar("concept_id", { length: 100 }).notNull(),
  conceptName: varchar("concept_name", { length: 255 }),
  videoCount: bigint("video_count", { mode: "number" }).default(0),
  videoCountPrev7d: bigint("video_count_prev7d", { mode: "number" }).default(0),
  videoGrowthRate: decimal("video_growth_rate", { precision: 6, scale: 2 }),
  totalViews: bigint("total_views", { mode: "number" }).default(0),
  engagementRate: decimal("engagement_rate", { precision: 5, scale: 2 }),
  carryingRatio: decimal("carrying_ratio", { precision: 5, scale: 2 }),
  hashtags: json("hashtags").$type<{ tag: string; heat: number }[]>().default([]),
  hashtag_heat_total: bigint("hashtag_heat_total", { mode: "number" }).default(0),
  influencerCount: int("influencer_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dws_tt_concept_date_id").on(table.statDate, table.conceptId),
  index("idx_dws_tt_concept_date").on(table.statDate),
  index("idx_dws_tt_concept_id").on(table.conceptId),
]);
export type DwsTiktokConceptDaily = typeof dwsTiktokConceptDaily.$inferSelect;

export const dwsAmazonConceptWeekly = mysqlTable("dws_amazon_concept_weekly", {
  id: serial("id").primaryKey(),
  weekStartDate: date("week_start_date").notNull(),
  conceptId: varchar("concept_id", { length: 100 }).notNull(),
  conceptName: varchar("concept_name", { length: 255 }),
  totalMonthlySales: bigint("total_monthly_sales", { mode: "number" }).default(0),
  totalRevenue: decimal("total_revenue", { precision: 16, scale: 2 }),
  effectiveSkuCount: int("effective_sku_count").default(0),
  totalSkuCount: int("total_sku_count").default(0),
  salesGrowthRate: decimal("sales_growth_rate", { precision: 6, scale: 2 }),
  newProductCount: int("new_product_count").default(0),
  newProductRatio: decimal("new_product_ratio", { precision: 5, scale: 2 }),
  top3BrandShare: decimal("top3_brand_share", { precision: 5, scale: 2 }),
  avgReviewCount: decimal("avg_review_count", { precision: 10, scale: 2 }),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dws_amz_concept_week_id").on(table.weekStartDate, table.conceptId),
  index("idx_dws_amz_concept_week").on(table.weekStartDate),
  index("idx_dws_amz_concept_id").on(table.conceptId),
]);
export type DwsAmazonConceptWeekly = typeof dwsAmazonConceptWeekly.$inferSelect;

export const dwsAmazonKeywordRankingDaily = mysqlTable("dws_amazon_keyword_ranking_daily", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  rank: int("rank").default(0),
  salesTotal: bigint("sales_total", { mode: "number" }).default(0),
  revenueTotal: decimal("revenue_total", { precision: 16, scale: 2 }),
  revenueGrowthRate: decimal("revenue_growth_rate", { precision: 6, scale: 2 }),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  top3Share: decimal("top3_share", { precision: 5, scale: 2 }),
  newShare: decimal("new_share", { precision: 5, scale: 2 }),
  competitionLevel: varchar("competition_level", { length: 20 }),
  topBrands: json("top_brands").$type<string[]>().default([]),
  topAttributes: json("top_attributes").$type<string[]>().default([]),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_dws_amz_kw_rank_date_kw").on(table.statDate, table.keyword),
  index("idx_dws_amz_kw_rank_date").on(table.statDate),
  index("idx_dws_amz_kw_rank_kw").on(table.keyword),
]);
export type DwsAmazonKeywordRankingDaily = typeof dwsAmazonKeywordRankingDaily.$inferSelect;

// ============================================================
// 新增：ADS 应用层（直接服务前端 tRPC API）
// ============================================================

export const adsTiktokHomeRanking = mysqlTable("ads_tiktok_home_ranking", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  rankType: mysqlEnum("rank_type", ["products_hot", "products_soaring", "products_new", "influencers_sales", "influencers_fans", "shops_hot", "videos_hot", "lives_popular"]).notNull(),
  rank: int("rank").notNull(),
  entityId: varchar("entity_id", { length: 255 }).notNull(),
  entityName: text("entity_name"),
  keyMetric: varchar("key_metric", { length: 50 }),
  extraData: json("extra_data").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ads_home_date_type").on(table.statDate, table.rankType),
  index("idx_ads_home_date").on(table.statDate),
]);
export type AdsTiktokHomeRanking = typeof adsTiktokHomeRanking.$inferSelect;

export const adsTiktokAnalysisKpi = mysqlTable("ads_tiktok_analysis_kpi", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  timeRange: mysqlEnum("time_range", ["7d", "30d"]).notNull().default("7d"),
  totalSales: bigint("total_sales", { mode: "number" }).default(0),
  totalRevenue: decimal("total_revenue", { precision: 18, scale: 2 }),
  activeProducts: bigint("active_products", { mode: "number" }).default(0),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
  newProducts: bigint("new_products", { mode: "number" }).default(0),
  newProductRevenue: decimal("new_product_revenue", { precision: 16, scale: 2 }),
  salesTrend: varchar("sales_trend", { length: 20 }),
  salesTrendUp: boolean("sales_trend_up").default(true),
  revenueTrend: varchar("revenue_trend", { length: 20 }),
  revenueTrendUp: boolean("revenue_trend_up").default(true),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  uniqueIndex("idx_ads_kpi_date_range").on(table.statDate, table.timeRange),
  index("idx_ads_kpi_date").on(table.statDate),
]);
export type AdsTiktokAnalysisKpi = typeof adsTiktokAnalysisKpi.$inferSelect;

export const adsAmazonMarketSummary = mysqlTable("ads_amazon_market_summary", {
  id: serial("id").primaryKey(),
  statDate: date("stat_date").notNull(),
  marketType: mysqlEnum("market_type", ["hot", "pot", "param", "brand"]).notNull(),
  rank: int("rank").notNull(),
  keyword: varchar("keyword", { length: 255 }).notNull(),
  trendData: json("trend_data").$type<number[]>().default([]),
  monthlySales: bigint("monthly_sales", { mode: "number" }).default(0),
  salesGrowth: varchar("sales_growth", { length: 20 }),
  monthlyRevenue: decimal("monthly_revenue", { precision: 16, scale: 2 }),
  revenueGrowth: varchar("revenue_growth", { length: 20 }),
  avgPrice: decimal("avg_price", { precision: 10, scale: 2 }),
  avgRating: decimal("avg_rating", { precision: 3, scale: 2 }),
  reviewsAvg: int("reviews_avg").default(0),
  competitionLevel: varchar("competition_level", { length: 20 }),
  top3Share: varchar("top3_share", { length: 20 }),
  newProductShare: varchar("new_product_share", { length: 20 }),
  topBrands: json("top_brands").$type<string[]>().default([]),
  topAttributes: json("top_attributes").$type<string[]>().default([]),
  potentialLevel: varchar("potential_level", { length: 20 }),
  createdAt: timestamp("created_at").defaultNow(),
}, (table) => [
  index("idx_ads_amz_market_date_type").on(table.statDate, table.marketType),
  uniqueIndex("idx_ads_amz_market_date_type_rank").on(table.statDate, table.marketType, table.rank),
]);
export type AdsAmazonMarketSummary = typeof adsAmazonMarketSummary.$inferSelect;

// ============================================================
// 新增：IPMS 项目跟踪系统
// ============================================================

export const ipmsProjects = mysqlTable("ipms_projects", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id", { length: 50 }).notNull().unique(),
  conceptId: varchar("concept_id", { length: 50 }),
  projectName: varchar("project_name", { length: 255 }).notNull(),
  description: text("description"),
  currentStage: mysqlEnum("current_stage", ["charter", "concept", "plan", "develop", "qualify", "launch"]).notNull().default("charter"),
  status: mysqlEnum("status", ["active", "paused", "completed", "cancelled"]).notNull().default("active"),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).notNull().default("medium"),
  owner: varchar("owner", { length: 100 }),
  targetLaunchDate: date("target_launch_date"),
  actualLaunchDate: date("actual_launch_date"),
  metadata: json("metadata").$type<Record<string, unknown>>().default({}),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow().onUpdateNow(),
});
export type IpmsProject = typeof ipmsProjects.$inferSelect;

export const ipmsStageHistory = mysqlTable("ipms_stage_history", {
  id: serial("id").primaryKey(),
  projectId: varchar("project_id", { length: 50 }).notNull(),
  stage: mysqlEnum("stage", ["charter", "concept", "plan", "develop", "qualify", "launch"]).notNull(),
  status: mysqlEnum("status", ["pending", "in_progress", "completed", "skipped"]).notNull().default("pending"),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  deliverables: json("deliverables").$type<string[]>().default([]),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
export type IpmsStageHistory = typeof ipmsStageHistory.$inferSelect;
