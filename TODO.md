# VOC AI选品平台 — 完整TODO清单

> 当前状态：Phase 1 ~ Phase 7 全部完成（11个页面接入tRPC，融合看板+VOC深度分析，数据库层就绪，性能优化完成，生产就绪），编译零错误通过，11 个单元测试通过。
> 当前日期：2026-05-22

---

## 总览：四阶段路线图

```
Phase 1（已完成）：剩余页面接入虚拟数据 → 全部11个页面接入tRPC
Phase 2（已完成）：前端工程化 → DataTablePage通用组件 + 主题系统 + Loading/Error
Phase 3（已完成）：融合看板 → 选品机会榜 + 概念详情 + 融合报告
Phase 4（已完成）：VOC深度 → 评论详情 + 跨平台VOC对比
```

---

## Phase 1：剩余页面接入虚拟数据（已完成）

**目标**：让全部页面都能通过tRPC获取动态虚拟数据

### 1.1 Amazon榜单页 (`/amazon/list`) ✅

**状态**：已完成 | **优先级**：P1

- [x] 将 `AMAZON_LIST` mock数据替换为 `trpc.amazon.products.list.useQuery()`
- [x] 保留现有表格列定义（排名/图片/名称/销量/趋势/价格/ASIN/类目/品牌/上架时间/操作）
- [x] 添加Loading骨架屏
- [x] 添加搜索功能（按名称/ASIN/品牌过滤）
- [x] 添加空状态提示

**验收标准**：
- 页面加载时显示Skeleton，数据返回后显示真实虚拟数据
- 表格中ASIN字段可点击跳转商品详情
- 搜索框输入后实时过滤（前端过滤即可）

---

### 1.2 Amazon市场分析4页 ✅

**状态**：已完成 | **优先级**：P1

| 页面 | 路由 | tRPC接口 |
|------|------|----------|
| 热门市场 | `/amazon/hot-market` | `trpc.amazon.hotMarket.list` |
| 潜力市场 | `/amazon/pot-market` | `trpc.amazon.potMarket.list` |
| 参数趋势 | `/amazon/param-trend` | `trpc.amazon.paramTrend.list` |
| 品牌趋势 | `/amazon/brand-trend` | `trpc.amazon.brandTrend.list` |

**共同任务**：
- [x] 将各页面的静态 `HOT_DATA`/`POT_DATA`/`PARAM_DATA`/`BRAND_DATA` 替换为tRPC查询
- [x] 保留现有表格UI和列定义
- [x] 添加Loading骨架屏
- [x] 搜索功能从内存过滤改为调用tRPC（带参数）

---

### 1.3 TikTok列表5页 ✅

**状态**：已完成 | **优先级**：P1

| 页面 | 路由 | tRPC接口 |
|------|------|----------|
| 商品 | `/tiktok/products` | `trpc.tiktok.products.list` |
| 达人 | `/tiktok/influencer` | `trpc.tiktok.creators.list` |
| 小店 | `/tiktok/shop` | `trpc.tiktok.shops.list` |
| 视频 | `/tiktok/video` | `trpc.tiktok.videos.list` |
| 直播 | `/tiktok/live` | `trpc.tiktok.lives.list` |

**共同任务**：
- [x] 将各页面从 `mockData.ts` import 替换为tRPC useQuery
- [x] 保留现有表格、Tab切换、筛选面板UI
- [x] 添加Loading骨架屏
- [x] 添加分页（后端已支持offset/limit）

**验收标准**：
- 每个页面数据来源于tRPC而非本地mock ✅
- Tab切换触发对应参数的数据请求 ✅
- 筛选条件（价格区间、评分等）通过API参数传递 ✅

---

### 1.4 用户中心/关注页 ✅

**状态**：已完成 | **优先级**：P2

- [x] TikTok关注页 (`/tiktok/attention`) 接入 `trpc.fusion.concepts.list` 作为收藏数据
- [x] 用户中心 (`/user/center`) 报告记录接入 `trpc.fusion.reports.list`

---

## Phase 2：前端工程化

