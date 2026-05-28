# 路特 AI 全球智能选品中心

**React 19 + TypeScript + Vite + Hono + tRPC + Drizzle ORM**

双平台（TikTok × Amazon）融合选品分析平台，覆盖社媒热度追踪、电商数据验证、VOC 评论洞察、Fusion 机会评分四大核心能力。

- **生产地址（主）**：https://product.lute-tlz-dddd.top — 腾讯云轻量服务器，HTTPS，全量 mock 数据
- **静态镜像（GitHub Pages）**：https://zjgulai.github.io/ai_product_select/
- **产品入口门户**：https://lute-tlz-dddd.top — 路特数据科学平台导航（含本项目卡片）
- **仓库**：https://github.com/zjgulai/ai_product_select
- **进化日志**：见 [`EVOLUTION_LOG.md`](./EVOLUTION_LOG.md) — Darwinian UI/UX 50 轮迭代全记录

---

## 快速开始

```bash
git clone https://github.com/zjgulai/ai_product_select.git
cd ai_product_select
npm install
cp .env.example .env
npm run dev
```

> 首次 clone 或切换 Node 版本后，若 `npm run build` 报 `cannot execute binary file`：
> ```bash
> npm rebuild esbuild
> ```

无数据库时所有接口自动回退到虚拟数据，开发体验完整。

---

## 技术栈

| 层次 | 技术 |
|------|------|
| 前端框架 | React 19 + TypeScript + Vite 7 |
| 样式 | Tailwind CSS v3 + shadcn/ui |
| 数据接口 | tRPC + TanStack Query |
| 后端服务 | Hono（轻量 BFF） |
| ORM | Drizzle ORM + MySQL 8 |
| 图表 | ECharts + Recharts |
| 测试 | Vitest（102 用例）+ Playwright E2E |
| 部署 | Docker / GitHub Pages（静态） |

---

## 项目结构

```
├── api/
│   ├── boot.ts                 Hono 启动入口
│   ├── router.ts               tRPC 主路由聚合
│   ├── routers/                业务路由（amazon/tiktok/fusion/dataManager）
│   ├── services/
│   │   ├── db/                 Drizzle 数据库查询层
│   │   ├── mockData/           虚拟数据层（DB 不可用时自动回退）
│   │   └── fusion-engine.ts    SHI/CVI/OppScore 指标计算引擎
│   └── queries/connection.ts   DB 连接池
├── db/
│   ├── schema.ts               全量表定义（ODS/DWD/DWS/ADS + 业务表，80+ 张）
│   ├── relations.ts            Drizzle 关系
│   └── seed-v2.ts              种子数据脚本
├── src/
│   ├── App.tsx                 路由配置（HashRouter，23 个页面）
│   ├── components/
│   │   ├── layout/             AppLayout / TopNavigation / LeftSidebar
│   │   ├── shared/             DataTablePage / ECharts* / ErrorState / VirtualList / ...
│   │   └── ui/                 shadcn/ui 原子组件（40+）
│   ├── pages/
│   │   ├── tiktok/             8 页（首页/大盘/商品/达人/小店/视频/直播/关注）
│   │   ├── amazon/             8 页（榜单/商品/关键词/评论/热门/潜力/参数/品牌）
│   │   ├── fusion/             3 页（机会榜/概念详情/融合报告）
│   │   ├── data/               数据管理中心（4 Tab 入站中枢）
│   │   ├── report/             综合报告分析
│   │   └── user/               用户中心
│   ├── lib/
│   │   ├── lute-colors.ts      品牌色彩系统（LC 变量）
│   │   └── mock-router.ts      静态部署 tRPC Mock Link（38 个接口）
│   ├── providers/trpc.tsx      tRPC Provider（含静态/动态环境自动切换）
│   └── types/                  共享类型（Drizzle 推导 + 业务自定义）
├── .github/workflows/
│   ├── ci.yml                  类型检查 + Lint + 测试 + 构建
│   └── deploy.yml              自动部署到 GitHub Pages
└── vite.config.ts
```

---

## 页面一览

### TikTok 趋势（8 页）

| 路由 | 功能 |
|------|------|
| `/tiktok/home` | 首页榜单（商品/达人/小店/视频/直播 Top10） |
| `/tiktok/analysis` | 大盘数据（KPI + 热力图 + GMV + 价格分布 + 达人矩阵） |
| `/tiktok/products` | 商品搜索排行 |
| `/tiktok/influencer` | 达人榜单（带货/涨粉） |
| `/tiktok/shop` | 小店榜单 |
| `/tiktok/video` | 视频榜单 |
| `/tiktok/live` | 直播榜单 |
| `/tiktok/attention` | 我的关注（商品/达人/小店分类管理） |

