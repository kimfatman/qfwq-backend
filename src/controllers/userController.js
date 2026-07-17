/**
 * 用户控制器 - 企服外勤代办宝
 * 获取用户信息、更新用户信息、用户订单统计
 */
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/response');
const { prisma } = require('../config/database');
const { decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * 获取当前用户信息
 * GET /user/info
 */
const getUserInfo = asyncHandler(async (req, res) => {
  const userId = BigInt(req.user.userId);

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      runner: {
        select: {
          id: true,
          realName: true,
          rating: true,
          totalOrders: true,
          verified: true,
          status: true
        }
      }
    }
  });

  if (!user) {
    return error(res, '用户不存在', 404, 404);
  }

  const userInfo = {
    id: user.id.toString(),
    openid: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone ? decrypt(user.phone) : '',
    companyName: user.companyName,
    role: user.role,
    status: user.status,
    runner: user.runner ? {
      ...user.runner,
      id: user.runner.id.toString()
    } : null,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };

  return success(res, userInfo, '查询成功');
});

/**
 * 更新用户信息
 * PUT /user/info
 * 参数: { nickname, avatarUrl, companyName }
 */
const updateUserInfo = asyncHandler(async (req, res) => {
  const userId = BigInt(req.user.userId);
  const { nickname, avatarUrl, companyName } = req.body;

  // 构建更新数据（只更新有值的字段）
  const updateData = {};
  if (nickname !== undefined) updateData.nickname = nickname;
  if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;
  if (companyName !== undefined) updateData.companyName = companyName;

  if (Object.keys(updateData).length === 0) {
    return error(res, '没有需要更新的字段', 422, 422);
  }

  const user = await prisma.user.update({
    where: { id: userId },
    data: updateData
  });

  const userInfo = {
    id: user.id.toString(),
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    companyName: user.companyName,
    role: user.role
  };

  logger.info('用户信息更新成功', { userId: userId.toString(), fields: Object.keys(updateData) });

  return success(res, userInfo, '更新成功');
});

/**
 * 获取用户订单统计
 * GET /user/stats
 * 统计用户各状态的订单数量
 */
const getUserStats = asyncHandler(async (req, res) => {
  const userId = BigInt(req.user.userId);

  // 按 status 分组统计订单数
  const statusCounts = await prisma.order.groupBy({
    by: ['status'],
    where: { userId },
    _count: { status: true }
  });

  // 整理统计数据
  const stats = {
    pendingCount: 0,
    processingCount: 0,
    completedCount: 0,
    totalSaved: 0
  };

  for (const item of statusCounts) {
    switch (item.status) {
      case 'pending':
      case 'quoted':
        stats.pendingCount += item._count.status;
        break;
      case 'assigned':
      case 'in_progress':
        stats.processingCount += item._count.status;
        break;
      case 'completed':
        stats.completedCount += item._count.status;
        break;
      // cancelled 不计入任何统计
    }
  }

  // 计算总节省金额：已完成订单的报价金额与最终成交价之差（简化计算）
  // 此处统计已完成订单中选择报价的总价
  const completedOrders = await prisma.order.findMany({
    where: { userId, status: 'completed', selectedQuoteId: { not: null } },
    include: {
      quotes: {
        where: { selected: true },
        select: { price: true }
      }
    }
  });

  // totalSaved 可根据实际业务逻辑计算，此处统计已完成订单总金额
  let totalAmount = 0;
  for (const order of completedOrders) {
    if (order.quotes.length > 0) {
      totalAmount += Number(order.quotes[0].price);
    }
  }
  stats.totalSaved = totalAmount;

  return success(res, stats, '查询成功');
});

module.exports = {
  getUserInfo,
  updateUserInfo,
  getUserStats
};