**目标**：消除代码重复，建立可维护的前端架构

### 2.1 抽象 `<DataTablePage />` 通用组件 ✅

**状态**：已完成 | **优先级**：P1

组件路径：`src/components/shared/DataTablePage.tsx`

**已替换页面**：
- [x] Amazon热门市场 (`HotMarket.tsx`)
- [x] Amazon潜力市场 (`PotMarket.tsx`)
- [x] Amazon参数趋势 (`ParamTrend.tsx`)
- [x] Amazon品牌趋势 (`BrandTrend.tsx`)
- [x] TikTok小店 (`Shop.tsx`)

**组件Props**：
- `breadcrumb`, `title`, `searchPlaceholder/value/onSearchChange`
- `tabs/activeTab/onTabChange`
- `extraHeader`（自定义筛选面板、banner等）
- `columns`（列定义：key/label/width/align/render）
- `data`, `total`, `loading`
- `page/pageSize/onPageChange`（分页）
- `exportable`（导出按钮）
- `children`（自定义表格内容）

**验收标准**：
- Amazon市场4页全部使用 `DataTablePage`，代码量减少30%+
- TikTok小店页已使用 `DataTablePage`
- 所有原有功能保持正常 ✅

---

### 2.2 统一Tailwind主题系统 ✅

**状态**：已完成 | **优先级**：P1

- [x] 在 `tailwind.config.js` 中扩展 `lc` 主题：
  ```js
  lc: {
    primary: { DEFAULT: '#E8785A', light: '#FEF2EE', dark: '#D46040' },
    border: { DEFAULT: '#EDEAE5', light: '#F5F2EE', strong: '#E0DCD6' },
    text: { primary: '#1C1917', secondary: '#78716C', muted: '#A8A29E', inverse: '#FFFFFF' },
    success: '#16A34A', danger: '#DC2626', warning: '#E8810A',
    gold: '#D49450', teal: '#14B8A6',
  }
  ```
- [x] 创建自动化脚本批量替换硬编码色值（`scripts/replace-colors.cjs`）
- [x] 修复重复className和边界情况（`scripts/fix-classes.cjs`）
- [x] 更新 `lute-colors.ts`，添加 `teal` / `textInverse` 等语义化命名
- [x] 验证所有页面视觉一致

**验收标准**：
- `grep -r "#E8785A" src/pages/` 返回0个结果 ✅
- `grep -r "#EDEAE5" src/pages/` 返回0个结果 ✅
- 所有页面外观与改造前一致 ✅

---

### 2.3 完善Loading/Error状态 ✅

**状态**：已完成 | **优先级**：P2
**依赖**：Phase 1 + 2.1完成

- [x] 为所有11个Phase 1页面添加统一的Loading骨架屏（使用shadcn Skeleton组件）
- [x] DataTablePage内置Loading骨架屏 + 空状态（`暂无数据`提示）
- [x] 所有tRPC useQuery设置 `staleTime: 5 * 60 * 1000`
- [x] 空状态设计覆盖：搜索无结果、无收藏、无报告等场景
- [x] Error处理：接口失败时表格区域显示空状态

---

## Phase 3：融合看板（核心差异化）

**目标**：建立双平台融合的产品能力，这是平台最大的技术壁垒

### 3.1 融合选品看板 (`/fusion/opportunities`) ✅

**状态**：已完成 | **优先级**：P0（最高）

**实现内容**：
- [x] 新建路由 `/fusion/opportunities`
- [x] 在LeftSidebar增加"融合选品"菜单组（含NEW标签）
- [x] 调用 `trpc.fusion.metrics.topOpportunities.useQuery()` 获取数据
- [x] 页面布局：头部渐变Banner + 筛选栏 + 机会榜表格
- [x] 表格列：排名/产品概念/SHI/CVI/机会分/TikTok视频/Amazon商品/趋势/操作
- [x] SHI/CVI使用进度条可视化展示
- [x] 支持按机会分/SHI/CVI/趋势动量排序（点击切换升降序）
- [x] 支持关键词搜索过滤
- [x] 空状态设计（Sparkles图标 + 提示文字）

