# 部署指南

## 环境要求

- Node.js 22+
- MySQL 8+（或本地开发环境使用 mockData 自动回退）
- 至少 512MB 内存

## 本地开发

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env

# 编辑 .env，配置 DATABASE_URL

# 启动开发服务器
npm run dev
```

无数据库时，所有 tRPC 接口会自动回退到 mockData，不影响开发。

## 数据库初始化

```bash
# 生成 schema migration
npm run db:generate

# 应用 migration
npm run db:migrate

# 生成种子数据
npx tsx db/seed-v2.ts
```

## 构建与测试

```bash
# 类型检查
npx tsc --noEmit

# 单元测试
npm test

# 生产构建
npm run build

# 本地预览生产版本
npm start
```

## Docker 部署

```bash
# 构建镜像
docker build -t voc-ai-select .

# 运行容器
docker run -d \
  -p 3000:3000 \
  -e DATABASE_URL=mysql://user:pass@host:3306/db \
  -v /local/uploads:/app/uploads \
  --name voc-ai \
  voc-ai-select
```

## CI/CD

GitHub Actions 已配置：
- `.github/workflows/ci.yml` — push/PR 触发，运行类型检查、Lint、单元测试、构建

## 监控建议

1. 错误监控：集成 Sentry，在 `main.tsx` 的 `__reportError` 钩子中调用
2. 性能监控：使用 Web Vitals + Lighthouse CI
3. API 监控：tRPC 接口接入 OpenTelemetry / DataDog

## 性能配置

- 已开启路由级代码分割（React.lazy + Suspense）
- ECharts/Lucide/Recharts 等大型库已通过 manualChunks 单独拆包
- tRPC 全局缓存：staleTime 5min / gcTime 10min
- 图表组件使用 IntersectionObserver 懒挂载

## 容量评估（参考）

- 200 商品 / 2000 评论 / 300 视频 / 20 概念 / 600 指标
- 数据库占用 ~20MB
- 内存占用 ~150MB（生产模式）
