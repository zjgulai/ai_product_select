---
name: next-sprint-plan
description: 基于产品现状深度剖析的下一阶段执行计划。涵盖数据管道打通、前端可信度修复、UX 补全三条主线。当需要制定开发优先级、规划下一个 sprint、了解当前最关键断点时使用。
---

# 路特 AI 选品中心 — 下一阶段执行计划

> 生成时间：2026-05-28
> 基于：代码库全量分析 + ETL 管道评估 + UX 债务量化 + 真实数据接入评估
> 状态：Phase 10b（腾讯云部署）完成后的首个规划

---

## 一、产品现状诊断

### 1.1 数据流实际通路（最关键发现）

```
预期完整链路：
  Excel/爬虫 → ODS → DWD → DWS → concept_metrics → Fusion API → 前端

实际通路：
  TikTok:  ODS ✅ → DWD ✅ → DWS-TikTok ✅ → [断点①] concept_metrics ❌ → Fusion(mock兜底)
  Amazon:  ODS ✅ → DWD ✅ → [断点②] DWS-Amazon 未调用 ❌ → concept_metrics ❌ → Fusion(mock兜底)

结论：所有 Fusion 路由（机会榜/概念详情/融合报告）100% 回落 mock 数据。
      即使用户通过 DataManager 导入了真实数据，Fusion 指标也不会更新。
```

### 1.2 前端数据真实性状态

| 板块 | 真实数据 | 问题 |
|------|---------|------|
| Amazon 榜单/商品 | ✅ 50 条爬虫真实数据 | 无 DataBadge，用户不知道是真实数据 |
| Amazon 评论 VOC | ❌ 3000 条假评论 | 核心功能无真实数据，爬虫能力已就位 |
| Amazon 市场分析（4页） | ❌ Math.random() 假图表 | 刷新数值变化，严重误导选品决策 |
| TikTok 视频 | ⚠️ 2 条真实 + generated | 量太少，fallback 到 300 条假数据 |
| TikTok 其他 | ❌ 全 generated mock | 达人/小店/直播/大盘均为假数据 |
| Fusion 全部 | ❌ 全 generated mock | 依赖数仓打通，见断点① ② |

### 1.3 代码债务量化

| 债务 | 量 | 严重度 |
|------|----|--------|
| Math.random() 假图表（刷新变化） | 3 文件 | P0 — 误导决策 |
| DataBadge 标记错误/缺失 | 14 页面无标记 + 1 标记错误 | P1 |
| EmptyState 未覆盖 | 18/25 页面 | P1 |
| 页面级 ErrorBoundary 缺失 | 25 页面 | P1 |
| eslint-disable any（整文件豁免） | 11 文件 | P2 |
| VirtualList 零使用 | 0/25 页面 | P3（真实数据接入前需解决） |

---

## 二、执行计划

按三条主线并行推进，每条主线内部按优先级串行。

---

### 主线 A：数据管道打通（工程核心）

**目标**：让真实导入的数据能够端到端流向 Fusion 看板。

#### A1 — 实现 `recalcAllConcepts` 并解注释 ETL Step 3
**文件**：`api/services/etl/pipeline.ts:69-72`，新建 `api/services/etl/fusion-recalc.ts`
**优先级**：🔴 P0
**工作量**：M（1-2天）

**具体任务**：
```typescript
// 在 api/services/etl/fusion-recalc.ts 中实现：
export async function recalcAllConcepts(db, snapshotDate: string) {
  // 1. 查所有 active concept_id
  // 2. 对每个 concept，从 DWS 取最新 tiktok + amazon 行
  // 3. 调用 fusion-engine.ts 的 computeConceptMetrics(tiktokRow, amazonRow, ...)
  // 4. upsert 到 concept_metrics 表
}
```

**验收标准**：DataManager 导入 TikTok 数据后，`concept_metrics` 表有新数据，`fusion/opportunities` 页面展示真实分数。

---