**验收标准**：
- 页面展示20个概念的Opportunity Score排名 ✅
- SHI/CVI/机会分数据来自tRPC ✅
- 筛选和排序功能正常 ✅

---

### 3.2 概念详情页 (`/fusion/concept/:id`)

**状态**：已完成 | **优先级**：P0
**依赖**：Phase 1完成

- [x] 新建路由 `/fusion/concept/:id`
- [x] 调用 `trpc.fusion.concepts.getById` + `trpc.fusion.metrics.list`
- [x] 页面布局：
  ```
  ┌─────────────────────────────────────────────┐
  │  便携温奶器        SHI:92 │ CVI:35 │ Opp:84.5│
  ├──────────────────┬──────────────────────────┤
  │  TikTok侧        │  Amazon侧                │
  │  • 相关视频:1240 │  • 相关商品:56           │
  │  • 总播放量:45.2M│  • 月销量:12,800         │
  │  • 达人带货:86   │  • 平均评分:4.3          │
  │  [相关视频列表]   │  [相关商品列表]           │
  ├──────────────────┴──────────────────────────┤
  │  VOC对比洞察                                  │
  │  TikTok用户说 vs Amazon评论说 → 需求缺口     │
  └─────────────────────────────────────────────┘
  ```
- [x] TikTok侧数据面板（视频数、播放量、达人数、热度趋势）
- [x] Amazon侧数据面板（商品数、销量、评分、卖家数）
- [x] VOC对比分析面板（词云对比、痛点对比）
- [x] SHI/CVI历史趋势折线图（近30天）

**验收标准**：
- 页面能完整展示一个概念的TikTok侧+Amazon侧+VOC对比
- 趋势图表数据来自 `concept_metrics`

---

### 3.3 融合报告生成页 (`/fusion/report`)

**状态**：已完成 | **优先级**：P1
**依赖**：Phase 1完成

- [x] 新建路由 `/fusion/report`
- [x] 搜索输入框（关键词/类目）
- [x] 报告生成流程：
  1. 用户输入关键词 → 系统查找匹配概念
  2. 展示概念卡片 → 用户选择
  3. 系统生成融合分析报告（社媒热度+电商验证+VOC分析）
  4. 展示报告结果（7个Tab结构类似现有报告页）
- [x] 支持导出按钮（UI占位）

**验收标准**：
- 输入关键词能找到匹配概念
- 生成的报告包含市场概况、社媒洞察、电商洞察、VOC分析

---

## Phase 4：VOC深度分析

### 4.1 评论详情列表页

**状态**：已完成 | **优先级**：P1
**依赖**：Phase 1完成

- [x] 在Amazon商品详情页增加"查看评论"入口
- [x] 新建评论列表页（按ASIN展示所有评论）
- [x] 支持按情感（正面/负面/中性）筛选
- [x] 支持按星级筛选
- [x] 支持按方面标签筛选
- [x] 评论内容高亮关键词

---

### 4.2 跨平台VOC对比

**状态**：已完成 | **优先级**：P2
**依赖**：Phase 3完成

- [x] 在概念详情页增加"VOC对比"Tab
- [x] 左侧：TikTok评论区高频词云
- [x] 右侧：Amazon Review高频词云
- [x] 中间：差异分析（TikTok用户期望 vs Amazon实际评价）
- [x] LLM生成自然语言洞察（"用户在TikTok上讨论'便携'的频率是Amazon评论的3倍，说明..."）

---

## 附录：开发规范

### 前端代码规范

```
1. 所有页面必须接入tRPC，禁止直接import mockData
2. 所有useQuery必须设置 { staleTime: 5 * 60 * 1000 }
3. 所有页面必须有Loading状态和Error处理
4. 颜色必须使用Tailwind主题变量，禁止硬编码
5. 类型安全：禁止在关键路径上使用any
```

### tRPC接口规范

```
1. 列表接口统一返回 { items: T[], total: number }
2. 支持分页参数 { limit?: number, offset?: number }
3. 支持搜索参数 { search?: string }
4. 所有接口添加Zod校验
```

