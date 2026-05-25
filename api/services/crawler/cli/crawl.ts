#!/usr/bin/env tsx
/**
 * 爬虫 CLI 入口
 *
 * 用法：
 *   npx tsx api/services/crawler/cli/crawl.ts amazon:bestsellers --marketplace=us --category=baby
 *   npx tsx api/services/crawler/cli/crawl.ts amazon:product --marketplace=us --asin=B08XXXX
 *   npx tsx api/services/crawler/cli/crawl.ts amazon:reviews --marketplace=us --asin=B08XXXX
 *   npx tsx api/services/crawler/cli/crawl.ts tiktok:video --keyword=baby
 *   npx tsx api/services/crawler/cli/crawl.ts tiktok:creator --username=xxx
 */

import { createBrowserPool, createRateLimiter, createRetryHandler } from "../core/index.ts";
import { writeToODS } from "../pipeline/ods-writer.ts";
import { writeToJSON } from "../pipeline/json-writer.ts";
import { triggerETL } from "../../etl/pipeline.ts";

// 解析命令行参数
const args = process.argv.slice(2);
const command = args[0]; // e.g. "amazon:bestsellers"

const flags: Record<string, string> = {};
for (let i = 1; i < args.length; i++) {
  const arg = args[i];
  if (arg.startsWith("--")) {
    const eqIdx = arg.indexOf("=");
    let key: string;
    let value: string;
    if (eqIdx > 2) {
      key = arg.slice(2, eqIdx);
      value = arg.slice(eqIdx + 1);
    } else {
      key = arg.slice(2);
      value = args[i + 1] && !args[i + 1].startsWith("--") ? args[i + 1] : "true";
      if (value !== "true") i++;
    }
    flags[key] = value;
  }
}

const marketplace = (flags.marketplace ?? "us") as "us" | "uk";
const limit = parseInt(flags.limit ?? "50", 10);
const headless = flags.headless !== "false";

