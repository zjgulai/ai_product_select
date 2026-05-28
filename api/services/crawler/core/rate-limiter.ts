/**
 * 请求频率控制器
 *
 * 模拟人类浏览行为：随机间隔、批次延迟、令牌桶限流
 */

import type { RateLimitOptions } from "./types";

export function createRateLimiter(opts: RateLimitOptions = {}) {
  const {
    requestsPerSecond = 0.5, // 默认每 2 秒 1 个请求
    minDelayMs = 1000,
    maxDelayMs = 3500,
  } = opts;

  const minIntervalMs = 1000 / requestsPerSecond;
  let lastRequestTime = 0;
  let pendingPromise: Promise<unknown> = Promise.resolve();

  function randomDelay(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  async function waitForSlot(): Promise<void> {
    const now = Date.now();
    const timeSinceLast = now - lastRequestTime;
    const waitTime = Math.max(0, minIntervalMs - timeSinceLast);

    if (waitTime > 0) {
      await new Promise((resolve) => setTimeout(resolve, waitTime));
    }

    lastRequestTime = Date.now();
  }

  async function throttle<T>(fn: () => Promise<T>): Promise<T> {
    // 串行化：确保同一时间只有一个请求在执行
    const current = pendingPromise.then(async () => {
      await waitForSlot();

      // 额外随机延迟，模拟人类操作间隔
      const jitter = randomDelay(minDelayMs, maxDelayMs);
      await new Promise((resolve) => setTimeout(resolve, jitter));

      return fn();
    });

    pendingPromise = current.catch(() => {});
    return current;
  }

  async function delay(ms?: number): Promise<void> {
    const d = ms ?? randomDelay(minDelayMs, maxDelayMs);
    await new Promise((resolve) => setTimeout(resolve, d));
  }

  return {
    throttle,
    delay,
    randomDelay: () => randomDelay(minDelayMs, maxDelayMs),
    getStats: () => ({
      requestsPerSecond,
      minDelayMs,
      maxDelayMs,
      lastRequestTime,
    }),
  };
}
