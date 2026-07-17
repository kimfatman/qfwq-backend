/**
 * 报价业务逻辑 - 企服外勤代办宝
 * 报价列表、详情、选择报价、报价统计
 */
const { prisma } = require('../config/database');
const logger = require('../utils/logger');

/**
 * 获取订单的报价列表
 * 关联查询 runner 信息
 * @param {string} orderId - 订单ID
 * @returns {Array} 报价列表
 */
async function getQuoteList(orderId) {
  const quotes = await prisma.quote.findMany({
    where: { orderId: BigInt(orderId) },
    orderBy: [
      { selected: 'desc' },
      { createdAt: 'desc' }
    ],
    include: {
      runner: {
        select: {
          id: true,
          realName: true,
          avatarUrl: true,
          rating: true,
          totalOrders: true,
          completionRate: true,
          avgResponseTime: true,
          verified: true
        }
      }
    }
  });

  return quotes.map(q => ({
    id: q.id.toString(),
    orderId: q.orderId.toString(),
    runnerId: q.runnerId.toString(),
    price: Number(q.price),
    timeEstimate: q.timeEstimate,
    description: q.description,
    runnerIntro: q.runnerIntro,
    status: q.status,
    selected: q.selected,
    createdAt: q.createdAt,
    updatedAt: q.updatedAt,
    runner: q.runner ? {
      ...q.runner,
      id: q.runner.id.toString(),
      rating: Number(q.runner.rating),
      completionRate: Number(q.runner.completionRate)
    } : null
  }));
}

/**
 * 获取报价详情
 * 关联查询 runner + order
 * @param {string} quoteId - 报价ID
 * @returns {object} 报价详情
 */
async function getQuoteDetail(quoteId) {
  const quote = await prisma.quote.findUnique({
    where: { id: BigInt(quoteId) },
    include: {
      runner: {
        select: {
          id: true,
          realName: true,
          avatarUrl: true,
          rating: true,
          totalOrders: true,
          completionRate: true,
          avgResponseTime: true,
          verified: true,
          description: true,
          serviceAreas: true,
          serviceCategories: true
        }
      },
      order: {
        select: {
          id: true,
          orderNo: true,
          title: true,
          status: true,
          serviceName: true
        }
      }
    }
  });

  if (!quote) {
    throw new Error('报价不存在');
  }

  return {
    id: quote.id.toString(),
    orderId: quote.orderId.toString(),
    runnerId: quote.runnerId.toString(),
    price: Number(quote.price),
    timeEstimate: quote.timeEstimate,
    description: quote.description,
    runnerIntro: quote.runnerIntro,
    status: quote.status,
    selected: quote.selected,
    createdAt: quote.createdAt,
    updatedAt: quote.updatedAt,
    runner: quote.runner ? {
      ...quote.runner,
      id: quote.runner.id.toString(),
      rating: Number(quote.runner.rating),
      completionRate: Number(quote.runner.completionRate)
    } : null,
    order: quote.order ? {
      ...quote.order,
      id: quote.order.id.toString()
    } : null
  };
}

/**
 * 选择报价
 * 验证归属 → 更新报价状态 → 更新订单 → 拒绝其他报价 → 写入进度
 * @param {string} userId - 用户ID
 * @param {string} quoteId - 报价ID
 * @returns {object} 更新后的报价
 */
