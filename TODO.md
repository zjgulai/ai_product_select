# VOC AI 选品平台 — TODO & 路线图

> 更新时间：2026-05-23
> 当前状态：Phase 1~9 全部完成，生产可用，GitHub Pages 已部署

---

## 已完成（Phase 1~9）

### Phase 1~4：前端工程化 + 全页面 tRPC 接入 ✅
- 23 个页面全部接入 tRPC，无任何本地 import mock
- DataTablePage 通用组件（Amazon 市场 4 页 + TikTok 小店复用）
- 统一 Tailwind 主题系统（LC 色彩变量）
- 全站 Loading/Error/空态覆盖

### Phase 5：真实数据层 ✅
- `api/services/db/` 三个查询文件（amazonDb / tiktokDb / fusionDb）
- `withFallback` 模式：DB 优先，失败自动回退 mock（含错误日志）
- DB Schema（`db/schema.ts`）+ Migration + 种子数据

### Phase 6：性能优化 ✅
- VirtualList 虚拟滚动（大数据表）
- ECharts LazyMount（视口内才渲染）
- LazyImage（图片懒加载 + 错误回退）
- 路由级代码分割（React.lazy + Suspense）
- Vite manualChunks（react-vendor / echarts / trpc / lucide / recharts）

### Phase 7：生产就绪 ✅
- ErrorBoundary 全局 + 路由级隔离
- 单元测试 91/91（Vitest）
- GitHub Actions CI（tsc + lint + test + build）
- Docker + docker-compose

### Phase 8：数仓架构 ✅
- ODS/DWD/DWS/ADS 四层，80+ 张表（MySQL 单库）
- DataManager 重构为统一入站中枢（4 Tab：数据源/导入记录/数据质量/模板配置）
- 字段映射引擎 + 数据校验 + 导入日志（importLogs 表）
- Fusion 指标计算引擎（`api/services/fusion-engine.ts`）
  - SHI：视频量 × 0.15 + 增速 × 0.25 + 播放 × 0.20 + 互动 × 0.20 + 带货 × 0.10 + 话题 × 0.10
  - CVI：市场规模 × 0.30 + 供需比 × 0.25 + 增速 × 0.20 + 新品 × 0.10 + 集中度 × 0.10 + 壁垒 × 0.05
  - OppScore：SHI × 0.45 + CVI × 0.35 + 趋势动量 × 0.20（含窗口系数加权）

### Phase 9：GitHub Pages 部署 + 稳定性 ✅
- `VITE_USE_MOCK_DATA=true` 构建时切换 Mock Link
- `src/lib/mock-router.ts`：38 个接口完整映射
- 修复 vite dev 模式空白页（exclude mockData 路径）
- 全站 Playwright 测试（13 个页面，0 报错）
- 修复直播/关注/用户中心页面崩溃
- 15 个 img 标签加 onError 降级
- 删除硬编码电话号码等敏感数据

---

## 待完成（Phase 10~）

### Phase 10：ETL 自动化 🔲

**目标**：DataManager 导入后自动触发清洗和指标计算

- [ ] DWD 清洗 Job（ODS → DWD 字段标准化、去重、分区写入）
- [ ] DWS 聚合 Job（DWD → DWS 按概念/品类聚合）
- [ ] Fusion 指标重算触发器（DWS 更新后调用 fusion-engine.ts）
- [ ] DataManager Tab4 字段别名映射 UI（当前只读展示）
- [ ] 导入调度配置（cron 表达式 + 定时自动同步）

### Phase 11：数据质量治理 🔲

- [ ] 各 ODS 表的字段非空率/异常值监控看板
- [ ] 导入失败告警（邮件/webhook）
- [ ] 差量 upsert（按主键判断 insert/update，替代全量覆盖）

### Phase 12：真实数据接入 🔲

**目标**：接入第三方数据服务（当前全量 mock）

- [ ] 制定各平台 Excel 导出模板（蝉妈妈/Jungle Scout/卖家精灵）
- [ ] DataManager 模板对应各平台导出格式
- [ ] 母婴品类 20~200 个概念人工录入（productConcepts 表）
- [ ] 关键词绑定（tiktokKeywords + amazonKeywords per concept）

### Phase 13：用户认证 🔲

- [ ] 登录注册（JWT / OAuth）
- [ ] 多用户隔离（userFavorites / fusionReports 按 userId）
- [ ] 权限控制（基础版/高级版功能差异）

### Phase 14：AI 增强 🔲

- [ ] VOC 缺口分自动计算（NLP 议题提取 → LLM 分析）
- [ ] 报告 AI 摘要生成
- [ ] 概念自动聚类（TikTok hashtag + Amazon keyword NLP 聚类）

---

## 代码规范（持续适用）

```
1. 所有页面通过 tRPC 获取数据，禁止直接 import mock
2. useQuery 统一设置 { staleTime: 5 * 60 * 1000 }
3. 所有页面必须有 isLoading Skeleton + isError 早返回 + 空态提示
4. 颜色使用 LC 主题变量（lute-colors.ts），禁止硬编码 hex
5. img 标签必须有 onError fallback，防止 404 布局破损
6. 新增字段时同步更新：db/schema.ts + mockData 接口 + tRPC router + mock-router.ts
```

---

## tRPC 接口清单（当前全量）

```
amazon.*
  products.list / getByAsin / brands
  reviews.list / stats
  keyword.search / stats
  hotMarket.list / potMarket.list / paramTrend.list / brandTrend.list

tiktok.*
  home.productsHot / productsSoaring / productsNew
  home.influencersSales / influencersFans / shopsHot / videosHot / livesPopular
  analysis.kpi / heatmap / gmvTrend / categoryShare / priceDistribution / influencerMatrix
  products.list / creators.list / videos.list / shops.list / lives.list

fusion.*
  concepts.list / getById
  metrics.list / latest / topOpportunities
  mappings.list
  reports.list / getById

dataManager.*
  template.list / getByKey / upsert
  import.ingest / logs / stats
  dynamic.queryByKey / getActiveKeys / bulkInsert / deleteByKey
  ods.latestDates
  file.list / getById / delete / archive / restore / stats
```
