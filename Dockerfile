# ============== 生产镜像 ==============
FROM node:20-bookworm-slim

WORKDIR /app

# 用阿里云镜像安装 openssl（Prisma 运行时需要检测 SSL 版本）
RUN sed -i 's|deb.debian.org|mirrors.aliyun.com|g' /etc/apt/sources.list.d/debian.sources 2>/dev/null; \
    apt-get update && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

# 安装 PM2
RUN npm install -g pm2

# 创建非 root 用户（-m 创建 home 目录）
RUN groupadd -g 1001 nodejs && \
    useradd -m -u 1001 -g nodejs appuser

# 先复制 schema，再用 --ignore-scripts 避免 prepare 脚本在 schema 不存在时执行
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

RUN npm ci --ignore-scripts && \
    npx prisma generate

# 复制源代码
COPY src ./src

# 让 appuser 可以写入 prisma 引擎目录（migrate deploy 需要）
RUN chown -R appuser:nodejs /app/node_modules/.prisma /app/node_modules/@prisma/engines 2>/dev/null || true

# 创建上传和日志目录
RUN mkdir -p uploads logs && \
    chown -R appuser:nodejs uploads logs

USER appuser

EXPOSE 3000

# 健康检查
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:3000/api/v1/health', (r) => { r.statusCode === 200 ? process.exit(0) : process.exit(1) })"

# 使用 PM2 启动
CMD ["sh", "-c", "npx prisma migrate deploy && pm2-runtime src/server.js --name qfwq-backend -i 1"]
