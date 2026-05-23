# ---- Build Stage ----
FROM node:22-alpine AS builder

WORKDIR /app

# 复制 package 文件并安装依赖
COPY package.json package-lock.json* ./
RUN npm ci --no-audit --no-fund

# 复制源码并构建
COPY . .
RUN npm run build

# ---- Production Stage ----
FROM node:22-alpine AS production

WORKDIR /app

# 只装生产依赖
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev --no-audit --no-fund && \
    npm cache clean --force

# 拷贝构建产物 + 数据库 schema/seed
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/db ./db

# 运行时上传目录
RUN mkdir -p uploads

ENV NODE_ENV=production
ENV PORT=3000
ENV APP_ID=voc-ai-product-select
ENV DATABASE_URL=file:./local.db

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/ || exit 1

CMD ["node", "dist/boot.js"]
