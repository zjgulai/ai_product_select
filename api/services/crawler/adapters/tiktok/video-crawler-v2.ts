/**
 * TikTok 视频爬虫 V2 — 增强反爬策略
 *
 * 策略优先级：
 *   1. www.tiktok.com/search + 预热 + 强反爬指纹
 *   2. m.tiktok.com 移动端搜索（反爬更弱）
 *   3. Google 搜索 site:tiktok.com（最后备选）
 */

import type { Page } from "playwright";
import type { CrawlContext } from "../../core/types.ts";

interface TikTokVideoItem {
  videoId: string;
  title: string;
  creatorName: string;
  creatorId: string;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  hashtags: string[];
  date: string;
  coverUrl?: string;
  duration?: string;
  strategy: string; // 记录成功使用的策略
}

function parseCount(text: string): number {
  const cleaned = text.trim().toLowerCase().replace(/,/g, "");
  if (cleaned.endsWith("k")) return Math.floor(parseFloat(cleaned) * 1000);
  if (cleaned.endsWith("m")) return Math.floor(parseFloat(cleaned) * 1000000);
  if (cleaned.endsWith("b")) return Math.floor(parseFloat(cleaned) * 1000000000);
  return parseInt(cleaned, 10) || 0;
}

// ============================================================
// 策略 1: www.tiktok.com/search + 预热 + 强反爬指纹
// ============================================================

async function warmupTikTok(page: Page): Promise<boolean> {
  try {
    await page.goto("https://www.tiktok.com", {
      waitUntil: "domcontentloaded",
      timeout: 15000,
    });
    await page.waitForTimeout(2000);

    // 模拟鼠标移动（人类行为）
    await page.mouse.move(100, 200);
    await page.waitForTimeout(300);
    await page.mouse.move(300, 400);
    await page.waitForTimeout(500);
    await page.mouse.move(500, 300);
    await page.waitForTimeout(400);

    // 滚动一点
    await page.evaluate(() => window.scrollBy(0, 300));
    await page.waitForTimeout(1000);

    const title = await page.title().catch(() => "");
    return !title.toLowerCase().includes("verify") && !title.toLowerCase().includes("captcha");
  } catch {
    return false;
  }
}

