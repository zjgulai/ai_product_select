/**
 * TikTok 视频爬虫
 *
 * 采集 TikTok 搜索结果页的视频数据
 * 目标页面：https://www.tiktok.com/search?q=[keyword]
 *
 * 策略：使用 Playwright 模拟真实浏览器，处理无限滚动加载
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
}

/**
 * 从 URL 提取视频 ID
 */
function extractVideoId(url: string): string {
  const match = url.match(/\/video\/(\d+)/);
  return match ? match[1] : "";
}

/**
 * 解析 views/likes 等数字（支持 K/M/B 后缀）
 */
function parseCount(text: string): number {
  const cleaned = text.trim().toLowerCase().replace(/,/g, "");
  if (cleaned.endsWith("k")) return Math.floor(parseFloat(cleaned) * 1000);
  if (cleaned.endsWith("m")) return Math.floor(parseFloat(cleaned) * 1000000);
  if (cleaned.endsWith("b")) return Math.floor(parseFloat(cleaned) * 1000000000);
  return parseInt(cleaned, 10) || 0;
}

/**
 * 使用 page.evaluate 高效提取搜索页视频数据
 */
async function parseSearchPage(page: Page): Promise<TikTokVideoItem[]> {
  return await page.evaluate(() => {
    const items: TikTokVideoItem[] = [];

    // TikTok 搜索页的视频卡片选择器
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
        // 如果是 a 标签，去重
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
        const anchor = card.tagName === "A" ? card : card.querySelector("a[href*=\"/video/\"]");
        if (!anchor) return;

        const href = (anchor as HTMLAnchorElement).href;
        const videoIdMatch = href.match(/\/video\/(\d+)/);
        const videoId = videoIdMatch ? videoIdMatch[1] : "";
        if (!videoId) return;

        // 标题
        let title = "";
        const titleEl = card.querySelector('[data-e2e="search-card-desc"], [class*="SpanText"], p');
        if (titleEl) title = titleEl.textContent || "";

        // 创作者
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

        // 播放量
        let views = 0;
        const viewsEl = card.querySelector('[data-e2e="search-card-video-view"], [class*="StrongVideoCount"]');
        if (viewsEl) {
          const text = viewsEl.textContent || "";
          const num = text.replace(/,/g, "").toLowerCase();
          if (num.endsWith("k")) views = Math.floor(parseFloat(num) * 1000);
          else if (num.endsWith("m")) views = Math.floor(parseFloat(num) * 1000000);
          else views = parseInt(num, 10) || 0;
        }

        // 点赞数
        let likes = 0;
        const likesEl = card.querySelector('[class*="like"], [class*="Like"]');
        if (likesEl) {
          const text = likesEl.textContent || "";
          const num = text.replace(/,/g, "").toLowerCase();
          if (num.endsWith("k")) likes = Math.floor(parseFloat(num) * 1000);
          else if (num.endsWith("m")) likes = Math.floor(parseFloat(num) * 1000000);
          else likes = parseInt(num, 10) || 0;
        }

        // 封面图
        let coverUrl = "";
        const img = card.querySelector("img");
        if (img) coverUrl = img.src;

        // 提取 hashtags
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
            likes,
            comments: 0,
            shares: 0,
            hashtags,
            date: new Date().toISOString().slice(0, 10),
            coverUrl,
          });
        }
      } catch {
        // ignore
      }
    });

    return items;
  });
}

interface CrawlTikTokVideosOptions {
  keyword?: string;
  limit?: number;
  browserPool: CrawlContext["browserPool"];
  rateLimiter: CrawlContext["rateLimiter"];
  retryHandler: CrawlContext["retryHandler"];
}

export async function crawlTikTokVideos(opts: CrawlTikTokVideosOptions) {
  const {
    keyword = "baby",
    limit = 30,
    browserPool,
    rateLimiter,
    retryHandler,
  } = opts;

  const encodedKeyword = encodeURIComponent(keyword);
  const url = `https://www.tiktok.com/search?q=${encodedKeyword}`;

  console.log(`🌐 Opening: ${url}`);

  const videos = await retryHandler.execute(
    async () => {
      return await rateLimiter.throttle(async () => {
        return await browserPool.withPage(async (page) => {
          // 设置 TikTok 需要的 headers
          await page.setExtraHTTPHeaders({
            "Accept-Language": "en-US,en;q=0.9",
            "Referer": "https://www.tiktok.com/",
          });

          await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });

          // 检查是否被拦截
          const pageTitle = await page.title().catch(() => "");
          if (pageTitle.toLowerCase().includes("verify") || pageTitle.toLowerCase().includes("captcha")) {
            throw new Error("TikTok verification detected");
          }

          console.log(`   Page title: ${pageTitle}`);

          // 等待内容加载
          await page.waitForTimeout(4000);

          let allVideos: TikTokVideoItem[] = [];
          let scrollAttempts = 0;
          const maxScrolls = Math.ceil(limit / 10);

          while (allVideos.length < limit && scrollAttempts < maxScrolls) {
            const parsed = await parseSearchPage(page);
            console.log(`   Scroll ${scrollAttempts + 1}: found ${parsed.length} videos`);

            // 去重合并
            const seen = new Set(allVideos.map((v) => v.videoId));
            const newVideos = parsed.filter((v) => !seen.has(v.videoId));
            allVideos = allVideos.concat(newVideos);

            if (newVideos.length === 0 && scrollAttempts > 2) break;

            // 滚动加载更多
            await page.evaluate(() => {
              window.scrollBy(0, window.innerHeight * 3);
            });
            await rateLimiter.delay();
            scrollAttempts++;
          }

          return allVideos.slice(0, limit);
        });
      });
    },
    { url, task: "tiktok_videos_search" }
  );

  return {
    data: videos,
    total: videos.length,
    hasMore: videos.length >= limit,
    meta: {
      source: "tiktok_search",
      marketplace: "us",
      durationMs: 0,
      requestedAt: new Date().toISOString(),
      pageUrl: url,
    },
  };
}
