# Darwinian UI/UX 进化日志

> 10 代 × 5 轮 = 50 轮迭代完成
> 原则：先减法后加法 — 移除假数据/不信任 UI，再增强真实体验

---

## 进化概览

| 代数 | 主题 | 轮次 | 核心成果 |
|:---:|---|:---:|---|
| Gen 1 | 减法进化 | 1-5 | 移除 20+ 假交互、5 假图表、8 噪声元素，修复 3 数据 bug |
| Gen 2 | 布局进化 | 6-10 | 压缩筛选器、标准化留白、合并标签页、增强空状态 |
| Gen 3 | 视觉进化 | 11-15 | 消除 emoji、统一品牌色系、Lucide 图标标准化 |
| Gen 4 | 交互进化 | 16-20 | 确认对话框、hover 操作菜单、筛选器保存、分页增强、Toast 统一 |
| Gen 5 | 数据可信度 | 21-25 | 数据徽章、更新时间、来源标注、空状态增强 |
| Gen 6 | 响应式适配 | 26-30 | 表格滚动、移动端 sidebar、卡片响应式、间距适配 |
| Gen 7 | 性能进化 | 31-35 | 搜索防抖、React.memo、useDebounce、减少重渲染 |
| Gen 8-10 | 业务+打磨 | 36-50 | 持久化 hook、代码清理、构建验证 |

---

## 关键指标

| 指标 | 进化前 | 进化后 |
|---|---|---|
| 表格列数（平均） | 11-13 列 | ≤7 列 |
| 假图表 | 5+ | 0（替换为占位提示） |
| Emoji 图标 | 15+ | 0（全部 Lucide） |
| 固定操作列 | 6 个页面 | 0（hover 菜单） |
| 确认对话框 | 0 | 5+ 关键操作 |
| 数据时间标注 | 0 | 5 个页面 |
| 移动端适配 | 无 | Sidebar drawer + 响应式网格 |
| 构建时间 | ~8s | ~4s |
| 测试通过率 | 102 passed | 102 passed |
| TypeScript 错误 | 0 | 0 |

---

## 新增组件

| 组件 | 用途 |
|---|---|
| `ConfirmDialog.tsx` + `useConfirm` | 破坏性操作确认 |
| `DataBadge.tsx` | 数据可信度标记（真实/演示/示例/占位） |
| `useSavedFilters.ts` | 筛选器保存/切换（localStorage） |
| `usePersistedState.ts` | 通用持久化状态 |
| `useDebounce.ts` | 搜索防抖 |
| `useToast.ts` | Sonner Toast 封装 |

---

## 新增 Hooks

| Hook | 用途 |
|---|---|
| `useSavedFilters` | 筛选器保存/应用/删除 |
| `usePersistedState` | localStorage 持久化状态 |
| `useDebounce` | 输入防抖 |
| `useToast` | 全局 Toast 通知 |

---

## Phase 10a — TypeScript 全量审计 & 安全加固（2026-05-28）

**背景**：项目启动以来 `tsc -b` 累积 100+ 类型错误，主要集中在 crawler/ETL/seed 等服务端代码。同步完成安全合规审查。

### 修复范围（54 个文件，610 行增 / 498 行删）

| 类型 | 文件 | 修复内容 |
|------|------|----------|
| `.gitignore` 安全 | `.gitignore` | 新增屏蔽 `*.pem`（SSH 私钥）、`morandi-*.png`（调试截图）、`.playwright-mcp/`（日志）、`.sisyphus/`（agent 状态） |
| tsconfig | `tsconfig.server.json` | 加 `"DOM"` lib，解决 crawler `page.evaluate()` 中 `document`/`window` 未定义 |
| mockData | `amazonData.ts` | 修复 `MarketItem` 接口定义与实际返回形状不匹配 |
| mockData | `fusionData.ts` | 修复 `opportunityScore: string` 类型参与算术排序 |
| crawler | `index.ts` | 修复导出名称 `crawlAmazonProduct` → `crawlAmazonProducts` |
| crawler | `review-crawler.ts` | `null` 安全的 `.trim()` 调用 |
| crawler | `search-crawler.ts` | `textContent()` 返回 `null` 的 `??""` 兜底 |
| crawler | `crawl.ts` | `records` 类型双重断言 `unknown as Record<string, unknown>[]` |
| crawler | `rate-limiter.ts` | `pendingPromise: Promise<void>` → `Promise<unknown>` |
| ETL | `ods-writer.ts` | Drizzle `date` 列 `eq(col, string)` → `eq(col, new Date(s))` |
| ETL | `dwd-cleaner.ts` | 同上，+ 移除未用 `and` import |
| ETL | `dws-aggregator.ts` | 同上，`BigInt()` → 原始 `number`，移除未用 `sql/desc/inArray` |
| ETL | `pipeline.ts` | 移除未用 `aggregateAmazonConceptWeekly` import |
| seed | `seed-v2.ts` | Drizzle `decimal` 字段全部 `String()` 转换，`as const` sentiment 类型修正，faker API 适配 |
| 前端 | `App.tsx` | 移除未用 `useEffect` import |
| 前端 | `LeftSidebar.tsx` | 移除未用 `Settings` import |
| 前端 | `ErrorBoundary.test.tsx` | 显式导入 `beforeAll`/`afterAll` from vitest |
| 前端 | `AmazonList.tsx` | 补 import `EmptyState` |
| 前端 | `BrandTrend.tsx` | 补 import `BarChart3` |
| 前端 | `HotMarket/ParamTrend/PotMarket.tsx` | 移除未用 `BarChart3`，补 `EChartsBar` |
| 前端 | `Attention.tsx` | 补充缺失的 `follows` state 和 `toggleFollow` 函数 |
| 前端 | `Video.tsx` | 补 import `EmptyState` + `SearchX` |
| 前端 | `UserCenter.tsx` | 补充 `followStats` 常量，移除未用 `useEffect` |

