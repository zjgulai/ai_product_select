# 数据采集规划 — 从 Mock 到 Real

## 当前数据真实性矩阵

| 模块 | 真实数据量 | 来源 | 优先级 | 方案 |
|------|-----------|------|--------|------|
| Amazon Best Sellers | 50 产品 | Crawler | P0 | 扩展品类节点，每日定时跑 |
| Amazon Reviews | 0 | — | P0 | 新增 `crawl:amazon:reviews` CLI |
| Amazon Keywords | 0 | — | P1 | 通过 `amazon:search` 采集搜索页 |
| TikTok Videos | 2 条 | Crawler(受限) | P1 | 手动导入 + 第三方 API 备选 |
| TikTok Products/Creators/Shops | 0 | — | P2 | 第三方数据服务 (如 EchoTik) |
| Fusion Concepts | 0 | Generated | P2 | 基于真实评论 NLP 提取 |

## CLI 采集命令清单

```bash
# Amazon 全链路
npm run crawl:amazon:bestsellers -- --category=breast-pumps --limit=50
npm run crawl:amazon:product -- --asin=B0C1234567,B0C2345678
npm run crawl:amazon:reviews -- --asin=B0C1234567 --limit=100
npm run crawl:amazon:search -- --keyword="breast pump" --limit=50
npm run crawl:amazon:enrich

# TikTok (受限，需手动导入)
npm run crawl:tiktok:import -- --file=videos.json
```

## 下一阶段目标

- [ ] Amazon Reviews: 为 Top 50 产品各采集 100 条真实评论
- [ ] Amazon Search: 5 个核心关键词各采集 50 条搜索结果
- [ ] TikTok: 建立手动导入规范，支持 CSV/JSON 批量导入
- [ ] Fusion: 基于真实评论做 NLP 概念提取（替代生成数据）
