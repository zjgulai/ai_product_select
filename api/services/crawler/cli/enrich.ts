#!/usr/bin/env tsx
/**
 * Amazon Best Sellers 数据富化 CLI
 *
 * 读取已有的 best sellers JSON，批量获取 product detail 页面，
 * 用准确的 review count、price、rating 等字段替换 best sellers 页面上不准确的值。
 *
 * 用法：
 *   npm run crawl:amazon:enrich -- --marketplace=us --limit=50
 */

import { readFileSync, readdirSync, existsSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { createBrowserPool, createRateLimiter, createRetryHandler } from "../core/index.ts";
import { crawlAmazonProducts } from "../adapters/amazon/product-crawler.ts";
import { writeToJSON } from "../pipeline/json-writer.ts";

const REAL_DATA_DIR = join(process.cwd(), "src", "data", "real");

// ---- 解析命令行参数 ----
const args = process.argv.slice(2);

const flags: Record<string, string> = {};
for (let i = 0; i < args.length; i++) {
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
const offset = parseInt(flags.offset ?? "0", 10);
const headless = flags.headless !== "false";

// ---- 工具函数 ----

interface BestSellerItem {
  rank: number;
  asin: string;
  title: string;
  price: string;
  rating: string;
  reviewCount: number;
  imageUrl: string;
  category: string;
}

function findLatestBestSellersFile(): string | null {
  if (!existsSync(REAL_DATA_DIR)) return null;
  const files = readdirSync(REAL_DATA_DIR).filter(
    (f) => f.startsWith(`amazon_bestsellers_${marketplace}_`) && f.endsWith(".json") && !f.includes("_enriched_")
  );
  if (files.length === 0) return null;
  return files.sort().reverse()[0];
}

function loadBestSellers(filename: string): BestSellerItem[] {
  const path = join(REAL_DATA_DIR, filename);
  const content = JSON.parse(readFileSync(path, "utf-8"));
  return (content.data || []) as BestSellerItem[];
}

function mergeEnriched(
  originals: BestSellerItem[],
  enriched: Array<{
    asin: string;
    title?: string;
    price?: string;
    rating?: string;
    reviewCount?: number;
    brand?: string;
    bsrRank?: number;
    imageUrl?: string;
  }>
): BestSellerItem[] {
  const enrichedMap = new Map(enriched.map((e) => [e.asin, e]));

  return originals.map((item) => {
    const detail = enrichedMap.get(item.asin);
    if (!detail) return item;

    return {
      ...item,
      // 优先使用 detail 页面的准确数据，但保留 best sellers 的 rank
      title: detail.title && detail.title.length > item.title.length ? detail.title : item.title,
      price: detail.price || item.price,
      rating: detail.rating || item.rating,
      reviewCount: detail.reviewCount ?? item.reviewCount,
      imageUrl: detail.imageUrl || item.imageUrl,
    };
  });
}

function printComparison(originals: BestSellerItem[], merged: BestSellerItem[]) {
  console.log("\n📊 Enrichment Comparison (top 10):");
  console.log("Rank | ASIN          | Title (truncated)                       | Before → After reviews | Before → After price");
  console.log("-".repeat(140));

  for (let i = 0; i < Math.min(10, originals.length); i++) {
    const o = originals[i];
    const m = merged[i];
    const title = m.title.slice(0, 40).padEnd(40);
    const rcBefore = String(o.reviewCount).padStart(6);
    const rcAfter = String(m.reviewCount).padStart(6);
    const pBefore = o.price.slice(0, 12).padStart(12);
    const pAfter = m.price.slice(0, 12).padStart(12);
    console.log(
      ` #${String(o.rank).padStart(2)} | ${o.asin} | ${title} | ${rcBefore} → ${rcAfter} | ${pBefore} → ${pAfter}`
    );
  }
}

// ---- 主流程 ----

async function main() {
  console.log(`\n🔧 Amazon Best Sellers Enrichment [${marketplace.toUpperCase()}]`);
  console.log(`   Offset: ${offset}, Limit: ${limit} products\n`);

  // 1. 读取 best sellers 数据
  const sourceFile = findLatestBestSellersFile();
  if (!sourceFile) {
    console.error("❌ No best sellers data found. Run `npm run crawl:amazon:bestsellers` first.");
    process.exit(1);
  }

  const originals = loadBestSellers(sourceFile);
  const toEnrich = originals.slice(offset, offset + limit);
  const asins = toEnrich.map((p) => p.asin);

  console.log(`📂 Source: ${sourceFile} (${originals.length} products total)`);
  console.log(`🎯 Enriching: ${asins.length} ASINs (offset=${offset})\n`);

  // 2. 创建基础设施
  // Product detail 页面风险较低，可以更激进的并发和延迟
  const browserPool = createBrowserPool({ headless, maxBrowsers: 3 });
  const rateLimiter = createRateLimiter({ minDelayMs: 600, maxDelayMs: 1500 });
  const retryHandler = createRetryHandler({ maxRetries: 1 });

  const startTime = Date.now();
  const date = new Date().toISOString().slice(0, 10);

  try {
    // 3. 批量获取 product detail（带 checkpoint）
    const enrichedSoFar: any[] = [];
    const batchSize = 5;

    for (let i = 0; i < asins.length; i += batchSize) {
      const batchAsins = asins.slice(i, i + batchSize);
      console.log(`\n📦 Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(asins.length / batchSize)}: ${batchAsins.length} products`);

      const result = await crawlAmazonProducts({
        marketplace,
        asins: batchAsins,
        browserPool,
        rateLimiter,
        retryHandler,
      });

      enrichedSoFar.push(...result.data);

      // Checkpoint：每批处理完就保存中间结果
      if (enrichedSoFar.length > 0 && i + batchSize < asins.length) {
        const checkpoint = mergeEnriched(toEnrich.slice(0, i + batchSize), enrichedSoFar);
        const checkpointData = {
          collectedAt: new Date().toISOString(),
          source: "amazon_bestsellers_enriched",
          marketplace,
          baseFile: sourceFile,
          enrichedCount: checkpoint.length,
          partial: true,
          data: checkpoint,
        };
        const checkpointPath = join(REAL_DATA_DIR, `amazon_bestsellers_enriched_${marketplace}_${date}_partial.json`);
        writeFileSync(checkpointPath, JSON.stringify(checkpointData, null, 2));
        console.log(`   💾 Checkpoint saved: ${checkpoint.length} products`);
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    console.log(`\n📦 Enriched ${enrichedSoFar.length}/${asins.length} products in ${duration}s`);

    // 4. 合并数据
    const merged = mergeEnriched(toEnrich, enrichedSoFar);

    // 打印前后对比
    printComparison(toEnrich, merged);

    // 5. 保存 enriched 数据
    const enrichedData = {
      collectedAt: new Date().toISOString(),
      source: "amazon_bestsellers_enriched",
      marketplace,
      baseFile: sourceFile,
      enrichedCount: merged.length,
      data: merged,
    };

    const filename = `amazon_bestsellers_enriched_${marketplace}_${date}.json`;
    const filePath = join(REAL_DATA_DIR, filename);
    writeFileSync(filePath, JSON.stringify(enrichedData, null, 2));

    console.log(`\n💾 Enriched data saved: ${filePath}`);

    // 统计
    const totalBefore = toEnrich.reduce((s, p) => s + p.reviewCount, 0);
    const totalAfter = merged.reduce((s, p) => s + p.reviewCount, 0);
    const improved = merged.filter((m, i) => m.reviewCount > toEnrich[i].reviewCount).length;

    console.log(`\n📈 Stats:`);
    console.log(`   Total reviews: ${totalBefore.toLocaleString()} → ${totalAfter.toLocaleString()}`);
    console.log(`   Products improved: ${improved}/${merged.length}`);
    console.log(`\n✅ Done\n`);
  } catch (err) {
    console.error("\n❌ Enrichment failed:", (err as Error).message);
    process.exit(1);
  } finally {
    await browserPool.shutdown();
  }
}

main();
