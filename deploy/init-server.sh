#!/bin/bash
# ============================================================
# 企服外勤代办宝 - 服务器初始化脚本
# 适用于 Ubuntu 20.04/22.04/24.04 LTS
# 用法: sudo bash init-server.sh
# ============================================================

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info()  { echo -e "${GREEN}[INFO]${NC} $1"; }
log_warn()  { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 检查 root 权限
if [ "$EUID" -ne 0 ]; then
    log_error "请使用 sudo 运行此脚本"
    exit 1
fi

log_info "========================================="
log_info " 企服外勤代办宝 - 服务器环境初始化"
log_info "========================================="

# ==================== 1. 系统更新 ====================
log_info "更新系统软件包..."
apt-get update -qq
apt-get upgrade -y -qq

# ==================== 2. 安装基础工具 ====================
log_info "安装基础工具..."
apt-get install -y -qq \
    curl \
    wget \
    git \
    vim \
    htop \
    ufw \
    fail2ban \
    logrotate \
    certbot \
    python3-certbot-nginx

# ==================== 3. 安装 Docker ====================
if command -v docker &> /dev/null; then
    log_info "Docker 已安装: $(docker --version)"
else
    log_info "安装 Docker..."
    curl -fsSL https://get.docker.com | sh
    systemctl enable docker
    systemctl start docker
    log_info "Docker 安装完成: $(docker --version)"
fi

# ==================== 4. 安装 Docker Compose ====================
if command -v docker compose &> /dev/null; then
    log_info "Docker Compose 已安装"
else
    log_info "安装 Docker Compose 插件..."
    apt-get install -y -qq docker-compose-plugin
    log_info "Docker Compose 安装完成"
fi

# ==================== 5. 配置防火墙 ====================
log_info "配置 UFW 防火墙..."
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
# 注意：不要对外开放 3306 和 6379，只通过 Docker 内部网络访问

echo "y" | ufw enable
log_info "防火墙已配置并启用"

# ==================== 6. 配置 fail2ban ====================
log_info "配置 fail2ban 防暴力破解..."
cat > /etc/fail2ban/jail.local << 'EOF'
[DEFAULT]
bantime = 3600
findtime = 600
maxretry = 5
backend = systemd

[sshd]
enabled = true
port = ssh
filter = sshd
logpath = /var/log/auth.log
maxretry = 3
EOF

systemctl enable fail2ban
systemctl restart fail2ban
log_info "fail2ban 已配置"

# ==================== 7. 配置系统参数 ====================
log_info "优化系统参数..."

# 增大文件描述符限制
cat >> /etc/security/limits.conf << 'EOF'
* soft nofile 65536
* hard nofile 65536
root soft nofile 65536
root hard nofile 65536
EOF

# 优化内核参数
cat > /etc/sysctl.d/99-qfwq.conf << 'EOF'
# 网络优化
net.core.somaxconn = 65535
net.ipv4.tcp_max_syn_backlog = 65535
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 1200
net.ipv4.ip_local_port_range = 1024 65535

# 文件监控
fs.inotify.max_user_watches = 524288

# 虚拟内存
vm.swappiness = 10
EOF

sysctl -p /etc/sysctl.d/99-qfwq.conf

# ==================== 8. 配置日志轮转 ====================
log_info "配置日志轮转..."
cat > /etc/logrotate.d/qfwq << 'EOF'
/opt/qfwq-backend/logs/*.log {
    daily
    rotate 30
    compress
    delaycompress
    notifempty
    missingok
    copytruncate
}
EOF

# ==================== 9. 创建项目目录 ====================
log_info "创建项目目录..."
mkdir -p /opt/qfwq-backend
mkdir -p /opt/qfwq-backend/uploads
mkdir -p /opt/qfwq-backend/logs
log_info "项目目录: /opt/qfwq-backend"

# ==================== 完成 ====================
echo ""
log_info "========================================="
log_info " 服务器初始化完成！"
log_info "========================================="
echo ""
log_info "后续步骤:"
log_info "  1. 将项目代码上传到 /opt/qfwq-backend/"
log_info "  2. 复制 .env.production 到 /opt/qfwq-backend/.env 并修改配置"
log_info "  3. 运行: sudo bash deploy/deploy.sh"
echo ""
log_warn "建议重启服务器使所有配置生效: sudo reboot"