#### A2 — 在 ETL pipeline 补 Amazon DWS 聚合分支
**文件**：`api/services/etl/pipeline.ts:53`
**优先级**：🔴 P0
**工作量**：S（半天）

**具体任务**：
```typescript
// pipeline.ts switch 后补充：
if (dataKey === "amazon_products" && dwdResult.outputRows > 0) {
  const weekStartDate = getWeekStart(snapshotDate); // 计算所在周的周一
  for (const { conceptId } of concepts) {
    const result = await aggregateAmazonConceptWeekly(conceptId, weekStartDate);
    if (result.output) { dwsDetails.push(result); conceptsProcessed++; }
  }
}
```

**验收标准**：Amazon 产品数据导入后，`dws_amazon_concept_weekly` 表有新数据。

---

#### A3 — 修复 DWS 数据质量缺陷（影响 CVI/SHI 权重）
**文件**：`api/services/etl/dws-aggregator.ts`
**优先级**：🟡 P1
**工作量**：S（半天）

**具体任务**：
1. `salesGrowthRate`（L240）：查上周 `dws_amazon_concept_weekly` 记录计算环比，替代 `null`
2. `hashtag_heat_total`（L124）：统计该 concept 的 hashtag 命中 TikTok 视频数量，替代 `0`
3. `isCarrying`（`dwd-cleaner.ts:61`）：ODS `shopType` 非空时设为 true

**影响**：
- `salesGrowthRate: null` → CVI 的 growthScore（权重 0.20）永远 0
- `hashtag_heat_total: 0` → SHI 的 hashtagScore（权重 0.10）永远 0
- `isCarrying: false` → SHI 的 carryingRatio（权重 0.10）永远 0

---

#### A4 — 扩充爬虫覆盖面（真实数据量增长）
**文件**：`api/services/crawler/cli/crawl.ts`
**优先级**：🟡 P1
**工作量**：M（1-2天）

**具体任务**：
```bash
# 1. 扩充 Amazon 评论真实数据（当前全是假的）
npm run crawl:amazon:reviews -- --asin=B010OVZO64,B07SCL613T,... --marketplace=us --limit=100

# 2. 批量爬更多 ASIN（母婴品类 Top50）
npm run crawl:amazon:bestsellers -- --marketplace=us --category=baby-products --limit=100
npm run crawl:amazon:enrich -- --marketplace=us --limit=100

# 3. TikTok 数据扩充（手动导入路径）
# 从蝉妈妈/TikTok Creative Center 人工收集视频 URL，然后：
npm run crawl:tiktok:import -- --file=./tiktok-baby-data.json
```

**数据目标**：
- Amazon 产品：50 → 200 条（enriched）
- Amazon 评论：0 → 500 条真实评论
- TikTok 视频：2 → 50 条（人工导入）

---

### 主线 B：前端数据可信度修复（用户感知核心）

**目标**：消除误导用户的假数据展示，让页面数据标记准确。

#### B1 — 消灭 Math.random() 假图表
**文件**：`src/pages/amazon/PotMarket.tsx:139`、`BrandTrend.tsx:147`、`ParamTrend.tsx:143`
**优先级**：🔴 P0（刷新变化，误导选品决策）
**工作量**：S（2-4小时）

**具体任务**：
- `PotMarket.tsx`：图表数据改为从 tRPC 返回的真实字段；无真实字段时用 `EmptyState` 占位，不展示随机数
- `BrandTrend.tsx`：同上，EChartsPie 数据来源改为 `data.topBrands` 真实字段
- `ParamTrend.tsx`：`EChartsBar` 数据改为 `data` 中的 `searchVolume` 真实字段（已有）

---

#### B2 — 修正 DataBadge 标记（1 错误 + 14 缺失）
**文件**：全部 25 个页面
**优先级**：🟡 P1
**工作量**：S（1天，逐页核对）

