/**
 * Amazon Best Sellers 爬虫
 *
 * 采集 Amazon Best Sellers 榜单页面
 * 目标页面：https://www.amazon.com/gp/bestsellers/[category]
 */

import type { Page } from "playwright";
import type { CrawlContext } from "../../core/types.ts";

interface BestSellerProduct {
  rank: number;
  asin: string;
  title: string;
  price: string;
  rating: string;
  reviewCount: number;
  imageUrl?: string;
  category?: string;
}

const CATEGORY_NODES: Record<string, { us: string; uk: string }> = {
  "baby-products": { us: "baby-products", uk: "baby" },
  "beauty": { us: "beauty", uk: "beauty" },
  "electronics": { us: "electronics", uk: "electronics" },
  "home-kitchen": { us: "home-kitchen", uk: "kitchen" },
  "toys-games": { us: "toys-games", uk: "toys" },
  "clothing": { us: "fashion", uk: "clothing" },
};

function getBaseUrl(marketplace: "us" | "uk"): string {
  return marketplace === "uk" ? "https://www.amazon.co.uk" : "https://www.amazon.com";
}

/**
 * 使用 page.evaluate 高效提取页面数据
 */
async function parseBestSellersPage(page: Page, category: string): Promise<BestSellerProduct[]> {
  return await page.evaluate((cat) => {
    const products: BestSellerProduct[] = [];

    // 尝试多种选择器找到商品卡片
    const cardSelectors = [
      ".zg-grid-general-faceout",
      ".p13n-sc-uncoverable-faceout",
    ];

    let cards: NodeListOf<Element> | null = null;
    for (const selector of cardSelectors) {
      cards = document.querySelectorAll(selector);
      if (cards && cards.length > 0) break;
    }

    if (!cards || cards.length === 0) return products;

    cards.forEach((card, index) => {
      try {
        // ASIN
        const link = card.querySelector("a[href*='/dp/']") as HTMLAnchorElement | null;
        const href = link?.href || "";
        const asinMatch = href.match(/\/dp\/([A-Z0-9]{10})/);
        const asin = asinMatch ? asinMatch[1] : "";
        if (!asin) return;

        // 排名
        let rank = index + 1;
        const rankEl = card.querySelector(".zg-bdg-body, .zg-bdg-text, .a-text-bold");
        if (rankEl) {
          const rankMatch = rankEl.textContent?.match(/#?([\d,]+)/);
          if (rankMatch) rank = parseInt(rankMatch[1].replace(/,/g, ""), 10);
        }

        // 标题
        let title = "";
        const img = card.querySelector("img");
        if (img?.alt) title = img.alt;
        if (!title) {
          const titleEl = card.querySelector(".p13n-sc-truncate, h2 a span, a[href*='/dp/'] span");
          if (titleEl) title = titleEl.textContent || "";
        }

        // 图片
        const imageUrl = img?.src;

        // 提取完整文本块（Amazon Best Sellers 将所有信息放在一个块中）
        const fullText = card.textContent || "";

        // 价格 — 支持 $, £, €, GBP, EUR 等格式
        let price = "";
        const priceMatch = fullText.match(/([\$£€]|GBP|EUR|USD)\s*([\d,]+\.?\d*)/);
        if (priceMatch) price = priceMatch[0];

        // 评分
        let rating = "";
        const ratingMatch = fullText.match(/([0-9.]+)\s*out\s*of\s*5/);
        if (ratingMatch) rating = ratingMatch[1];

        // 评论数
        let reviewCount = 0;
        const reviewMatch = fullText.match(/([\d,]+)\s*(?:ratings?|reviews?|stars?)/i);
        if (reviewMatch) {
          reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""), 10);
        }

        if (title && title.trim().length > 2) {
          products.push({
            rank,
            asin,
            title: title.trim(),
            price: price.trim(),
            rating,
            reviewCount,
            imageUrl: imageUrl || undefined,
            category: cat,
          });
        }
      } catch {
        // ignore individual card errors
      }
    });

    return products;
  }, category);
}

interface CrawlBestSellersOptions {
  marketplace?: "us" | "uk";
  category?: string;
  limit?: number;
  browserPool: CrawlContext["browserPool"];
  rateLimiter: CrawlContext["rateLimiter"];
  retryHandler: CrawlContext["retryHandler"];
}

export async function crawlAmazonBestSellers(opts: CrawlBestSellersOptions) {
  const {
    marketplace = "us",
    category = "baby-products",
    limit = 50,
    browserPool,
    rateLimiter,
    retryHandler,
  } = opts;

  const nodeInfo = CATEGORY_NODES[category] ?? CATEGORY_NODES["baby-products"];
  const nodeId = nodeInfo[marketplace];
  const baseUrl = getBaseUrl(marketplace);
  const url = `${baseUrl}/gp/bestsellers/${nodeId}`;

  console.log(`🌐 Opening: ${url}`);

  const products = await retryHandler.execute(
    async () => {
      return await rateLimiter.throttle(async () => {
        return await browserPool.withPage(async (page) => {
          await page.setExtraHTTPHeaders({
            "Accept-Language": marketplace === "uk" ? "en-GB,en;q=0.9" : "en-US,en;q=0.9",
          });

          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

          const pageTitle = await page.title().catch(() => "");
          if (pageTitle.toLowerCase().includes("captcha") || pageTitle.toLowerCase().includes("robot")) {
            throw new Error("CAPTCHA detected");
          }

          await page.waitForTimeout(2500);

          // 滚动加载
          await page.evaluate(async () => {
            for (let i = 0; i < 4; i++) {
              window.scrollBy(0, window.innerHeight * 2);
              await new Promise((r) => setTimeout(r, 400));
            }
          });
          await page.waitForTimeout(1000);

          let allProducts: BestSellerProduct[] = [];
          let pageNum = 1;

          while (allProducts.length < limit && pageNum <= 3) {
            const parsed = await parseBestSellersPage(page, category);
            console.log(`📊 Page ${pageNum}: parsed ${parsed.length} products`);

            if (parsed.length === 0) break;

            allProducts = allProducts.concat(parsed);

            // 检查是否有下一页
            const nextBtn = page.locator(".zg-pagination li.a-last a").first();
            const hasNext = await nextBtn.isVisible().catch(() => false);
            const isDisabled = await nextBtn.locator("..").first().evaluate((el) => el.classList.contains("a-disabled")).catch(() => true);

            if (!hasNext || isDisabled) break;

            console.log(`➡️  Navigating to page ${pageNum + 1}`);
            await rateLimiter.delay();
            await nextBtn.click();
            await page.waitForTimeout(3000);
            pageNum++;
          }

          return allProducts.slice(0, limit);
        });
      });
    },
    { url, task: "amazon_best_sellers" }
  );

  return {
    data: products,
    total: products.length,
    hasMore: false,
    meta: {
      source: "amazon_bestsellers",
      marketplace,
      durationMs: 0,
      requestedAt: new Date().toISOString(),
      pageUrl: url,
    },
  };
}
