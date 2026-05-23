import type { ConceptMetric, DwsTiktokConceptDaily, DwsAmazonConceptWeekly } from "@db/schema";

export interface SHIInputs {
  videoCount: number;
  videoCountPrev7d: number;
  totalViews: number;
  engagementRate: number;
  carryingRatio: number;
  hashtagHeatTotal: number;
  categoryMaxVideoCount: number;
}

export interface CVIInputs {
  totalMonthlySales: number;
  totalRevenue: number;
  effectiveSkuCount: number;
  salesGrowthRate: number;
  newProductCount: number;
  newProductRatio: number;
  top3BrandShare: number;
  avgReviewCount: number;
  categoryMaxSales: number;
}

export interface FusionScores {
  shiScore: number;
  cviScore: number;
  oppScore: number;
  trendMomentum: number;
  vocGapScore: number;
  shiBreakdown: {
    videoVolumeScore: number;
    growthScore: number;
    viewsScore: number;
    engagementScore: number;
    carryingScore: number;
    hashtagScore: number;
  };
  cviBreakdown: {
    marketSizeScore: number;
    supplyDemandScore: number;
    growthScore: number;
    newProductScore: number;
    concentrationScore: number;
    reviewBarrierScore: number;
  };
  opportunityQuadrant: "gold" | "leading" | "following" | "watch";
}

const IDEAL_COMPETITOR_COUNT = 30;

function clamp(val: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, val));
}

export function calculateSHI(inputs: SHIInputs): {
  score: number;
  breakdown: FusionScores["shiBreakdown"];
} {
  const normMax = Math.max(inputs.categoryMaxVideoCount, 1);

  const videoVolumeScore = clamp((inputs.videoCount / normMax) * 100);

  const growthRate = inputs.videoCountPrev7d > 0
    ? (inputs.videoCount - inputs.videoCountPrev7d) / inputs.videoCountPrev7d
    : 0;
  const growthScore = clamp(growthRate * 100 + 50, 0, 100);

  const viewsScore = clamp(Math.log10(inputs.totalViews + 1) / Math.log10(10_000_000) * 100);

  const engagementScore = clamp(inputs.engagementRate * 20);

  const carryingScore = clamp(inputs.carryingRatio * 100);

  const hashtagScore = clamp(Math.log10(inputs.hashtagHeatTotal + 1) / Math.log10(100_000_000) * 100);

  const rawScore =
    videoVolumeScore * 0.15 +
    growthScore      * 0.25 +
    viewsScore       * 0.20 +
    engagementScore  * 0.20 +
    carryingScore    * 0.10 +
    hashtagScore     * 0.10;

  return {
    score: clamp(rawScore),
    breakdown: {
      videoVolumeScore,
      growthScore,
      viewsScore,
      engagementScore,
      carryingScore,
      hashtagScore,
    },
  };
}

export function calculateCVI(inputs: CVIInputs): {
  score: number;
  breakdown: FusionScores["cviBreakdown"];
} {
  const maxSales = Math.max(inputs.categoryMaxSales, 1);

  const marketSizeScore = clamp(
    (Math.log10(inputs.totalMonthlySales + 1) / Math.log10(maxSales)) * 100
  );

  const supplyDemandScore = clamp(
    (1 - Math.min(1, inputs.effectiveSkuCount / IDEAL_COMPETITOR_COUNT)) * 100
  );

  const growthScore = clamp(inputs.salesGrowthRate * 500);

  const newProductScore = clamp(
    Math.min(1, inputs.newProductRatio * 3) * 100
  );

  const concentrationScore = clamp((1 - inputs.top3BrandShare) * 100);

  const reviewBarrierScore = clamp(
    (1 - Math.min(1, inputs.avgReviewCount / 500)) * 100
  );

  const rawScore =
    marketSizeScore      * 0.30 +
    supplyDemandScore    * 0.25 +
    growthScore          * 0.20 +
    newProductScore      * 0.10 +
    concentrationScore   * 0.10 +
    reviewBarrierScore   * 0.05;

  return {
    score: clamp(rawScore),
    breakdown: {
      marketSizeScore,
      supplyDemandScore,
      growthScore,
      newProductScore,
      concentrationScore,
      reviewBarrierScore,
    },
  };
}

export function calculateOppScore(
  shi: number,
  cvi: number,
  trendMomentum: number
): { score: number; quadrant: FusionScores["opportunityQuadrant"] } {
  const saturation = Math.min(100, (100 - cvi));

  const base =
    shi          * 0.45 +
    cvi          * 0.35 +
    clamp(trendMomentum * 50) * 0.20;

  let windowMultiplier = 1.0;
  if (shi >= 60 && shi < 80 && cvi >= 50) windowMultiplier = 1.20;
  else if (shi >= 80 && cvi >= 50) windowMultiplier = 1.10;
  void saturation;

  const score = clamp(base * windowMultiplier);

  let quadrant: FusionScores["opportunityQuadrant"];
  if (shi >= 60 && cvi >= 50) quadrant = "gold";
  else if (shi >= 60 && cvi < 50) quadrant = "leading";
  else if (shi < 60 && cvi >= 50) quadrant = "following";
  else quadrant = "watch";

  return { score, quadrant };
}

