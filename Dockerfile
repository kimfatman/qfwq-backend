# ============== 阶段1: 依赖安装 ==============
FROM node:20-alpine AS deps

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --only=production && \
    npm install prisma --save-dev

COPY prisma ./prisma/
RUN npx prisma generate

# ============== 阶段2: 构建应用 ==============
FROM node:20-alpine AS builder

WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# ============== 阶段3: 生产镜像 ==============
FROM node:20-alpine AS runner

WORKDIR /app

# 安装 PM2
RUN npm install -g pm2

# 创建非 root 用户
RUN addgroup -g 1001 -S nodejs && \
    adduser -S appuser -u 1001 -G nodejs

# 复制生产依赖和 prisma 客户端
COPY --from=builder --chown=appuser:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=appuser:nodejs /app/prisma ./prisma
COPY --from=builder --chown=appuser:nodejs /app/src ./src
COPY --from=builder --chown=appuser:nodejs /app/package.json ./

# 创建上传和日志目录
RUN mkdir -p uploads logs && \
    chown -R appuser:nodejs uploads logs

USER appuser

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => { r.statusCode === 200 ? process.exit(0) : process.exit(1) })"

# 使用 PM2 启动
CMD ["pm2-runtime", "src/server.js", "--name", "qfwq-backend", "-i", "max"]
