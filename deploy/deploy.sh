#!/bin/bash
# ============================================================
# 企服外勤代办宝 - 一键部署脚本
# 用法: sudo bash deploy.sh [选项]
#
# 选项:
#   --init      首次部署（包含数据库初始化+种子数据）
#   --update    更新部署（仅更新代码和重启）
#   --rebuild   完整重建（重建镜像+重启）
#   --ssl       配置 HTTPS（需要域名已解析到本服务器）
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }
log_step()  { echo -e "${BLUE}[STEP]${NC} $1"; }

# 项目目录
PROJECT_DIR="/opt/qfwq-backend"
COMPOSE_FILE="${PROJECT_DIR}/deploy/docker-compose.prod.yml"
DEPLOY_MODE="${1:---init}"

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

# 检查 .env 文件
if [ ! -f "${PROJECT_DIR}/.env" ]; then
    log_error ".env 文件不存在！"
    log_error "请先复制并修改配置文件:"
    log_error "  cp ${PROJECT_DIR}/deploy/.env.production ${PROJECT_DIR}/.env"
    log_error "  vim ${PROJECT_DIR}/.env"
    exit 1
fi

# 加载环境变量
source "${PROJECT_DIR}/.env"

echo ""
log_info "========================================="
log_info " 企服外勤代办宝 - 部署脚本"
log_info " 模式: ${DEPLOY_MODE}"
log_info "========================================="
echo ""

# ==================== 首次部署 ====================
deploy_init() {
    log_step "首次部署开始..."

    # 1. 检查 Docker
    if ! command -v docker &> /dev/null; then
        log_error "Docker 未安装，请先运行 init-server.sh"
        exit 1
    fi

    # 2. 构建镜像
    log_step "构建 Docker 镜像..."
    cd "${PROJECT_DIR}"
    docker compose -f deploy/docker-compose.prod.yml build --no-cache
    log_info "镜像构建完成"

    # 3. 启动 MySQL 和 Redis（先启动数据库）
    log_step "启动数据库服务..."
    docker compose -f deploy/docker-compose.prod.yml up -d mysql redis
    log_info "等待数据库就绪..."
    sleep 15

    # 等待 MySQL 健康检查通过
    local retries=0
    local max_retries=30
    while [ $retries -lt $max_retries ]; do
        if docker compose -f deploy/docker-compose.prod.yml exec -T mysql mysqladmin ping -h localhost -u root -p"${DB_ROOT_PASSWORD}" &>/dev/null; then
            log_info "MySQL 已就绪"
            break
        fi
        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done
    echo ""

    if [ $retries -eq $max_retries ]; then
        log_error "MySQL 启动超时，请检查日志: docker compose logs mysql"
        exit 1
    fi

    # 等待 Redis 健康检查通过
    retries=0
    while [ $retries -lt $max_retries ]; do
        if docker compose -f deploy/docker-compose.prod.yml exec -T redis redis-cli ping &>/dev/null; then
            log_info "Redis 已就绪"
            break
        fi
        retries=$((retries + 1))
        echo -n "."
        sleep 2
    done
    echo ""

    # 4. 初始化数据库（Prisma Migrate）
    log_step "初始化数据库表结构..."
    docker compose -f deploy/docker-compose.prod.yml run --rm app npx prisma migrate deploy
    log_info "数据库表结构初始化完成"

    # 5. 灌入种子数据
    log_step "灌入种子数据（服务分类、协议等）..."
    docker compose -f deploy/docker-compose.prod.yml run --rm app npm run prisma:seed
    log_info "种子数据灌入完成"

    # 6. 启动应用
    log_step "启动应用服务..."
    docker compose -f deploy/docker-compose.prod.yml up -d app
    log_info "应用服务启动完成"

    # 7. 配置 Nginx
    log_step "配置 Nginx 反向代理..."
    setup_nginx

    # 8. 验证部署
    log_step "验证部署状态..."
    sleep 5
    verify_deployment

    echo ""
    log_info "========================================="
    log_info " 部署完成！"
    log_info "========================================="
    show_status
}

# ==================== 更新部署 ====================
deploy_update() {
    log_step "更新部署开始..."
    cd "${PROJECT_DIR}"

    # 1. 构建新镜像
    log_step "构建新镜像..."
    docker compose -f deploy/docker-compose.prod.yml build app
    log_info "镜像构建完成"

    # 2. 滚动更新应用
    log_step "更新应用服务..."
    docker compose -f deploy/docker-compose.prod.yml up -d --no-deps app
    log_info "应用服务更新完成"

    # 3. 运行数据库迁移（如有新的迁移）
    log_step "检查数据库迁移..."
    docker compose -f deploy/docker-compose.prod.yml run --rm app npx prisma migrate deploy 2>/dev/null || true
    log_info "数据库迁移检查完成"

    # 4. 验证
    sleep 5
    verify_deployment

    log_info "更新部署完成！"
    show_status
}