async function parseTikTokSearchPage(page: Page): Promise<TikTokVideoItem[]> {
  return await page.evaluate(() => {
    const items: TikTokVideoItem[] = [];

    const selectors = [
      '[data-e2e="search_top-item"]',
      '[data-e2e="search_video-item"]',
      '.tiktok-x6y88p-DivItemContainer',
      '[class*="DivItemContainer"]',
      'a[href*="/video/"]',
    ];

    let cards: Element[] = [];
    for (const selector of selectors) {
      const found = document.querySelectorAll(selector);
      if (found.length > 0) {
        if (selector === 'a[href*="/video/"]') {
          const seen = new Set<string>();
          cards = Array.from(found).filter((el) => {
            const href = (el as HTMLAnchorElement).href;
            if (seen.has(href)) return false;
            seen.add(href);
            return true;
          });
        } else {
          cards = Array.from(found);
        }
        break;
      }
    }

    cards.forEach((card) => {
      try {
        const anchor = card.tagName === "A" ? card : card.querySelector('a[href*="/video/"]');
        if (!anchor) return;

        const href = (anchor as HTMLAnchorElement).href;
        const videoIdMatch = href.match(/\/video\/(\d+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : "";
        if (!videoId) return;

        let title = "";
        const titleEl = card.querySelector('[data-e2e="search-card-desc"], [class*="SpanText"], p');
        if (titleEl) title = titleEl.textContent || "";

        let creatorName = "";
        let creatorId = "";
        const creatorEl = card.querySelector('a[href^="/@"]');
        if (creatorEl) {
          const creatorHref = (creatorEl as HTMLAnchorElement).href;
          const creatorMatch = creatorHref.match(/@([^/?]+)/);
          if (creatorMatch) {
            creatorId = creatorMatch[1];
            creatorName = creatorEl.textContent || creatorId;
          }
        }

        let views = 0;
        const viewsEl = card.querySelector('[data-e2e="search-card-video-view"], [class*="StrongVideoCount"]');
        if (viewsEl) {
          const text = viewsEl.textContent || "";
          const num = text.replace(/,/g, "").toLowerCase();
          if (num.endsWith("k")) views = Math.floor(parseFloat(num) * 1000);
          else if (num.endsWith("m")) views = Math.floor(parseFloat(num) * 1000000);
          else views = parseInt(num, 10) || 0;
        }

        let coverUrl = "";
        const img = card.querySelector("img");
        if (img) coverUrl = img.src;

        const hashtags: string[] = [];
        const hashtagEls = card.querySelectorAll('a[href*="/tag/"]');
        hashtagEls.forEach((el) => {
          const tag = el.textContent?.trim();
          if (tag && tag.startsWith("#")) hashtags.push(tag.slice(1));
        });

        if (title || creatorName) {
          items.push({
            videoId,
            title: title.trim(),
            creatorName: creatorName.trim(),
            creatorId,
            views,
            likes: 0,
            comments: 0,
            shares: 0,
            hashtags,
            date: new Date().toISOString().slice(0, 10),
            coverUrl,
            strategy: "www_search",
          } as TikTokVideoItem);
        }
      } catch {
        // ignore
      }
    });

    return items;
  });
}

async function strategyWwwSearch(
  keyword: string,
  limit: number,
  browserPool: CrawlContext["browserPool"],
  rateLimiter: CrawlContext["rateLimiter"],
  retryHandler: CrawlContext["retryHandler"]
): Promise<TikTokVideoItem[] | null> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.tiktok.com/search?q=${encodedKeyword}`;

  console.log(`   [Strategy 1] www.tiktok.com/search?q=${keyword}`);

  return await retryHandler.execute(
    async () => {
      return await rateLimiter.throttle(async () => {
        return await browserPool.withPage(async (page) => {
          // 设置更强的 headers
          await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.tiktok.com/",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
            "Sec-Fetch-User": "?1",
            "Upgrade-Insecure-Requests": "1",
          });

          // 预热
          const warmed = await warmupTikTok(page);
          if (!warmed) {
            throw new Error("Warmup failed - likely blocked");
          }

          // 跳转到搜索页
          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          // 给足时间让 JS 渲染内容（TikTok 是重度 JS 应用）
          await page.waitForTimeout(6000);

          const pageTitle = await page.title().catch(() => "");
          if (pageTitle.toLowerCase().includes("verify") || pageTitle.toLowerCase().includes("captcha")) {
            throw new Error("TikTok verification detected");
          }

          console.log(`   Page title: ${pageTitle}`);

          let allVideos: TikTokVideoItem[] = [];
          let scrollAttempts = 0;
          const maxScrolls = Math.ceil(limit / 5) + 3; // 更多滚动次数

          while (allVideos.length < limit && scrollAttempts < maxScrolls) {
            const parsed = await parseTikTokSearchPage(page);
            console.log(`   Scroll ${scrollAttempts + 1}: found ${parsed.length} videos`);

            const seen = new Set(allVideos.map((v) => v.videoId));
            const newVideos = parsed.filter((v) => !seen.has(v.videoId));
            allVideos = allVideos.concat(newVideos);

            if (newVideos.length === 0 && scrollAttempts > 3) break;

            await page.evaluate(() => window.scrollBy(0, window.innerHeight * 3));
            await rateLimiter.delay();
            scrollAttempts++;
          }

          // 如果内容太少，可能是未登录状态，尝试再等一会儿
          if (allVideos.length < 3 && scrollAttempts < maxScrolls) {
            await page.waitForTimeout(5000);
            const extra = await parseTikTokSearchPage(page);
            const seen = new Set(allVideos.map((v) => v.videoId));
            const newExtra = extra.filter((v) => !seen.has(v.videoId));
            allVideos = allVideos.concat(newExtra);
          }

          if (allVideos.length === 0) {
            throw new Error("No videos found on www search");
          }

          return allVideos.slice(0, limit);
        });
      });
    },
    { url, task: "tiktok_www_search" }
  );
}

// ============================================================
// 策略 2: m.tiktok.com 移动端搜索
// ============================================================

async function strategyMobileSearch(
  keyword: string,
  limit: number,
  browserPool: CrawlContext["browserPool"],
  rateLimiter: CrawlContext["rateLimiter"],
  retryHandler: CrawlContext["retryHandler"]
): Promise<TikTokVideoItem[] | null> {
  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://m.tiktok.com/search?q=${encodedKeyword}`;

  console.log(`   [Strategy 2] m.tiktok.com/search?q=${keyword}`);

  return await retryHandler.execute(
    async () => {
      return await rateLimiter.throttle(async () => {
        return await browserPool.withPage(async (page) => {
          // 移动端 viewport
          await page.setViewportSize({ width: 375, height: 812 });
          await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://m.tiktok.com/",
            "User-Agent":
              "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
            "Sec-Fetch-Dest": "document",
            "Sec-Fetch-Mode": "navigate",
            "Sec-Fetch-Site": "same-origin",
          });

          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(4000);

          const pageTitle = await page.title().catch(() => "");
          console.log(`   Mobile page title: ${pageTitle}`);

          // 移动端使用不同的选择器
          const items = await page.evaluate(() => {
            const results: TikTokVideoItem[] = [];

            // 移动端常见的视频卡片 class
            const cards = document.querySelectorAll(
              'a[href*="/video/"], [class*="video-card"], [class*="item-card"]'
            );

            const seen = new Set<string>();
            cards.forEach((card) => {
              try {
                const anchor = card.tagName === "A" ? card : card.querySelector('a[href*="/video/"]');
                if (!anchor) return;

                const href = (anchor as HTMLAnchorElement).href;
                const match = href.match(/\/video\/(\d+)/);
                const videoId = match ? match[1] : "";
                if (!videoId || seen.has(videoId)) return;
                seen.add(videoId);

                let title = "";
                const titleEl = card.querySelector("p, [class*='desc'], [class*='title']");
                if (titleEl) title = titleEl.textContent || "";

                let creatorName = "";
                let creatorId = "";
                const creatorEl = card.querySelector('a[href^="/@"]');
                if (creatorEl) {
                  const cMatch = creatorEl.getAttribute("href")?.match(/@([^/?]+)/);
                  if (cMatch) {
                    creatorId = cMatch[1];
                    creatorName = creatorEl.textContent || creatorId;
                  }
                }

                let views = 0;
                const viewsEl = card.querySelector("span, [class*='count'], [class*='view']");
                if (viewsEl) {
                  const text = viewsEl.textContent || "";
                  const num = text.replace(/,/g, "").toLowerCase();
                  if (num.endsWith("k")) views = Math.floor(parseFloat(num) * 1000);
                  else if (num.endsWith("m")) views = Math.floor(parseFloat(num) * 1000000);
                  else views = parseInt(num, 10) || 0;
                }

                let coverUrl = "";
                const img = card.querySelector("img");
                if (img) coverUrl = img.src;

                if (title || creatorName) {
                  results.push({
                    videoId,
                    title: title.trim(),
                    creatorName: creatorName.trim(),
                    creatorId,
                    views,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    hashtags: [],
                    date: new Date().toISOString().slice(0, 10),
                    coverUrl,
                    strategy: "mobile_search",
                  } as TikTokVideoItem);
                }
              } catch {
                // ignore
              }
            });

            return results;
          });

          if (items.length === 0) {
            throw new Error("No videos found on mobile search");
          }

          console.log(`   Mobile search: found ${items.length} videos`);
          return items.slice(0, limit);
        });
      });
    },
    { url, task: "tiktok_mobile_search" }
  );
}

