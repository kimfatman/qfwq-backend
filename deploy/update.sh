#!/bin/bash
# ============================================================
# 企服外勤代办宝 - 更新部署脚本
# 适用于日常代码更新，自动拉取代码、构建、重启
# 用法: sudo bash update.sh [git分支名]
# ============================================================

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

PROJECT_DIR="/opt/qfwq-backend"
BRANCH="${1:-main}"

cd "${PROJECT_DIR}"

echo ""
log_info "========================================="
log_info " 企服外勤代办宝 - 更新部署"
log_info " 分支: ${BRANCH}"
log_info " 时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_info "========================================="

# 1. 拉取最新代码
log_info "拉取最新代码..."
git fetch origin
git checkout "${BRANCH}"
git pull origin "${BRANCH}"
log_info "代码更新完成"

# 2. 检查是否有新的依赖
if git diff HEAD@{1} --name-only | grep -q "package.json"; then
    log_info "检测到 package.json 变更，将重新构建镜像"
    REBUILD=true
else
    REBUILD=false
fi

# 3. 检查是否有数据库迁移
if git diff HEAD@{1} --name-only | grep -q "prisma/schema.prisma"; then
    log_info "检测到数据库 schema 变更"
    MIGRATE=true
else
    MIGRATE=false
fi

# 4. 备份当前版本（可选）
log_info "创建备份..."
bash "${PROJECT_DIR}/deploy/backup.sh" --full 2>/dev/null || log_warn "备份失败，继续更新..."

# 5. 重新构建或滚动更新
if [ "${REBUILD}" = true ]; then
    log_info "重新构建 Docker 镜像..."
    docker compose -f deploy/docker-compose.prod.yml build --no-cache app
else
    log_info "构建 Docker 镜像（使用缓存）..."
    docker compose -f deploy/docker-compose.prod.yml build app
fi

# 6. 重启应用
log_info "重启应用服务..."
docker compose -f deploy/docker-compose.prod.yml up -d --no-deps app

# 7. 数据库迁移
if [ "${MIGRATE}" = true ]; then
    log_info "执行数据库迁移..."
    docker compose -f deploy/docker-compose.prod.yml run --rm app npx prisma migrate deploy
    log_info "数据库迁移完成"
fi

# 8. 验证
sleep 5
log_info "验证服务状态..."
HEALTH=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:3000/api/v1/health 2>/dev/null || echo "000")

if [ "${HEALTH}" = "200" ]; then
    log_info "更新部署成功！服务运行正常 ✓"
else
    log_error "健康检查失败 (HTTP ${HEALTH})，请检查日志:"
    log_error "  docker compose -f deploy/docker-compose.prod.yml logs --tail=50 app"
fi

echo ""
log_info "当前版本: $(git log -1 --format='%h %s')"
