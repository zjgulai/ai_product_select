/**
 * Amazon 搜索爬虫
 *
 * 采集 Amazon 搜索结果页
 * 目标页面：https://www.amazon.com/s?k=[keyword]
 */

import type { Page } from "playwright";
import type { CrawlContext } from "../../core/types.ts";

interface SearchResult {
  asin: string;
  title: string;
  brand: string;
  price: string;
  rating: string;
  reviewCount: number;
  imageUrl?: string;
  isPrime: boolean;
  sponsored: boolean;
  monthlySales: number;
  category?: string;
}

function getBaseUrl(marketplace: "us" | "uk"): string {
  return marketplace === "uk" ? "https://www.amazon.co.uk" : "https://www.amazon.com";
}

/**
 * 解析搜索结果页
 */
async function parseSearchPage(page: Page): Promise<SearchResult[]> {
  const results: SearchResult[] = [];

  // 等待搜索结果加载
  await page.waitForSelector("[data-component-type='s-search-result']", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(2000);

  // 滚动加载更多
  await page.evaluate(async () => {
    for (let i = 0; i < 3; i++) {
      window.scrollBy(0, window.innerHeight * 2);
      await new Promise((r) => setTimeout(r, 600));
    }
  });

  const items = await page.locator("[data-component-type='s-search-result']").all();

  for (const item of items) {
    try {
      // ASIN
      const asin = await item.getAttribute("data-asin").catch(() => "");
      if (!asin) continue;

      // 标题
      const title = await item.locator("h2 a span, h2 span").first().textContent().catch(() => "");

      // 图片
      const imageUrl = await item.locator("img").first().getAttribute("src").catch(() => undefined);

      // 价格
      let price = "";
      const priceSelectors = [
        ".a-price .a-offscreen",
        ".a-price-whole",
        ".a-price-range",
      ];
      for (const sel of priceSelectors) {
        price = await item.locator(sel).first().textContent().catch(() => "");
        if (price) break;
      }

      // 评分
      let rating = "";
      const ratingText = await item.locator(".a-icon-alt").first().getAttribute("aria-label").catch(() => "");
      const ratingMatch = ratingText?.match(/([0-9.]+)\s*out\s*of/);
      if (ratingMatch) rating = ratingMatch[1];

      // 评论数
      const reviewText = await item.locator("[href*='reviews'] span").first().textContent().catch(() => "");
      const reviewCount = parseInt((reviewText || "").replace(/[^0-9]/g, ""), 10) || 0;

      // Prime
      const hasPrime = await item.locator("[aria-label*='Prime']").first().isVisible().catch(() => false);

      // Sponsored
      const sponsoredText = await item.locator("[data-sponsored]").first().getAttribute("data-sponsored").catch(() => "");
      const isSponsored = sponsoredText === "true" || (await item.locator("span:has-text('Sponsored')").first().isVisible().catch(() => false));

      // Brand
      let brand = "";
      const brandText = await item.locator("[data-cy='byline-section'] span, .a-size-base-plus").first().textContent().catch(() => "");
      if (brandText) brand = brandText.trim();

      // 月销量估算（基于评论数和评分粗略估算）
      const monthlySales = reviewCount > 0 ? Math.floor(reviewCount * 0.3) : 0;

      results.push({
        asin,
        title: title.trim(),
        brand,
        price: price.trim(),
        rating,
        reviewCount,
        imageUrl,
        isPrime: hasPrime,
        sponsored: isSponsored,
        monthlySales,
        category: (opts as any).category || "search-results",
      });
    } catch {
      continue;
    }
  }

  return results;
}

interface CrawlSearchOptions {
  marketplace?: "us" | "uk";
  keyword: string;
  category?: string;
  limit?: number;
  browserPool: CrawlContext["browserPool"];
  rateLimiter: CrawlContext["rateLimiter"];
  retryHandler: CrawlContext["retryHandler"];
}

export async function crawlAmazonSearch(opts: CrawlSearchOptions) {
  const {
    marketplace = "us",
    keyword,
    category,
    limit = 50,
    browserPool,
    rateLimiter,
    retryHandler,
  } = opts;

  const baseUrl = getBaseUrl(marketplace);
  const encodedKeyword = encodeURIComponent(keyword);
  let url = `${baseUrl}/s?k=${encodedKeyword}&page=1`;

  console.log(`🌐 Searching: ${url}`);

  const allResults: SearchResult[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (allResults.length < limit && hasMore && pageNum <= 5) {
    const pageResults = await retryHandler.execute(
      async () => {
        return await rateLimiter.throttle(async () => {
          return await browserPool.withPage(async (page) => {
            await page.setExtraHTTPHeaders({
              "Accept-Language": marketplace === "uk" ? "en-GB,en;q=0.9" : "en-US,en;q=0.9",
            });

            await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

            const pageTitle = await page.title().catch(() => "");
            if (pageTitle.toLowerCase().includes("captcha")) {
              throw new Error("CAPTCHA detected");
            }

            return await parseSearchPage(page);
          });
        });
      },
      { url, task: `amazon_search_page_${pageNum}` }
    );

    if (pageResults.length === 0) {
      hasMore = false;
      break;
    }

    for (const r of pageResults) {
      r.category = category || keyword;
    }
    allResults.push(...pageResults);
    console.log(`   Page ${pageNum}: +${pageResults.length} results (total: ${allResults.length})`);

    pageNum++;
    url = `${baseUrl}/s?k=${encodedKeyword}&page=${pageNum}`;
  }

  return {
    data: allResults.slice(0, limit),
    total: allResults.length,
    hasMore,
    meta: {
      source: "amazon_search",
      marketplace,
      durationMs: 0,
      requestedAt: new Date().toISOString(),
      pageUrl: url,
    },
  };
}
