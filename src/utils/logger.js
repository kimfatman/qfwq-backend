/**
 * 日志工具 - 企服外勤代办宝
 * 基于 Winston，支持 console + file 输出，JSON 格式，按天分文件
 */
const winston = require('winston');
const path = require('path');
const config = require('../config/index');

const { combine, timestamp, printf, colorize, json } = winston.format;

// 自定义日志格式
const customFormat = printf(({ level, message, timestamp: ts, ...meta }) => {
  const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
  return `${ts} [${level}]: ${message} ${metaStr}`;
});

// 日志目录
const logDir = path.resolve(process.cwd(), 'logs');

// 创建 Winston Logger
const logger = winston.createLogger({
  level: config.log.level,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    json()
  ),
  defaultMeta: { service: 'qfwq-backend' },
  transports: [
    // 按天分文件 - 所有日志
    new winston.transports.File({
      filename: path.join(logDir, 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxsize: 20 * 1024 * 1024, // 20MB
      maxFiles: 30, // 保留30天
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      )
    }),
    // 错误日志单独文件
    new winston.transports.File({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxsize: 20 * 1024 * 1024,
      maxFiles: 30,
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        json()
      )
    })
  ]
});

// 开发环境增加 console 输出（带颜色）
if (config.app.isDev) {
  logger.add(
    new winston.transports.Console({
      format: combine(
        colorize(),
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      )
    })
  );
}

// 生产环境简洁 console 输出
if (config.app.isProd) {
  logger.add(
    new winston.transports.Console({
      format: combine(
        timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        customFormat
      ),
      level: 'info'
    })
  );
}

module.exports = logger;
