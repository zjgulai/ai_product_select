# 路线图 — 下一阶段开发计划

> 制定时间：2026-05-23
> 当前基线：Phase 1~9 完成，GitHub Pages 已部署，91 单元测试全通过
> 目标：将平台从「可演示的虚拟数据产品」升级为「真实数据驱动的选品工具」

---

## 一、现状评估

### 数据层现状

| 数据实体 | Mock 数量 | 真实数据 | 缺口 |
|---------|---------|---------|------|
| Amazon 商品 | 200 条（随机生成） | 0 | 需接入真实采集 |
| TikTok 达人 | 50 条 | 0 | 同上 |
| TikTok 视频 | 300 条 | 0 | 同上 |
| TikTok 小店 | 30 条 | 0 | 同上 |
| TikTok 直播 | 20 条 | 0 | 同上 |
| Fusion 概念 | 20 条（固定 CONCEPT_SEED） | 0 | 需人工录入 + 关键词绑定 |
| concept_metrics | 600 条（20概念×30天，全 mock） | 0 | 需基于真实数据计算 |
| Fusion 报告 | 5 条 | 0 | 需真实 AI 生成 |

### 功能层缺口

| 功能 | 当前状态 | 优先级 |
|------|---------|--------|
| ODS 导入后 → DWD/DWS ETL | 架构完整，无触发逻辑 | 🔴 高 |
| Fusion 指标自动重算 | 引擎代码完整，未接入触发 | 🔴 高 |
| 收藏/关注写入 | 只有 UI，无 mutation | 🟡 中 |
| Product.tsx 上架时间/销量筛选 | 控件未绑定 tRPC | 🟡 中 |
| DataManager 字段别名映射 UI | 「即将上线」占位 | 🟡 中 |
| TopNavigation 6 个死链 | `href: "#"` | 🟢 低 |
| UserCenter 参数库/推广链接 | 空页 | 🟢 低 |
| 融合报告 AI 生成 | UI 有，无 LLM 调用 | 🔴 高（产品核心） |

---

## 二、开发阶段规划

```
Phase 10  数据入站流程完整化      2~3 周
Phase 11  Fusion 指标自动化        2 周
Phase 12  真实数据接入（母婴品类）  持续进行
Phase 13  AI 报告生成              3~4 周
Phase 14  用户体系                 3 周
Phase 15  产品打磨 & 上线          2 周
```

---

## Phase 10：数据入站流程完整化

**目标**：DataManager 导入一张 Excel 后，数据自动流转到 DWD→DWS，并触发 Fusion 指标重算

**预计工期**：2~3 周

### 10.1 DWD 清洗 Job（后端）

**文件**：`api/services/etl/dwd-cleaner.ts`

```typescript
// 核心逻辑：从 ODS 读取 → 标准化 → 写入 DWD

// ODS → DWD: tiktok_products
async function cleanTiktokProducts(snapshotDate: string) {
  // 1. 从 ods_tiktok_products 按 snapshot_date 读取
  // 2. 类型转换（string → decimal，null 填充，异常过滤）
  // 3. 去重（同 product_id + stat_date 的记录取最新）
  // 4. 写入 dwd_tiktok_product_daily
}

// 同理：creators / shops / amazon_products / amazon_keywords
```

**待实现**：
- [ ] `cleanTiktokProducts(snapshotDate)` — ODS → dwd_tiktok_product_daily
- [ ] `cleanTiktokCreators(snapshotDate)` — ODS → dwd_tiktok_creator_daily
- [ ] `cleanAmazonProducts(snapshotDate)` — ODS → dwd_amazon_product_daily
- [ ] `cleanAmazonKeywords(weekStart)` — ODS → dwd_amazon_keyword_weekly
- [ ] `cleanAmazonReviews()` — ODS → dwd_amazon_review（情感标注）

### 10.2 DWS 聚合 Job（后端）

**文件**：`api/services/etl/dws-aggregator.ts`

```typescript
// ODS/DWD → DWS: 按概念/品类聚合

// 计算 dws_tiktok_concept_daily
async function aggregateTiktokConceptDaily(conceptId: string, statDate: string) {
  // 1. 从 dwd_tiktok_product_daily 按 concept 的 tiktokKeywords 匹配
  // 2. 统计 videoCount、totalViews、engagementRate、carryingRatio 等
  // 3. 与 7 天前对比算 videoGrowthRate
  // 4. 写入 dws_tiktok_concept_daily
}

// 同理：dws_amazon_concept_weekly / dws_amazon_keyword_ranking_daily
```

