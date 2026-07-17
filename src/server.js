/**
 * 启动文件 - 企服外勤代办宝
 * 加载环境变量 → 测试连接 → 启动服务 → 优雅关闭
 */
require('dotenv').config();

const http = require('http');
const app = require('./app');
const config = require('./config/index');
const logger = require('./utils/logger');
const { testConnection: testDbConnection, disconnect: disconnectDb } = require('./config/database');
const { testConnection: testRedisConnection, disconnect: disconnectRedis } = require('./config/redis');

const PORT = config.app.port;

/**
 * 启动服务
 */
async function startServer() {
  try {
    logger.info('🚀 企服外勤代办宝 后端服务启动中...');

    // 测试数据库连接
    const dbOk = await testDbConnection();
    if (!dbOk) {
      logger.warn('⚠️ 数据库连接失败，服务仍将启动（部分功能不可用）');
    }

    // 测试 Redis 连接
    const redisOk = await testRedisConnection();
    if (!redisOk) {
      logger.warn('⚠️ Redis 连接失败，服务仍将启动（缓存功能不可用）');
    }

    // 创建 HTTP Server
    const server = http.createServer(app);

    // 启动监听
    server.listen(PORT, () => {
      logger.info(`✅ 服务启动成功: http://localhost:${PORT}`);
      logger.info(`📍 环境: ${config.app.env}`);
      logger.info(`📍 API: http://localhost:${PORT}/api/v1`);
    });

    // 优雅关闭
    const shutdown = async (signal) => {
      logger.info(`\n📡 收到 ${signal} 信号，开始优雅关闭...`);

      // 停止接受新请求
      server.close(async () => {
        logger.info('📪 HTTP 服务已停止接受新请求');

        try {
          // 断开数据库连接
          await disconnectDb();
          // 断开 Redis 连接
          await disconnectRedis();

          logger.info('👋 所有连接已断开，服务已关闭');
          process.exit(0);
        } catch (err) {
          logger.error('关闭连接时出错:', err);
          process.exit(1);
        }
      });

      // 10秒超时强制退出
      setTimeout(() => {
        logger.error('⏰ 优雅关闭超时，强制退出');
        process.exit(1);
      }, 10000);
    };

    // 注册信号处理
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 未捕获异常处理
    process.on('uncaughtException', (err) => {
      logger.error('未捕获异常:', err);
      shutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason) => {
      logger.error('未处理的 Promise 拒绝:', reason);
    });

  } catch (error) {
    logger.error('❌ 服务启动失败:', error);
    process.exit(1);
  }
}

// 启动
startServer();