async function main() {
  console.log(`\n🕷️  Crawler CLI — ${command} [${marketplace.toUpperCase()}]\n`);

  const browserPool = createBrowserPool({ headless, maxBrowsers: 2 });
  const rateLimiter = createRateLimiter({ minDelayMs: 1500, maxDelayMs: 4000 });
  const retryHandler = createRetryHandler({ maxRetries: 3 });

  const snapshotDate = new Date().toISOString().slice(0, 10);
  const startTime = Date.now();

  try {
    switch (command) {
      case "amazon:bestsellers": {
        const { crawlAmazonBestSellers } = await import("../adapters/amazon/bestseller-crawler");
        const result = await crawlAmazonBestSellers({
          marketplace,
          category: flags.category ?? "baby-products",
          limit,
          browserPool,
          rateLimiter,
          retryHandler,
        });

        console.log(`📦 Collected ${result.data.length} products from Best Sellers`);

        // 1. 写入 JSON（验证阶段优先，无需数据库）
        const jsonResult = writeToJSON({
          source: "amazon_bestsellers",
          marketplace,
          data: result.data,
        });
        console.log(`💾 JSON saved: ${jsonResult.filePath} (${jsonResult.count} items)`);

        // 2. 尝试写入 ODS（如果数据库可用）
        try {
          const writeResult = await writeToODS({
            tableKey: "ods_amazon_products",
            records: result.data,
            snapshotDate,
            sourceKey: `amazon_bestsellers_${marketplace}`,
          });
          console.log(`💾 ODS write: ${writeResult.inserted} inserted, ${writeResult.skipped} skipped`);

          // 触发 ETL
          if (writeResult.inserted > 0) {
            console.log("🔄 Triggering ETL...");
            const etlResult = await triggerETL("amazon_products", snapshotDate);
            console.log(`✅ ETL: ${etlResult.dwd.outputRows} rows to DWD`);
          }
        } catch (dbErr) {
          console.warn(`⚠️  Database write skipped: ${(dbErr as Error).message}`);
        }
        break;
      }

      case "amazon:product": {
        if (!flags.asin) {
          console.error("❌ --asin is required (comma-separated for multiple)");
          process.exit(1);
        }
        const asins = flags.asin.split(",").map((a: string) => a.trim());
        const { crawlAmazonProducts } = await import("../adapters/amazon/product-crawler");
        const result = await crawlAmazonProducts({
          marketplace,
          asins,
          browserPool,
          rateLimiter,
          retryHandler,
        });

        console.log(`📦 Collected ${result.data.length} product details`);

        const jsonResult = writeToJSON({
          source: "amazon_product",
          marketplace,
          data: result.data,
        });
        console.log(`💾 JSON saved: ${jsonResult.filePath} (${jsonResult.count} items)`);

        try {
          const writeResult = await writeToODS({
            tableKey: "ods_amazon_products",
            records: result.data,
            snapshotDate,
            sourceKey: `amazon_product_${marketplace}`,
          });
          console.log(`💾 ODS write: ${writeResult.inserted} inserted`);
        } catch (dbErr) {
          console.warn(`⚠️  Database write skipped: ${(dbErr as Error).message}`);
        }
        break;
      }

      case "amazon:reviews": {
        if (!flags.asin) {
          console.error("❌ --asin is required");
          process.exit(1);
        }
        const { crawlAmazonReviews } = await import("../adapters/amazon/review-crawler");
        const result = await crawlAmazonReviews({
          marketplace,
          asin: flags.asin,
          limit,
          browserPool,
          rateLimiter,
          retryHandler,
        });

        console.log(`💬 Collected ${result.data.length} reviews`);

        const writeResult = await writeToODS({
          tableKey: "ods_amazon_reviews",
          records: result.data,
          snapshotDate,
          sourceKey: `amazon_reviews_${marketplace}`,
        });

        console.log(`💾 ODS write: ${writeResult.inserted} inserted, ${writeResult.skipped} skipped`);
        break;
      }

      case "amazon:search": {
        if (!flags.keyword) {
          console.error("❌ --keyword is required");
          process.exit(1);
        }
        const { crawlAmazonSearch } = await import("../adapters/amazon/search-crawler");
        const result = await crawlAmazonSearch({
          marketplace,
          keyword: flags.keyword,
          category: flags.category,
          limit,
          browserPool,
          rateLimiter,
          retryHandler,
        });

        console.log(`🔍 Collected ${result.data.length} search results`);

        // 同时写入 products 和 keywords
        const productWrite = await writeToODS({
          tableKey: "ods_amazon_products",
          records: result.data.map((d) => ({ ...d, monthlySales: 0, monthlyRevenue: "0" })),
          snapshotDate,
          sourceKey: `amazon_search_${marketplace}`,
        });

        const keywordWrite = await writeToODS({
          tableKey: "ods_amazon_keywords",
          records: [{
            keyword: flags.keyword,
            searchVolume: 0,
            monthlySales: result.data.reduce((s, d) => s + (d.monthlySales ?? 0), 0),
            avgPrice: result.data.length > 0
              ? (result.data.reduce((s, d) => s + (parseFloat(String(d.price)) || 0), 0) / result.data.length).toFixed(2)
              : "0",
            avgRating: result.data.length > 0
              ? (result.data.reduce((s, d) => s + (parseFloat(String(d.rating)) || 0), 0) / result.data.length).toFixed(1)
              : "0",
            top3: "0%",
            newP: "0%",
            competition: "Medium",
          }],
          snapshotDate,
          sourceKey: `amazon_search_${marketplace}`,
        });

        console.log(`💾 Products: ${productWrite.inserted} inserted | Keywords: ${keywordWrite.inserted} inserted`);
        break;
      }

      case "tiktok:v2": {
        const keyword = flags.keyword ?? "baby";
        const { crawlTikTokVideosV2 } = await import("../adapters/tiktok/video-crawler-v2");
        const result = await crawlTikTokVideosV2({
          keyword,
          limit,
          browserPool,
          rateLimiter,
          retryHandler,
        });

        if (result.strategy === "unavailable") {
          console.log(`\n⚠️  TikTok data unavailable (anti-bot). Skipping JSON write.`);
          console.log(`   Tip: Use generated mock data for TikTok, or provide manual video URLs.`);
        } else {
          console.log(`\n📱 Collected ${result.data.length} TikTok videos via ${result.strategy}`);
          const jsonResult = writeToJSON({
            source: "tiktok_videos",
            marketplace: "us",
            data: result.data,
          });
          console.log(`💾 JSON saved: ${jsonResult.filePath} (${jsonResult.count} items)`);
        }
        break;
      }

      default:
        console.error(`❌ Unknown command: ${command}`);
        console.log(`\nAvailable commands:`);
        console.log(`  amazon:bestsellers  --category=baby-products  --limit=50`);
        console.log(`  amazon:product      --asin=B08XXXXXX,B08YYYYYY  --limit=50`);
        console.log(`  amazon:reviews      --asin=B08XXXXXX  --limit=50`);
        console.log(`  amazon:search       --keyword="baby bottle"  --limit=50`);
        console.log(`  amazon:enrich       --marketplace=us  --limit=50    (separate CLI)`);
        console.log(`  tiktok:v2           --keyword=baby  --limit=30`);
        process.exit(1);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n✅ Done in ${duration}s\n`);

  } catch (err) {
    console.error("\n❌ Crawl failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  } finally {
    await browserPool.shutdown();
  }
}

main();
