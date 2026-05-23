/**
 * DB 集成测试
 *
 * 前置：
 *   1. docker compose -f docker-compose.test.yml up -d
 *   2. DATABASE_URL=mysql://testuser:testpass@localhost:3307/voc_ai_test \
 *      npx drizzle-kit push
 *   3. DATABASE_URL=mysql://testuser:testpass@localhost:3307/voc_ai_test \
 *      npx tsx db/seed-v2.ts
 *
 * 运行：
 *   DATABASE_URL=... npx vitest run api/services/db/dbIntegration.test.ts
 *
 * 默认无 DATABASE_URL 时整套件被跳过（不阻塞其他测试）。
 */
import { describe, it, expect } from "vitest";
import {
  dbGetAmazonProducts,
  dbGetAmazonReviewStats,
  dbGetProductConcepts,
  dbGetLatestMetrics,
} from "./index";

const hasDb = !!process.env.DATABASE_URL;
const d = hasDb ? describe : describe.skip;

d("DB integration (requires MySQL)", () => {
  it("dbGetAmazonProducts 返回 items + total", async () => {
    const result = await dbGetAmazonProducts({ limit: 5 });
    expect(result.items).toBeDefined();
    expect(typeof result.total).toBe("number");
  });

  it("dbGetAmazonProducts 支持搜索", async () => {
    const result = await dbGetAmazonProducts({ search: "Warmer", limit: 10 });
    expect(result.items.length).toBeLessThanOrEqual(10);
  });

  it("dbGetProductConcepts 返回概念列表", async () => {
    const result = await dbGetProductConcepts({ limit: 5 });
    expect(result.items.length).toBeGreaterThan(0);
    expect(result.items[0].conceptId).toBeTruthy();
  });

  it("dbGetLatestMetrics 包含 conceptName join 字段", async () => {
    const items = await dbGetLatestMetrics(5);
    expect(items.length).toBeGreaterThan(0);
    expect(items[0].conceptName).toBeTruthy();
  });

  it("dbGetAmazonReviewStats 聚合 sentiment 分布", async () => {
    const products = await dbGetAmazonProducts({ limit: 1 });
    if (products.items.length === 0) return;
    const asin = products.items[0].asin;
    const stats = await dbGetAmazonReviewStats(asin);
    expect(typeof stats.total).toBe("number");
    expect(typeof stats.positive).toBe("number");
    expect(typeof stats.avgRating).toBe("number");
    expect(Array.isArray(stats.aspects)).toBe(true);
  });
});
