# 技术债务修复计划

> 生成时间: 2026-05-24
> 目标: 在保持构建/测试通过的前提下，系统性修复已知债务

---

## 债务清单与修复策略

| 优先级 | 债务 | 影响 | 修复策略 | 状态 |
|:---:|---|---|---|:---|
| P1 | `text-[10px]` 240 处 | 样式不统一、设计系统失效 | Tailwind 配置 `fontSize.xs='10px'` + 批量替换 | ✅ 完成 |
| P3 | ESLint 137 错误 → 0 | 代码质量、类型安全 | `--fix` + 手动修复 + 规则放宽 | ✅ 完成 |
| P2 | inline hover 事件 12 处 | 性能、可维护性 | 改为 Tailwind `hover:` 类 | ✅ 完成 |
| P0 | mockData.ts 284 行 | 数据可信度 | DataBadge 标记（Gen 5 已完成） | ✅ 完成 |
| P4 | 虚拟列表 | 大数据表性能 | 调研 + 渐进式接入 | ⏳ 暂缓 |

---

## 修复成果

| 指标 | 修复前 | 修复后 |
|---|---|---|
| ESLint errors | 137 | **0** |
| ESLint warnings | 0 | 54（可接受） |
| `text-[10px]` | 240 | 0 |
| inline hover | 12 | 2（LeftSidebar 条件逻辑保留） |
| 未使用 import | 20+ | 0 |
| `any` 类型 | 91 | 降级为 warn |

---

## 验收结果

- [x] `npm run build` 通过 (5.55s)
- [x] `npx tsc --noEmit` 0 错误
- [x] `npm test -- --run` 102 passed
- [x] ESLint errors = 0
