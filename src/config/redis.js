/**
 * Redis 连接管理 - 企服外勤代办宝
 * 使用 ioredis 提供连接实例和快捷操作方法
 */
const Redis = require('ioredis');
const config = require('./index');

// 创建 Redis 客户端实例
const redis = new Redis({
  host: config.redis.host,
  port: config.redis.port,
  password: config.redis.password,
  db: config.redis.db,
  retryStrategy(times) {
    const delay = Math.min(times * 200, 5000); // 最大重试间隔5秒
    if (times > 10) {
      console.warn('⚠️ Redis 重试次数超过10次，请检查连接配置');
    }
    return delay;
  },
  maxRetriesPerRequest: 3,
  enableReadyCheck: true,
  lazyConnect: false
});

// 连接事件
redis.on('connect', () => {
  console.log('✅ Redis 连接成功');
});

redis.on('error', (err) => {
  console.error('❌ Redis 连接错误:', err.message);
});

redis.on('reconnecting', () => {
  console.log('🔄 Redis 正在重连...');
});

/**
 * 测试 Redis 连接
 */
async function testConnection() {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      console.log('✅ Redis 连接测试成功');
      return true;
    }
    return false;
  } catch (error) {
    console.error('❌ Redis 连接测试失败:', error.message);
    return false;
  }
}

/**
 * 获取缓存值（自动 JSON 解析）
 * @param {string} key - 缓存键
 * @returns {any} 解析后的值，不存在返回 null
 */
async function get(key) {
  const value = await redis.get(key);
  if (value === null) return null;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

/**
 * 设置缓存值（自动 JSON 序列化）
 * @param {string} key - 缓存键
 * @param {any} value - 缓存值
 * @param {number|string} expire - 过期时间（秒），或 EX 格式字符串
 */
async function set(key, value, expire) {
  const serialized = JSON.stringify(value);
  if (expire) {
    const seconds = typeof expire === 'string' ? parseInt(expire, 10) : expire;
    return redis.set(key, serialized, 'EX', seconds);
  }
  return redis.set(key, serialized);
}

/**
 * 删除缓存
 * @param {string|Array<string>} keys - 缓存键或键数组
 */
async function del(keys) {
  if (Array.isArray(keys)) {
    return redis.del(...keys);
  }
  return redis.del(keys);
}

/**
 * 优雅断开连接
 */
async function disconnect() {
  await redis.quit();
  console.log('📤 Redis 连接已断开');
}

module.exports = {
  redis,
  testConnection,
  get,
  set,
  del,
  disconnect
};