**待实现**：
- [ ] `aggregateTiktokConceptDaily(conceptId, date)` → dws_tiktok_concept_daily
- [ ] `aggregateAmazonConceptWeekly(conceptId, week)` → dws_amazon_concept_weekly
- [ ] `aggregateKeywordRanking(date)` → dws_amazon_keyword_ranking_daily

### 10.3 导入后自动触发

**文件**：`api/routers/dataManager.ts`（扩展 `import.ingest`）

```typescript
// ingest 成功后追加触发
if (successRows > 0) {
  await triggerETL(input.dataKey, input.snapshotDate);
}

// triggerETL 按 dataKey 路由到对应的清洗+聚合+指标重算
```

**待实现**：
- [ ] `api/services/etl/pipeline.ts` — ETL 主调度器
- [ ] `dataManager.import.ingest` 成功后调用 `triggerETL`
- [ ] DataManager UI 显示 ETL 进度（Tab2 导入记录中增加「清洗状态」列）

### 10.4 DataManager Tab4 字段映射 UI

**待实现**：
- [ ] 每个数据源的字段映射表（支持别名规则编辑）
- [ ] 校验规则配置（非空/类型/范围）
- [ ] 保存到 `data_templates` 表的 `columns` JSON

---

## Phase 11：Fusion 指标自动化

**目标**：ODS 有新数据时，自动计算 SHI/CVI/OppScore，写入 concept_metrics

**预计工期**：2 周

### 11.1 接入现有计算引擎

`api/services/fusion-engine.ts` 已有完整的 `computeConceptMetrics()` 函数，需要：

```typescript
// api/services/etl/fusion-calculator.ts

export async function recalcAllConcepts(db: DB, statDate: string) {
  const concepts = await db.select().from(productConcepts).where(eq(productConcepts.status, 'active'));
  
  // 获取分母（品类最大值，用于归一化）
  const categoryMax = await getCategoryMaxValues(db, statDate);
  
  for (const concept of concepts) {
    // 从 DWS 层读取计算原料
    const tiktokRow = await getTiktokConceptDailyRow(db, concept.conceptId, statDate);
    const amazonRow = await getAmazonConceptWeeklyRow(db, concept.conceptId, statDate);
    
    // 读取前 7 天 SHI 均值（用于趋势动量）
    const prevShi = await getAvgShi(db, concept.conceptId, 7);
    
    // 调用现有引擎
    const metric = computeConceptMetrics(tiktokRow, amazonRow, categoryMax.videoCount, categoryMax.sales, prevShi);
    
    // 写入 concept_metrics（upsert）
    await db.insert(conceptMetrics).values(metric).onDuplicateKeyUpdate({ ... });
  }
}
```

**待实现**：
- [ ] `api/services/etl/fusion-calculator.ts` — 从 DWS 读取数据，调用 fusion-engine，写入 concept_metrics
- [ ] `getCategoryMaxValues()` — 品类归一化分母计算
- [ ] 接入 ETL Pipeline：DWS 聚合完成后自动触发 recalcAllConcepts
- [ ] concept_metrics 的 upsert 逻辑（同 conceptId + metricDate 更新，不重复插入）

### 11.2 手动触发（DataManager 数据质量页）

- [ ] Tab3 数据质量页底部增加「重算 Fusion 指标」按钮
- [ ] 调用新 tRPC 接口 `dataManager.fusion.recalc`
- [ ] 显示重算进度和结果（重算了几个概念，最新指标时间）

### 11.3 概念管理页（新页面）

**路由**：`/fusion/concepts`（新增）

- [ ] 概念列表（当前 20 条，支持新增/编辑/归档）
- [ ] 每条概念可编辑：tiktokKeywords、tiktokHashtags、amazonKeywords、amazonCategories
- [ ] 关键词绑定质量指标（匹配到的视频数、商品数预览）
- [ ] 支持从 tRPC 关键词建议自动补全
- [ ] 侧边栏增加「概念管理」菜单项

---

## Phase 12：真实数据接入（母婴品类）

**目标**：从第三方数据服务导出 Excel，通过 DataManager 导入，让平台运转真实数据

**预计工期**：持续进行（不阻塞其他 Phase）

### 数据来源方案

```
TikTok 数据：蝉妈妈 / 抖查查 → 手动导出 Excel
Amazon 数据：Jungle Scout / 卖家精灵 / AMZScout → 手动导出 Excel
品类范围：母婴（非食品类目全覆盖）
更新频率：每日（TikTok 榜单）+ 每周（Amazon 关键词）
```

### 标准化导出模板

**待制作**（Excel 模板文件）：

- [ ] `templates/tiktok_products_template.xlsx` — 对应 ods_tiktok_products 字段
- [ ] `templates/tiktok_creators_template.xlsx` — 对应 ods_tiktok_creators
- [ ] `templates/amazon_products_template.xlsx` — 对应 ods_amazon_products
- [ ] `templates/amazon_keywords_template.xlsx` — 对应 ods_amazon_keywords

