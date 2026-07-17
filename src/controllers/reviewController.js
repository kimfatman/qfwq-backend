/**
 * 评价控制器 - 企服外勤代办宝
 * 创建评价（需鉴权）+ 获取最新评价（无需鉴权）
 */
const { prisma } = require('../config/database');
const { success, error, successWithPaginate } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * 创建评价
 * POST /review/create
 * 需鉴权。参数 {orderId, rating, content, images}
 * 校验：订单必须已完成+属于当前用户+未评价过
 * 创建评价后更新 runners 表的 rating（计算新平均分）
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { orderId, rating, content, images } = req.body;

  // 参数校验
  if (!orderId || !rating) {
    return error(res, '缺少必填参数（orderId, rating）', 400, 400);
  }

  const ratingNum = Number(rating);
  if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
    return error(res, '评分必须在1-5之间', 400, 400);
  }

  try {
    // 校验订单：必须属于当前用户
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId)
      },
      include: {
        review: true
      }
    });

    if (!order) {
      return error(res, '订单不存在或无权操作', 404, 404);
    }

    // 校验订单状态：必须已完成
    if (order.status !== 'completed') {
      return error(res, '订单未完成，无法评价', 400, 400);
    }

    // 校验是否已评价
    if (order.review) {
      return error(res, '该订单已评价过', 400, 400);
    }

    // 校验订单必须有分配的外勤
    if (!order.assignedRunnerId) {
      return error(res, '该订单未分配外勤，无法评价', 400, 400);
    }

    // 创建评价 + 更新外勤评分（事务）
    const review = await prisma.$transaction(async (tx) => {
      // 创建评价
      const newReview = await tx.review.create({
        data: {
          orderId: BigInt(orderId),
          userId: BigInt(userId),
          runnerId: order.assignedRunnerId,
          serviceName: order.serviceName,
          rating: ratingNum,
          content: content || '',
          images: images || []
        }
      });

      // 计算外勤新的平均评分
      const stats = await tx.review.aggregate({
        where: { runnerId: order.assignedRunnerId },
        _avg: { rating: true },
        _count: { id: true }
      });

      // 更新外勤评分
      if (stats._avg.rating !== null) {
        await tx.runner.update({
          where: { id: order.assignedRunnerId },
          data: {
            rating: Math.round(stats._avg.rating * 10) / 10
          }
        });
      }

      return newReview;
    });

    logger.info('创建评价成功', { userId, orderId, rating: ratingNum });
    return success(res, review, '评价成功');
  } catch (err) {
    logger.error('创建评价失败', { error: err.message, userId, orderId });
    return error(res, '创建评价失败', 500);
  }
});

/**
 * 获取最新评价列表
 * GET /review/latest
 * 无需鉴权。分页返回最新评价，关联用户信息
 * 参数 page/pageSize
 */
const getLatest = asyncHandler(async (req, res) => {
  const { page = 1, pageSize = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

  try {
    const [list, total] = await Promise.all([
      prisma.review.findMany({
        where: { status: 1 },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true
            }
          },
          runner: {
            select: {
              id: true,
              realName: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum
      }),
      prisma.review.count({ where: { status: 1 } })
    ]);

    return successWithPaginate(res, list, total, pageNum, pageSizeNum, '获取最新评价成功');
  } catch (err) {
    logger.error('获取最新评价失败', { error: err.message });
    return error(res, '获取最新评价失败', 500);
  }
});

module.exports = {
  create,
  getLatest
};
