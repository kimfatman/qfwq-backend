/**
 * 全局错误处理中间件 - 企服外勤代办宝
 * 404处理 + 统一错误响应 + async错误捕获包装器
 */
const logger = require('../utils/logger');
const { error } = require('../utils/response');
const config = require('../config/index');

/**
 * 404 处理中间件
 */
function notFound(req, res, next) {
  return error(res, `接口不存在: ${req.method} ${req.originalUrl}`, 404, 404);
}

/**
 * 全局错误处理中间件
 * 区分开发/生产环境，开发环境输出错误栈
 */
function errorHandler(err, req, res, next) {
  // 记录错误日志
  logger.error('请求错误', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: {
      name: err.name,
      message: err.message,
      stack: config.app.isDev ? err.stack : undefined
    }
  });

  // Prisma 已知错误处理
  if (err.code?.startsWith('P')) {
    const prismaMessages = {
      P2002: '数据唯一约束冲突',
      P2025: '记录不存在',
      P2003: '关联数据不存在'
    };
    const message = prismaMessages[err.code] || '数据库操作错误';
    return error(res, message, 400, 400);
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    return error(res, '无效的认证令牌', 401, 401);
  }
  if (err.name === 'TokenExpiredError') {
    return error(res, '认证令牌已过期', 401, 401);
  }

  // 校验错误
  if (err.name === 'ValidationError') {
    return error(res, err.message, 422, 422);
  }

  // 默认服务器错误
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && !config.app.isDev
    ? '服务器内部错误'
    : err.message || '服务器内部错误';

  return error(res, message, statusCode, statusCode);
}

/**
 * Async 路由错误捕获包装器
 * 自动捕获 async 函数中的错误并传递给 errorHandler
 * @param {Function} fn - async 路由处理函数
 * @returns {Function} Express 中间件
 */
function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  notFound,
  errorHandler,
  asyncHandler
};
