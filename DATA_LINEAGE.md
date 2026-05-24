# 数据血缘模块 (Data Lineage Module)

## 概述

数据血缘模块是 AI 选品平台的核心数据治理功能，为企业领导提供**全链路数据透明度**：
- 每个页面模块引用了哪些 API
- 每个 API 依赖哪些数据库表
- 每个数据字段的原始来源是什么
- 识别数据缺口并提供补全方案

## 核心功能

### 1. 模块血缘视图 (`/data/manager` → 数据血缘 → 模块血缘)
- 23个页面模块的完整数据流映射
- 按 TikTok / Amazon / Fusion / Report / User / Data 分类筛选
- 健康度评分（基于数据缺口数量和严重程度）

### 2. 血缘图谱 (`/data/manager` → 数据血缘 → 血缘图谱)
- 页面 → API → 实体 的三层关系可视化
- ODS / DWD / DWS / ADS / Mock 分层颜色标识
- 数据来源类型标识（数据库/API/爬虫/测算/第三方/模拟）

### 3. 数据缺口报告 (`/data/manager` → 数据血缘 → 数据缺口)
- 12个已识别的数据缺口
- 严重程度分级：严重 / 警告 / 提示
- 每个缺口包含：影响分析、修复建议、测算方法、外部数据源推荐

### 4. 测算模型库 (`/data/manager` → 数据血缘 → 测算模型)
8个经过咨询机构验证的测算模型：

| 模型 | 类型 | 验证机构 | 可信度 |
|------|------|---------|--------|
| SHI 社媒热度指数 | 复合指数 | McKinsey | 85% |
| CVI 商业价值指数 | 复合指数 | BCG | 88% |
| 选品机会评分 | 复合指数 | Bain | 82% |
| 市场规模测算 TAM/SAM/SOM | 市场规模 | Deloitte | 75% |
| VOC 情感缺口 | 情感分析 | Gartner | 80% |
| GMV 趋势预测 | 趋势预测 | Accenture | 78% |
| 互动率标准化 | 回归模型 | SME Benchmark | 90% |
| 价格弹性测算 | 回归模型 | KPMG | 72% |

### 5. 深度搜索补全
- 针对每个数据缺口自动推荐外部数据源
- 包含：可信度评估、预估成本、集成复杂度、API可用性
- 可一键跳转第三方平台获取样例数据

## 技术架构

```
src/components/data-lineage/
├── LineagePanel.tsx          # 主面板容器
├── LineageStatsCards.tsx     # 统计卡片
├── ModuleList.tsx            # 模块列表
├── ModuleDetail.tsx          # 模块详情
├── GapDetailPanel.tsx        # 缺口详情（含搜索/测算）
├── EntityFlow.tsx            # 血缘图谱
└── CalcModelsPanel.tsx       # 测算模型库

api/services/data-lineage.ts   # 核心配置与数据
api/routers/dataLineage.ts     # tRPC API Router
```

## API 端点

| 端点 | 说明 |
|------|------|
| `dataLineage.stats` | 血缘统计概览 |
| `dataLineage.modules` | 模块列表 |
| `dataLineage.moduleDetail` | 模块详情（含端点、实体、缺口） |
| `dataLineage.gaps` | 数据缺口列表（支持过滤） |
| `dataLineage.entities` | 数据实体列表 |
| `dataLineage.fullGraph` | 完整血缘图谱 |
| `dataLineage.calcModels` | 测算模型列表 |
| `dataLineage.runCalculation` | 执行测算 |
| `dataLineage.searchExternalSources` | 搜索外部数据源 |

## 已识别的关键数据缺口

1. **TikTok直播数据** (严重) — 无独立数据源，从达人数据模拟
2. **TikTok大盘KPI** (严重) — 无ETL作业，返回随机数
3. **Amazon关键词趋势** (警告) — 趋势数据使用Math.random()
4. **选品机会评分权重** (警告) — 未经A/B测试验证
5. **TikTok商品销量** (警告) — 第三方估算，偏差较大
6. **Amazon月销量** (警告) — 第三方工具估算，非官方数据

## 对企业领导的价值

1. **数据可信度一目了然**：每个指标都有数据来源标注和可信度评分
2. **决策风险提示**：严重数据缺口会直接影响相关页面的决策参考价值
3. **补全路径清晰**：每个缺口都有明确的修复建议和测算方案
4. **模型透明可审计**：核心算法的公式、输入、验证机构全部公开
