/**
 * 通用控制器 - 企服外勤代办宝
 * Banner、客服配置、协议、反馈、系统配置
 */
const { prisma } = require('../config/database');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const redis = require('../config/redis');

// 缓存key前缀
const CACHE_PREFIX = 'cache:common';

/**
 * 获取Banner列表
 * GET /common/banners
 * 无需鉴权。查询 status=1，当前时间在展示期内，按 sortOrder 排序
 * Redis缓存30分钟
 */
const getBanners = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_PREFIX}:banners`;

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return success(res, cached, '获取Banner列表成功');
  }

  try {
    const now = new Date();

    const list = await prisma.banner.findMany({
      where: {
        status: 1,
        OR: [
          { startTime: null, endTime: null },
          { startTime: { lte: now }, endTime: { gte: now } },
          { startTime: null, endTime: { gte: now } },
          { startTime: { lte: now }, endTime: null }
        ]
      },
      orderBy: { sortOrder: 'asc' }
    });

    // 缓存30分钟
    await redis.set(cacheKey, list, 1800);

    return success(res, list, '获取Banner列表成功');
  } catch (err) {
    logger.error('获取Banner列表失败', { error: err.message });
    return error(res, '获取Banner列表失败', 500);
  }
});

/**
 * 获取客服配置
 * GET /common/chat-config
 * 需鉴权。从 system_config 读取 customer_service_url
 */
const getChatConfig = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_PREFIX}:chat_config`;

  try {
    // 尝试从缓存获取
    const cached = await redis.get(cacheKey);
    if (cached) {
      return success(res, cached, '获取客服配置成功');
    }

    const config = await prisma.systemConfig.findUnique({
      where: { key: 'customer_service_url' }
    });

    const result = {
      url: config ? config.value : '',
      online: true // 默认在线，后续可接入实际状态
    };

    // 缓存1小时
    await redis.set(cacheKey, result, 3600);

    return success(res, result, '获取客服配置成功');
  } catch (err) {
    logger.error('获取客服配置失败', { error: err.message });
    return error(res, '获取客服配置失败', 500);
  }
});

/**
 * 获取协议内容
 * GET /common/agreement/:type
 * 无需鉴权。查询 agreements 表按 type
 */
const getAgreement = asyncHandler(async (req, res) => {
  const { type } = req.params;

  if (!type) {
    return error(res, '缺少协议类型参数', 400, 400);
  }

  const cacheKey = `${CACHE_PREFIX}:agreement:${type}`;

  try {
    // 尝试从缓存获取
    const cached = await redis.get(cacheKey);
    if (cached) {
      return success(res, cached, '获取协议内容成功');
    }

    const agreement = await prisma.agreement.findUnique({
      where: { type }
    });

    if (!agreement) {
      return error(res, '协议不存在', 404, 404);
    }

    const result = {
      id: agreement.id,
      type: agreement.type,
      title: agreement.title,
      content: agreement.content,
      version: agreement.version
    };

    // 缓存1小时（协议内容变更不频繁）
    await redis.set(cacheKey, result, 3600);

    return success(res, result, '获取协议内容成功');
  } catch (err) {
    logger.error('获取协议内容失败', { error: err.message, type });
    return error(res, '获取协议内容失败', 500);
  }
});

/**
 * 提交意见反馈
 * POST /common/feedback
 * 需鉴权。参数 {content, images, contact}
 * 目前写入日志 + Redis队列，后续建表
 */
const submitFeedback = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { content, images, contact } = req.body;

  if (!content || content.trim() === '') {
    return error(res, '反馈内容不能为空', 400, 400);
  }

  try {
    const feedback = {
      userId,
      content: content.trim(),
      images: images || [],
      contact: contact || '',
      createdAt: new Date().toISOString()
    };

    // 写入日志
    logger.info('收到用户反馈', feedback);

    // 写入Redis队列（后续消费者落库）
    await redis.set(
      `queue:feedback:${userId}:${Date.now()}`,
      feedback,
      86400 // 24小时过期，消费者需在此之前处理
    );

    return success(res, null, '反馈提交成功，感谢您的建议');
  } catch (err) {
    logger.error('提交反馈失败', { error: err.message, userId });
    return error(res, '提交反馈失败', 500);
  }
});

/**
 * 获取公开系统配置
 * GET /common/config
 * 无需鉴权。返回 app_name, city, version 等公开配置
 * Redis缓存1小时
 */
const getConfig = asyncHandler(async (req, res) => {
  const cacheKey = `${CACHE_PREFIX}:config`;

  // 尝试从缓存获取
  const cached = await redis.get(cacheKey);
  if (cached) {
    return success(res, cached, '获取系统配置成功');
  }

  try {
    // 从 system_config 表读取公开配置
    const publicKeys = ['app_name', 'city', 'version', 'service_phone', 'icp'];
    const configs = await prisma.systemConfig.findMany({
      where: {
        key: { in: publicKeys }
      }
    });

    // 转换为 key-value 对象
    const result = {};
    for (const c of configs) {
      result[c.key] = c.value;
    }

    // 补充默认值
    const defaultConfig = {
      app_name: result.app_name || '企服外勤代办宝',
      city: result.city || '全国',
      version: result.version || '1.0.0',
      service_phone: result.service_phone || '',
      icp: result.icp || ''
    };

    // 缓存1小时
    await redis.set(cacheKey, defaultConfig, 3600);

    return success(res, defaultConfig, '获取系统配置成功');
  } catch (err) {
    logger.error('获取系统配置失败', { error: err.message });
    return error(res, '获取系统配置失败', 500);
  }
});

module.exports = {
  getBanners,
  getChatConfig,
  getAgreement,
  submitFeedback,
  getConfig
};
