# VOC AI 选品平台 — 完整测试计划

> 最后更新：2026-05-22
> 当前状态：5 套件 / 65 用例 全部通过 ✅

---

## 1. 测试策略

### 1.1 测试金字塔

```
       ▲    E2E（Playwright，未实施 — 见 §6）
      ▲▲    集成 / 路由测试（router.test.ts，26 用例）
     ▲▲▲    单元测试（mock 层 + 业务逻辑，39 用例）
    ▲▲▲▲    静态检查（TypeScript + ESLint）
```

### 1.2 测试目标

| 层级 | 工具 | 频次 | 关键指标 |
|------|------|------|----------|
| 静态检查 | `tsc --noEmit` | 每次提交 | 0 错误 |
| 单元测试 | Vitest | 每次提交 | 65/65 通过 |
| 集成测试 | tRPC caller | 每次提交 | 26/26 通过 |
| E2E | Playwright (规划中) | 每次合并到 main | 待定 |
| 性能 | Lighthouse | 每次发布 | LCP < 2.5s |

---

## 2. 测试套件清单

| 文件 | 用例数 | 覆盖范围 |
|------|--------|----------|
| `api/services/mockData/amazonData.test.ts` | 6 | Amazon 商品/评论/搜索/市场 mock 层 |
| `api/services/mockData/tiktokData.test.ts` | 15 | TikTok 达人/视频/小店/直播/分析/首页 |
| `api/services/mockData/fusionData.test.ts` | 5 | 融合概念/指标/映射/报告 |
| `api/services/logic.test.ts` | 13 | 业务逻辑纯函数（机会分/情感比例/高亮/分页） |
| `api/routers/router.test.ts` | 26 | tRPC 三个 router 端到端接口契约 |
| **合计** | **65** | — |

---

## 3. 静态检查

### 3.1 TypeScript

```bash
npx tsc --noEmit
```

**约束**：编译必须零错误。已通过。

### 3.2 ESLint（可选）

```bash
npm run lint
```

**当前状态**：CI 已配置为 `continue-on-error: true`，未阻塞合并。

---

## 4. 单元测试

### 4.1 Mock 数据层

**Amazon (`amazonData.test.ts`) — 6 用例**

- 商品列表包含必要字段（ASIN/title/price/rating）
- ASIN 格式正则验证（`/^B0[A-Z0-9]{8}$/`）
- 评论 ASIN 过滤正确
- 评论情感字段值 ∈ {positive, negative, neutral}
- 关键词搜索支持空查询和模糊匹配
- HotMarket/PotMarket 字段完整性

**TikTok (`tiktokData.test.ts`) — 15 用例**

- 基础列表（达人 50 个 / 视频 / 小店 / 直播 / 商品）
- 分析仪表盘（KPI / Heatmap categories x months / GMV trend 10 个月 / 品类份额 / 矩阵 / 价格带）
- 首页榜单（productsHot/Soaring/New、influencersSales/Fans、shops/videos/lives）
- 缓存稳定性（多次调用同一引用）

**Fusion (`fusionData.test.ts`) — 5 用例**

- 概念列表包含 keyFeatures/tiktokKeywords/amazonCategories
- 机会分降序排列
- SHI/CVI/opportunityScore 数值范围 [0, 100]
- 关键词映射对完整
- 报告记录字段完整

### 4.2 业务逻辑

**`logic.test.ts` — 13 用例**

- **机会分计算**（4 用例）：SHI 高+CVI 低=高分（蓝海）；SHI 低+CVI 高=低分（红海）；上限 100；饱和趋零
- **情感比例**（2 用例）：正常计算；零评论不报错
- **关键词高亮**（4 用例）：多关键词；大小写不敏感；空数组；正则特殊字符
- **分页计算**（3 用例）：首页；末页不满 pageSize；超出页码

---

## 5. 集成测试（tRPC Router）

**`router.test.ts` — 26 用例**

通过 `appRouter.createCaller()` 直接调用，无需启动 HTTP 服务。

### 5.1 Amazon Router（13 用例）

- `products.list`：默认列表 + total / 搜索过滤 / 分页 / brands
- `products.getByAsin`：存在/不存在两种情况
- `reviews.list/stats`：默认查询、情感过滤、统计字段完整
- `keyword.search/stats`
- `hotMarket/potMarket/paramTrend/brandTrend`

