import { describe, it, expect } from "vitest";
import {
  getTiktokCreators,
  getTiktokVideos,
  getTiktokShops,
  getTiktokLives,
  getTiktokProducts,
  getTiktokKpi,
  getHeatmapData,
  getGmvTrend,
  getCategoryShare,
  getInfluencerMatrix,
  getPriceDistribution,
  getTiktokHomeProducts,
  getTiktokHomeInfluencers,
  getTiktokHomeShops,
  getTiktokHomeVideos,
  getTiktokHomeLives,
} from "./tiktokData";

describe("tiktokData", () => {
  describe("基础列表", () => {
    it("getTiktokCreators 返回 50 个达人", () => {
      const creators = getTiktokCreators();
      expect(creators.length).toBe(50);
      const c = creators[0];
      expect(c.creatorId).toBeTruthy();
      expect(c.username).toBeTruthy();
      expect(c.followers).toBeGreaterThan(0);
      expect(typeof c.videoGpm).toBe("string");
    });

    it("getTiktokVideos 包含完整的 KPI 字段", () => {
      const videos = getTiktokVideos();
      expect(videos.length).toBeGreaterThan(0);
      const v = videos[0];
      expect(v.videoId).toBeTruthy();
      expect(typeof v.views).toBe("number");
      expect(typeof v.likes).toBe("number");
      expect(v.engagementRate).toBeGreaterThanOrEqual(0);
    });

    it("getTiktokShops 包含国家与销量字段", () => {
      const shops = getTiktokShops();
      expect(shops.length).toBeGreaterThan(0);
      expect(shops[0].name).toBeTruthy();
      expect(typeof shops[0].sales).toBe("number");
    });

    it("getTiktokLives 包含主播信息", () => {
      const lives = getTiktokLives();
      expect(lives.length).toBeGreaterThan(0);
      expect(lives[0].title).toBeTruthy();
      expect(lives[0].creator).toBeTruthy();
    });

    it("getTiktokProducts 包含价格和评分", () => {
      const products = getTiktokProducts();
      expect(products.length).toBeGreaterThan(0);
      const p = products[0];
      expect(p.name).toBeTruthy();
      expect(p.rating).toBeGreaterThanOrEqual(0);
      expect(p.rating).toBeLessThanOrEqual(5);
    });
  });

  describe("分析仪表盘", () => {
    it("getTiktokKpi 返回核心指标卡片", () => {
      const kpis = getTiktokKpi();
      expect(Array.isArray(kpis)).toBe(true);
      expect(kpis.length).toBeGreaterThan(0);
    });

    it("getHeatmapData 返回带 categories/months/data 的对象", () => {
      const data = getHeatmapData();
      expect(Array.isArray(data.categories)).toBe(true);
      expect(Array.isArray(data.months)).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(data.categories.length * data.months.length);
    });

    it("getGmvTrend 返回 10 个月趋势数据", () => {
      const trend = getGmvTrend();
      expect(trend.length).toBe(10);
      expect(trend[0].month).toBeTruthy();
      expect(typeof trend[0].gmv).toBe("number");
    });

    it("getCategoryShare 返回品类份额", () => {
      const share = getCategoryShare();
      expect(share.length).toBeGreaterThan(0);
      const total = share.reduce((s, x) => s + x.value, 0);
      expect(total).toBeGreaterThan(0);
    });

    it("getInfluencerMatrix 返回粉丝量级矩阵", () => {
      const matrix = getInfluencerMatrix();
      expect(matrix.length).toBeGreaterThan(0);
    });

    it("getPriceDistribution 返回价格带分布", () => {
      const dist = getPriceDistribution();
      expect(dist.length).toBeGreaterThan(0);
    });
  });

  describe("首页榜单", () => {
    it("getTiktokHomeProducts 支持 hot/soaring/new 三种类型", () => {
      expect(getTiktokHomeProducts("hot").length).toBeGreaterThan(0);
      expect(getTiktokHomeProducts("soaring").length).toBeGreaterThan(0);
      expect(getTiktokHomeProducts("new").length).toBeGreaterThanOrEqual(0);
    });

    it("getTiktokHomeInfluencers 支持 sales/fans 两种排序", () => {
      const sales = getTiktokHomeInfluencers("sales");
      const fans = getTiktokHomeInfluencers("fans");
      expect(sales.length).toBeGreaterThan(0);
      expect(fans.length).toBeGreaterThan(0);
    });

    it("getTiktokHomeShops/Videos/Lives 全部返回非空", () => {
      expect(getTiktokHomeShops().length).toBeGreaterThan(0);
      expect(getTiktokHomeVideos().length).toBeGreaterThan(0);
      expect(getTiktokHomeLives().length).toBeGreaterThan(0);
    });
  });

  describe("数据稳定性", () => {
    it("多次调用返回相同的缓存数据（同一引用）", () => {
      const a = getTiktokCreators();
      const b = getTiktokCreators();
      expect(a).toBe(b);
    });
  });
});