// ============================================================
// 策略 3: Google 搜索 site:tiktok.com
// ============================================================

async function strategyGoogleSearch(
  keyword: string,
  limit: number,
  browserPool: CrawlContext["browserPool"],
  rateLimiter: CrawlContext["rateLimiter"],
  retryHandler: CrawlContext["retryHandler"]
): Promise<TikTokVideoItem[] | null> {
  const encodedKeyword = encodeURIComponent(`${keyword} site:tiktok.com`);
  const url = `https://www.google.com/search?q=${encodedKeyword}`;

  console.log(`   [Strategy 3] Google search: ${keyword} site:tiktok.com`);

  return await retryHandler.execute(
    async () => {
      return await rateLimiter.throttle(async () => {
        return await browserPool.withPage(async (page) => {
          await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.google.com/",
          });

          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
          await page.waitForTimeout(3000);

          // 处理 Google 的 cookie consent
          const consentBtn = await page.locator('button:has-text("Reject all"), button:has-text("I decline")').first();
          if (await consentBtn.isVisible().catch(() => false)) {
            await consentBtn.click();
            await page.waitForTimeout(1000);
          }

          const items = await page.evaluate(() => {
            const results: TikTokVideoItem[] = [];

            // Google 搜索结果中的 TikTok 链接
            const links = document.querySelectorAll('a[href*="tiktok.com/@"][href*="/video/"]');
            const seen = new Set<string>();

            links.forEach((link) => {
              try {
                const href = (link as HTMLAnchorElement).href;
                const match = href.match(/\/video\/(\d+)/);
                const videoId = match ? match[1] : "";
                if (!videoId || seen.has(videoId)) return;
                seen.add(videoId);

                // 尝试找标题（通常在上面的 h3 中）
                let title = "";
                let parent = link.parentElement;
                for (let i = 0; i < 5 && parent; i++) {
                  const h3 = parent.querySelector("h3");
                  if (h3) {
                    title = h3.textContent || "";
                    break;
                  }
                  parent = parent.parentElement;
                }

                // 提取 creator
                let creatorId = "";
                const creatorMatch = href.match(/tiktok\.com\/(@[^/]+)/);
                if (creatorMatch) creatorId = creatorMatch[1];

                if (title || videoId) {
                  results.push({
                    videoId,
                    title: title.trim(),
                    creatorName: creatorId,
                    creatorId,
                    views: 0,
                    likes: 0,
                    comments: 0,
                    shares: 0,
                    hashtags: [],
                    date: new Date().toISOString().slice(0, 10),
                    strategy: "google_search",
                  } as TikTokVideoItem);
                }
              } catch {
                // ignore
              }
            });

            return results;
          });

          if (items.length === 0) {
            throw new Error("No videos found via Google search");
          }

          console.log(`   Google search: found ${items.length} videos`);
          return items.slice(0, limit);
        });
      });
    },
    { url, task: "tiktok_google_search" }
  );
}