### 5.2 Fusion Router（6 用例）

- `concepts.list/getById`：列表、null 处理、完整字段
- `metrics.list/topOpportunities`：按 conceptId 过滤、机会分降序
- `mappings.list/reports.list`

### 5.3 TikTok Router（7 用例）

- `products/creators/videos/shops/lives.list`
- `home.*` 8 个子接口全部可调用
- `analysis.*` 6 个图表数据接口全部可获取

---

## 6. E2E 测试（规划，未实施）

### 6.1 推荐工具：Playwright

```bash
npm i -D @playwright/test
npx playwright install
```

### 6.2 核心用户流程（待实施）

| # | 场景 | 优先级 |
|---|------|--------|
| 1 | 用户进入首页 → 查看 TikTok 热门商品榜单 | P0 |
| 2 | 进入选品机会榜 → 排序/搜索 → 进入概念详情 | P0 |
| 3 | 生成融合报告 → 输入关键词 → 选概念 → 查看 7 个 Tab | P0 |
| 4 | Amazon 榜单 → 点击查看评论 → 筛选 + 分页 | P1 |
| 5 | 概念详情 → 切换 VOC 深度对比 Tab → 词云渲染 | P1 |
| 6 | 数据管理：上传 Excel → 解析 → 写入 dynamic_data | P2 |

---

## 7. 性能测试（规划）

### 7.1 Lighthouse 指标基线

| 指标 | 目标 |
|------|------|
| LCP（最大内容绘制） | < 2.5s |
| FCP（首次内容绘制） | < 1.5s |
| TBT（总阻塞时间） | < 200ms |
| CLS（累积布局偏移） | < 0.1 |

### 7.2 Bundle 体积监控

```bash
npm run build
# 检查 dist/public/assets/ 单个 chunk 不超过 500KB
```

**当前优化**：已通过 `manualChunks` 拆分 echarts/lucide/trpc/recharts，路由级 lazy-loading。

---

## 8. 可用性测试（手工）

### 8.1 浏览器兼容

| 浏览器 | 最低版本 |
|--------|----------|
| Chrome | 100+ |
| Edge | 100+ |
| Safari | 15+ |
| Firefox | 100+ |

### 8.2 响应式断点

平台为 PC Web，主要适配 1280px+ 宽度。移动端非首要目标。

### 8.3 手工冒烟清单

每次发版前手工验证：
- [ ] 24 个路由全部可打开
- [ ] 左侧菜单 24 项全部高亮正确
- [ ] 主题色一致（lc-primary 橙红色调）
- [ ] Loading 骨架屏正常显示
- [ ] 接口失败时显示空状态
- [ ] 错误边界触发时降级 UI 正常

---

## 9. 测试运行

```bash
# 全量测试
npm test

# Watch 模式
npx vitest

# 单文件
npx vitest run api/routers/router.test.ts

# 覆盖率
npx vitest run --coverage
```

---

## 10. 测试执行结果（2026-05-22 更新）

```
✓ api/services/logic.test.ts                       (13 tests)
✓ api/services/mockData/tiktokData.test.ts         (15 tests)
✓ api/services/mockData/amazonData.test.ts          (6 tests)
✓ api/services/mockData/fusionData.test.ts          (5 tests)
✓ api/routers/router.test.ts                       (26 tests)
✓ src/components/shared/ErrorBoundary.test.tsx      (5 tests)
✓ src/components/shared/LazyMount.test.tsx          (5 tests)
✓ src/components/shared/LazyImage.test.tsx          (4 tests)
✓ src/components/shared/VirtualList.test.tsx        (5 tests)
✓ src/components/shared/DataTablePage.test.tsx      (7 tests)

Test Files  10 passed (10)
Tests       91 passed (91)
```

### 新增前端组件测试套件

| 文件 | 用例数 | 重点覆盖 |
|------|--------|----------|
| `ErrorBoundary.test.tsx` | 5 | 正常透传 / 异常降级 UI / 自定义 fallback / 重试恢复 |
| `LazyMount.test.tsx` | 5 | 占位高度 / 视口外不渲染 / 进入视口挂载 / keepMounted / 无 IO 降级 |
| `LazyImage.test.tsx` | 4 | 占位 src / 进入视口加载 / 加载失败 fallback / 原生 loading 属性 |
| `VirtualList.test.tsx` | 5 | 视口外项目不渲染 / 首屏含 0 / 空数组 / 容器高度 / spacer 总高度 |
| `DataTablePage.test.tsx` | 7 | Loading 骨架 / 数据渲染 / 列头 / 搜索回调 / Tab 切换 / 空状态 / extraHeader |

