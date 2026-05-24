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
| 构建时间 | ~8s | ~6s |
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

## 仍需关注（已知债务）

1. **P0 模拟数据**: `src/data/mockData.ts` 包含 284 行硬编码数据，被 5 个页面引用
2. **P1 Hover inline 事件**: Products/Video/Influencer 等页面使用 `onMouseEnter`/`onMouseLeave` inline handler（性能）
3. **P2 text-[10px] 标准化**: 101 处 `text-[10px]` 在 23 个文件中，需统一为 `text-xs` 或 `text-[11px]`
4. **P3 any 类型**: 137 个 ESLint 错误（大部分是 `any` 类型和未使用变量）
5. **P4 虚拟列表**: 长表格（>100 行）未实现虚拟滚动

---

## 构建验证

```
✓ built in 6.03s
  dist/boot.js  4.8mb

Test Files  11 passed | 1 skipped (12)
     Tests  102 passed | 5 skipped (107)
  TS Check  0 errors
```

---

*进化完成时间: 2026-05-24*
