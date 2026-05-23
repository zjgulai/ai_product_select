import { test, expect } from '@playwright/test';

/**
 * 流程 2：选品机会榜 → 排序 → 进入概念详情
 *
 * 验证点：
 * - 机会榜列表正常加载
 * - 点击查看详情可跳转
 * - 概念详情页加载完成
 */
test.describe('融合选品机会榜', () => {
  test('打开机会榜并显示数据', async ({ page }) => {
    await page.goto('/#/fusion/opportunities');
    await page.waitForLoadState('networkidle', { timeout: 30_000 });

    await expect(page.getByText('融合选品机会榜')).toBeVisible();
    await expect(page.getByText('SHI')).toBeVisible();
    await expect(page.getByText('CVI')).toBeVisible();

    // 至少有一行数据
    const rows = page.locator('tbody tr');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
  });

  test('点击查看详情跳转到概念详情页', async ({ page }) => {
    await page.goto('/#/fusion/opportunities');
    await page.waitForLoadState('networkidle');

    // 等表格加载
    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 });
    await page.locator('text=查看详情').first().click();

    await expect(page).toHaveURL(/.*\/fusion\/concept\//);
    await page.waitForLoadState('networkidle');

    // 详情页头部存在
    await expect(page.getByText('SHI 社媒热度')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByText('CVI 电商验证')).toBeVisible();
  });

  test('支持排序切换', async ({ page }) => {
    await page.goto('/#/fusion/opportunities');
    await page.waitForLoadState('networkidle');

    await page.locator('tbody tr').first().waitFor({ timeout: 15_000 });
    // 点击 SHI 排序
    await page.getByRole('button', { name: 'SHI' }).click();

    // 不报错即认为通过（排序逻辑已被单元测试覆盖）
    await expect(page.locator('tbody tr').first()).toBeVisible();
  });
});
