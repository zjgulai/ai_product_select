/**
 * Playwright 爬虫引擎类型定义
 */

export interface CrawlOptions {
  /** 目标市场 */
  marketplace?: "us" | "uk";
  /** 品类关键词 */
  category?: string;
  /** 搜索关键词 */
  keyword?: string;
  /** 最大采集数量 */
  limit?: number;
  /** 起始偏移 */
  offset?: number;
  /** 分页游标 */
  cursor?: string;
  /** 日期范围 */
  dateRange?: [string, string];
  /** 是否使用无头模式 */
  headless?: boolean;
  /** 是否使用代理 */
  useProxy?: boolean;
  /** 请求间隔 ms（默认 1000-3000 随机） */
  minDelay?: number;
  maxDelay?: number;
}

export interface CrawlResult<T = unknown> {
  /** 采集到的数据 */
  data: T[];
  /** 总数量（如有） */
  total?: number;
  /** 下一页游标 */
  nextCursor?: string;
  /** 是否有更多数据 */
  hasMore: boolean;
  /** 元信息 */
  meta: {
    source: string;
    marketplace: string;
    durationMs: number;
    requestedAt: string;
    pageUrl: string;
  };
}

export interface CrawlerAdapter<T = unknown> {
  name: string;
  sourceKey: string;
  /** 采集入口 */
  crawl(opts: CrawlOptions): Promise<CrawlResult<T>>;
  /** 健康检查 */
  healthCheck(): Promise<{ ok: boolean; latencyMs: number; message?: string }>;
}

export interface BrowserPoolOptions {
  /** 最大并发 browser 实例数 */
  maxBrowsers?: number;
  /** 每个 browser 最大页面数 */
  maxPagesPerBrowser?: number;
  /** 无头模式 */
  headless?: boolean;
  /** 额外的 launch 参数 */
  launchOptions?: Record<string, unknown>;
}

export interface RateLimitOptions {
  /** 每秒最大请求数 */
  requestsPerSecond?: number;
  /** 每批次之间的最小延迟 ms */
  minDelayMs?: number;
  /** 每批次之间的最大延迟 ms */
  maxDelayMs?: number;
}

export interface RetryOptions {
  /** 最大重试次数 */
  maxRetries?: number;
  /** 重试间隔基数 ms（指数退避） */
  baseDelayMs?: number;
  /** 最大重试间隔 ms */
  maxDelayMs?: number;
  /** 哪些错误码需要重试 */
  retryableStatuses?: number[];
  /** 自定义重试判断 */
  shouldRetry?: (error: Error, attempt: number) => boolean;
}

export interface CrawlContext {
  browserPool: BrowserPool;
  rateLimiter: RateLimiter;
  retryHandler: RetryHandler;
}

export type BrowserPool = ReturnType<typeof import("./browser-pool").createBrowserPool>;
export type RateLimiter = ReturnType<typeof import("./rate-limiter").createRateLimiter>;
export type RetryHandler = ReturnType<typeof import("./retry-handler").createRetryHandler>;
