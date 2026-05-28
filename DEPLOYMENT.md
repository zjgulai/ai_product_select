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

# 静态构建（纯前端，无需后端 — GitHub Pages / 腾讯云静态部署均用此方式）
VITE_USE_MOCK_DATA=true npm run build
```

构建产物：
- `dist/public/` — 前端静态资源（5.3MB，可直接托管）
- `dist/boot.js` — 后端 Hono 服务（esbuild 打包，6.2MB，静态部署不需要）

---

## 部署方式

### 方式一：腾讯云生产环境（当前主部署）✅

**访问地址**：https://product.lute-tlz-dddd.top

**服务器信息**：
- IP：`101.34.52.232` (VM-0-16-ubuntu, Ubuntu 22.04 LTS)
- 用户：`ubuntu`
- SSH Key：`ai_video.pem`（项目根目录，**已加入 .gitignore，不入版本库**）

**架构**：
```
Internet → ai_video_nginx（Docker 容器，端口 80/443）
              ↓ nginx server block: product.lute-tlz-dddd.top
         /var/www/ai-product-select（bind mount 只读）
              ↓
         /opt/ai-product-select/html/（宿主机目录）
```

**无新增容器**：静态文件挂载到现有 `ai_video_nginx` 容器，不影响服务器其他应用。

**日常更新（代码变更后重新部署）**：
```bash
# Step 1: 本地构建
VITE_USE_MOCK_DATA=true npm run build

# Step 2: 上传（rsync 增量同步，~5-10 秒）
rsync -avz --delete \
  -e "ssh -i ai_video.pem -o StrictHostKeyChecking=no" \
  dist/public/ \
  ubuntu@101.34.52.232:/opt/ai-product-select/html/
```

静态文件更新立即生效（nginx bind mount 实时读取），**无需 reload/重建容器**。

**服务器相关文件**：
```
服务器宿主机：
/opt/ai-product-select/html/          ← 静态文件目录
/opt/ai-video/deploy/lighthouse/
  ├── nginx.conf                       ← nginx 主配置（含 product server block）
  └── docker-compose.prod.yml          ← nginx 容器定义（含 volume 挂载）
```

**SSL 证书**：Let's Encrypt，由 certbot 管理，自动续期。
证书路径（容器内）：`/etc/letsencrypt/live/lute-tlz-dddd.top/fullchain.pem`
证书有效期：至 2026-08-26（自动续期）

**从零重建**（仅在服务器出现问题时需要）：
```bash
# SSH 进入服务器
ssh -i ai_video.pem ubuntu@101.34.52.232

# 创建目录
sudo mkdir -p /opt/ai-product-select/html
sudo chown ubuntu:ubuntu /opt/ai-product-select

# 在 nginx.conf 末尾（http 块内）追加 product server block（见下方配置）
# 在 docker-compose.prod.yml nginx volumes 追加挂载行
# 重建 nginx 容器（仅 nginx，其他容器不受影响）
cd /opt/ai-video/deploy/lighthouse
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
```

**nginx server block（参考）**：
```nginx
server {
    listen 443 ssl;
    http2 on;
    server_name product.lute-tlz-dddd.top;

    ssl_certificate /etc/letsencrypt/live/lute-tlz-dddd.top/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/lute-tlz-dddd.top/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;

    root /var/www/ai-product-select;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
        add_header Cache-Control "public, max-age=300, must-revalidate" always;
        add_header X-Frame-Options SAMEORIGIN always;
    }

    location ~* \.html$ {
        add_header Cache-Control "no-cache, must-revalidate" always;
    }

    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot|webp)$ {
        add_header Cache-Control "public, max-age=604800, immutable" always;
        access_log off;
    }
}
```

**docker-compose.prod.yml nginx volumes 追加行**：
```yaml
- /opt/ai-product-select/html:/var/www/ai-product-select:ro
```

---

### 方式二：GitHub Pages（自动 CI）

每次推送 `main` 分支，`.github/workflows/deploy.yml` 自动执行：

1. `npm ci`
2. `npx vite build --base=/ai_product_select/`（注入 `VITE_USE_MOCK_DATA=true`）
3. 推送 `dist/public/` 到 `gh-pages` 分支

启用步骤：
1. GitHub 仓库 → Settings → Pages → Source 选 `gh-pages` 分支
2. 首次需要手动在 Actions 触发或 push 触发

**注意**：GitHub Pages 纯静态，后端 API 不可用，数据由前端 Mock Link 提供（`src/lib/mock-router.ts`）。

---

### 方式三：Docker（完整全栈）

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

### 方式四：裸机 Node.js

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

**腾讯云生产环境**：当前为手动部署（rsync 上传），如需自动化可参考上方「日常更新」步骤配置 CI/CD。

---

## 健康检查

```bash
# 本地
curl http://localhost:3000/api/trpc/ping
# 响应：{"result":{"data":{"json":{"ok":true,"ts":1234567890}}}}

# 腾讯云生产
curl -sI https://product.lute-tlz-dddd.top
# 预期：HTTP/2 200
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

**Q: 腾讯云 nginx 容器重建后其他应用受影响**

`--no-deps` 参数确保只重建 nginx 容器，其他服务（ai_video_backend、promptforge_app 等）不会重启。
```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate --no-deps nginx
```