**具体任务**：
```
修正（错误标记）：
  amazon/Keyword.tsx：type="real" → type="demo"（关键词数据是 generated mock）

新增（高价值页面优先）：
  amazon/AmazonList.tsx：type="real"（已有 50 条真实爬虫数据）
  amazon/Product.tsx：type="real"（已有 50 条真实爬虫数据）
  amazon/Reviews.tsx：type="demo"（3000 条假评论）
  amazon/HotMarket.tsx：type="demo"
  amazon/PotMarket.tsx：type="demo"
  amazon/ParamTrend.tsx：type="demo"
  amazon/BrandTrend.tsx：type="demo"
  tiktok/Products.tsx：type="demo"
  tiktok/Influencer.tsx：type="demo"
  tiktok/Shop.tsx：type="demo"
  tiktok/Live.tsx：type="demo"
  fusion/Opportunities.tsx：type="demo"
  fusion/ConceptDetail.tsx：type="demo"
  fusion/FusionReport.tsx：type="demo"
```

---

#### B3 — EmptyState 补全（18 页面缺失）
**文件**：18 个无 EmptyState 的页面
**优先级**：🟡 P1
**工作量**：M（1-2天）

**优先处理**（核心业务页面）：
1. `fusion/Opportunities.tsx` — 核心选品机会榜，无结果时白屏
2. `tiktok/Attention.tsx` — 用户关注页，空列表无引导
3. `amazon/Reviews.tsx` — 评论详情，无数据时完全空白
4. `fusion/ConceptDetail.tsx` — 概念详情，数据加载失败无提示

**后续处理**（批量）：
- 所有 DataTablePage 的父页面在 `data.length === 0` 时已有内置空状态，重点处理非表格页面

---

#### B4 — 页面级 ErrorBoundary 补全
**文件**：`src/App.tsx`
**优先级**：🟡 P1
**工作量**：XS（1-2小时）

**具体任务**：
```tsx
// App.tsx 中每个路由包一层
<ErrorBoundary fallback={<PageError />}>
  <Route path="/fusion/concept/:id" element={<ConceptDetail />} />
</ErrorBoundary>
```

优先覆盖 Fusion 板块（数据依赖最复杂，崩溃风险最高）和 project 板块。

---

### 主线 C：代码质量（可维护性）

#### C1 — `any` 类型消除（11 文件）
**文件**：11 个有 `eslint-disable` 的页面文件
**优先级**：🟢 P2
**工作量**：L（3-5天，分批）

**策略**：
- 利用 tRPC 推导类型：`type ConceptListItem = RouterOutput['fusion']['concepts']['list']['items'][number]`
- 处理顺序：Fusion 板块 → TikTok 板块 → Amazon 板块 → 其余
- 每修好一个文件删掉文件顶部的 `eslint-disable`

---

#### C2 — VirtualList 接入（4 个大表格页面）
**文件**：`amazon/Product.tsx`、`amazon/AmazonList.tsx`、`tiktok/Products.tsx`、`amazon/Keyword.tsx`
**优先级**：🟢 P2（真实数据接入前完成，否则上线后立即退化）
**工作量**：M（1-2天）

**注意**：VirtualList 已在 `src/components/shared/VirtualList.tsx` 完整实现，含 E2E 测试，接入成本低。

---

## 三、Sprint 排期建议

### Sprint 1（约 1 周）— 数据链路打通 + 可信度修复

| 任务 | 优先级 | 工作量 | 负责人 |
|------|--------|--------|--------|
| A1 实现 recalcAllConcepts | 🔴 P0 | M | 后端 |
| A2 补 Amazon DWS pipeline | 🔴 P0 | S | 后端 |
| B1 消灭 Math.random() 假图表 | 🔴 P0 | S | 前端 |
| B4 页面级 ErrorBoundary | 🟡 P1 | XS | 前端 |
| B2 DataBadge 标记修正 | 🟡 P1 | S | 前端 |

**Sprint 1 完成后效果**：
- Fusion 看板在有 DB 数据时可展示真实分数（不再 100% mock）
- Amazon 市场分析页面图表不再刷新变化
- 页面崩溃不再传染整个应用