**最终状态**：`tsc -b` → **0 错误**，`vitest` → **102 通过 / 5 DB 连接跳过**，`build` → **exit 0**

---

## Phase 10b — 腾讯云生产部署（2026-05-28）

**目标**：将平台部署到 https://product.lute-tlz-dddd.top，接入现有服务器 nginx 体系。

### 服务器环境

| 项目 | 值 |
|------|----|
| 服务器 | 101.34.52.232 (VM-0-16-ubuntu, Ubuntu 22.04) |
| Docker | 26.1.3 + Compose v2.27.1 |
| 现有容器 | 10 个（ai_video / promptforge / voc_superset 等） |
| nginx 管理方式 | `ai_video_nginx` Docker 容器（统一管理所有域名） |
| SSL 证书 | Let's Encrypt，certbot 管理，`lute-tlz-dddd.top` 通配子域 |

### 部署决策

**选静态挂载方案**（与现有 report/llm/mkt 等站点完全一致）：
- 构建 `dist/public/` → rsync 到 `/opt/ai-product-select/html/`
- nginx.conf 追加 `product.lute-tlz-dddd.top` server block
- `docker-compose.prod.yml` nginx volumes 追加只读挂载
- certbot `--expand` 将 product 子域加入证书

**零污染保证**：不新建容器、不占用新端口、仅向现有 nginx 追加配置。

### 执行结果

| 步骤 | 结果 |
|------|------|
| 本地构建 | ✅ `VITE_USE_MOCK_DATA=true npm run build`，5.3MB |
| 文件上传 | ✅ rsync 59 个文件，速度 3.1MB/s |
| SSL 扩域 | ✅ `certbot --expand` 成功，deploy-hook 自动 reload |
| nginx 配置 | ✅ Python 精确插入 server block，语法验证通过 |
| 容器重建 | ✅ `--force-recreate --no-deps nginx`，10 秒完成 |
| HTTPS 访问 | ✅ `HTTP/2 200`，`<title>路特全球智能选品中心</title>` |
| 其他容器隔离 | ✅ 10 个现有容器全部 healthy，响应正常 |

### 门户更新

同步更新 `https://lute-tlz-dddd.top` landing page，添加「全球智能选品中心」卡片：
- 暖橙色主题 `#C4702C`（区别于现有 9 张卡片）
- chips：TikTok × Amazon、Fusion 评分、React + Vite
- footer 追加 `product.lute` 链接

---

## 仍需关注（已知债务）

1. **P0 模拟数据**: `src/data/mockData.ts` 包含 284 行硬编码数据，被 5 个页面引用
2. **P1 Hover inline 事件**: Products/Video/Influencer 等页面使用 `onMouseEnter`/`onMouseLeave` inline handler（性能）
3. **P2 text-[10px] 标准化**: 101 处 `text-[10px]` 在 23 个文件中，需统一为 `text-xs` 或 `text-[11px]`
4. **P3 any 类型**: ESLint 存在 `any` 类型（`// @ts-nocheck` 类文件）
5. **P4 虚拟列表**: 长表格（>100 行）未实现虚拟滚动
6. **P5 腾讯云手动部署**: 当前为手动 rsync，待接入自动化 CD

---

## 构建验证（2026-05-28）

```
tsc -b：          0 errors（全量，含 crawler/ETL/frontend）
vitest run：      102 passed / 5 skipped（DB 连接）
npm run build：   ✓ built in 4s，dist/public/ 5.3MB，dist/boot.js 6.2MB
HTTPS 线上：      https://product.lute-tlz-dddd.top → 200 OK
```

---

*进化完成时间: 2026-05-24（UI/UX 50 轮）*
*生产部署时间: 2026-05-28（腾讯云 + TS 审计）*
