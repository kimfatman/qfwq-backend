/**
 * Admin 仪表盘控制器
 * 统计概览数据
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// 仪表盘统计
exports.getDashboard = async (req, res) => {
  try {
    const [
      totalUsers,
      totalRunners,
      totalOrders,
      totalServices,
      pendingRunners,
      pendingOrders,
      inProgressOrders,
      completedOrders,
      cancelledOrders,
      todayOrders,
      totalRevenue,
      recentOrders,
      recentReviews,
    ] = await Promise.all([
      prisma.user.count({ where: { role: 'user' } }),
      prisma.runner.count(),
      prisma.order.count(),
      prisma.service.count({ where: { status: 1 } }),
      prisma.runner.count({ where: { status: 2 } }),
      prisma.order.count({ where: { status: 'pending' } }),
      prisma.order.count({ where: { status: 'assigned' } }),
      prisma.order.count({ where: { status: 'completed' } }),
      prisma.order.count({ where: { status: 'cancelled' } }),
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().setHours(0, 0, 0, 0)),
          },
        },
      }),
      prisma.order.aggregate({
        where: { status: 'completed' },
        _sum: { quoteCount: true },
      }),
      prisma.order.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true, phone: true } },
          service: { select: { name: true, categoryName: true } },
        },
      }),
      prisma.review.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true } },
          runner: { select: { realName: true } },
        },
      }),
    ]);

    // 最近7天订单趋势
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const count = await prisma.order.count({
        where: {
          createdAt: { gte: date, lt: nextDate },
        },
      });

      last7Days.push({
        date: `${date.getMonth() + 1}/${date.getDate()}`,
        count,
      });
    }

    // 服务分类分布
    const categoryStats = await prisma.service.groupBy({
      by: ['categoryName'],
      _count: { id: true },
      where: { status: 1 },
    });

    res.json({
      code: 200,
      message: '获取仪表盘数据成功',
      data: {
        overview: {
          totalUsers,
          totalRunners,
          totalOrders,
          totalServices,
          pendingRunners,
          pendingOrders,
          inProgressOrders,
          completedOrders,
          cancelledOrders,
          todayOrders,
        },
        orderTrend: last7Days,
        categoryStats: categoryStats.map((c) => ({
          name: c.categoryName,
          count: c._count.id,
        })),
        recentOrders: recentOrders.map((o) => ({
          id: o.id.toString(),
          orderNo: o.orderNo,
          serviceName: o.serviceName,
          category: o.service?.categoryName || '',
          userName: o.user?.nickname || '',
          status: o.status,
          createdAt: o.createdAt,
        })),
        recentReviews: recentReviews.map((r) => ({
          id: r.id.toString(),
          userName: r.user?.nickname || '',
          runnerName: r.runner?.realName || '',
          serviceName: r.serviceName,
          rating: r.rating,
          content: r.content?.slice(0, 50),
          createdAt: r.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error('获取仪表盘数据失败:', error);
    res.status(500).json({ code: 500, message: '获取仪表盘数据失败' });
  }
};