// ============================================================
// 主入口：多策略回退
// ============================================================

interface CrawlTikTokVideosOptions {
  keyword?: string;
  limit?: number;
  browserPool: CrawlContext["browserPool"];
  rateLimiter: CrawlContext["rateLimiter"];
  retryHandler: CrawlContext["retryHandler"];
}

export async function crawlTikTokVideosV2(opts: CrawlTikTokVideosOptions): Promise<{
  data: TikTokVideoItem[];
  total: number;
  hasMore: boolean;
  strategy: string;
  meta: {
    source: string;
    marketplace: string;
    durationMs: number;
    requestedAt: string;
    pageUrl: string;
  };
}> {
  const {
    keyword = "baby",
    limit = 30,
    browserPool,
    rateLimiter,
    retryHandler,
  } = opts;

  const startTime = Date.now();
  const strategies = [
    { name: "www_search", fn: () => strategyWwwSearch(keyword, limit, browserPool, rateLimiter, retryHandler) },
    { name: "mobile_search", fn: () => strategyMobileSearch(keyword, limit, browserPool, rateLimiter, retryHandler) },
    { name: "google_search", fn: () => strategyGoogleSearch(keyword, limit, browserPool, rateLimiter, retryHandler) },
  ];

  let lastError: Error | undefined;

  for (const strategy of strategies) {
    try {
      console.log(`\n🌐 Trying strategy: ${strategy.name}`);
      const videos = await strategy.fn();

      if (videos && videos.length > 0) {
        const duration = Date.now() - startTime;
        console.log(`\n✅ Strategy '${strategy.name}' succeeded with ${videos.length} videos`);

        return {
          data: videos,
          total: videos.length,
          hasMore: videos.length >= limit,
          strategy: strategy.name,
          meta: {
            source: "tiktok_search_v2",
            marketplace: "us",
            durationMs: duration,
            requestedAt: new Date().toISOString(),
            pageUrl: `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`,
          },
        };
      }
    } catch (err) {
      lastError = err as Error;
      console.warn(`   ❌ Strategy '${strategy.name}' failed: ${lastError.message}`);
    }
  }

  // 所有策略都失败了 —— TikTok 反爬严格，返回空结果+标记
  console.warn(`\n⚠️  All TikTok strategies failed. Last error: ${lastError?.message ?? "unknown"}`);
  console.warn(`   TikTok requires authenticated session or residential proxy.`);
  console.warn(`   Returning empty result. Use mock data or manual import as fallback.\n`);

  return {
    data: [],
    total: 0,
    hasMore: false,
    strategy: "unavailable",
    meta: {
      source: "tiktok_search_v2",
      marketplace: "us",
      durationMs: Date.now() - startTime,
      requestedAt: new Date().toISOString(),
      pageUrl: `https://www.tiktok.com/search?q=${encodeURIComponent(keyword)}`,
    },
  };
}
