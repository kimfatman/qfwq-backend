/**
 * 限流中间件 - 企服外勤代办宝
 * 基于 express-rate-limit 提供接口限流保护
 */
const rateLimit = require('express-rate-limit');
const { error } = require('../utils/response');
const config = require('../config/index');

/**
 * 通用限流 - 100次/15分钟
 */
const generalLimiter = rateLimit({
  windowMs: config.rateLimit.general.windowMs,
  max: config.rateLimit.general.max,
  handler: (req, res) => {
    return error(res, '请求过于频繁，请稍后再试', 429, 429);
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => config.app.isDev && req.path === '/api/v1/health'
});

/**
 * 登录/鉴权接口限流 - 10次/15分钟
 */
const authLimiter = rateLimit({
  windowMs: config.rateLimit.auth.windowMs,
  max: config.rateLimit.auth.max,
  handler: (req, res) => {
    return error(res, '登录尝试次数过多，请15分钟后重试', 429, 429);
  },
  standardHeaders: true,
  legacyHeaders: false
});

/**
 * 上传接口限流 - 20次/15分钟
 */
const uploadLimiter = rateLimit({
  windowMs: config.rateLimit.upload.windowMs,
  max: config.rateLimit.upload.max,
  handler: (req, res) => {
    return error(res, '上传请求过于频繁，请稍后再试', 429, 429);
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  generalLimiter,
  authLimiter,
  uploadLimiter
};
