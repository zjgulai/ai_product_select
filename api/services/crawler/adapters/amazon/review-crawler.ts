/**
 * Amazon 评论爬虫
 *
 * 采集单个 ASIN 的评论列表
 * 目标页面：https://www.amazon.com/product-reviews/[ASIN]
 */

import type { Page } from "playwright";
import type { CrawlContext } from "../../core/types.ts";

interface AmazonReview {
  review_id: string;
  asin: string;
  rating: string;
  sentiment: "positive" | "negative" | "neutral";
  content: string;
  title: string;
  reviewDate: string;
  verifiedPurchase: boolean;
  helpfulCount: number;
  reviewerName: string;
}

function getBaseUrl(marketplace: "us" | "uk"): string {
  return marketplace === "uk" ? "https://www.amazon.co.uk" : "https://www.amazon.com";
}

function inferSentiment(rating: number): "positive" | "negative" | "neutral" {
  if (rating >= 4) return "positive";
  if (rating <= 2) return "negative";
  return "neutral";
}

/**
 * 解析评论列表页
 */
async function parseReviewsPage(page: Page, asin: string): Promise<AmazonReview[]> {
  const reviews: AmazonReview[] = [];

  // 等待评论加载
  await page.waitForSelector("[data-hook='review']", { timeout: 15000 }).catch(() => {});
  await page.waitForTimeout(1500);

  const reviewEls = await page.locator("[data-hook='review']").all();

  for (const el of reviewEls) {
    try {
      // 评论 ID
      const reviewId = await el.getAttribute("id").catch(() => "") || "";

      // 评分
      const ratingText = await el.locator("[data-hook='review-star-rating'] .a-icon-alt, i.a-icon-star a-icon-alt").first().getAttribute("aria-label").catch(() => "");
      const ratingMatch = (ratingText ?? "").match(/([0-9.]+)\s*out\s*of/);
      const rating = ratingMatch ? ratingMatch[1] : "0";
      const ratingNum = parseFloat(rating) || 0;

      // 评论标题
      const title = await el.locator("[data-hook='review-title'] span:last-child, a[data-hook='review-title'] span").first().textContent().catch(() => "");

      // 评论内容
      const content = await el.locator("[data-hook='review-body'] span").first().textContent().catch(() => "");

      // 评论日期
      const dateText = await el.locator("[data-hook='review-date']").first().textContent().catch(() => "");
      let reviewDate = "";
      const dateMatch = dateText?.match(/on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
      if (dateMatch) {
        reviewDate = new Date(dateMatch[1]).toISOString().slice(0, 10);
      }

      // Verified Purchase
      const verifiedText = await el.locator("[data-hook='avp-badge']").first().textContent().catch(() => "");
      const verifiedPurchase = verifiedText?.toLowerCase().includes("verified") ?? false;

      // Helpful votes
      const helpfulText = await el.locator("[data-hook='helpful-vote-statement']").first().textContent().catch(() => "");
      const helpfulMatch = helpfulText?.match(/([\d,]+)/);
      const helpfulCount = helpfulMatch ? parseInt(helpfulMatch[1].replace(/,/g, ""), 10) : 0;

      // Reviewer name
      const reviewerName = await el.locator("[data-hook='genome-widget'] .a-profile-name, .a-profile-name").first().textContent().catch(() => "");

      if (content && content.trim().length > 5) {
        reviews.push({
          review_id: reviewId,
          asin,
          rating,
          sentiment: inferSentiment(ratingNum),
          content: content.trim(),
          title: (title || "").trim(),
          reviewDate: reviewDate || new Date().toISOString().slice(0, 10),
          verifiedPurchase,
          helpfulCount,
          reviewerName: (reviewerName ?? "").trim(),
        });
      }
    } catch {
      continue;
    }
  }

  return reviews;
}

interface CrawlReviewsOptions {
  marketplace?: "us" | "uk";
  asin: string;
  limit?: number;
  browserPool: CrawlContext["browserPool"];
  rateLimiter: CrawlContext["rateLimiter"];
  retryHandler: CrawlContext["retryHandler"];
}

export async function crawlAmazonReviews(opts: CrawlReviewsOptions) {
  const {
    marketplace = "us",
    asin,
    limit = 50,
    browserPool,
    rateLimiter,
    retryHandler,
  } = opts;

  const baseUrl = getBaseUrl(marketplace);
  let url = `${baseUrl}/product-reviews/${asin}?ie=UTF8&reviewerType=all_reviews&pageNumber=1`;

  console.log(`🌐 Opening reviews: ${url}`);

  const allReviews: AmazonReview[] = [];
  let pageNum = 1;
  let hasMore = true;

  while (allReviews.length < limit && hasMore && pageNum <= 10) {
    const pageReviews = await retryHandler.execute(
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

            return await parseReviewsPage(page, asin);
          });
        });
      },
      { url, task: `amazon_reviews_page_${pageNum}` }
    );

    if (pageReviews.length === 0) {
      hasMore = false;
      break;
    }

    allReviews.push(...pageReviews);
    console.log(`   Page ${pageNum}: +${pageReviews.length} reviews (total: ${allReviews.length})`);

    // 检查是否有下一页
    pageNum++;
    url = `${baseUrl}/product-reviews/${asin}?ie=UTF8&reviewerType=all_reviews&pageNumber=${pageNum}`;
  }

  return {
    data: allReviews.slice(0, limit),
    total: allReviews.length,
    hasMore,
    meta: {
      source: "amazon_reviews",
      marketplace,
      durationMs: 0,
      requestedAt: new Date().toISOString(),
      pageUrl: url,
    },
  };
}