---

### Sprint 2（约 1 周）— 数据量扩充 + UX 补全

| 任务 | 优先级 | 工作量 | 负责人 |
|------|--------|--------|--------|
| A3 修复 DWS 数据质量缺陷 | 🟡 P1 | S | 后端 |
| A4 爬虫扩充数据量 | 🟡 P1 | M | 后端/运营 |
| B3 EmptyState 补全（优先 4 页） | 🟡 P1 | M | 前端 |
| C1 any 类型消除（Fusion 板块） | 🟢 P2 | M | 前端 |

**Sprint 2 完成后效果**：
- Amazon 评论 VOC 有真实数据（500 条）
- 空数据场景有正确空状态 UI
- CVI/SHI 的 growthScore/hashtagScore/carryingRatio 维度有效

---

### Sprint 3（约 1 周）— 数据采集标准化 + 性能

| 任务 | 优先级 | 工作量 |
|------|--------|--------|
| 制定蝉妈妈/Jungle Scout Excel 导入模板 | 🟡 P1 | M |
| DataManager 模板对应各平台导出格式 | 🟡 P1 | M |
| C2 VirtualList 接入（4 页） | 🟢 P2 | M |
| C1 any 类型消除（TikTok + Amazon 板块） | 🟢 P2 | L |

---

### Sprint 4+（持续迭代）

| 任务 | 说明 |
|------|------|
| Phase 14：用户认证 | JWT/OAuth + 多用户隔离 |
| Phase 15：AI 增强 | VOC 缺口分析 + 报告摘要 + 概念聚类 |
| Phase 16：CD 自动化 | GitHub Actions rsync 到腾讯云 |
| 产品概念人工录入 | 母婴品类 20-200 个概念 + 关键词绑定 |

---

## 四、关键技术决策

### 决策1：数据策略

**当前**：`VITE_USE_MOCK_DATA=true` 静态部署，数仓为可选功能
**建议保持**：继续双轨制。静态站（GitHub Pages + 腾讯云）用 mock 保证演示，有 DB 时自动切换真实数据。

**下一步**：腾讯云部署**加入 MySQL 容器**，让生产环境可以用真实数仓路径：
```yaml
# docker-compose.prod.yml 增加 MySQL 服务（隔离在独立 network）
mysql:
  image: mysql:8.0
  container_name: ai_product_mysql
  networks: [ai_product_net]  # 独立网络，不影响其他应用
```

### 决策2：TikTok 数据采集路径

**当前限制**：TikTok 反爬严格，自动化采集几乎不可行
**推荐路径**：
1. 短期：通过**蝉妈妈/飞瓜数据**导出 CSV → DataManager 导入（已有标准化框架）
2. 中期：建立人工采集 SOP（周更），批量手动导入
3. 长期：对接数仓（用户提及「数仓接入」需求）

### 决策3：Amazon 数据质量

**已有**：50 条 enriched 真实产品（母婴品类）
**缺口**：评论 VOC 是空的（核心竞争力），市场类数据（HotMarket 等）无真实来源
**推荐**：
1. 立即扩充评论爬虫（已实现，成本最低）
2. Jungle Scout/卖家精灵 月度导出 → DataManager 标准化导入

---

## 五、成功衡量标准

| 里程碑 | 衡量方式 |
|--------|---------|
| Fusion 数据链路打通 | `concept_metrics` 表行数 > 0，且 opportunities 页面显示 DB 数据标识 |
| 数据可信度提升 | 全部 25 个页面有正确 DataBadge，无 Math.random() 假图表 |
| 评论 VOC 真实化 | `amazon/reviews` 页面展示真实爬虫评论，DataBadge type="real" |
| 代码质量达标 | eslint-disable any 从 11 文件 → 0 文件 |
| 用户体验基线 | EmptyState 覆盖率 18/25 → 25/25 |
| 性能基线 | 所有超过 50 行数据的表格接入 VirtualList |