async function selectQuote(userId, quoteId) {
  // 1. 查询报价及其关联订单
  const quote = await prisma.quote.findUnique({
    where: { id: BigInt(quoteId) },
    include: {
      order: {
        select: { id: true, userId: true, status: true, orderNo: true }
      }
    }
  });

  if (!quote) {
    throw new Error('报价不存在');
  }

  // 2. 验证报价属于该用户的订单
  if (quote.order.userId.toString() !== userId) {
    throw new Error('无权操作此报价');
  }

  // 3. 校验订单状态（只有 pending/quoted 状态可选择报价）
  const allowedStatuses = ['pending', 'quoted'];
  if (!allowedStatuses.includes(quote.order.status)) {
    throw new Error(`订单状态为${quote.order.status}，无法选择报价`);
  }

  // 4. 校验报价状态（只能选择 pending 状态的报价）
  if (quote.status !== 'pending') {
    throw new Error('该报价已被处理，无法选择');
  }

  // 5. 使用事务更新数据
  const result = await prisma.$transaction(async (tx) => {
    // 5a. 更新当前报价为已接受
    const updatedQuote = await tx.quote.update({
      where: { id: quote.id },
      data: {
        status: 'accepted',
        selected: true
      }
    });

    // 5b. 更新订单：指派外勤 + 状态变更为 assigned
    const updatedOrder = await tx.order.update({
      where: { id: quote.order.id },
      data: {
        assignedRunnerId: quote.runnerId,
        status: 'assigned',
        selectedQuoteId: quote.id
      }
    });

    // 5c. 将该订单下其他报价设为已拒绝
    await tx.quote.updateMany({
      where: {
        orderId: quote.orderId,
        id: { not: quote.id },
        status: 'pending'
      },
      data: { status: 'rejected' }
    });

    return { updatedQuote, updatedOrder };
  });

  // 6. 写入订单进度
  await prisma.orderProgress.create({
    data: {
      orderId: quote.orderId,
      action: 'assigned',
      title: '已选择外勤',
      description: `已选择外勤报价，等待外勤确认`,
      operatorType: 'user',
      operatorId: BigInt(userId)
    }
  });

  // 7. 通知外勤（预留）
  // TODO: notifyRunner(quote.runnerId, 'quote_selected')

  logger.info('报价选择成功', { quoteId, orderId: quote.orderId.toString(), runnerId: quote.runnerId.toString(), userId });

  return {
    id: result.updatedQuote.id.toString(),
    orderId: result.updatedQuote.orderId.toString(),
    runnerId: result.updatedQuote.runnerId.toString(),
    price: Number(result.updatedQuote.price),
    timeEstimate: result.updatedQuote.timeEstimate,
    description: result.updatedQuote.description,
    runnerIntro: result.updatedQuote.runnerIntro,
    status: result.updatedQuote.status,
    selected: result.updatedQuote.selected,
    createdAt: result.updatedQuote.createdAt,
    updatedAt: result.updatedQuote.updatedAt,
    order: {
      id: result.updatedOrder.id.toString(),
      status: result.updatedOrder.status,
      assignedRunnerId: result.updatedOrder.assignedRunnerId ? result.updatedOrder.assignedRunnerId.toString() : null
    }
  };
}

/**
 * 获取报价统计
 * COUNT + AVG/MIN/MAX price
 * @param {string} orderId - 订单ID
 * @returns {object} 报价统计
 */
async function getQuoteStats(orderId) {
  // 校验订单存在
  const order = await prisma.order.findUnique({
    where: { id: BigInt(orderId) },
    select: { id: true, status: true }
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  // 统计报价数量
  const count = await prisma.quote.count({
    where: { orderId: BigInt(orderId) }
  });

  // 聚合统计
  let stats = {
    count: 0,
    avgPrice: 0,
    minPrice: 0,
    maxPrice: 0
  };

  if (count > 0) {
    const aggregate = await prisma.quote.aggregate({
      where: { orderId: BigInt(orderId) },
      _avg: { price: true },
      _min: { price: true },
      _max: { price: true },
      _count: { id: true }
    });

    stats = {
      count: aggregate._count.id,
      avgPrice: aggregate._avg.price ? Number(aggregate._avg.price) : 0,
      minPrice: aggregate._min.price ? Number(aggregate._min.price) : 0,
      maxPrice: aggregate._max.price ? Number(aggregate._max.price) : 0
    };
  }

  return stats;
}

module.exports = {
  getQuoteList,
  getQuoteDetail,
  selectQuote,
  getQuoteStats
};
