#!/bin/bash
# ============================================================
# 企服外勤代办宝 - 运维工具集
# 用法: bash ops.sh <命令>
# ============================================================

set -e

PROJECT_DIR="/opt/qfwq-backend"
COMPOSE="-f ${PROJECT_DIR}/deploy/docker-compose.prod.yml"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

show_help() {
    echo ""
    echo -e "${GREEN}企服外勤代办宝 - 运维工具集${NC}"
    echo ""
    echo "用法: bash ops.sh <命令>"
    echo ""
    echo "命令:"
    echo "  status      查看所有服务状态"
    echo "  logs        查看应用日志 (tail -f)"
    echo "  logs-err    查看最近的错误日志"
    echo "  restart     重启所有服务"
    echo "  restart-app 仅重启应用"
    echo "  stop        停止所有服务"
    echo "  start       启动所有服务"
    echo "  shell       进入应用容器 shell"
    echo "  db-shell    进入 MySQL 命令行"
    echo "  redis-cli   进入 Redis 命令行"
    echo "  db-size     查看数据库大小"
    echo "  redis-info  查看 Redis 信息"
    echo "  disk        查看磁盘使用情况"
    echo "  connections 查看当前连接数"
    echo "  slow-log    查看 MySQL 慢查询"
    echo ""
}

case "${1}" in
    status)
        docker compose ${COMPOSE} ps
        ;;

    logs)
        docker compose ${COMPOSE} logs -f --tail=100 app
        ;;

    logs-err)
        docker compose ${COMPOSE} logs --tail=500 app 2>&1 | grep -i "error\|fatal\|panic" | tail -20
        ;;

    restart)
        echo "重启所有服务..."
        docker compose ${COMPOSE} restart
        echo "完成"
        ;;

    restart-app)
        echo "重启应用服务..."
        docker compose ${COMPOSE} restart app
        echo "完成"
        ;;

    stop)
        echo "停止所有服务..."
        docker compose ${COMPOSE} down
        echo "已停止"
        ;;

    start)
        echo "启动所有服务..."
        docker compose ${COMPOSE} up -d
        echo "已启动"
        ;;

    shell)
        echo "进入应用容器..."
        docker compose ${COMPOSE} exec app sh
        ;;

    db-shell)
        source "${PROJECT_DIR}/.env"
        docker compose ${COMPOSE} exec mysql mysql -u root -p"${DB_ROOT_PASSWORD}" "${DB_NAME:-qfwq_db}"
        ;;

    redis-cli)
        source "${PROJECT_DIR}/.env"
        docker compose ${COMPOSE} exec redis redis-cli -a "${REDIS_PASSWORD}"
        ;;

    db-size)
        source "${PROJECT_DIR}/.env"
        docker compose ${COMPOSE} exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" -e \
            "SELECT table_name, 
                    ROUND((data_length + index_length) / 1024 / 1024, 2) AS 'Size (MB)',
                    table_rows
             FROM information_schema.tables 
             WHERE table_schema = '${DB_NAME:-qfwq_db}'
             ORDER BY (data_length + index_length) DESC;"
        ;;

    redis-info)
        source "${PROJECT_DIR}/.env"
        docker compose ${COMPOSE} exec redis redis-cli -a "${REDIS_PASSWORD}" INFO memory | grep -E "used_memory_human|maxmemory_human|maxmemory_policy"
        ;;

    disk)
        echo "磁盘使用情况:"
        echo ""
        df -h / /opt
        echo ""
        echo "项目目录:"
        du -sh "${PROJECT_DIR}"/*  2>/dev/null | sort -rh | head -10
        ;;

    connections)
        source "${PROJECT_DIR}/.env"
        docker compose ${COMPOSE} exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" -e \
            "SHOW STATUS WHERE Variable_name = 'Threads_connected';"
        ;;

    slow-log)
        source "${PROJECT_DIR}/.env"
        docker compose ${COMPOSE} exec -T mysql mysql -u root -p"${DB_ROOT_PASSWORD}" -e \
            "SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 20;" 2>/dev/null || \
        docker compose ${COMPOSE} exec -T mysql cat /var/lib/mysql/slow.log 2>/dev/null | tail -50
        ;;

    *)
        show_help
        ;;
esac