### Amazon 趋势（8 页）

| 路由 | 功能 |
|------|------|
| `/amazon/list` | Amazon 商品榜单 |
| `/amazon/product` | 商品搜索（价格筛选实时传参） |
| `/amazon/keyword` | 关键词趋势分析 |
| `/amazon/reviews/:asin` | 评论 VOC 详情（情感/议题/高亮） |
| `/amazon/hot-market` | 热门市场榜 |
| `/amazon/pot-market` | 潜力市场榜 |
| `/amazon/param-trend` | 参数趋势榜 |
| `/amazon/brand-trend` | 品牌趋势榜 |

### Fusion 融合选品（3 页）

| 路由 | 功能 |
|------|------|
| `/fusion/opportunities` | 选品机会榜（SHI × CVI 双维度） |
| `/fusion/concept/:id` | 概念详情（TikTok + Amazon + VOC + 趋势图） |
| `/fusion/report` | 融合报告生成 |

### 系统管理

| 路由 | 功能 |
|------|------|
| `/data/manager` | 数据管理中心（Excel 导入 → ODS 分层写入） |
| `/user/center` | 用户中心（账号/订购/报告/参数/推广链接） |
| `/report/analysis` | 综合分析报告 |

---

## Fusion 指标体系

### SHI（社媒热度指数）

```
SHI = 视频量 × 0.15 + 视频增速 × 0.25 + 播放量(log) × 0.20
    + 互动率 × 0.20 + 带货占比 × 0.10 + 话题热度(log) × 0.10

分级：80-100 爆发期 | 60-79 成长期（最佳入场）| 40-59 稳定期 | 0-39 冷启动
```

### CVI（电商验证指数）

```
CVI = 市场规模 × 0.30 + 供需比 × 0.25 + 增速 × 0.20
    + 新品活跃 × 0.10 + 品牌分散度 × 0.10 + 评论壁垒 × 0.05
```

### OppScore（融合机会分）

```
OppScore = SHI × 0.45 + CVI × 0.35 + 趋势动量 × 0.20
         × 窗口系数（SHI 成长期 + CVI 可进入 → 1.2× 加权）

黄金象限：SHI ≥ 60 且 CVI ≥ 50
```

---

## 爬虫数据接入（Playwright）

```
Internet → Playwright Crawler → JSON 文件 → Mock Data 层（优先加载）
                                    ↓
                              MySQL ODS（可选，需本地启动数据库）
```

### Amazon 爬虫

| 命令 | 说明 | 示例 |
|------|------|------|
| `crawl:amazon:bestsellers` | 抓取 Best Sellers 榜单 | `--category=baby-products --limit=50` |
| `crawl:amazon:product` | 抓取 ASIN 详情页 | `--asin=B010OVZO64,B07SCL613T` |
| `crawl:amazon:enrich` | 富化已有数据 | `--offset=0 --limit=50` |

数据保存到 `src/data/real/amazon_bestsellers_{market}_{date}.json`，Mock 数据层自动优先加载。

### TikTok 爬虫

TikTok 反爬严格（需登录态/住宅代理），当前实现 3 策略回退：
1. `www.tiktok.com/search` + 预热 + 反爬指纹
2. `m.tiktok.com` 移动端
3. Google `site:tiktok.com` 搜索

当全部失败时返回空结果，CLI 提示使用 **手动导入**：

```bash
# 方式 1：从 URL 列表创建模板（编辑后生效）
npm run crawl:tiktok:import -- \
  --urls="https://tiktok.com/@user1/video/123,https://tiktok.com/@user2/video/456"

# 方式 2：从 JSON 文件导入
npm run crawl:tiktok:import -- --file=./my-tiktok-data.json
```

手动导入文件保存到 `src/data/real/tiktok_videos_manual_us_{date}.json`。

### 数据来源标记

前端页面已添加数据来源徽章：
- **真实数据**（绿色）— Amazon 数据来自爬虫真实采集
- **演示数据**（黄色）— TikTok 数据当前为 mock，需手动导入或后续数仓接入

## 数仓架构（ODS → DWD → DWS → ADS）

```
ODS（原始层）：8 张表，直接落库，保留 snapshot_date + raw_data
  ods_tiktok_products / creators / shops / videos / lives
  ods_amazon_products / keywords / reviews

DWD（明细层）：5 张表，类型统一，按日/周分区
DWS（汇总层）：4 张表，按概念/品类聚合，SHI/CVI 计算数据源
ADS（应用层）：3 张表，直接服务前端 tRPC API
```