每个模板包含：
1. 「数据」sheet：字段名行 + 数据行（按平台导出字段预填别名）
2. 「说明」sheet：每个字段的含义和填写示例

### DataManager 对应配置

- [ ] 为每个数据源预置字段别名规则（蝉妈妈列名 → ODS 字段名）
- [ ] 预置数据校验规则（月销量 > 0，评分 0~5，价格 > 0）

---

## Phase 13：AI 报告生成

**目标**：融合报告不再是 mock 数据展示，而是基于真实概念数据 + LLM 的自动分析

**预计工期**：3~4 周

### 13.1 报告数据引擎

**文件**：`api/services/report-generator.ts`

```typescript
// 报告生成三步：
// 1. 数据聚合（从 concept_metrics + amazon + tiktok 拉取最新快照）
// 2. LLM 分析（调用 Claude/GPT API，传入结构化数据，返回洞察文字）
// 3. 持久化（写入 fusion_reports 表）

export async function generateFusionReport(conceptId: string, userId: string) {
  // Step 1: 数据聚合
  const snapshot = await buildConceptSnapshot(conceptId);
  // {概念信息, 最新指标, TikTok Top10视频, Amazon Top10商品, VOC议题}
  
  // Step 2: LLM 分析（可以是 Claude API）
  const insights = await callLLM({
    systemPrompt: REPORT_SYSTEM_PROMPT,
    data: snapshot,
  });
  
  // Step 3: 持久化
  await saveReport(conceptId, userId, snapshot, insights);
}
```

**待实现**：
- [ ] `api/services/report-generator.ts` — 数据聚合 + LLM 调用 + 持久化
- [ ] `api/lib/llm.ts` — LLM 客户端（支持 Claude/OpenAI，通过环境变量切换）
- [ ] `REPORT_SYSTEM_PROMPT` — 报告生成 Prompt 模板（母婴品类专用）
- [ ] `.env.example` 新增 `LLM_API_KEY` / `LLM_PROVIDER`
- [ ] FusionReport 页面「生成报告」按钮真实调用 API（带 loading 状态、进度条）
- [ ] 生成完成后可查看历史报告（UserCenter 报告记录页对接真实数据）

### 13.2 VOC 缺口分自动计算

**当前**：`vocGapScore` 在 concept_metrics 里全是 null

**待实现**：
- [ ] 从 `dwd_amazon_review` 提取议题 + 情感（简单规则：负面议题比率）
- [ ] `calculateVocGapScore()` 已在 `fusion-engine.ts` 实现，接入真实数据调用

---

## Phase 14：用户体系

**目标**：多用户支持、真实收藏写入、个性化数据

**预计工期**：3 周

### 14.1 认证

- [ ] JWT 登录/注册（用户名+密码，或手机号+验证码）
- [ ] Hono 中间件鉴权（`publicQuery` → `authedQuery`）
- [ ] 前端 TRPCProvider 带 Authorization header

### 14.2 收藏/关注写入

**当前**：`user_favorites` 表已存在，但 tRPC 无对应 mutation

**待实现**：
- [ ] `fusion.favorites.add` / `fusion.favorites.remove` — 写入/删除 user_favorites
- [ ] `fusion.favorites.list` — 按 userId + itemType 查询收藏列表
- [ ] TikTok 关注页、Amazon 榜单页的 ⭐ 按钮绑定 mutation
- [ ] FusionReport 页「收藏」按钮写入 favorites

### 14.3 个性化首页

- [ ] 首页榜单根据用户关注的类目/概念排序
- [ ] 「我的关注」页展示真实收藏数据（替换当前虚拟 mock）

---

## Phase 15：产品打磨 & 正式上线

**目标**：完成所有 placeholder，修复所有死链，提升整体品质

### 15.1 界面完整化

- [ ] TopNavigation 6 个死链 → 对应真实功能页或隐藏
  - `Boost Claw` → 跳转达人建联工具页（新建或链接外部）
  - `开放平台` → API 文档页（新建）
  - `产品中心/资源中心` → 下拉菜单展示实际功能列表
  - `客户案例/关于我们` → 简单静态页

- [ ] UserCenter 参数库 → 展示用户常用的搜索条件/关键词组合
- [ ] UserCenter 推广链接 → 邀请机制（生成分享链接）
- [ ] Product.tsx 上架时间/销量筛选控件 → 绑定 tRPC 参数

### 15.2 数据质量优化

- [ ] Fusion 概念从 20 条扩充到 50~100 条（母婴品类主要赛道）
- [ ] 每条概念补充详细的 keyFeatures、usageScenes、amazonCategories
- [ ] Mock 数据更贴近真实数据分布（价格区间、销量分布符合母婴品类特征）

