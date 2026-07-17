/**
 * Express 应用配置 - 企服外勤代办宝
 * 中间件注册、路由挂载、错误处理
 */
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const morgan = require('morgan');
const path = require('path');

// 中间件
const { generalLimiter } = require('./middleware/rateLimit');
const { notFound, errorHandler } = require('./middleware/errorHandler');

// 工具
const logger = require('./utils/logger');
const config = require('./config/index');

const app = express();

// ==================== 安全与基础中间件 ====================

// 安全 HTTP 头
app.use(helmet());

// CORS 跨域
app.use(cors({
  origin: '*', // 生产环境应限制具体域名
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  credentials: true,
  maxAge: 86400
}));

// 请求日志
if (config.app.isDev) {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined', {
    stream: {
      write: (message) => logger.info(message.trim())
    }
  }));
}

// 限流
app.use(generalLimiter);

// 请求体解析
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// 静态文件服务（上传目录）
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// ==================== 路由挂载 ====================

// 健康检查
app.get('/api/v1/health', (req, res) => {
  res.json({
    code: 200,
    message: 'ok',
    data: {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      env: config.app.env
    }
  });
});

// 业务路由挂载
app.use('/api/v1', require('./routes'));

// ==================== 错误处理 ====================

// 404 处理（放在所有路由之后）
app.use(notFound);

// 全局错误处理（必须放最后）
app.use(errorHandler);

module.exports = app;
