# 部署指南

## 环境要求

- Node.js 22+
- MySQL 8+（可选，无 DB 时全量 mock 数据自动回退）
- 至少 512MB 内存

---

## 本地开发

```bash
npm install
cp .env.example .env   # 配置 DATABASE_URL（可留空，走 mock 回退）
npm run dev            # http://localhost:3000
```

**无数据库开发**：所有 tRPC 接口通过 `withFallback` 自动回退到 mockData，页面功能完整。

---

## 数据库初始化

```bash
npm run db:generate    # 生成 Drizzle migration
npm run db:migrate     # 执行 migration
npx tsx db/seed-v2.ts  # 写入种子数据
```

---

## 生产构建

```bash
# 标准构建（需配套后端）
npm run build

# GitHub Pages 构建（纯前端静态，无需后端）
VITE_USE_MOCK_DATA=true npx vite build --base=/your-repo-name/
```

构建产物：
- `dist/public/` — 前端静态资源
- `dist/boot.js` — 后端 Hono 服务（esbuild 打包）

---

## 部署方式

### 方式一：GitHub Pages（自动 CI）

每次推送 `main` 分支，`.github/workflows/deploy.yml` 自动执行：

1. `npm ci`
2. `npx vite build --base=/ai_product_select/`（注入 `VITE_USE_MOCK_DATA=true`）
3. 推送 `dist/public/` 到 `gh-pages` 分支

启用步骤：
1. GitHub 仓库 → Settings → Pages → Source 选 `gh-pages` 分支
2. 首次需要手动在 Actions 触发或 push 触发

**注意**：GitHub Pages 纯静态，后端 API 不可用，数据由前端 Mock Link 提供（`src/lib/mock-router.ts`）。

---

### 方式二：Docker

```bash
docker build -t voc-ai .
docker run -p 3000:3000 \
  -e DATABASE_URL="mysql://user:pass@host:3306/db" \
  -e APP_SECRET="your-secret" \
  voc-ai
```

或使用 docker-compose：

```bash
cp .env.example .env   # 填写环境变量
docker-compose up -d
```

---

### 方式三：裸机 Node.js

```bash
npm run build
APP_SECRET=xxx DATABASE_URL=mysql://... NODE_ENV=production node dist/boot.js
```

默认监听 `3000` 端口，可通过 `PORT` 环境变量修改。

---

## 环境变量

| 变量 | 说明 | 默认值 |
|------|------|--------|
| `DATABASE_URL` | MySQL 连接串 | —（留空走 mock） |
| `APP_SECRET` | 应用密钥 | 必填 |
| `PORT` | 监听端口 | `3000` |
| `NODE_ENV` | 环境标识 | `development` |
| `VITE_USE_MOCK_DATA` | 前端启用 Mock Link | `false` |

---

## CI/CD

`.github/workflows/ci.yml` 在每次推送时自动执行：

```
类型检查（tsc --noEmit）
  ↓
ESLint（continue-on-error）
  ↓
单元测试 + 覆盖率报告（vitest）
  ↓
生产构建（npm run build）
```

`.github/workflows/deploy.yml` 在 `main` 分支推送时额外执行 GitHub Pages 部署。

---

## 健康检查

```bash
curl http://localhost:3000/api/trpc/ping
# 响应：{"result":{"data":{"json":{"ok":true,"ts":1234567890}}}}
```

---

## 常见问题

**Q: `npm run build` 报 `cannot execute binary file`**
```bash
npm rebuild esbuild
```

**Q: 数据库连接失败**

检查 `DATABASE_URL` 格式：`mysql://user:password@host:port/dbname`
无数据库时删除 `.env` 中的 `DATABASE_URL`，系统自动使用 mock 数据。

**Q: GitHub Pages 页面白屏**

确认构建时注入了 `VITE_USE_MOCK_DATA=true`，检查 `deploy.yml` 的 env 配置。

**Q: vite dev 模式空白页**

`vite.config.ts` 中 `@hono/vite-dev-server` 的 `exclude` 必须包含 `/^\/api\/services\/mockData\//`，确保 mock 模块走 Vite 而非 Hono。