### 虚拟数据 → 真实数据 替换指南

当接入真实数据库时：

```typescript
// 当前（虚拟数据）
export function getAmazonProducts() {
  if (_cache) return _cache;
  // ... 生成虚拟数据
}

// 替换为（真实数据库）
export async function getAmazonProducts(db: DbType, filters?: Filters) {
  return db.select().from(amazonProducts).where(...);
}
```

替换点：
1. `api/services/mockData/` 三个文件 → 改为 `api/services/db/` 真实查询
2. `api/routers/` 中调用mockData的地方 → 改为传入db实例
3. 前端代码**完全不需要改动**（tRPC接口签名保持不变）

---

## 附录：当前可用tRPC接口清单

```
✅ amazon.products.list      ✅ amazon.products.getByAsin
✅ amazon.products.brands    ✅ amazon.reviews.list
✅ amazon.reviews.stats      ✅ amazon.keyword.search
✅ amazon.keyword.stats      ✅ amazon.hotMarket.list
✅ amazon.potMarket.list     ✅ amazon.paramTrend.list
✅ amazon.brandTrend.list

✅ tiktok.home.productsHot   ✅ tiktok.home.productsSoaring
✅ tiktok.home.productsNew   ✅ tiktok.home.influencersSales
✅ tiktok.home.influencersFans ✅ tiktok.home.shopsHot
✅ tiktok.home.videosHot     ✅ tiktok.home.livesPopular
✅ tiktok.analysis.kpi       ✅ tiktok.analysis.heatmap
✅ tiktok.analysis.gmvTrend  ✅ tiktok.analysis.categoryShare
✅ tiktok.analysis.priceDistribution ✅ tiktok.analysis.influencerMatrix
✅ tiktok.products.list      ✅ tiktok.creators.list
✅ tiktok.videos.list        ✅ tiktok.shops.list
✅ tiktok.lives.list

✅ fusion.concepts.list      ✅ fusion.concepts.getById
✅ fusion.metrics.list       ✅ fusion.metrics.latest
✅ fusion.metrics.topOpportunities
✅ fusion.mappings.list      ✅ fusion.reports.list
✅ fusion.reports.getById
```

---

## 测试检查报告（2026-05-22）

### 执行范围
- TypeScript 编译检查（`npx tsc --noEmit`）：✅ 零错误
- 路由完整性检查：✅ 所有页面已注册路由
- 菜单与路由对齐检查：✅ LeftSidebar 包含所有有效路由
- 代码规范检查：✅ 无 console.log，无未使用变量

### 发现并修复的 Bug

| # | 问题 | 影响文件 | 修复方式 |
|---|------|----------|----------|
| 1 | 重复 `className` 属性（后一个覆盖前一个） | AmazonList, Products, Analysis×2, Live, Video, Influencer, Analysis(粉丝量级) | 合并为单个 className |
| 2 | `absolute` 定位缺少 `relative` 父元素 | Analysis.tsx（商品对比选中标记） | 添加 `relative` 类 |
| 3 | 硬编码 hover 背景色 `hover:bg-[#F7F8F9]` | 11个文件 | 批量替换为 `hover:bg-lc-bg-warm` |
| 4 | 硬编码颜色值 `#5A5A00`, `#DBEAFE`, `#D6D3D0` 等 | PotMarket, ParamTrend, BrandTrend, UserCenter, DataManager, Reviews, Influencer | 替换为 LC 主题变量 |
| 5 | 缺少 `LC` 导入导致运行时错误 | DataManager.tsx, UserCenter.tsx | 添加 `import { LC } from '@/lib/lute-colors'` |

---

## 下一步计划：Phase 6 ~ Phase 7

```
Phase 5（已完成）：真实数据接入 → Schema + DB查询层 + Router回退机制
Phase 6（已完成）：性能优化 → 虚拟列表 + 懒加载 + 图表按需渲染 + 代码分割
Phase 7（已完成）：生产就绪 → 错误边界 + 单元测试 + CI/CD
```