export function calculateTrendMomentum(
  shi7dAvg: number,
  shi30dAvg: number
): number {
  if (shi30dAvg === 0) return 1.0;
  return Math.min(3.0, shi7dAvg / shi30dAvg);
}

export function calculateVocGapScore(aspects: {
  aspect: string;
  positiveCount: number;
  negativeCount: number;
  totalCount: number;
  mentionRate: number;
}[]): number {
  if (aspects.length === 0) return 0;
  const negativeAspects = aspects.filter(a => a.negativeCount / Math.max(a.totalCount, 1) > 0.3);
  const gapScore = (negativeAspects.length / aspects.length) * 100;
  return clamp(gapScore);
}

export function computeConceptMetrics(
  tiktokRow: DwsTiktokConceptDaily,
  amazonRow: DwsAmazonConceptWeekly | null,
  categoryMaxVideoCount: number,
  categoryMaxSales: number,
  prevShi: number | null
): Omit<ConceptMetric, "id" | "createdAt"> {
  const shiResult = calculateSHI({
    videoCount: tiktokRow.videoCount ?? 0,
    videoCountPrev7d: tiktokRow.videoCountPrev7d ?? 0,
    totalViews: tiktokRow.totalViews ?? 0,
    engagementRate: parseFloat(String(tiktokRow.engagementRate ?? 0)),
    carryingRatio: parseFloat(String(tiktokRow.carryingRatio ?? 0)) / 100,
    hashtagHeatTotal: tiktokRow.hashtag_heat_total ?? 0,
    categoryMaxVideoCount,
  });

  const cviResult = amazonRow
    ? calculateCVI({
        totalMonthlySales: amazonRow.totalMonthlySales ?? 0,
        totalRevenue: parseFloat(String(amazonRow.totalRevenue ?? 0)),
        effectiveSkuCount: amazonRow.effectiveSkuCount ?? 0,
        salesGrowthRate: parseFloat(String(amazonRow.salesGrowthRate ?? 0)) / 100,
        newProductCount: amazonRow.newProductCount ?? 0,
        newProductRatio: parseFloat(String(amazonRow.newProductRatio ?? 0)) / 100,
        top3BrandShare: parseFloat(String(amazonRow.top3BrandShare ?? 0)) / 100,
        avgReviewCount: parseFloat(String(amazonRow.avgReviewCount ?? 0)),
        categoryMaxSales,
      })
    : { score: 0, breakdown: { marketSizeScore: 0, supplyDemandScore: 0, growthScore: 0, newProductScore: 0, concentrationScore: 0, reviewBarrierScore: 0 } };

  const trendMomentum = calculateTrendMomentum(
    shiResult.score,
    prevShi ?? shiResult.score
  );

  const { score: oppScore } = calculateOppScore(shiResult.score, cviResult.score, trendMomentum);

  return {
    conceptId: tiktokRow.conceptId,
    metricDate: tiktokRow.statDate,
    tiktokVideoCount: tiktokRow.videoCount ?? 0,
    tiktokTotalViews: tiktokRow.totalViews ?? 0,
    tiktokTotalLikes: 0,
    tiktokEngagementRate: String(parseFloat(String(tiktokRow.engagementRate ?? 0)).toFixed(2)) as unknown as null,
    tiktokInfluencerCount: tiktokRow.influencerCount ?? 0,
    tiktokHashtagGrowth: String(parseFloat(String(tiktokRow.videoGrowthRate ?? 0)).toFixed(2)) as unknown as null,
    amazonProductCount: amazonRow?.totalSkuCount ?? 0,
    amazonTotalSales: amazonRow?.totalMonthlySales ?? 0,
    amazonAvgRating: amazonRow?.avgRating ?? null,
    amazonReviewGrowth: null,
    amazonSellerCount: amazonRow?.effectiveSkuCount ?? 0,
    amazonNewProductRatio: amazonRow?.newProductRatio ?? null,
    amazonRevenueEstimate: amazonRow?.totalRevenue ?? null,
    shiScore: String(shiResult.score.toFixed(2)) as unknown as null,
    cviScore: String(cviResult.score.toFixed(2)) as unknown as null,
    opportunityScore: String(oppScore.toFixed(2)) as unknown as null,
    trendMomentum: String(trendMomentum.toFixed(2)) as unknown as null,
    vocGapScore: null,
  };
}
