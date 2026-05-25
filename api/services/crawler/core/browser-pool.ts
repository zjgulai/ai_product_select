/**
 * Playwright Browser 实例池管理
 *
 * 模拟真实浏览器环境，支持多实例复用和优雅关闭
 */

import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { BrowserPoolOptions } from "./types";

const DEFAULT_USER_AGENTS = [
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
];

interface PooledBrowser {
  browser: Browser;
  contexts: BrowserContext[];
  createdAt: number;
  useCount: number;
}

export function createBrowserPool(opts: BrowserPoolOptions = {}) {
  const {
    maxBrowsers = 3,
    maxPagesPerBrowser = 10,
    headless = true,
    launchOptions = {},
  } = opts;

  const pool: PooledBrowser[] = [];
  let isShuttingDown = false;

  function pickUserAgent(): string {
    return DEFAULT_USER_AGENTS[Math.floor(Math.random() * DEFAULT_USER_AGENTS.length)];
  }

  async function createBrowser(): Promise<PooledBrowser> {
    const browser = await chromium.launch({
      headless,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-accelerated-2d-canvas",
        "--disable-gpu",
        "--window-size=1920,1080",
      ],
      ...launchOptions,
    });

    const pooled: PooledBrowser = {
      browser,
      contexts: [],
      createdAt: Date.now(),
      useCount: 0,
    };

    pool.push(pooled);
    return pooled;
  }

  async function getOrCreateBrowser(): Promise<PooledBrowser> {
    if (isShuttingDown) {
      throw new Error("Browser pool is shutting down");
    }

    // 找一个使用率最低的 browser
    const available = pool.filter((p) => p.useCount < maxPagesPerBrowser);
    if (available.length > 0) {
      available.sort((a, b) => a.useCount - b.useCount);
      return available[0];
    }

    if (pool.length < maxBrowsers) {
      return createBrowser();
    }

    // 等待可用 browser（简单实现：等第一个释放）
    await new Promise((resolve) => setTimeout(resolve, 500));
    return getOrCreateBrowser();
  }

  async function newPage(): Promise<Page> {
    const pooled = await getOrCreateBrowser();

    const context = await pooled.browser.newContext({
      userAgent: pickUserAgent(),
      viewport: { width: 1920, height: 1080 },
      locale: "en-US",
      timezoneId: "America/New_York",
      extraHTTPHeaders: {
        "Accept-Language": "en-US,en;q=0.9",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
        "Accept-Encoding": "gzip, deflate, br",
        "DNT": "1",
        "Connection": "keep-alive",
        "Upgrade-Insecure-Requests": "1",
      },
    });

    pooled.contexts.push(context);
    pooled.useCount++;

    const page = await context.newPage();

    // 注入 anti-detection 脚本
    await page.addInitScript(() => {
      // 覆盖 webdriver 检测
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      // 覆盖 plugins
      Object.defineProperty(navigator, "plugins", { get: () => [1, 2, 3, 4, 5] });
      // 覆盖 languages
      Object.defineProperty(navigator, "languages", { get: () => ["en-US", "en"] });
    });

    return page;
  }

  async function releasePage(page: Page): Promise<void> {
    try {
      const context = page.context();
      await page.close();
      await context.close();
    } catch {
      // ignore
    }

    // 更新 useCount
    for (const pooled of pool) {
      const stillOpen = pooled.contexts.filter((c) => {
        try {
          // @ts-expect-error internal check
          return !c._closed;
        } catch {
          return false;
        }
      });
      pooled.useCount = stillOpen.length;
      pooled.contexts = stillOpen;
    }
  }

  async function withPage<T>(fn: (page: Page) => Promise<T>): Promise<T> {
    const page = await newPage();
    try {
      return await fn(page);
    } finally {
      await releasePage(page);
    }
  }

  async function shutdown(): Promise<void> {
    isShuttingDown = true;
    for (const pooled of pool) {
      try {
        await pooled.browser.close();
      } catch {
        // ignore
      }
    }
    pool.length = 0;
  }

  // 进程退出时自动清理
  process.on("SIGINT", () => shutdown().then(() => process.exit(0)));
  process.on("SIGTERM", () => shutdown().then(() => process.exit(0)));

  return {
    newPage,
    releasePage,
    withPage,
    shutdown,
    getStats: () => ({
      totalBrowsers: pool.length,
      totalPages: pool.reduce((sum, p) => sum + p.useCount, 0),
      isShuttingDown,
    }),
  };
}
