# 企服外勤代办宝 - 部署指南

## 📋 目录结构

```
deploy/
├── init-server.sh          # 服务器初始化脚本（首次使用）
├── deploy.sh               # 一键部署脚本
├── update.sh               # 更新部署脚本
├── backup.sh               # 数据备份/恢复脚本
├── ops.sh                  # 运维工具集
├── .env.production         # 生产环境配置模板
├── docker-compose.prod.yml # 生产环境 Docker Compose
└── nginx/
    └── qfwq.conf           # Nginx 配置（含HTTPS模板）
```

## 🚀 快速开始

### 第一步：服务器初始化

在腾讯云服务器上执行（仅需首次）：

```bash
sudo bash deploy/init-server.sh
```

这会安装 Docker、Docker Compose、配置防火墙和安全策略。

### 第二步：上传项目代码

```bash
# 方式1: 从本地上传
scp -r 企服外勤代办宝-backend/* root@你的服务器IP:/opt/qfwq-backend/

# 方式2: 如果用了 Git
cd /opt/qfwq-backend
git clone 你的仓库地址 .
```

### 第三步：配置环境变量

```bash
# 复制配置模板
cp deploy/.env.production .env

# 编辑配置（必须修改的项目已标注）
vim .env
```

**必须修改的配置项：**

| 配置项 | 说明 | 生成方式 |
|--------|------|---------|
| `DB_ROOT_PASSWORD` | MySQL root 密码 | 至少16位强密码 |
| `REDIS_PASSWORD` | Redis 密码 | 至少16位强密码 |
| `JWT_SECRET` | JWT签名密钥 | `openssl rand -base64 48` |
| `JWT_REFRESH_SECRET` | JWT刷新密钥 | `openssl rand -base64 48` |
| `WX_APPID` | 微信小程序 AppID | 微信公众平台获取 |
| `WX_SECRET` | 微信小程序 AppSecret | 微信公众平台获取 |
| `CRYPTO_SECRET_KEY` | AES加密密钥（32位hex） | `openssl rand -hex 16` |
| `CRYPTO_IV` | AES加密IV（16位hex） | `openssl rand -hex 8` |
| `DOMAIN` | 你的域名 | 如 `example.com` |

**如果使用腾讯云 COS（生产环境图片存储）：**

| 配置项 | 说明 |
|--------|------|
| `COS_SECRET_ID` | 腾讯云 API 密钥 ID |
| `COS_SECRET_KEY` | 腾讯云 API 密钥 Key |
| `COS_BUCKET` | 存储桶名称（格式：`bucketname-appid`） |
| `COS_REGION` | 地域（如 `ap-guangzhou`） |

### 第四步：部署

```bash
# 首次部署（包含数据库初始化 + 种子数据）
sudo bash deploy/deploy.sh --init
```

部署成功后，访问 `http://你的服务器IP/api/v1/health` 应返回 `{"code":200,"message":"ok"}`。

### 第五步（可选）：配置 HTTPS

```bash
# 前提：域名已解析到服务器IP
sudo bash deploy/deploy.sh --ssl
```

## 📝 日常运维

### 更新代码

```bash
# 自动拉取最新代码、构建、重启
sudo bash deploy/update.sh          # 默认 main 分支
sudo bash deploy/update.sh develop  # 指定分支
```

### 备份数据

```bash
# 完整备份（数据库 + 上传文件）
sudo bash deploy/backup.sh --full

# 仅备份数据库
sudo bash deploy/backup.sh --db

# 查看备份列表
sudo bash deploy/backup.sh --list

# 从备份恢复
sudo bash deploy/backup.sh --restore /opt/qfwq-backend/backups/db_20260717_030000.sql.gz
```

**设置自动备份（每天凌晨3点）：**

```bash
echo "0 3 * * * /opt/qfwq-backend/deploy/backup.sh --full >> /var/log/qfwq-backup.log 2>&1" | sudo crontab -
```

### 运维工具

```bash
# 查看服务状态
bash deploy/ops.sh status

# 查看实时日志
bash deploy/ops.sh logs

# 查看错误日志
bash deploy/ops.sh logs-err

# 重启应用
bash deploy/ops.sh restart-app

# 进入 MySQL
bash deploy/ops.sh db-shell

# 进入 Redis
bash deploy/ops.sh redis-cli

# 查看数据库大小
bash deploy/ops.sh db-size

# 查看慢查询
bash deploy/ops.sh slow-log
```

## 🔧 架构说明

```
                    ┌──────────┐
                    │  Nginx   │  :80 / :443
                    │ 反向代理  │
                    └────┬─────┘
                         │
                    ┌────▼─────┐
                    │  App     │  :3000 (内部)
                    │ Node.js  │  PM2 进程管理
                    └────┬─────┘
                    ┌────┴─────┐
              ┌─────┤          ├─────┐
              │     │          │     │
         ┌────▼──┐ ┌──▼───┐ ┌──▼───┐
         │ MySQL │ │Redis │ │ COS  │
         │ :3306 │ │:6379 │ │(外部)│
         └───────┘ └──────┘ └──────┘
         (内部网络) (内部网络)
```

- **Nginx** 处理 HTTPS、限流、静态文件
- **App** 运行 Node.js 应用，PM2 管理进程
- **MySQL** 数据持久化，仅内部访问
- **Redis** 缓存 + 会话，仅内部访问
- **COS** 腾讯云对象存储，存放用户上传的文件

## 🔐 安全清单

- [x] 防火墙仅开放 22/80/443 端口
- [x] fail2ban 防暴力破解
- [x] Nginx 限流（API 10r/s，登录 1r/s）
- [x] 安全响应头（X-Frame-Options, XSS-Protection 等）
- [x] 敏感数据 AES 加密存储
- [x] JWT 双 Token + Redis 黑名单
- [x] Docker 容器以非 root 用户运行
- [x] MySQL/Redis 不对外暴露端口
- [ ] 启用 HTTPS（需配置域名后执行 `deploy.sh --ssl`）
- [ ] 配置腾讯云安全组（仅允许 80/443 入站）

## ❓ 常见问题

### Q: 部署后访问返回 502
检查应用容器是否正常运行：
```bash
docker compose -f deploy/docker-compose.prod.yml logs app
```

### Q: 数据库连接失败
确认 MySQL 容器健康：
```bash
docker compose -f deploy/docker-compose.prod.yml ps
bash deploy/ops.sh db-shell
```

### Q: 如何查看完整日志
```bash
# 应用日志
docker compose -f deploy/docker-compose.prod.yml logs -f app

# MySQL 日志
docker compose -f deploy/docker-compose.prod.yml logs -f mysql

# Nginx 日志
docker logs -f qfwq-nginx
```

### Q: 磁盘空间不足
```bash
# 清理 Docker 无用资源
docker system prune -a

# 清理旧备份
bash deploy/backup.sh --list  # 查看
rm -f /opt/qfwq-backend/backups/旧文件
```

### Q: 如何迁移到新服务器
```bash
# 旧服务器：备份
bash deploy/backup.sh --full

# 将 /opt/qfwq-backend 整个目录复制到新服务器
scp -r /opt/qfwq-backend root@新服务器IP:/opt/

# 新服务器：初始化 + 部署
bash /opt/qfwq-backend/deploy/init-server.sh
bash /opt/qfwq-backend/deploy/deploy.sh --init

# 恢复数据
bash deploy/backup.sh --restore /opt/qfwq-backend/backups/db_最新.sql.gz
bash deploy/backup.sh --restore /opt/qfwq-backend/backups/files_最新.tar.gz
```
