// ========================================================================
// Fusion 融合数据服务层 — 使用 realistic 母婴品类数据
// ========================================================================

import { CONCEPTS_DATA, CONCEPT_METRICS } from "@/data/generated";

export interface ProductConcept {
  id: number; conceptId: string; name: string; nameEn: string | null;
  description: string | null; tiktokKeywords: string[]; tiktokHashtags: string[];
  amazonKeywords: string[]; amazonCategories: string[]; keyFeatures: string[];
  usageScenes: string[]; confidence: number | null; mappedAsins: string[];
  mappedVideos: string[]; status: string; createdAt: string | null;
}

export interface ConceptMetric {
  conceptId: string; conceptName: string; metricDate: string;
  tiktokVideoCount: number; tiktokTotalViews: number;
  tiktokEngagementRate: number; tiktokInfluencerCount: number;
  amazonProductCount: number; amazonTotalSales: number; amazonAvgRating: number;
  shiScore: string; cviScore: string; opportunityScore: string;
  trendMomentum: number; vocGapScore: number;
}

export interface KeywordMapping {
  id: number; conceptId: string; tiktokKeyword: string;
  amazonKeyword: string; relevance: number; source: string;
}

export interface FusionReport {
  reportId: string; conceptId: string; conceptName: string; title: string;
  reportDate: string; summary: string; opportunityScore: number;
  shiScore: number; cviScore: number; strengths: string[];
  risks: string[]; recommendations: string[];
  sections: { title: string; content: string }[];
}

function safeParse(val: unknown): string[] {
  if (Array.isArray(val)) return val as string[];
  if (typeof val === "string") {
    try { return JSON.parse(val); } catch { return []; }
  }
  return [];
}

function adaptConcepts(raw: any[]): ProductConcept[] {
  return raw.map((r, i) => ({
    id: i + 1, conceptId: r.concept_id, name: r.name, nameEn: r.name_en,
    description: r.description,
    tiktokKeywords: safeParse(r.tiktok_keywords),
    tiktokHashtags: safeParse(r.tiktok_hashtags),
    amazonKeywords: safeParse(r.amazon_keywords),
    amazonCategories: safeParse(r.amazon_categories),
    keyFeatures: safeParse(r.key_features),
    usageScenes: safeParse(r.usage_scenes),
    confidence: r.confidence,
    mappedAsins: safeParse(r.mapped_asins),
    mappedVideos: safeParse(r.mapped_videos),
    status: r.status, createdAt: null,
  }));
}

function adaptMetrics(raw: any[]): ConceptMetric[] {
  return raw.map(r => ({
    conceptId: r.concept_id, conceptName: "",
    metricDate: r.metric_date,
    tiktokVideoCount: r.tiktok_video_count,
    tiktokTotalViews: Number(r.tiktok_total_views),
    tiktokEngagementRate: r.tiktok_engagement_rate,
    tiktokInfluencerCount: r.tiktok_influencer_count,
    amazonProductCount: r.amazon_product_count,
    amazonTotalSales: r.amazon_total_sales,
    amazonAvgRating: r.amazon_avg_rating,
    shiScore: String(r.shi_score), cviScore: String(r.cvi_score),
    opportunityScore: String(r.opportunity_score),
    trendMomentum: r.trend_momentum,
    vocGapScore: r.voc_gap_score,
  }));
}

let _concepts: ProductConcept[] | null = null;
let _metrics: ConceptMetric[] | null = null;

export function getProductConcepts(): ProductConcept[] {
  if (!_concepts) _concepts = adaptConcepts(CONCEPTS_DATA as any);
  return _concepts;
}

export function getConceptMetrics(conceptId?: string): ConceptMetric[] {
  if (!_metrics) _metrics = adaptMetrics(CONCEPT_METRICS as any);
  if (conceptId) return _metrics.filter(m => m.conceptId === conceptId);
  return _metrics;
}

export function getLatestMetrics(): ConceptMetric[] {
  const all = getConceptMetrics();
  const latestByConcept = new Map<string, ConceptMetric>();
  for (const m of all) {
    const existing = latestByConcept.get(m.conceptId);
    if (!existing || m.metricDate > existing.metricDate) {
      latestByConcept.set(m.conceptId, m);
    }
  }
  return Array.from(latestByConcept.values()).sort((a, b) => Number(b.opportunityScore) - Number(a.opportunityScore));
}

export function getKeywordMappings(): KeywordMapping[] {
  const concepts = getProductConcepts();
  const mappings: KeywordMapping[] = [];
  let id = 1;
  for (const c of concepts) {
    for (const tk of c.tiktokKeywords) {
      for (const ak of c.amazonKeywords.slice(0, 2)) {
        mappings.push({
          id: id++, conceptId: c.conceptId, tiktokKeyword: tk,
          amazonKeyword: ak, relevance: parseFloat((Math.random() * 0.4 + 0.5).toFixed(2)),
          source: "ai-match",
        });
      }
    }
  }
  return mappings;
}

export function getFusionReports(): FusionReport[] {
  const concepts = getProductConcepts().slice(0, 10);
  return concepts.map((c, i) => ({
    reportId: `FR-2026-${String(i + 1).padStart(3, "0")}`,
    conceptId: c.conceptId, conceptName: c.name, title: `${c.name}融合分析报告`,
    reportDate: "2026-05-20",
    summary: `${c.name}市场呈现稳定增长态势，TikTok 热度持续上升，Amazon 竞争格局趋于成熟。`,
    opportunityScore: parseFloat((Math.random() * 30 + 60).toFixed(1)),
    shiScore: parseFloat((Math.random() * 30 + 55).toFixed(1)),
    cviScore: parseFloat((Math.random() * 30 + 50).toFixed(1)),
    strengths: ["TikTok 热度高", "用户口碑好", "复购率高"],
    risks: ["竞品增多", "价格战风险"],
    recommendations: ["加大 TikTok 投放", "优化产品差异化"],
    sections: [
      { title: "市场概览", content: `${c.name}是母婴市场的核心品类...` },
      { title: "竞争分析", content: "Top5 品牌占据 45% 市场份额..." },
      { title: "机会点", content: "新兴功能型产品增长迅速..." },
    ],
  }));
}