数据导入流程：
```
Excel/CSV → DataManager 字段映射 + 校验 → ODS → DWD → DWS → ADS → Fusion 指标重算
```

爬虫数据导入流程：
```
Playwright Crawler → JSON 文件 → 验证阶段
                                    ↓
                             数仓 ETL Pipeline（用户自行接入 DWD/DWS/ADS）
```

---

## 静态部署说明（GitHub Pages）

GitHub Pages 是纯静态托管，无后端。通过 **前端 Mock Link** 解决：

```
构建时注入：VITE_USE_MOCK_DATA=true

tRPC Client
  ├── VITE_USE_MOCK_DATA=true  → mockLink（拦截请求，直接调用本地 mock 函数）
  └── 默认                    → httpBatchLink → /api/trpc（后端 Hono 服务）
```

`src/lib/mock-router.ts` 映射了全部 38 个 tRPC 接口到对应 mock 函数。

---

## 生产部署（腾讯云）

服务器：`101.34.52.232` (VM-0-16-ubuntu, Ubuntu 22.04)
域名：`product.lute-tlz-dddd.top`
SSH Key：`ai_video.pem`（本地，**不入版本库**）

架构：静态文件挂载到现有 `ai_video_nginx` Docker 容器（nginx:alpine），无新增容器。

**快速重新部署（代码更新）**：
```bash
# 1. 本地构建
VITE_USE_MOCK_DATA=true npm run build

# 2. 上传静态文件（覆盖）
rsync -avz --delete \
  -e "ssh -i ai_video.pem -o StrictHostKeyChecking=no" \
  dist/public/ \
  ubuntu@101.34.52.232:/opt/ai-product-select/html/
```

静态文件立即生效，无需 nginx reload（bind mount 实时读取）。

详细部署文档见 [`DEPLOYMENT.md`](./DEPLOYMENT.md)。

---

## 开发命令

```bash
# 开发 & 构建
npm run dev           # 开发服务器（localhost:3000）
npm run build         # 生产构建
npm run test          # 单元测试
npm run test:coverage # 覆盖率报告
npm run test:e2e      # Playwright E2E
npm run lint          # ESLint
npm run check         # TypeScript 类型检查

# 数据库
npm run db:generate   # 生成 migration
npm run db:migrate    # 执行 migration
npm run db:push       # 直接 push schema（开发用）

# 爬虫 CLI（Playwright + 真实数据）
npm run crawl:amazon:bestsellers  # 抓取 Amazon Best Sellers
npm run crawl:amazon:product      # 抓取单个/多个 ASIN 详情
npm run crawl:amazon:reviews      # 抓取评论
npm run crawl:amazon:search       # 按关键词搜索
npm run crawl:amazon:enrich       # 批量富化 review count / price / rating
npm run crawl:tiktok:v2           # TikTok 视频搜索（多策略回退）
npm run crawl:tiktok:import       # 手动导入 TikTok 视频数据
```

---

## 测试状态

```
TypeScript 编译（全量代码）：✅ 0 错误（含 crawler / ETL / frontend）
单元测试：                   ✅ 102/107 通过（5 个 MySQL 连接失败为预期，本地无 DB）
构建：                       ✅ 成功（dist/public/ 5.3MB，dist/boot.js 6.2MB）
GitHub Pages：               ✅ 已部署
腾讯云生产：                 ✅ https://product.lute-tlz-dddd.top（HTTPS）
```

---

## 路线图

```
✅ Phase 1-7   前端工程化、全页面接入、融合看板、VOC 分析、性能优化、CI/CD
✅ Phase 8     数仓架构（ODS/DWD/DWS/ADS）+ DataManager 重构 + Fusion 指标引擎
✅ Phase 9     GitHub Pages 静态部署 + mockLink + 全站稳定性修复
✅ Phase 9.5   Darwinian UI/UX 50 轮进化（Gen 1~10）
✅ Phase 10a   TypeScript 全量零错误审计（100+ 错误 → 0）+ 安全加固（.gitignore pem/截图）
✅ Phase 10b   腾讯云生产部署（HTTPS + 独立 nginx server block + certbot 扩域）

🔲 Phase 11   DataManager 调度配置 + DWD/DWS 自动 ETL Job
🔲 Phase 12   Fusion 指标导入后自动重算
🔲 Phase 13   第三方数据服务对接（蝉妈妈/Jungle Scout 导出 Excel 标准化）
🔲 Phase 14   用户认证 + 多租户支持
🔲 Phase 15   AI 增强（VOC 缺口分析 + 报告 AI 摘要 + 概念自动聚类）
```
