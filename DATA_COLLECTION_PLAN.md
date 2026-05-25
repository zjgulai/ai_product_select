# VOC AI 选品平台 — 全页面数据采集计划

> 制定时间：2026-05-24
> 目标：为所有 22 个前端页面提供真实、完整、可展示的数据

---

## 一、数据总览

| 数据域 | 页面数 | 核心实体 | 目标数据量 | 采集方式 |
|--------|--------|----------|-----------|----------|
| TikTok | 8 | 商品/达人/小店/视频/直播 | 各 200-500 条 | 模拟生成（母婴品类） |
| Amazon | 7 | 商品/关键词/评论 | 商品 500 条, 评论 3000 条 | 模拟生成（母婴品类） |
| Fusion | 3 | 概念/指标/报告 | 50 概念, 600 指标 | 概念人工定义 + 指标自动计算 |
| 用户/项目 | 2 | 用户中心/项目跟踪 | 20 项目 | 模拟生成 |
| 数据管理 | 1 | 导入记录/模板 | 10 条记录 | 模拟生成 |

---

## 二、按页面拆解采集需求

### TikTok 域（8 页）

| 页面 | 路由 | 数据表 | 字段需求 | 数据量 |
|------|------|--------|----------|--------|
| 首页 | `/tiktok/home` | `ads_tiktok_home_ranking` | 6 类榜单各 Top20 | 120 条 |
| 大盘分析 | `/tiktok/analysis` | `ads_tiktok_analysis_daily` | KPI/热力图/趋势/价格分布 | 90 天日数据 |
| 商品趋势 | `/tiktok/products` | `dwd_tiktok_product_daily` | 商品列表 + 趋势 | 300 条 |
| 达人发现 | `/tiktok/influencer` | `dwd_tiktok_creator_daily` | 达人画像 + 销售数据 | 200 条 |
| 小店排行 | `/tiktok/shop` | `dwd_tiktok_shop_daily` | 店铺销售 + 商品数 | 100 条 |
| 热门视频 | `/tiktok/video` | `dwd_tiktok_video_daily` | 视频播放/点赞/带货 | 300 条 |
| 直播排行 | `/tiktok/live` | `dwd_tiktok_live_daily` | 直播间观看/销售 | 100 条 |
| 关注监控 | `/tiktok/attention` | `user_favorites` | 用户收藏列表 | 50 条 |

### Amazon 域（7 页）

| 页面 | 路由 | 数据表 | 字段需求 | 数据量 |
|------|------|--------|----------|--------|
| 关键词趋势 | `/amazon/keyword` | `dwd_amazon_keyword_weekly` | 关键词搜索量/销量 | 200 条 |
| Amazon榜单 | `/amazon/list` | `dwd_amazon_product_daily` | BSR 榜单商品 | 200 条 |
| 商品搜索 | `/amazon/product` | `dwd_amazon_product_daily` | 商品详情 + 筛选 | 500 条 |
| 参数趋势 | `/amazon/param-trend` | `ads_amazon_param_trend` | 价格/评分/评论趋势 | 12 周数据 |
| 品牌趋势 | `/amazon/brand-trend` | `ads_amazon_brand_trend` | 品牌市场份额趋势 | 12 周数据 |
| 热门市场 | `/amazon/hot-market` | `ads_amazon_market_depth` | 市场深度分析 | 20 个类目 |
| 潜力市场 | `/amazon/pot-market` | `ads_amazon_market_depth` | 供需比/增速/新品率 | 20 个类目 |
| 商品评价 | `/amazon/reviews/:asin` | `dwd_amazon_review` | 评价内容 + 情感/VOC | 3000 条 |

### Fusion 域（3 页）

| 页面 | 路由 | 数据表 | 字段需求 | 数据量 |
|------|------|--------|----------|--------|
| 选品机会榜 | `/fusion/opportunities` | `concept_metrics` | SHI/CVI/OppScore | 50 概念 × 30 天 |
| 融合报告 | `/fusion/report` | `fusion_reports` | 报告内容 + AI 洞察 | 10 条 |
| 概念详情 | `/fusion/concept/:id` | `product_concepts` + `concept_metrics` | 概念定义 + 趋势 | 50 概念 |

---

## 三、品类聚焦：母婴非食品

### 覆盖类目

```
一级类目：母婴用品
├── 喂养用品（奶瓶、奶嘴、温奶器、辅食机、消毒器）
├── 出行用品（婴儿推车、安全座椅、背带、防走失包）
├── 护理用品（纸尿裤、湿巾、润肤乳、护臀膏、洗发沐浴）
├── 睡眠用品（睡袋、抱被、隔尿垫、婴儿床、摇椅）
├── 玩具早教（健身架、摇铃、布书、学步车、爬行垫）
├── 安全用品（门栏、防撞角、监护器、体温计）
└── 孕产妇（吸奶器、哺乳枕、托腹带）
```

### 数据真实性策略

1. **价格区间**：符合母婴品类实际（¥15-¥800）
2. **销量分布**：符合幂律分布（头部 1% 占 30% 销量）
3. **评分分布**：偏右分布（4.2-4.8 占 70%）
4. **品牌集中度**：Top5 品牌占 40-60%
5. **季节性**：Q4（双11/圣诞）销量高 30-50%

---

## 四、采集实施步骤

### Step 1: 数据库初始化
- 使用 SQLite（本地环境无 MySQL）
- 运行 `drizzle-kit push` 创建所有表
- 运行种子脚本填充基础数据

### Step 2: 概念定义（人工）
- 定义 50 个母婴概念
- 每个概念绑定 TikTok 关键词 + Amazon 关键词

### Step 3: 批量数据生成
- TikTok 商品/达人/小店/视频/直播（Python 脚本）
- Amazon 商品/关键词/评论（Python 脚本）
- Fusion 指标自动计算（调用 fusion-engine）

### Step 4: 数据验证
- 每个页面数据完整性检查
- 指标计算逻辑验证
- 前端展示验证

---

## 五、技术方案

```
Python 生成器
    ↓
SQLite 数据库（本地）
    ↓
后端 tRPC API（withFallback：DB 优先，Mock 兜底）
    ↓
前端页面展示
```

### 生成器脚本

| 脚本 | 输出表 | 数据量 |
|------|--------|--------|
| `scripts/generate_concepts.py` | `product_concepts` | 50 |
| `scripts/generate_tiktok.py` | `dwd_tiktok_*` | 1000+ |
| `scripts/generate_amazon.py` | `dwd_amazon_*` | 5000+ |
| `scripts/generate_fusion.py` | `concept_metrics` | 1500 |
| `scripts/import_to_sqlite.py` | 所有表 | — |
