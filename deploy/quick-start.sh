#!/bin/bash
# ============================================================
# 企服外勤代办宝 - 服务器快速部署脚本
# 用法：SSH登录服务器后，复制粘贴执行
# ============================================================

echo "🚀 企服外勤代办宝 - 开始部署..."
echo ""

# ==================== 1. 拉取代码 ====================
echo "📥 [1/6] 拉取代码..."
if [ -d "/opt/qfwq-backend" ]; then
    echo "目录已存在，跳过克隆"
    cd /opt/qfwq-backend
    git pull origin main
else
    git clone https://github.com/kimfatman/qfwq-backend.git /opt/qfwq-backend
    cd /opt/qfwq-backend
fi
echo "✅ 代码就绪"

# ==================== 2. 安装 Docker ====================
echo "📦 [2/6] 检查/安装 Docker..."
if ! command -v docker &> /dev/null; then
    apt-get update -qq
    apt-get install -y -qq curl wget ufw
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    echo "✅ Docker 已安装"
else
    echo "✅ Docker 已安装: $(docker --version)"
fi

# 安装 Docker Compose 插件
if ! docker compose version &> /dev/null; then
    apt-get install -y -qq docker-compose-plugin
fi
echo "✅ Docker Compose 就绪"

# ==================== 3. 配置防火墙 ====================
echo "🔒 [3/6] 配置防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
echo "y" | ufw enable 2>/dev/null
echo "✅ 防火墙已配置（22/80/443）"

# ==================== 4. 生成密钥 ====================
echo "🔑 [4/6] 生成安全密钥..."
DB_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
REDIS_PASS=$(openssl rand -base64 16 | tr -dc 'a-zA-Z0-9' | head -c 16)
JWT_SECRET=$(openssl rand -base64 48)
JWT_REFRESH=$(openssl rand -base64 48)
CRYPTO_KEY=$(openssl rand -hex 16)
CRYPTO_IV=$(openssl rand -hex 8)
echo "✅ 密钥已生成"

# ==================== 5. 生成 .env 配置 ====================
echo "📝 [5/6] 生成环境配置..."
cat > /opt/qfwq-backend/.env << ENVEOF
# ==================== 应用配置 ====================
PORT=3000
NODE_ENV=production

# ==================== 域名配置（暂时留空，后续填写） ====================
DOMAIN=your-domain.com
ADMIN_EMAIL=admin@your-domain.com

# ==================== 数据库配置 ====================
DB_ROOT_PASSWORD=${DB_PASS}
DB_NAME=qfwq_db
DATABASE_URL="mysql://root:${DB_PASS}@mysql:3306/qfwq_db"

# ==================== Redis 配置 ====================
REDIS_HOST=redis
REDIS_PORT=6379
REDIS_PASSWORD=${REDIS_PASS}
REDIS_DB=0

# ==================== JWT 配置 ====================
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=2h
JWT_REFRESH_SECRET=${JWT_REFRESH}
JWT_REFRESH_EXPIRES_IN=7d

# ==================== 微信小程序配置（待填写） ====================
WX_APPID=你的小程序AppID
WX_SECRET=你的小程序AppSecret

# ==================== 腾讯云 COS 配置（待填写） ====================
COS_SECRET_ID=你的腾讯云SecretId
COS_SECRET_KEY=你的腾讯云SecretKey
COS_BUCKET=你的存储桶名称
COS_REGION=ap-guangzhou

# ==================== 日志配置 ====================
LOG_LEVEL=info

# ==================== 加密配置 ====================
CRYPTO_SECRET_KEY=${CRYPTO_KEY}
CRYPTO_IV=${CRYPTO_IV}

# ==================== 安全配置 ====================
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100
ENVEOF
echo "✅ .env 已生成"

# ==================== 6. 启动服务 ====================
echo "🐳 [6/6] 构建并启动服务（首次需要几分钟）..."
cd /opt/qfwq-backend

# 构建镜像
docker compose -f deploy/docker-compose.prod.yml build --no-cache

# 先启动数据库
docker compose -f deploy/docker-compose.prod.yml up -d mysql redis
echo "等待数据库就绪..."
sleep 15

# 等待 MySQL 就绪
for i in $(seq 1 30); do
    if docker compose -f deploy/docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -p"${DB_PASS}" &>/dev/null; then
        echo "✅ MySQL 已就绪"
        break
    fi
    echo -n "."
    sleep 2
done

# 初始化数据库
docker compose -f deploy/docker-compose.prod.yml run --rm app npx prisma migrate deploy
docker compose -f deploy/docker-compose.prod.yml run --rm app npm run prisma:seed
echo "✅ 数据库初始化完成"

# 启动应用
docker compose -f deploy/docker-compose.prod.yml up -d app
echo "✅ 应用已启动"

# 配置 Nginx
cp /opt/qfwq-backend/deploy/nginx/qfwq.conf /etc/nginx/sites-available/qfwq 2>/dev/null
# 如果没有系统 Nginx，用 Docker 里的 Nginx
docker compose -f deploy/docker-compose.prod.yml up -d nginx
echo "✅ Nginx 已启动"

# ==================== 完成 ====================
echo ""
echo "================================================"
echo "  ✅ 部署完成！"
echo "================================================"
echo ""
echo "  验证地址: http://111.229.98.64/api/v1/health"
echo ""
echo "  查看状态: bash /opt/qfwq-backend/deploy/ops.sh status"
echo "  查看日志: bash /opt/qfwq-backend/deploy/ops.sh logs"
echo ""
echo "  ⚠️  待完成:"
echo "  1. 编辑 .env 填入微信小程序 AppID/Secret"
echo "     vim /opt/qfwq-backend/.env"
echo "  2. 编辑 .env 填入域名和 COS 配置"
echo "  3. 配置域名解析到 111.229.98.64"
echo "  4. 执行 HTTPS: sudo bash /opt/qfwq-backend/deploy/deploy.sh --ssl"
echo ""
echo "  📋 .env 中的自动生成密码（已保存，可修改）:"
echo "  MySQL 密码: ${DB_PASS}"
echo "  Redis 密码: ${REDIS_PASS}"
echo "================================================"