### 新发现并修复的 Bug

- **DataTablePage.tsx 缺失 `LC` 导入** — 与之前 DataManager / UserCenter 同源问题。组件测试直接渲染时暴露，已添加 `import { LC } from '@/lib/lute-colors'`。

---

## 11. 已知技术债

1. **E2E 测试未实施** — Playwright 配置待补
2. **前端组件测试缺失** — 当前测试集中在 mock/router 层，组件测试需要 `@testing-library/react` + jsdom
3. **数据库层未跑实际测试** — `api/services/db/` 需要真实数据库实例或测试容器
4. **Lighthouse CI 未集成** — `.github/workflows/ci.yml` 可加 `treosh/lighthouse-ci-action`
5. **覆盖率门槛未配置** — vitest 可加 `--coverage --threshold` 配置

---

## 12. 下一步建议

按优先级：

1. **P0** ✅ 补全前端关键组件测试（DataTablePage / ErrorBoundary / LazyMount / LazyImage / VirtualList）
2. **P1** ✅ Playwright 配置 + 3 个 P0 流程的 E2E 用例
3. **P1** ✅ 覆盖率门槛（lines 55% / branches 50% / functions 55% / statements 55%）
4. **P2**：数据库层集成测试（使用 docker-compose 起 MySQL 测试容器）
5. **P2**：Lighthouse CI 接入 GitHub Actions

---

## 13. 覆盖率结果（2026-05-22）

```
All files          | 69.12 stmts | 52.26 branch | 69.70 func | 72.01 lines
 api/routers       | 65.66       | 58.74        | 71.17      | 70.86
  amazon.ts        | 89.47       | 74.28        | 90.00      | 100.00 ★
  fusion.ts        | 67.27       | 59.37        | 62.50      | 69.23
  tiktok.ts        | 76.31       | 65.00        | 81.15      | 86.86
 api/services/mockData
  amazonData.ts    | 98.70       | 93.33        | 100.00     | 98.21
  fusionData.ts    | 95.94       | 80.95        | 95.45      | 100.00
  tiktokData.ts    | 100.00      | 100.00       | 100.00     | 100.00 ★
 src/components/shared
  Breadcrumb.tsx   | 100.00      | 100.00       | 100.00     | 100.00 ★
  DataTablePage.tsx| 72.22       | 72.13        | 70.58      | 77.41
  ErrorBoundary.tsx| 80.00       | 78.57        | 80.00      | 85.71
  LazyImage.tsx    | 86.36       | 82.35        | 100.00     | 90.00
  LazyMount.tsx    | 90.47       | 82.35        | 100.00     | 94.73
  VirtualList.tsx  | 90.00       | 80.00        | 83.33      | 100.00 ★
```

未覆盖的核心组件：EChartsLine/Pie/Bar/Heatmap/Treemap、MiniTrend、CategoryFilter — 主要为渲染型展示组件，建议在 P2 阶段补充快照测试。

## 14. E2E 测试套件

**位置**：`e2e/*.spec.ts` | **运行**：`npm run test:e2e`

| 文件 | 场景 | 用例数 |
|------|------|--------|
| `home.spec.ts` | 首页加载 + 导航跳转 | 2 |
| `fusion.spec.ts` | 机会榜 → 排序 → 详情跳转 | 3 |
| `fusion-report.spec.ts` | 三步报告生成流程 + Tab 切换 | 2 |

**配置**：`playwright.config.ts`
- baseURL: localhost:3000
- webServer: 自动启动 `npm run dev`
- trace/screenshot on failure
- CI 模式：2 个 worker，retries 2 次

## 15. 命令速查

```bash
# 单元 + 集成测试
npm test
npm run test:watch          # watch 模式
npm run test:coverage       # 带覆盖率

# E2E 测试
npx playwright install      # 首次安装浏览器
npm run test:e2e            # 跑全部
npm run test:e2e:ui         # UI 调试模式
```
