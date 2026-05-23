import { test, expect } from '@playwright/test';

/**
 * 流程 1：用户进入首页 → 查看 TikTok 热门商品榜单
 *
 * 验证点：
 * - 主导航可访问
 * - 首页/热门列表加载完成
 * - 左侧菜单结构完整
 */
test.describe('首页与导航', () => {
  test('首页打开并显示左侧菜单', async ({ page }) => {
    await page.goto('/');

    // 等待页面加载
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // 左侧菜单可见
    await expect(page.locator('text=TikTok趋势').first()).toBeVisible();
    await expect(page.locator('text=Amazon趋势').first()).toBeVisible();
    await expect(page.locator('text=融合选品').first()).toBeVisible();
  });

  test('从菜单跳转到达人页', async ({ page }) => {
    await page.goto('/');
    await page.waitForLoadState('networkidle');

    await page.locator('text=达人').first().click();
    await expect(page).toHaveURL(/.*\/tiktok\/influencer/);
    await page.waitForLoadState('networkidle');

    // 表格存在
    await expect(page.locator('text=达人信息').first()).toBeVisible({ timeout: 15_000 });
  });
});
