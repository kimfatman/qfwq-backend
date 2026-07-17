/**
 * 外勤控制器 - 企服外勤代办宝
 * 外勤详情、评价列表、虚拟号码，全部需鉴权
 */
const { prisma } = require('../config/database');
const { success, error, successWithPaginate } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');
const config = require('../config/index');

/**
 * 获取外勤详情
 * GET /runner/detail/:id
 * 返回外勤信息：关联 user 表获取头像昵称，包含统计
 */
const getDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const runner = await prisma.runner.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      },
      include: {
        user: {
          select: {
            id: true,
            nickname: true,
            avatarUrl: true
          }
        }
      }
    });

    if (!runner) {
      return error(res, '外勤不存在', 404, 404);
    }

    // 构建返回数据（隐藏敏感信息）
    const result = {
      id: runner.id,
      realName: runner.realName,
      avatarUrl: runner.avatarUrl || runner.user.avatarUrl,
      nickname: runner.user.nickname,
      description: runner.description,
      serviceAreas: runner.serviceAreas,
      serviceCategories: runner.serviceCategories,
      rating: runner.rating,
      totalOrders: runner.totalOrders,
      completionRate: runner.completionRate,
      avgResponseTime: runner.avgResponseTime,
      verified: runner.verified
    };

    return success(res, result, '获取外勤详情成功');
  } catch (err) {
    logger.error('获取外勤详情失败', { error: err.message, runnerId: id });
    return error(res, '获取外勤详情失败', 500);
  }
});

/**
 * 获取外勤的评价列表
 * GET /runner/reviews/:id
 * 分页返回外勤的评价列表，关联用户信息
 */
const getReviews = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { page = 1, pageSize = 20 } = req.query;

  const pageNum = Math.max(1, parseInt(page, 10));
  const pageSizeNum = Math.min(100, Math.max(1, parseInt(pageSize, 10)));

  try {
    // 校验外勤是否存在
    const runner = await prisma.runner.findFirst({
      where: {
        id: BigInt(id),
        status: 1
      },
      select: { id: true }
    });

    if (!runner) {
      return error(res, '外勤不存在', 404, 404);
    }

    const [list, total] = await Promise.all([
      prisma.review.findMany({
        where: {
          runnerId: BigInt(id),
          status: 1
        },
        include: {
          user: {
            select: {
              id: true,
              nickname: true,
              avatarUrl: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip: (pageNum - 1) * pageSizeNum,
        take: pageSizeNum
      }),
      prisma.review.count({
        where: {
          runnerId: BigInt(id),
          status: 1
        }
      })
    ]);

    return successWithPaginate(res, list, total, pageNum, pageSizeNum, '获取评价列表成功');
  } catch (err) {
    logger.error('获取外勤评价列表失败', { error: err.message, runnerId: id });
    return error(res, '获取外勤评价列表失败', 500);
  }
});

/**
 * 获取虚拟号码
 * GET /runner/virtual-phone/:orderId
 * 查订单关联的外勤 → 调用腾讯云虚拟号API获取临时号码
 * 预留接口，失败时返回外勤真实号码作为降级
 */
const getVirtualPhone = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { orderId } = req.params;

  try {
    // 查询订单及关联外勤
    const order = await prisma.order.findFirst({
      where: {
        id: BigInt(orderId),
        userId: BigInt(userId)
      },
      include: {
        assignedRunner: {
          include: {
            user: {
              select: {
                id: true,
                phone: true
              }
            }
          }
        }
      }
    });

    if (!order) {
      return error(res, '订单不存在或无权操作', 404, 404);
    }

    if (!order.assignedRunner) {
      return error(res, '该订单尚未分配外勤', 400, 400);
    }

    // 尝试获取虚拟号码
    let virtualPhone = null;
    let phoneType = 'real'; // 标记号码类型

    // TODO: 对接腾讯云虚拟号API
    // if (config.vpp.appId) {
    //   try {
    //     const axios = require('axios');
    //     // 调用腾讯云虚拟号码保护API
    //     // 文档：https://cloud.tencent.com/document/product/655/31957
    //     const result = await axios.post('https://cloud.tencent.com/api/vpp/bind', {
    //       appId: config.vpp.appId,
    //       caller: order.contactPhone,  // 主叫号码（企业联系人）
    //       callee: order.assignedRunner.phone,  // 被叫号码（外勤）
    //       // ... 其他参数
    //     });
    //     if (result.data.code === 0) {
    //       virtualPhone = result.data.virtualNumber;
    //       phoneType = 'virtual';
    //     }
    //   } catch (vppErr) {
    //     logger.warn('获取虚拟号码失败，降级为真实号码', { error: vppErr.message, orderId });
    //   }
    // }

    // 降级：返回外勤真实号码
    const phone = virtualPhone || order.assignedRunner.phone;

    logger.info('获取联系号码', {
      orderId,
      phoneType,
      userId
    });

    return success(res, {
      phone,
      phoneType,
      tip: phoneType === 'real'
        ? '为保护隐私，建议通过平台沟通'
        : '虚拟号码有时效限制，请尽快联系'
    }, '获取联系号码成功');
  } catch (err) {
    logger.error('获取虚拟号码失败', { error: err.message, orderId, userId });
    return error(res, '获取联系号码失败', 500);
  }
});

module.exports = {
  getDetail,
  getReviews,
  getVirtualPhone
};
