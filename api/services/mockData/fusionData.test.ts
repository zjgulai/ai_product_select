import { describe, it, expect } from "vitest";
import {
  getProductConcepts,
  getLatestMetrics,
  getKeywordMappings,
  getFusionReports,
} from "./fusionData";

describe("fusionData", () => {
  it("getProductConcepts 返回有效概念列表", () => {
    const concepts = getProductConcepts();
    expect(concepts.length).toBeGreaterThan(0);
    const first = concepts[0];
    expect(first.conceptId).toBeTruthy();
    expect(first.name).toBeTruthy();
    expect(first.nameEn).toBeTruthy();
    expect(Array.isArray(first.keyFeatures)).toBe(true);
    expect(Array.isArray(first.tiktokKeywords)).toBe(true);
    expect(Array.isArray(first.amazonCategories)).toBe(true);
  });

  it("getLatestMetrics 返回机会分降序排列", () => {
    const items = getLatestMetrics();
    expect(items.length).toBeGreaterThan(0);
    for (let i = 1; i < items.length; i++) {
      expect(parseFloat(items[i - 1].opportunityScore ?? '0')).toBeGreaterThanOrEqual(parseFloat(items[i].opportunityScore ?? '0'));
    }
  });

  it("getLatestMetrics 包含 SHI/CVI/opportunityScore 字段", () => {
    const items = getLatestMetrics();
    const m = items[0];
    expect(typeof m.shiScore).toBe("string");
    expect(typeof m.cviScore).toBe("string");
    expect(typeof m.opportunityScore).toBe("string");
    expect(parseFloat(m.shiScore ?? '0')).toBeGreaterThanOrEqual(0);
    expect(parseFloat(m.shiScore ?? '0')).toBeLessThanOrEqual(100);
  });

  it("getKeywordMappings 返回 TikTok+Amazon 关键词对", () => {
    const mappings = getKeywordMappings();
    expect(mappings.length).toBeGreaterThan(0);
    const m = mappings[0];
    expect(m.tiktokKeyword).toBeTruthy();
    expect(m.amazonKeyword).toBeTruthy();
  });

  it("getFusionReports 返回报告列表", () => {
    const reports = getFusionReports();
    expect(reports.length).toBeGreaterThan(0);
    expect(reports[0].reportId).toBeTruthy();
    expect(reports[0].title).toBeTruthy();
  });
});
