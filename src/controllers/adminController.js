/**
 * Admin 通用管理控制器
 * 服务/Banner/用户/外勤/订单/评价/配置/协议 的增删改查
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// ==================== 服务管理 ====================

exports.getServiceList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, category, status, keyword } = req.query;
    const where = {};
    if (category) where.category = category;
    if (status !== undefined && status !== '') where.status = Number(status);
    if (keyword) where.name = { contains: keyword };

    const [total, list] = await Promise.all([
      prisma.service.count({ where }),
      prisma.service.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { sortOrder: 'asc' },
      }),
    ]);

    res.json({
      code: 200, message: '获取服务列表成功',
      data: { list, total, page: Number(page), pageSize: Number(pageSize), totalPages: Math.ceil(total / Number(pageSize)) },
    });
  } catch (error) {
    console.error('获取服务列表失败:', error);
    res.status(500).json({ code: 500, message: '获取服务列表失败' });
  }
};

exports.createService = async (req, res) => {
  try {
    const data = req.body;
    const service = await prisma.service.create({
      data: {
        name: data.name,
        category: data.category,
        categoryName: data.categoryName,
        description: data.description || '',
        icon: data.icon || '',
        imageUrl: data.imageUrl || '',
        basePrice: data.basePrice || 0,
        timeDesc: data.timeDesc || '',
        region: data.region || '武汉',
        isHot: data.isHot || false,
        sortOrder: data.sortOrder || 0,
        status: data.status ?? 1,
        detail: data.detail ? JSON.stringify(data.detail) : '{}',
        process: data.process ? JSON.stringify(data.process) : '[]',
        materials: data.materials ? JSON.stringify(data.materials) : '[]',
        faq: data.faq ? JSON.stringify(data.faq) : '[]',
      },
    });
    res.json({ code: 200, message: '创建服务成功', data: service });
  } catch (error) {
    console.error('创建服务失败:', error);
    res.status(500).json({ code: 500, message: '创建服务失败' });
  }
};

exports.updateService = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const updateData = {};

    const allowedFields = ['name','category','categoryName','description','icon','imageUrl','basePrice','timeDesc','region','isHot','sortOrder','status','detail','process','materials','faq'];
    for (const field of allowedFields) {
      if (data[field] !== undefined) {
        if (['detail','process','materials','faq'].includes(field)) {
          updateData[field] = typeof data[field] === 'string' ? data[field] : JSON.stringify(data[field]);
        } else {
          updateData[field] = data[field];
        }
      }
    }

    const service = await prisma.service.update({ where: { id: BigInt(id) }, data: updateData });
    res.json({ code: 200, message: '更新服务成功', data: service });
  } catch (error) {
    console.error('更新服务失败:', error);
    res.status(500).json({ code: 500, message: '更新服务失败' });
  }
};

exports.deleteService = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.service.delete({ where: { id: BigInt(id) } });
    res.json({ code: 200, message: '删除服务成功' });
  } catch (error) {
    console.error('删除服务失败:', error);
    res.status(500).json({ code: 500, message: '删除服务失败' });
  }
};

exports.toggleServiceStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await prisma.service.findUnique({ where: { id: BigInt(id) } });
    if (!service) return res.status(404).json({ code: 404, message: '服务不存在' });

    const updated = await prisma.service.update({
      where: { id: BigInt(id) },
      data: { status: service.status === 1 ? 0 : 1 },
    });
    res.json({ code: 200, message: '切换状态成功', data: updated });
  } catch (error) {
    console.error('切换状态失败:', error);
    res.status(500).json({ code: 500, message: '切换状态失败' });
  }
};

// ==================== Banner 管理 ====================

exports.getBannerList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20 } = req.query;
    const where = {};
    const [total, list] = await Promise.all([
      prisma.banner.count({ where }),
      prisma.banner.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { sortOrder: 'asc' },
      }),
    ]);
    res.json({ code: 200, message: '获取Banner列表成功', data: { list, total } });
  } catch (error) {
    console.error('获取Banner列表失败:', error);
    res.status(500).json({ code: 500, message: '获取Banner列表失败' });
  }
};

exports.createBanner = async (req, res) => {
  try {
    const data = req.body;
    const banner = await prisma.banner.create({
      data: {
        title: data.title,
        subtitle: data.subtitle || '',
        imageUrl: data.imageUrl || '',
        gradient: data.gradient || '',
        linkType: data.linkType || '',
        linkValue: data.linkValue || '',
        sortOrder: data.sortOrder || 0,
        status: data.status ?? 1,
      },
    });
    res.json({ code: 200, message: '创建Banner成功', data: banner });
  } catch (error) {
    console.error('创建Banner失败:', error);
    res.status(500).json({ code: 500, message: '创建Banner失败' });
  }
};

exports.updateBanner = async (req, res) => {
  try {
    const { id } = req.params;
    const data = req.body;
    const banner = await prisma.banner.update({ where: { id: BigInt(id) }, data });
    res.json({ code: 200, message: '更新Banner成功', data: banner });
  } catch (error) {
    console.error('更新Banner失败:', error);
    res.status(500).json({ code: 500, message: '更新Banner失败' });
  }
};

exports.deleteBanner = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.banner.delete({ where: { id: BigInt(id) } });
    res.json({ code: 200, message: '删除Banner成功' });
  } catch (error) {
    console.error('删除Banner失败:', error);
    res.status(500).json({ code: 500, message: '删除Banner失败' });
  }
};

// ==================== 用户管理 ====================

exports.getUserList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, keyword, status, role } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = Number(status);
    if (role) where.role = role;
    if (keyword) {
      where.OR = [
        { nickname: { contains: keyword } },
        { phone: { contains: keyword } },
        { companyName: { contains: keyword } },
      ];
    }

    const [total, list] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true, nickname: true, avatarUrl: true, phone: true,
          companyName: true, role: true, status: true, createdAt: true,
          _count: { select: { orders: true } },
        },
      }),
    ]);

    res.json({
      code: 200, message: '获取用户列表成功',
      data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error) {
    console.error('获取用户列表失败:', error);
    res.status(500).json({ code: 500, message: '获取用户列表失败' });
  }
};

exports.toggleUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await prisma.user.findUnique({ where: { id: BigInt(id) } });
    if (!user) return res.status(404).json({ code: 404, message: '用户不存在' });

    const updated = await prisma.user.update({
      where: { id: BigInt(id) },
      data: { status: user.status === 1 ? 0 : 1 },
    });
    res.json({ code: 200, message: '切换状态成功', data: { id: updated.id.toString(), status: updated.status } });
  } catch (error) {
    console.error('切换用户状态失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

// ==================== 外勤管理 ====================

exports.getRunnerList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword, verified } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = Number(status);
    if (verified !== undefined && verified !== '') where.verified = verified === 'true';
    if (keyword) {
      where.OR = [
        { realName: { contains: keyword } },
        { phone: { contains: keyword } },
      ];
    }

    const [total, list] = await Promise.all([
      prisma.runner.count({ where }),
      prisma.runner.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true, avatarUrl: true } },
          _count: { select: { orders: true, reviews: true } },
        },
      }),
    ]);

    res.json({
      code: 200, message: '获取外勤列表成功',
      data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error) {
    console.error('获取外勤列表失败:', error);
    res.status(500).json({ code: 500, message: '获取外勤列表失败' });
  }
};

exports.getRunnerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const runner = await prisma.runner.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { nickname: true, avatarUrl: true, phone: true } },
        reviews: { take: 10, orderBy: { createdAt: 'desc' } },
        _count: { select: { orders: true, quotes: true, reviews: true } },
      },
    });
    if (!runner) return res.status(404).json({ code: 404, message: '外勤不存在' });
    res.json({ code: 200, message: '获取外勤详情成功', data: runner });
  } catch (error) {
    console.error('获取外勤详情失败:', error);
    res.status(500).json({ code: 500, message: '获取外勤详情失败' });
  }
};

// 审核通过
exports.approveRunner = async (req, res) => {
  try {
    const { id } = req.params;
    const runner = await prisma.runner.update({
      where: { id: BigInt(id) },
      data: { status: 1, verified: true },
    });
    res.json({ code: 200, message: '审核通过', data: runner });
  } catch (error) {
    console.error('审核失败:', error);
    res.status(500).json({ code: 500, message: '审核操作失败' });
  }
};

// 审核拒绝
exports.rejectRunner = async (req, res) => {
  try {
    const { id } = req.params;
    const runner = await prisma.runner.update({
      where: { id: BigInt(id) },
      data: { status: 0 },
    });
    res.json({ code: 200, message: '已拒绝', data: runner });
  } catch (error) {
    console.error('拒绝失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

exports.toggleRunnerStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const runner = await prisma.runner.findUnique({ where: { id: BigInt(id) } });
    if (!runner) return res.status(404).json({ code: 404, message: '外勤不存在' });

    const updated = await prisma.runner.update({
      where: { id: BigInt(id) },
      data: { status: runner.status === 1 ? 0 : 1 },
    });
    res.json({ code: 200, message: '切换状态成功', data: updated });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

// ==================== 订单管理 ====================

exports.getOrderList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status, keyword } = req.query;
    const where = {};
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { serviceName: { contains: keyword } },
        { contactName: { contains: keyword } },
      ];
    }

    const [total, list] = await Promise.all([
      prisma.order.count({ where }),
      prisma.order.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true, phone: true } },
          service: { select: { name: true, categoryName: true } },
          assignedRunner: { select: { realName: true, phone: true } },
          quotes: { select: { id: true, price: true, status: true } },
        },
      }),
    ]);

    res.json({
      code: 200, message: '获取订单列表成功',
      data: { list, total, page: Number(page), pageSize: Number(pageSize) },
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({ code: 500, message: '获取订单列表失败' });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await prisma.order.findUnique({
      where: { id: BigInt(id) },
      include: {
        user: { select: { nickname: true, phone: true, companyName: true } },
        service: true,
        assignedRunner: { select: { realName: true, phone: true, avatarUrl: true } },
        quotes: {
          include: { runner: { select: { realName: true, phone: true, rating: true } } },
        },
        progresses: { orderBy: { createdAt: 'desc' } },
        materials: true,
        review: true,
      },
    });
    if (!order) return res.status(404).json({ code: 404, message: '订单不存在' });
    res.json({ code: 200, message: '获取订单详情成功', data: order });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({ code: 500, message: '获取订单详情失败' });
  }
};

// 管理员取消订单
exports.adminCancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const order = await prisma.order.update({
      where: { id: BigInt(id) },
      data: {
        status: 'cancelled',
        cancelledAt: new Date(),
        cancelReason: reason || '管理员操作取消',
      },
    });
    res.json({ code: 200, message: '订单已取消', data: order });
  } catch (error) {
    console.error('取消订单失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

// ==================== 评价管理 ====================

exports.getReviewList = async (req, res) => {
  try {
    const { page = 1, pageSize = 20, status } = req.query;
    const where = {};
    if (status !== undefined && status !== '') where.status = Number(status);

    const [total, list] = await Promise.all([
      prisma.review.count({ where }),
      prisma.review.findMany({
        where,
        skip: (Number(page) - 1) * Number(pageSize),
        take: Number(pageSize),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { nickname: true } },
          runner: { select: { realName: true } },
        },
      }),
    ]);

    res.json({ code: 200, message: '获取评价列表成功', data: { list, total } });
  } catch (error) {
    console.error('获取评价列表失败:', error);
    res.status(500).json({ code: 500, message: '获取评价列表失败' });
  }
};

exports.toggleReviewStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await prisma.review.findUnique({ where: { id: BigInt(id) } });
    if (!review) return res.status(404).json({ code: 404, message: '评价不存在' });

    const updated = await prisma.review.update({
      where: { id: BigInt(id) },
      data: { status: review.status === 1 ? 0 : 1 },
    });
    res.json({ code: 200, message: '切换成功', data: updated });
  } catch (error) {
    console.error('操作失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

exports.replyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;
    const review = await prisma.review.update({
      where: { id: BigInt(id) },
      data: { reply, replyAt: new Date() },
    });
    res.json({ code: 200, message: '回复成功', data: review });
  } catch (error) {
    console.error('回复失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

// ==================== 系统配置 ====================

exports.getConfigList = async (req, res) => {
  try {
    const list = await prisma.systemConfig.findMany({ orderBy: { id: 'asc' } });
    res.json({ code: 200, message: '获取配置列表成功', data: list });
  } catch (error) {
    console.error('获取配置列表失败:', error);
    res.status(500).json({ code: 500, message: '获取配置列表失败' });
  }
};

exports.updateConfig = async (req, res) => {
  try {
    const { key, value } = req.body;
    const config = await prisma.systemConfig.upsert({
      where: { key },
      create: { key, value, description: '' },
      update: { value },
    });
    res.json({ code: 200, message: '更新配置成功', data: config });
  } catch (error) {
    console.error('更新配置失败:', error);
    res.status(500).json({ code: 500, message: '更新配置失败' });
  }
};

exports.batchUpdateConfig = async (req, res) => {
  try {
    const { configs } = req.body;
    if (!Array.isArray(configs)) {
      return res.status(400).json({ code: 400, message: '参数格式错误' });
    }

    for (const { key, value } of configs) {
      await prisma.systemConfig.upsert({
        where: { key },
        create: { key, value, description: '' },
        update: { value },
      });
    }

    res.json({ code: 200, message: '批量更新成功' });
  } catch (error) {
    console.error('批量更新配置失败:', error);
    res.status(500).json({ code: 500, message: '操作失败' });
  }
};

// ==================== 协议管理 ====================

exports.getAgreements = async (req, res) => {
  try {
    const list = await prisma.agreement.findMany({ orderBy: { id: 'asc' } });
    res.json({ code: 200, message: '获取协议列表成功', data: list });
  } catch (error) {
    console.error('获取协议列表失败:', error);
    res.status(500).json({ code: 500, message: '获取协议列表失败' });
  }
};

exports.updateAgreement = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const agreement = await prisma.agreement.update({
      where: { id: BigInt(id) },
      data: { title, content },
    });
    res.json({ code: 200, message: '更新协议成功', data: agreement });
  } catch (error) {
    console.error('更新协议失败:', error);
    res.status(500).json({ code: 500, message: '更新协议失败' });
  }
};

// ==================== 分类列表（给前端下拉框用） ====================

exports.getCategories = async (req, res) => {
  const categories = [
    { value: 'business', label: '工商注册' },
    { value: 'license', label: '资质办理' },
    { value: 'tax', label: '税务服务' },
    { value: 'social', label: '社保公积金' },
    { value: 'bank', label: '银行开户' },
    { value: 'ip', label: '知识产权' },
    { value: 'admin', label: '行政许可' },
    { value: 'other', label: '其他服务' },
  ];
  res.json({ code: 200, message: '获取分类列表成功', data: categories });
};

// ==================== 管理员登录 ====================

exports.adminLogin = async (req, res) => {
  try {
    const { phone, password } = req.body;

    if (!phone || !password) {
      return res.status(400).json({ code: 400, message: '请输入手机号和密码' });
    }

    // 查找管理员用户
    const admin = await prisma.user.findFirst({
      where: { role: 'admin', phone, status: 1 },
    });

    if (!admin) {
      return res.status(401).json({ code: 401, message: '管理员不存在或已禁用' });
    }

    // 密码校验：从系统配置读取管理员密码，默认 admin123
    const config = await prisma.systemConfig.findUnique({ where: { key: 'admin_password' } });
    const adminPassword = config?.value || 'admin123';

    if (password !== adminPassword) {
      return res.status(401).json({ code: 401, message: '密码错误' });
    }

    const jwt = require('jsonwebtoken');
    const JWT_SECRET = process.env.JWT_SECRET || 'qfwq_jwt_secret_2026';

    const token = jwt.sign(
      { id: admin.id.toString(), role: 'admin', openid: admin.openid },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      code: 200, message: '登录成功',
      data: {
        token,
        user: {
          id: admin.id.toString(),
          nickname: admin.nickname,
          role: admin.role,
          avatarUrl: admin.avatarUrl,
        },
      },
    });
  } catch (error) {
    console.error('管理员登录失败:', error);
    res.status(500).json({ code: 500, message: '登录失败' });
  }
};
