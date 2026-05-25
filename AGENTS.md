# AI Agent 工作指南

## 项目背景

路特 AI 全球智能选品中心 — 双平台（TikTok × Amazon）融合选品分析平台。

用户核心诉求：**先通过爬虫模拟人工采集真实数据，其余数据接入通过数仓进行**。

## 爬虫体系（Playwright）

### 核心原则

1. **验证优先**：数据先落地 JSON 文件，无需数据库即可运行和验证
2. **Mock Fallback**：若 `src/data/real/` 目录无真实数据，自动回退到 `src/data/generated/`
3. **分批处理**：Amazon enrichment 每批 5 个产品，带 checkpoint 机制
4. **Rate Limiting**：Amazon product detail 延迟 0.6-1.5s，best sellers 延迟 1.5-4s

### 文件结构

```
api/services/crawler/
├── core/
│   ├── browser-pool.ts      # Playwright 浏览器池（3 实例）
│   ├── rate-limiter.ts      # 请求频率控制
│   ├── retry-handler.ts     # 指数退避重试
│   └── types.ts             # 共享类型
├── adapters/
│   ├── amazon/
│   │   ├── bestseller-crawler.ts   # Best Sellers 榜单
│   │   ├── product-crawler.ts      # ASIN 详情页
│   │   ├── review-crawler.ts       # 评论列表
│   │   └── search-crawler.ts       # 关键词搜索
│   └── tiktok/
│       ├── video-crawler.ts        # V1（基础版）
│       └── video-crawler-v2.ts     # V2（3 策略回退）
├── pipeline/
│   ├── json-writer.ts       # JSON 持久化
│   └── ods-writer.ts        # MySQL ODS 写入（可选）
└── cli/
    ├── crawl.ts             # 主 CLI（amazon:* / tiktok:v2）
    ├── enrich.ts            # Amazon 数据富化
    └── tiktok-import.ts     # TikTok 手动导入
```

### CLI 使用速查

```bash
# Amazon Best Sellers（50 产品，~3 分钟）
npm run crawl:amazon:bestsellers -- --marketplace=us --category=baby-products --limit=50

# Amazon 产品详情（批量 ASIN）
npm run crawl:amazon:product -- --asin=B010OVZO64,B07SCL613T --marketplace=us

# Amazon 数据富化（核心：用 detail 页准确数据替换 best sellers 粗略数据）
npm run crawl:amazon:enrich -- --marketplace=us --offset=0 --limit=50

# TikTok 视频搜索（可能失败，见下方已知限制）
npm run crawl:tiktok:v2 -- --keyword=baby --limit=30

# TikTok 手动导入（推荐）
npm run crawl:tiktok:import -- --urls="url1,url2"
npm run crawl:tiktok:import -- --file=./data.json
```

### 已知限制

| 平台 | 限制 | 当前对策 |
|------|------|----------|
| Amazon | 价格显示 GBP（IP 地理检测）| 保留原始格式，数仓层可做汇率转换 |
| Amazon | 部分产品 reviewCount 异常低 | 已用 product detail 页数据覆盖，大部分已修复 |
| TikTok | 未登录用户几乎无法获取搜索数据 | 3 策略回退（www/mobile/google），失败后提示手动导入 |
| TikTok | oembed/embed API 均不可用 | 提供 JSON 模板 + CLI 手动导入工具 |
| MySQL | 本地未运行时 ODS 写入自动跳过 | JSON 持久化作为验证阶段主存储 |

### Mock 数据层加载优先级

**Amazon** (`api/services/mockData/amazonData.ts`):
```
amazon_bestsellers_enriched_*.json  →  amazon_bestsellers_*.json  →  generated mock
```

**TikTok** (`api/services/mockData/tiktokData.ts`):
```
tiktok_videos_manual_*.json  →  tiktok_videos_*.json  →  generated mock
```

### 修改代码时的注意事项

1. **浏览器 bundle 兼容性**：`mockData/*.ts` 中的 `node:fs`/`node:path` 必须用动态 `require()` 包裹在 `try-catch` 中，不能使用顶层 ESM import，否则 Vite 构建会报错 `"join" is not exported by "__vite-browser-external"`
2. **ESM 模块**：CLI 脚本使用 `node --import tsx/esm` 运行，支持 `*.ts` 直接执行
3. **CLI 参数格式**：同时支持 `--key=value` 和 `--key value` 两种格式

## 测试

```bash
npm run test       # 102 单元测试（5 个 MySQL 连接跳过，属于预期行为）
npm run build      # 生产构建（dist/boot.js 6.2mb）
```

## 代码风格

- TypeScript 严格模式
- 使用 `LC`（Lute Colors）变量系统，避免硬编码颜色
- 数据表格使用 `DataTablePage` 统一组件
- API 路由使用 `publicQuery`（无需认证）
