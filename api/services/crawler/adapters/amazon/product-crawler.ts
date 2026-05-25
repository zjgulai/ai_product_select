/**
 * Amazon 产品详情页爬虫
 *
 * 基于 ASIN 列表批量采集产品详情
 */

import type { Page } from "playwright";
import type { CrawlContext } from "../../core/types.ts";

interface AmazonProductDetail {
  asin: string;
  title: string;
  brand: string;
  category: string;
  price: string;
  rating: string;
  reviewCount: number;
  bsrRank: number;
  imageUrl: string;
  description: string;
  features: string[];
}

function getBaseUrl(marketplace: "us" | "uk"): string {
  return marketplace === "uk" ? "https://www.amazon.co.uk" : "https://www.amazon.com";
}

async function parseProductPage(page: Page, asin: string): Promise<AmazonProductDetail | null> {
  return await page.evaluate((asinArg) => {
    const fullText = document.body.textContent || "";

    // 标题
    let title = "";
    const titleEl = document.querySelector("#productTitle");
    if (titleEl) title = titleEl.textContent || "";

    // 品牌
    let brand = "";
    const brandEl = document.querySelector("#bylineInfo, a[href*='field-brandtextbin']");
    if (brandEl) {
      brand = (brandEl.textContent || "").replace(/^Brand:\s*/i, "").trim();
    }

    // 价格 — 支持多种货币
    let price = "";
    const priceEls = document.querySelectorAll(
      ".a-price .a-offscreen, #priceblock_dealprice, #priceblock_ourprice, .a-price-whole"
    );
    for (const el of Array.from(priceEls)) {
      const text = el.textContent || "";
      if (/[\$£€]|GBP|EUR|USD/.test(text) && /\d/.test(text)) {
        price = text.trim();
        break;
      }
    }

    // 评分
    let rating = "";
    const ratingMatch = fullText.match(/([0-9.]+)\s*out\s*of\s*5/);
    if (ratingMatch) rating = ratingMatch[1];

    // 评论数
    let reviewCount = 0;
    const reviewMatch = fullText.match(/([\d,]+)\s*(?:ratings?|reviews?)/i);
    if (reviewMatch) reviewCount = parseInt(reviewMatch[1].replace(/,/g, ""), 10);

    // BSR
    let bsrRank = 0;
    const detailText = document.querySelector("#productDetails_detailBullets_sections1, #detailBullets_feature_div")?.textContent || "";
    const bsrMatch = detailText.match(/#?([\d,]+)\s*in\s*[^#]+Best\s*Sellers?/i);
    if (bsrMatch) bsrRank = parseInt(bsrMatch[1].replace(/,/g, ""), 10);

    // 图片
    let imageUrl = "";
    const img = document.querySelector("#landingImage, #imgBlkFront") as HTMLImageElement;
    if (img) imageUrl = img.src;

    // 描述
    let description = "";
    const descEl = document.querySelector("#productDescription, #aplus");
    if (descEl) description = descEl.textContent || "";

    // Feature bullets
    const features: string[] = [];
    const bulletEls = document.querySelectorAll("#feature-bullets ul li span");
    bulletEls.forEach((el) => {
      const text = el.textContent?.trim();
      if (text && text.length > 5 && !text.includes("Make sure")) features.push(text);
    });

    if (!title) return null;

    return {
      asin: asinArg,
      title: title.trim(),
      brand,
      category: "",
      price,
      rating,
      reviewCount,
      bsrRank,
      imageUrl,
      description: description.trim().slice(0, 1000),
      features: features.slice(0, 5),
    };
  }, asin);
}

interface CrawlProductOptions {
  marketplace?: "us" | "uk";
  asins: string[];
  browserPool: CrawlContext["browserPool"];
  rateLimiter: CrawlContext["rateLimiter"];
  retryHandler: CrawlContext["retryHandler"];
}

export async function crawlAmazonProducts(opts: CrawlProductOptions) {
  const {
    marketplace = "us",
    asins,
    browserPool,
    rateLimiter,
    retryHandler,
  } = opts;

  const baseUrl = getBaseUrl(marketplace);
  const products: AmazonProductDetail[] = [];

  for (let i = 0; i < asins.length; i++) {
    const asin = asins[i];
    const url = `${baseUrl}/dp/${asin}`;

    console.log(`🌐 [${i + 1}/${asins.length}] Product: ${url}`);

    try {
      const product = await retryHandler.execute(
        async () => {
          return await rateLimiter.throttle(async () => {
            return await browserPool.withPage(async (page) => {
              await page.setExtraHTTPHeaders({
                "Accept-Language": marketplace === "uk" ? "en-GB,en;q=0.9" : "en-US,en;q=0.9",
              });

              await page.goto(url, { waitUntil: "domcontentloaded", timeout: 20000 });
              await page.waitForTimeout(2000);

              const pageTitle = await page.title().catch(() => "");
              if (pageTitle.toLowerCase().includes("captcha")) {
                throw new Error("CAPTCHA detected");
              }

              return await parseProductPage(page, asin);
            });
          });
        },
        { url, task: `amazon_product_${asin}` }
      );

      if (product) {
        products.push(product);
        console.log(`   ✅ ${product.title.slice(0, 60)} | ${product.price} | ⭐${product.rating}`);
      }
    } catch (err) {
      console.warn(`   ❌ Failed: ${(err as Error).message}`);
    }
  }

  return {
    data: products,
    total: products.length,
    hasMore: false,
    meta: {
      source: "amazon_product",
      marketplace,
      durationMs: 0,
      requestedAt: new Date().toISOString(),
      pageUrl: baseUrl,
    },
  };
}