### Phase 5：真实数据接入（P0）✅

**目标**：将虚拟数据层替换为真实数据库查询

**状态**：已完成 | 编译零错误通过

**已完成内容**：
- [x] 数据库 Schema 已存在（`db/schema.ts`）：Amazon Products/Reviews、TikTok Videos/Creators/Shops、Fusion Concepts/Metrics/Reports/KeywordMappings
- [x] 创建 `api/services/db/` 真实查询层：
  - `amazonDb.ts` — 商品/评论/关键词/市场查询
  - `tiktokDb.ts` — 视频/达人/小店/直播/首页/分析查询
  - `fusionDb.ts` — 概念/指标/映射/报告查询
  - `index.ts` — 统一导出
- [x] 更新 `api/routers/`：
  - `amazon.ts` — 所有接口使用 `withFallback(dbQuery, mockQuery)`
  - `tiktok.ts` — 所有接口使用 `withFallback(dbQuery, mockQuery)`
  - `fusion.ts` — 所有接口使用 `withFallback(dbQuery, mockQuery)`
- [x] 前端代码零改动（tRPC 接口签名保持不变）
- [x] 数据种子脚本已存在（`db/seed-v2.ts`）
- [x] 创建 `.env.example` 模板

**回退机制**：`withFallback` 包装器 — 先尝试 DB 查询，失败时自动回退到 mockData，确保开发环境无需数据库也能运行。

### Phase 6：性能优化（P1）✅

**状态**：已完成 | 编译零错误通过

- [x] 通用虚拟滚动组件 `VirtualList`（src/components/shared/VirtualList.tsx），适合 >500 行的大数据表
- [x] ECharts 图表按需渲染：`LazyMount` 组件（IntersectionObserver + 占位高度）
- [x] 图片懒加载：`LazyImage` 组件（IntersectionObserver + 错误回退）
- [x] ECharts 组件 React.memo + useMemo(option) + lazyUpdate/notMerge（EChartsLine/Pie/Bar）
- [x] tRPC QueryClient 全局缓存策略（staleTime 5min / gcTime 10min / 关闭窗口聚焦重拉）
- [x] 路由级代码分割：所有非首页路由使用 `React.lazy` + `Suspense`
- [x] Vite manualChunks 配置：react-vendor / echarts / trpc / lucide / recharts 拆包
- [x] ConceptDetail 趋势图表区域接入 LazyMount

**性能收益预估**：
- 首屏 JS bundle 减小 ~60%（lucide-react 单独拆包 + 路由懒加载）
- ECharts 滚动到视口才渲染，初始 idle 时间减少 ~40%
- 图表配置 useMemo 缓存避免重复计算，重渲染性能 +50%

### Phase 7：生产就绪（P1）✅

**状态**：已完成 | 编译零错误通过 | 11 个单元测试全部通过

- [x] 全局错误边界 `ErrorBoundary` 组件（带友好降级 UI + 重试 + 返回首页）
- [x] 应用根节点包裹 ErrorBoundary（src/main.tsx）
- [x] 每个 lazy 路由独立 ErrorBoundary 隔离（避免单页错误影响整个应用）
- [x] 全局 `unhandledrejection` / `error` 监听（预留监控上报钩子）
- [x] 单元测试：
  - `api/services/mockData/fusionData.test.ts` — 5 个用例（概念/指标/映射/报告）
  - `api/services/mockData/amazonData.test.ts` — 6 个用例（商品/评论/搜索/市场）
- [x] vitest.config.ts 配置完善（jsdom/aliases）
- [x] GitHub Actions CI 配置（`.github/workflows/ci.yml`）
  - 类型检查 → Lint → 测试 → 构建
- [x] Dockerfile 已存在（生产部署）
- [x] 部署文档 `DEPLOYMENT.md`（环境/构建/Docker/CI/监控建议）

**测试覆盖结果**：
```
✓ api/services/mockData/fusionData.test.ts (5 tests)  74ms
✓ api/services/mockData/amazonData.test.ts (6 tests)  325ms
Tests: 11 passed (11)
```

