/**
 * 失败重试处理器
 *
 * 支持指数退避、自定义重试条件、错误分类
 */

import type { RetryOptions } from "./types";

export class CrawlError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly status?: number,
    public readonly url?: string,
    public readonly isRetryable: boolean = true
  ) {
    super(message);
    this.name = "CrawlError";
  }
}

export function createRetryHandler(opts: RetryOptions = {}) {
  const {
    maxRetries = 3,
    baseDelayMs = 1000,
    maxDelayMs = 30000,
    retryableStatuses = [408, 429, 500, 502, 503, 504],
    shouldRetry,
  } = opts;

  function exponentialDelay(attempt: number): number {
    const delay = Math.min(baseDelayMs * Math.pow(2, attempt), maxDelayMs);
    // 添加 ±20% 抖动
    const jitter = delay * 0.2 * (Math.random() * 2 - 1);
    return Math.floor(delay + jitter);
  }

  function isRetryableError(error: Error): boolean {
    if (shouldRetry) {
      return shouldRetry(error, 0);
    }

    if (error instanceof CrawlError) {
      if (!error.isRetryable) return false;
      if (error.status && retryableStatuses.includes(error.status)) return true;
      return true;
    }

    // Playwright 常见错误
    const msg = error.message.toLowerCase();
    const retryablePatterns = [
      "timeout",
      "net::",
      "err_",
      "connection refused",
      "connection reset",
      "blocked",
      "forbidden",
      "too many requests",
    ];

    return retryablePatterns.some((p) => msg.includes(p));
  }

  async function execute<T>(
    fn: () => Promise<T>,
    context?: { url?: string; task?: string }
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error as Error;

        if (attempt === maxRetries) {
          break;
        }

        if (!isRetryableError(lastError)) {
          throw lastError;
        }

        const delayMs = exponentialDelay(attempt);
        const contextStr = context?.url ? ` [${context.url}]` : "";
        const taskStr = context?.task ? ` (${context.task})` : "";

        console.warn(
          `[Retry]${taskStr}${contextStr} attempt ${attempt + 1}/${maxRetries + 1} failed: ${lastError.message}. Retrying in ${delayMs}ms...`
        );

        await new Promise((resolve) => setTimeout(resolve, delayMs));
      }
    }

    throw lastError ?? new Error("Max retries exceeded");
  }

  return {
    execute,
    isRetryableError,
    getStats: () => ({ maxRetries, baseDelayMs, maxDelayMs }),
  };
}
