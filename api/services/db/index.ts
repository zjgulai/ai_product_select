// ========================================================================
// 数据库查询层入口
// 提供统一的查询接口，自动回退到 mockData
// ========================================================================

import {
  dbGetAmazonProducts, dbGetAmazonProductByAsin, dbGetAmazonBrands,
  dbGetAmazonReviews, dbGetAmazonReviewStats,
  dbSearchAmazonKeywords, dbGetAmazonKeywordStats,
  dbGetHotMarket, dbGetPotMarket, dbGetParamMarket, dbGetBrandMarket,
} from "./amazonDb";

import {
  dbGetProductConcepts, dbGetProductConceptById,
  dbGetConceptMetrics, dbGetLatestMetrics,
  dbGetKeywordMappings,
  dbGetFusionReports, dbGetFusionReportById,
} from "./fusionDb";

import {
  dbGetTiktokProducts, dbGetTiktokCreators, dbGetTiktokShops,
  dbGetTiktokVideos, dbGetTiktokLives,
  dbGetHomeData, dbGetAnalysisData,
} from "./tiktokDb";

export {
  // Amazon
  dbGetAmazonProducts, dbGetAmazonProductByAsin, dbGetAmazonBrands,
  dbGetAmazonReviews, dbGetAmazonReviewStats,
  dbSearchAmazonKeywords, dbGetAmazonKeywordStats,
  dbGetHotMarket, dbGetPotMarket, dbGetParamMarket, dbGetBrandMarket,
  // Fusion
  dbGetProductConcepts, dbGetProductConceptById,
  dbGetConceptMetrics, dbGetLatestMetrics,
  dbGetKeywordMappings,
  dbGetFusionReports, dbGetFusionReportById,
  // TikTok
  dbGetTiktokProducts, dbGetTiktokCreators, dbGetTiktokShops,
  dbGetTiktokVideos, dbGetTiktokLives,
  dbGetHomeData, dbGetAnalysisData,
};