# ==================== 完整重建 ====================
deploy_rebuild() {
    log_step "完整重建开始..."
    cd "${PROJECT_DIR}"

    # 1. 停止所有服务
    log_step "停止所有服务..."
    docker compose -f deploy/docker-compose.prod.yml down
    log_info "服务已停止"

    # 2. 删除旧镜像
    log_step "清理旧镜像..."
    docker image prune -f
    log_info "旧镜像已清理"

    # 3. 重新构建并启动
    deploy_init
}

# ==================== 配置 Nginx ====================
setup_nginx() {
    # 复制 Nginx 配置
    cp "${PROJECT_DIR}/deploy/nginx/qfwq.conf" /etc/nginx/sites-available/qfwq

    # 启用站点
    if [ ! -L /etc/nginx/sites-enabled/qfwq ]; then
        ln -sf /etc/nginx/sites-available/qfwq /etc/nginx/sites-enabled/qfwq
    fi

    # 删除默认站点（避免冲突）
    rm -f /etc/nginx/sites-enabled/default

    # 测试配置
    nginx -t
    if [ $? -ne 0 ]; then
        log_error "Nginx 配置测试失败，请检查配置文件"
        exit 1
    fi

    # 重载 Nginx
    systemctl reload nginx 2>/dev/null || systemctl start nginx
    log_info "Nginx 配置已生效"
}

# ==================== 配置 HTTPS ====================
setup_ssl() {
    if [ -z "${DOMAIN}" ] || [ "${DOMAIN}" = "your-domain.com" ]; then
        log_error "请先在 .env 中设置 DOMAIN 变量"
        exit 1
    fi

    log_step "申请 SSL 证书（Let's Encrypt）..."

    # 先确保 HTTP 服务正常运行
    setup_nginx

    # 申请证书
    certbot --nginx -d "${DOMAIN}" --non-interactive --agree-tos --email "${ADMIN_EMAIL:-admin@${DOMAIN}}"

    if [ $? -eq 0 ]; then
        log_info "SSL 证书申请成功！"
        log_info "证书将自动续期（certbot 已配置自动续期定时器）"
    else
        log_error "SSL 证书申请失败，请检查域名解析是否正确"
        exit 1
    fi
}

# ==================== 验证部署 ====================
verify_deployment() {
    log_step "检查服务状态..."

    # 检查容器状态
    echo ""
    docker compose -f deploy/docker-compose.prod.yml ps
    echo ""

    # 健康检查
    local health_url="http://localhost:3000/api/v1/health"
    local response=$(curl -s -o /dev/null -w "%{http_code}" "${health_url}" 2>/dev/null || echo "000")

    if [ "${response}" = "200" ]; then
        log_info "健康检查通过 ✓"
    else
        log_warn "健康检查未通过 (HTTP ${response})，请检查日志:"
        log_warn "  docker compose -f deploy/docker-compose.prod.yml logs app"
    fi

    # 检查端口监听
    log_step "检查端口监听..."
    if ss -tlnp | grep -q ":80 "; then
        log_info "Nginx (80) 正在监听 ✓"
    else
        log_warn "Nginx (80) 未监听"
    fi

    if ss -tlnp | grep -q ":3000 "; then
        log_info "应用 (3000) 正在监听 ✓"
    else
        log_warn "应用 (3000) 未监听"
    fi
}

# ==================== 显示状态 ====================
show_status() {
    echo ""
    log_info "服务状态:"
    docker compose -f deploy/docker-compose.prod.yml ps --format "table {{.Name}}\t{{.Status}}\t{{.Ports}}"
    echo ""
    log_info "常用命令:"
    log_info "  查看日志:   docker compose -f deploy/docker-compose.prod.yml logs -f app"
    log_info "  重启服务:   docker compose -f deploy/docker-compose.prod.yml restart app"
    log_info "  停止服务:   docker compose -f deploy/docker-compose.prod.yml down"
    log_info "  备份数据:   bash ${PROJECT_DIR}/deploy/backup.sh"
}

# ==================== 主逻辑 ====================
case "${DEPLOY_MODE}" in
    --init)
        deploy_init
        ;;
    --update)
        deploy_update
        ;;
    --rebuild)
        deploy_rebuild
        ;;
    --ssl)
        setup_ssl
        ;;
    *)
        log_error "未知选项: ${DEPLOY_MODE}"
        echo "用法: sudo bash deploy.sh [--init|--update|--rebuild|--ssl]"
        exit 1
        ;;
esac
