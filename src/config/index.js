/**
 * 统一配置管理 - 企服外勤代办宝
 * 从环境变量读取所有配置，提供合理默认值
 */
require('dotenv').config();

const config = {
  // 应用配置
  app: {
    port: parseInt(process.env.PORT, 10) || 3000,
    env: process.env.NODE_ENV || 'development',
    isDev: (process.env.NODE_ENV || 'development') === 'development',
    isProd: process.env.NODE_ENV === 'production'
  },

  // 数据库配置
  database: {
    url: process.env.DATABASE_URL || 'mysql://root:123456@localhost:3306/qfwq_db'
  },

  // Redis 配置
  redis: {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    db: parseInt(process.env.REDIS_DB, 10) || 0
  },

  // JWT 配置
  jwt: {
    secret: process.env.JWT_SECRET || 'default_jwt_secret_change_in_production',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_change_in_production',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  },

  // 微信小程序配置
  wechat: {
    appId: process.env.WX_APPID || '',
    secret: process.env.WX_SECRET || '',
    code2SessionUrl: 'https://api.weixin.qq.com/sns/jscode2session',
    accessTokenUrl: 'https://api.weixin.qq.com/cgi-bin/token'
  },

  // 腾讯云 COS 配置
  cos: {
    secretId: process.env.COS_SECRET_ID || '',
    secretKey: process.env.COS_SECRET_KEY || '',
    bucket: process.env.COS_BUCKET || '',
    region: process.env.COS_REGION || 'ap-guangzhou'
  },

  // VPP SDK 配置
  vpp: {
    appId: process.env.VPP_SDK_APPID || ''
  },

  // 日志配置
  log: {
    level: process.env.LOG_LEVEL || 'info'
  },

  // 加密配置
  crypto: {
    secretKey: process.env.CRYPTO_SECRET_KEY || 'default_32_char_aes_key_change',
    iv: process.env.CRYPTO_IV || 'default_16_char_iv'
  },

  // 上传配置
  upload: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.pdf'],
    uploadDir: 'uploads/'
  },

  // 限流配置
  rateLimit: {
    general: { windowMs: 15 * 60 * 1000, max: 100 },   // 100次/15分钟
    auth: { windowMs: 15 * 60 * 1000, max: 10 },        // 10次/15分钟
    upload: { windowMs: 15 * 60 * 1000, max: 20 }       // 20次/15分钟
  }
};

module.exports = config;
