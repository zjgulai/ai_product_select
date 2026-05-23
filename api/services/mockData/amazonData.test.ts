import { describe, it, expect } from "vitest";
import {
  getAmazonProducts,
  getAmazonReviews,
  searchAmazonKeywords,
  getHotMarket,
  getPotMarket,
} from "./amazonData";

describe("amazonData", () => {
  it("getAmazonProducts 返回带必要字段的商品", () => {
    const products = getAmazonProducts();
    expect(products.length).toBeGreaterThan(0);
    const p = products[0];
    expect(p.asin).toMatch(/^B0[A-Z0-9]{8}$/);
    expect(typeof p.title).toBe("string");
    expect(typeof p.price).toBe("string");
    expect(parseFloat(p.rating ?? '0')).toBeGreaterThanOrEqual(0);
    expect(parseFloat(p.rating ?? '0')).toBeLessThanOrEqual(5);
  });

  it("getAmazonReviews 按 ASIN 过滤", () => {
    const products = getAmazonProducts();
    const asin = products[0].asin;
    const reviews = getAmazonReviews(asin);
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every(r => r.asin === asin)).toBe(true);
  });

  it("getAmazonReviews 所有评论包含正确的情感字段", () => {
    const reviews = getAmazonReviews();
    expect(reviews.length).toBeGreaterThan(0);
    expect(reviews.every(r => ["positive", "negative", "neutral"].includes(r.sentiment))).toBe(true);
  });

  it("searchAmazonKeywords 支持空查询和关键词过滤", () => {
    const all = searchAmazonKeywords();
    expect(all.length).toBeGreaterThan(0);

    const filtered = searchAmazonKeywords("yoga");
    expect(filtered.every(r => r.keyword.toLowerCase().includes("yoga"))).toBe(true);
  });

  it("getHotMarket 返回完整的市场字段", () => {
    const items = getHotMarket();
    expect(items.length).toBeGreaterThan(0);
    const m = items[0];
    expect(m.rank).toBe(1);
    expect(typeof m.keyword).toBe("string");
    expect(typeof m.sales).toBe("number");
    expect(typeof m.price).toBe("number");
  });

  it("getPotMarket 返回潜力字段", () => {
    const items = getPotMarket();
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].potential).toBeTruthy();
  });
});
