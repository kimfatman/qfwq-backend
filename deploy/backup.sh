#!/bin/bash
# ============================================================
# 企服外勤代办宝 - 数据备份脚本
# 用法: bash backup.sh [选项]
#
# 选项:
#   --full      完整备份（数据库+上传文件）默认
#   --db        仅备份数据库
#   --files     仅备份上传文件
#   --restore   从备份恢复（需指定备份文件路径）
#
# 自动备份: 添加 crontab 定时任务
#   0 3 * * * /opt/qfwq-backend/deploy/backup.sh --full >> /var/log/qfwq-backup.log 2>&1
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
BACKUP_DIR="${PROJECT_DIR}/backups"
DATE=$(date +%Y%m%d_%H%M%S)
RETENTION_DAYS=30  # 备份保留天数

# 加载环境变量
if [ -f "${PROJECT_DIR}/.env" ]; then
    source "${PROJECT_DIR}/.env"
fi

BACKUP_MODE="${1:---full}"

# 创建备份目录
mkdir -p "${BACKUP_DIR}"

echo ""
log_info "========================================="
log_info " 企服外勤代办宝 - 数据备份"
log_info " 时间: $(date '+%Y-%m-%d %H:%M:%S')"
log_info " 模式: ${BACKUP_MODE}"
log_info "========================================="

# ==================== 数据库备份 ====================
backup_database() {
    log_info "备份数据库..."

    local dump_file="${BACKUP_DIR}/db_${DATE}.sql.gz"

    docker compose -f "${PROJECT_DIR}/deploy/docker-compose.prod.yml" exec -T mysql \
        mysqldump -u root -p"${DB_ROOT_PASSWORD}" \
        --single-transaction \
        --routines \
        --triggers \
        --databases "${DB_NAME:-qfwq_db}" \
        | gzip > "${dump_file}"

    if [ -f "${dump_file}" ] && [ -s "${dump_file}" ]; then
        local size=$(du -h "${dump_file}" | cut -f1)
        log_info "数据库备份完成: ${dump_file} (${size})"
    else
        log_error "数据库备份失败！"
        rm -f "${dump_file}"
        return 1
    fi
}

# ==================== 文件备份 ====================
backup_files() {
    log_info "备份上传文件..."

    local archive_file="${BACKUP_DIR}/files_${DATE}.tar.gz"

    if [ -d "${PROJECT_DIR}/uploads" ] && [ "$(ls -A ${PROJECT_DIR}/uploads 2>/dev/null)" ]; then
        tar -czf "${archive_file}" -C "${PROJECT_DIR}" uploads/

        if [ -f "${archive_file}" ] && [ -s "${archive_file}" ]; then
            local size=$(du -h "${archive_file}" | cut -f1)
            log_info "文件备份完成: ${archive_file} (${size})"
        else
            log_error "文件备份失败！"
            rm -f "${archive_file}"
            return 1
        fi
    else
        log_warn "上传目录为空，跳过文件备份"
    fi
}

# ==================== 清理旧备份 ====================
cleanup_old_backups() {
    log_info "清理 ${RETENTION_DAYS} 天前的备份..."

    local count=$(find "${BACKUP_DIR}" -name "*.sql.gz" -o -name "*.tar.gz" | grep -v "$(date +%Y%m%d)" | head -100 | wc -l)

    find "${BACKUP_DIR}" \( -name "db_*.sql.gz" -o -name "files_*.tar.gz" \) -mtime +${RETENTION_DAYS} -delete 2>/dev/null

    log_info "旧备份清理完成"
}

# ==================== 恢复备份 ====================
restore_backup() {
    local backup_file="$2"

    if [ -z "${backup_file}" ]; then
        log_error "请指定备份文件路径"
        echo "用法: bash backup.sh --restore /path/to/backup.sql.gz"
        exit 1
    fi

    if [ ! -f "${backup_file}" ]; then
        log_error "备份文件不存在: ${backup_file}"
        exit 1
    fi

    echo ""
    log_warn "警告：恢复操作将覆盖当前数据库数据！"
    read -p "确认恢复？(输入 yes 继续): " confirm
    if [ "${confirm}" != "yes" ]; then
        log_info "已取消恢复"
        exit 0
    fi

    log_info "开始恢复..."

    if [[ "${backup_file}" == *.sql.gz ]]; then
        # 恢复数据库
        log_info "恢复数据库..."
        gunzip -c "${backup_file}" | docker compose -f "${PROJECT_DIR}/deploy/docker-compose.prod.yml" exec -T mysql \
            mysql -u root -p"${DB_ROOT_PASSWORD}"
        log_info "数据库恢复完成"

    elif [[ "${backup_file}" == *.tar.gz ]]; then
        # 恢复文件
        log_info "恢复上传文件..."
        tar -xzf "${backup_file}" -C "${PROJECT_DIR}"
        log_info "文件恢复完成"
    else
        log_error "不支持的备份文件格式"
        exit 1
    fi

    # 重启应用
    log_info "重启应用服务..."
    docker compose -f "${PROJECT_DIR}/deploy/docker-compose.prod.yml" restart app
    log_info "恢复完成！"
}

# ==================== 显示备份列表 ====================
list_backups() {
    log_info "可用备份:"
    echo ""
    echo "数据库备份:"
    ls -lh "${BACKUP_DIR}"/db_*.sql.gz 2>/dev/null || echo "  (无)"
    echo ""
    echo "文件备份:"
    ls -lh "${BACKUP_DIR}"/files_*.tar.gz 2>/dev/null || echo "  (无)"
    echo ""
    local total_size=$(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)
    echo "备份总大小: ${total_size:-0}"
}

# ==================== 主逻辑 ====================
case "${BACKUP_MODE}" in
    --full)
        backup_database
        backup_files
        cleanup_old_backups
        ;;
    --db)
        backup_database
        cleanup_old_backups
        ;;
    --files)
        backup_files
        cleanup_old_backups
        ;;
    --restore)
        restore_backup "$@"
        ;;
    --list)
        list_backups
        ;;
    *)
        log_error "未知选项: ${BACKUP_MODE}"
        echo "用法: bash backup.sh [--full|--db|--files|--restore|--list]"
        exit 1
        ;;
esac

echo ""
log_info "备份完成！"
list_backups
