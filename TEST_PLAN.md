# 测试计划

> 更新时间：2026-05-23
> 测试状态：91/91 单元测试通过，全站 Playwright 手动验证通过

---

## 测试金字塔

```
         ▲    Playwright E2E（3 个套件，关键流程）
        ▲▲    tRPC 路由集成测试（router.test.ts，26 用例）
       ▲▲▲    单元测试（mockData + 业务逻辑，65 用例）
      ▲▲▲▲    静态检查（TypeScript 0 错误 + ESLint）
```

---

## 测试套件

| 文件 | 用例 | 覆盖范围 |
|------|------|----------|
| `api/services/mockData/amazonData.test.ts` | 6 | Amazon 商品/评论/搜索/市场 mock 层 |
| `api/services/mockData/tiktokData.test.ts` | 15 | TikTok 达人/视频/小店/直播/分析/首页 |
| `api/services/mockData/fusionData.test.ts` | 5 | 融合概念/指标/映射/报告 |
| `api/services/logic.test.ts` | 13 | 业务逻辑纯函数 |
| `api/routers/router.test.ts` | 26 | tRPC 三个 router 端到端接口契约 |
| `src/components/shared/DataTablePage.test.tsx` | 7 | 通用表格组件 |
| `src/components/shared/ErrorBoundary.test.tsx` | 5 | 错误边界 |
| `src/components/shared/LazyImage.test.tsx` | 5 | 图片懒加载 |
| `src/components/shared/LazyMount.test.tsx` | 4 | 视口懒渲染 |
| `src/components/shared/VirtualList.test.tsx` | 5 | 虚拟列表 |
| **合计** | **91** | — |

---

## 运行测试

```bash
npm run test                    # 全量运行
npm run test:watch              # 监听模式
npm run test:coverage           # 覆盖率报告
npm run test:e2e                # Playwright E2E（需本地服务器）
npx vitest run api/routers/     # 只跑 router 测试
```

---

## Playwright 手动验证结果（2026-05-23）

逐页测试，全部通过：

| 页面 | 数据渲染 | 图片加载 | Console 错误 |
|------|---------|---------|------------|
| TikTok 首页 | ✅ 榜单完整 | ✅ 0 破损 | 0 |
| TikTok 大盘分析 | ✅ 8 KPI + 8 图表 | — | 0 |
| TikTok 商品 | ✅ 20 行 | ✅ 0 破损 | 0 |
| TikTok 小店 | ✅ 20 行 | ✅ 0 破损 | 0 |
| TikTok 直播 | ✅ 20 行 | — | 0 |
| TikTok 关注 | ✅ 3 Tab 有数据 | — | 0 |
| Amazon 榜单 | ✅ 50 行 | ✅ 0 破损 | 0 |
| Amazon 关键词 | ✅ 搜索 "baby" 返回 5 条 | — | 0 |
| Amazon Reviews | ✅ 空态正常 | — | 0 |
| Fusion 机会榜 | ✅ 20 概念完整 | — | 0 |
| Fusion 概念详情 | ✅ SHI/CVI/指标全显示 | — | 0 |
| 数据管理中心 | ✅ 4 Tab + 8 数据源 | — | 0 |
| 用户中心 | ✅ 虚拟数据正常 | — | 0 |

---

## CI 自动化

`.github/workflows/ci.yml` 每次 push 执行：

```yaml
1. TypeScript 编译（tsc --noEmit）  → 必须 0 错误
2. ESLint                          → continue-on-error（警告不阻塞）
3. 单元测试 + 覆盖率               → 全部通过
4. 生产构建                        → 构建成功
```

`.github/workflows/deploy.yml` 在 main 分支额外执行 GitHub Pages 部署。

---

## 已知问题与已修复 Bug

### 2026-05-23 修复

| # | 问题 | 修复 |
|---|------|------|
| 1 | Live.tsx 使用已删除字段 `peakOnline/replies/newFans` | 改为 `maxOnline ?? peakOnline`、`comments ?? replies`、`gpm ?? newFans` |
| 2 | Attention.tsx `item.name[0]` 在空值时 crash | 改为 `(item.name ?? '?')[0]` |
| 3 | UserCenter 硬编码电话号码和到期日期 | 替换为虚拟数据 `lute_user_001` / `2027-12-31` |
| 4 | vite dev 模式空白页（mock 被 Hono 拦截 404） | vite.config.ts 新增 exclude `/^\/api\/services\/mockData\//` |
| 5 | 全局 mockLink 缺失（GitHub Pages 数据不加载） | 新建 `src/lib/mock-router.ts`，部署时注入 `VITE_USE_MOCK_DATA=true` |

### 2026-05-22 修复

| # | 问题 | 修复 |
|---|------|------|
| 6 | TS 编译 188 错误（mock 类型 ≠ DB Schema） | 重构 mock 接口，补齐 id/scrapedAt 等字段 |
| 7 | withFallback 静默吞掉所有 DB 错误 | 加 `console.error('[DB Fallback][xxx]', err)` |
| 8 | 2 处重复 className（Product/Keyword） | 合并为单个 className |
| 9 | Home.tsx 直播 Tab 死按钮 | 绑定 `liveTab` state |
| 10 | 15 处 img 标签无 onError | 批量添加 onError fallback SVG |
