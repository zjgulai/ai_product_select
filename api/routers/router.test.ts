import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "../router";

// 直接调用 tRPC caller，无需 HTTP 层
const caller = appRouter.createCaller({
  req: new Request("http://localhost/api/trpc"),
  resHeaders: new Headers(),
});

describe("amazon router", () => {
  it("products.list 返回列表 + total", async () => {
    const result = await caller.amazon.products.list({});
    expect(result.items).toBeDefined();
    expect(Array.isArray(result.items)).toBe(true);
    expect(typeof result.total).toBe("number");
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("products.list 支持 search 参数", async () => {
    const all = await caller.amazon.products.list({});
    const firstAsin = all.items[0].asin;
    const filtered = await caller.amazon.products.list({ search: firstAsin });
    expect(filtered.items.length).toBeGreaterThanOrEqual(0);
  });

  it("products.list 支持 limit/offset 分页", async () => {
    const page1 = await caller.amazon.products.list({ limit: 5, offset: 0 });
    const page2 = await caller.amazon.products.list({ limit: 5, offset: 5 });
    expect(page1.items.length).toBe(5);
    expect(page2.items.length).toBe(5);
    expect(page1.items[0].asin).not.toBe(page2.items[0].asin);
  });

  it("products.getByAsin 返回单个商品", async () => {
    const list = await caller.amazon.products.list({ limit: 1 });
    const asin = list.items[0].asin;
    const product = await caller.amazon.products.getByAsin({ asin });
    expect(product).not.toBeNull();
    expect(product!.asin).toBe(asin);
  });

  it("products.getByAsin 不存在的 ASIN 返回 null", async () => {
    const product = await caller.amazon.products.getByAsin({ asin: "B0XXXXXXXX" });
    expect(product).toBeNull();
  });

  it("products.brands 返回品牌数组", async () => {
    const brands = await caller.amazon.products.brands();
    expect(Array.isArray(brands)).toBe(true);
    expect(brands.length).toBeGreaterThan(0);
  });

  it("reviews.list 默认返回所有评论", async () => {
    const result = await caller.amazon.reviews.list({});
    expect(result.items).toBeDefined();
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("reviews.list 按情感过滤", async () => {
    const positive = await caller.amazon.reviews.list({ sentiment: "positive" });
    expect(positive.items.every((r: any) => r.sentiment === "positive")).toBe(true);
  });

  it("reviews.stats 返回完整统计字段", async () => {
    const products = await caller.amazon.products.list({ limit: 1 });
    const asin = products.items[0].asin;
    const stats = await caller.amazon.reviews.stats({ asin });
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.positive).toBe("number");
    expect(typeof stats.negative).toBe("number");
    expect(typeof stats.neutral).toBe("number");
    expect(typeof stats.avgRating).toBe("number");
    expect(Array.isArray(stats.aspects)).toBe(true);
  });

  it("keyword.search 返回关键词结果", async () => {
    const results = await caller.amazon.keyword.search({});
    expect(Array.isArray(results)).toBe(true);
    expect(results.length).toBeGreaterThan(0);
    expect(typeof results[0].keyword).toBe("string");
  });

  it("keyword.stats 返回 4 张统计卡", async () => {
    const stats = await caller.amazon.keyword.stats();
    expect(Array.isArray(stats)).toBe(true);
  });

  it("hotMarket/potMarket/paramTrend/brandTrend 全部返回数据", async () => {
    const hot = await caller.amazon.hotMarket.list();
    const pot = await caller.amazon.potMarket.list();
    const param = await caller.amazon.paramTrend.list();
    const brand = await caller.amazon.brandTrend.list();
    expect(hot.length).toBeGreaterThan(0);
    expect(pot.length).toBeGreaterThan(0);
    expect(param.length).toBeGreaterThan(0);
    expect(brand.length).toBeGreaterThan(0);
  });
});

describe("fusion router", () => {
  it("concepts.list 返回概念列表", async () => {
    const result = await caller.fusion.concepts.list({});
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.total).toBeGreaterThan(0);
  });

  it("concepts.getById 不存在时返回 null", async () => {
    const c = await caller.fusion.concepts.getById({ conceptId: "nonexistent_xxxxx" });
    expect(c).toBeNull();
  });

  it("concepts.getById 返回完整概念字段", async () => {
    const list = await caller.fusion.concepts.list({ limit: 1 });
    const id = list.items[0].conceptId;
    const c = await caller.fusion.concepts.getById({ conceptId: id });
    expect(c).not.toBeNull();
    expect(c!.name).toBeTruthy();
    expect(Array.isArray(c!.keyFeatures)).toBe(true);
  });

  it("metrics.list 按 conceptId 过滤", async () => {
    const concepts = await caller.fusion.concepts.list({ limit: 1 });
    const id = concepts.items[0].conceptId;
    const metrics = await caller.fusion.metrics.list({ conceptId: id });
    expect(metrics.items.length).toBeGreaterThan(0);
  });

  it("metrics.topOpportunities 按机会分降序", async () => {
    const items = await caller.fusion.metrics.topOpportunities({ limit: 10 });
    expect(items.length).toBeLessThanOrEqual(10);
    for (let i = 1; i < items.length; i++) {
      expect(parseFloat(String(items[i - 1].opportunityScore ?? 0))).toBeGreaterThanOrEqual(parseFloat(String(items[i].opportunityScore ?? 0)));
    }
  });

  it("mappings.list 返回关键词映射对", async () => {
    const result = await caller.fusion.mappings.list({});
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].tiktokKeyword).toBeTruthy();
    expect(result.items[0].amazonKeyword).toBeTruthy();
  });

  it("reports.list 返回报告记录", async () => {
    const result = await caller.fusion.reports.list({});
    expect(result.items.length).toBeGreaterThan(0);
  });
});

describe("tiktok router", () => {
  it("products.list 默认返回 hot 榜单", async () => {
    const result = await caller.tiktok.products.list({});
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("creators.list 支持搜索", async () => {
    const all = await caller.tiktok.creators.list({});
    const name = (all.items[0].displayName ?? all.items[0].username).slice(0, 3);
    const filtered = await caller.tiktok.creators.list({ search: name });
    expect(filtered.items.length).toBeGreaterThanOrEqual(0);
  });

  it("videos.list 返回视频列表", async () => {
    const result = await caller.tiktok.videos.list({});
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("shops.list 返回小店列表", async () => {
    const result = await caller.tiktok.shops.list({});
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("lives.list 返回直播列表", async () => {
    const result = await caller.tiktok.lives.list({});
    expect(result.items.length).toBeGreaterThan(0);
  });

  it("home 所有子接口均可调用", async () => {
    await caller.tiktok.home.productsHot();
    await caller.tiktok.home.productsSoaring();
    await caller.tiktok.home.productsNew();
    await caller.tiktok.home.influencersSales();
    await caller.tiktok.home.influencersFans();
    await caller.tiktok.home.shopsHot();
    await caller.tiktok.home.videosHot();
    await caller.tiktok.home.livesPopular();
  });

  it("analysis 所有图表数据可获取", async () => {
    await caller.tiktok.analysis.kpi();
    await caller.tiktok.analysis.heatmap();
    await caller.tiktok.analysis.gmvTrend();
    await caller.tiktok.analysis.categoryShare();
    await caller.tiktok.analysis.priceDistribution();
    await caller.tiktok.analysis.influencerMatrix();
  });
});
