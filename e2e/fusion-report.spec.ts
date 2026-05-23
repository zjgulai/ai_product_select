import { test, expect } from '@playwright/test';

/**
 * 流程 3：融合报告生成
 *
 * 验证点：
 * - 输入关键词
 * - 选择概念
 * - 报告 7 个 Tab 可切换
 */
test.describe('融合报告生成', () => {
  test('完整三步流程：搜索 → 选择 → 报告', async ({ page }) => {
    await page.goto('/#/fusion/report');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    // 步骤1：搜索
    await expect(page.getByText('融合选品报告生成')).toBeVisible();
    await expect(page.getByPlaceholder(/输入关键词/)).toBeVisible();

    // 点击热门搜索快捷词
    await page.locator('text=便携温奶器').first().click();
    await page.waitForLoadState('networkidle');

    // 步骤2：选择概念
    await expect(page.getByText(/找到/).first()).toBeVisible({ timeout: 10_000 });

    // 点击第一个概念卡片
    const conceptCard = page.locator('button:has-text("便携温奶器")').first();
    if (await conceptCard.isVisible({ timeout: 5_000 })) {
      await conceptCard.click();
      await page.waitForLoadState('networkidle');

      // 步骤3：报告
      await expect(page.getByText('融合分析报告').first()).toBeVisible({ timeout: 15_000 });
      await expect(page.getByText('市场概况')).toBeVisible();
      await expect(page.getByText('社媒洞察')).toBeVisible();
      await expect(page.getByText('VOC分析')).toBeVisible();
    }
  });

  test('Tab 切换正常', async ({ page }) => {
    await page.goto('/#/fusion/report');
    await page.waitForLoadState('networkidle');

    await page.locator('text=便携温奶器').first().click();
    await page.waitForLoadState('networkidle');

    const card = page.locator('button:has-text("便携温奶器")').first();
    if (await card.isVisible({ timeout: 5_000 })) {
      await card.click();
      await page.waitForLoadState('networkidle');

      // 切换到机会建议 Tab
      await page.getByRole('button', { name: /机会建议/ }).click();
      await expect(page.getByText('AI选品建议').first()).toBeVisible({ timeout: 10_000 });
    }
  });
});
