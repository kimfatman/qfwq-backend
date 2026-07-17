/**
 * Prisma 客户端单例 - 企服外勤代办宝
 * 避免在开发模式下热重载创建多个连接
 */
const { PrismaClient } = require('@prisma/client');
const config = require('./index');

// 全局缓存 PrismaClient 实例
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: config.app.isDev
      ? ['query', 'error', 'warn']
      : ['error'],
    errorFormat: 'pretty'
  });

if (config.app.isDev) {
  globalForPrisma.prisma = prisma;
}

/**
 * 测试数据库连接
 */
async function testConnection() {
  try {
    await prisma.$queryRaw`SELECT 1 AS test`;
    console.log('✅ 数据库连接成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    return false;
  }
}

/**
 * 优雅断开连接
 */
async function disconnect() {
  await prisma.$disconnect();
  console.log('📤 数据库连接已断开');
}

module.exports = { prisma, testConnection, disconnect };
