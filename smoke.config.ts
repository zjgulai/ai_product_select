import { defineConfig, devices } from '@playwright/test';

/**
 * Smoke Test Config — 验证生产构建产物无控制台错误
 * 在 deploy.yml 中于部署前运行，阻塞有 JS 错误的构建
 *
 * 运行：npx playwright test --config=smoke.config.ts
 */
export default defineConfig({
  testDir: './e2e',
  testMatch: 'smoke.spec.ts',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI ? 'github' : 'list',

  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  webServer: {
    command: 'npx vite preview --port 3000 --base=/ai_product_select/',
    url: 'http://localhost:3000/ai_product_select/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
