import { test, expect } from '@playwright/test';

const routes = [
  '/',
  '/tiktok/home',
  '/tiktok/analysis',
  '/tiktok/products',
  '/tiktok/influencer',
  '/tiktok/shop',
  '/tiktok/video',
  '/tiktok/live',
  '/tiktok/attention',
  '/amazon/keyword',
  '/amazon/list',
  '/amazon/product',
  '/amazon/param-trend',
  '/amazon/brand-trend',
  '/amazon/hot-market',
  '/amazon/pot-market',
  '/report/analysis',
  '/user/center',
  '/data/manager',
  '/project/tracking',
  '/fusion/opportunities',
  '/fusion/report',
];

for (const route of routes) {
  test(`prod ${route}`, async ({ page }) => {
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        const text = msg.text();
        if (text.includes('favicon.ico')) return;
        errors.push(text);
      }
    });
    page.on('pageerror', err => errors.push(`PAGEERROR: ${err.message}`));

    await page.goto(`https://zjgulai.github.io/ai_product_select/#${route}`, { waitUntil: 'networkidle', timeout: 15000 });
    await page.waitForTimeout(2000);

    const errorOutput = errors.length > 0 ? errors.join('\n') : 'NO_ERRORS';
    expect(errorOutput).toBe('NO_ERRORS');
  });
}