### 15.3 性能 & 监控

- [ ] Lighthouse CI 通过（LCP < 2.5s）
- [ ] 错误上报（Sentry 或自建）
- [ ] 接入 APM（请求耗时、错误率）

---

## 三、优先级矩阵

```
高价值 × 低复杂度（立即做）：
  ✅ ETL Pipeline（Phase 10.3）— 数据流通关键路径，代码架构已就绪
  ✅ DataManager 字段映射 UI（Phase 10.4）— 用户导入必经步骤
  ✅ Fusion 指标自动重算（Phase 11.1~11.2）— 核心差异化，引擎已写好
  ✅ 概念管理页（Phase 11.3）— 管理 20 条概念，当前只能改代码

高价值 × 高复杂度（计划推进）：
  ⭕ AI 报告生成（Phase 13）— 产品核心卖点，需 LLM API 接入
  ⭕ 真实数据接入（Phase 12）— 依赖外部数据源，需持续运营

低价值 × 低复杂度（顺手做）：
  ✅ Product.tsx 日期/销量筛选绑定（Phase 15.1）— 1 小时内
  ✅ TopNavigation 死链处理（Phase 15.1）— 简单 UI 改动
  ✅ 收藏写入 mutation（Phase 14.2）— 逻辑简单，表已存在

低价值 × 高复杂度（暂缓）：
  ⏳ 用户认证（Phase 14.1）— 当前单用户演示足够
  ⏳ Playwright E2E 自动化（全覆盖）
```

---

## 四、下一个 Sprint（2 周）具体任务

**Sprint 目标**：数据能真正流转，Fusion 指标能基于真实导入数据自动计算

### Week 1

| 任务 | 预计 | 优先级 |
|------|------|--------|
| `api/services/etl/dwd-cleaner.ts` 实现 TikTok + Amazon DWD 清洗 | 2d | 🔴 |
| `api/services/etl/dws-aggregator.ts` 实现概念维度 DWS 聚合 | 2d | 🔴 |
| `api/services/etl/pipeline.ts` ETL 调度器（dataKey → 对应 Job） | 0.5d | 🔴 |
| `dataManager.import.ingest` 导入成功后调用 ETL | 0.5d | 🔴 |

### Week 2

| 任务 | 预计 | 优先级 |
|------|------|--------|
| `api/services/etl/fusion-calculator.ts` 从 DWS 读取 → 调用 fusion-engine → 写入 concept_metrics | 2d | 🔴 |
| DataManager Tab3 增加「重算 Fusion 指标」入口 | 0.5d | 🟡 |
| `/fusion/concepts` 概念管理页（列表 + 编辑关键词） | 2d | 🟡 |
| 制作 2 份 Excel 模板（TikTok 商品 + Amazon 商品） | 0.5d | 🟡 |
| 用真实蝉妈妈/JS 数据导入测试全流程 | 1d | 🔴 |

---

## 五、技术决策记录

### 决策 1：ETL 同步 vs 异步

**选择**：同步（导入时立即 ETL，小数据量无需队列）

理由：母婴品类每日数据量约 5 万行，MySQL 单次事务可处理，无需引入 Kafka/Bull 等队列系统。

未来扩展点：数据量超 50 万行/天时，改为后台 Job + 状态轮询。

### 决策 2：LLM 集成方案

**选择**：Claude API（Anthropic）作为主要 LLM，环境变量切换供应商

理由：报告生成是长文本任务（1000~3000 字），Claude 在结构化中文报告生成上表现稳定。通过 `api/lib/llm.ts` 抽象层，未来可替换为 GPT/本地模型。

### 决策 3：概念数量策略

**选择**：从 20 条 CONCEPT_SEED 扩充到 50~100 条，人工维护

理由：母婴非食品类目赛道数量有限（便携/喂养/清洁/玩具/安全等约 8~12 大类，每类 5~10 个概念），人工维护成本低且质量可控，比 NLP 聚类更准确。

---

## 六、风险点

| 风险 | 概率 | 影响 | 应对 |
|------|------|------|------|
| 第三方数据导出格式不稳定 | 高 | 中 | 别名映射引擎 + 宽松字段校验 |
| LLM API 调用费用超预期 | 中 | 低 | 报告生成设置 rate limit；优先用 batch API |
| DWS 聚合逻辑错误导致指标偏差 | 中 | 高 | 单元测试覆盖 SHI/CVI 计算；与 mock 数据做比对验证 |
| MySQL 在大量 concept_metrics upsert 时锁表 | 低 | 高 | 按 conceptId 分批写入；非高峰期执行 |
