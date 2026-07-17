/**
 * 订单业务逻辑 - 企服外勤代办宝
 * 订单创建、列表、详情、取消、确认完成、进度、材料上传
 */
const { prisma } = require('../config/database');
const { generateOrderNo } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * 创建订单
 * 生成订单号 → 创建订单 → 写入进度 → 写入材料(如有) → 推送通知(预留)
 * @param {string} userId - 用户ID
 * @param {object} data - 订单数据
 * @returns {object} 创建的订单
 */
async function createOrder(userId, data) {
  const {
    serviceId, title, addressId, addressSnapshot,
    contactName, contactPhone, urgency, remark,
    materialUrls
  } = data;

  // 1. 查询服务信息
  const service = await prisma.service.findUnique({
    where: { id: BigInt(serviceId) },
    select: { id: true, name: true, status: true }
  });

  if (!service) {
    throw new Error('服务不存在');
  }
  if (service.status !== 1) {
    throw new Error('该服务已下架');
  }

  // 2. 生成订单号
  const orderNo = generateOrderNo();

  // 3. 创建订单
  const order = await prisma.order.create({
    data: {
      orderNo,
      userId: BigInt(userId),
      serviceId: BigInt(serviceId),
      serviceName: service.name,
      title,
      addressId: addressId ? BigInt(addressId) : null,
      addressSnapshot: addressSnapshot || '',
      contactName,
      contactPhone,
      urgency: urgency || false,
      remark: remark || null,
      status: 'pending'
    },
    include: {
      service: { select: { id: true, name: true, category: true, icon: true } }
    }
  });

  // 4. 写入订单进度（已创建）
  await prisma.orderProgress.create({
    data: {
      orderId: order.id,
      action: 'created',
      title: '订单已创建',
      description: '您的订单已提交，等待外勤报价',
      operatorType: 'user',
      operatorId: BigInt(userId)
    }
  });

  // 5. 如果有材料URL，批量创建材料记录
  if (materialUrls && Array.isArray(materialUrls) && materialUrls.length > 0) {
    const materialData = materialUrls.map((item) => ({
      orderId: order.id,
      fileUrl: item.url || item,
      fileName: item.name || '未命名文件',
      fileType: item.type || 'unknown',
      fileSize: item.size || 0,
      uploaderType: 'user',
      uploaderId: BigInt(userId)
    }));

    await prisma.orderMaterial.createMany({ data: materialData });
  }

  // 6. 推送通知给匹配外勤（预留）
  // TODO: 调用通知服务 notifyMatchingRunners(order)

  logger.info('订单创建成功', { orderId: order.id.toString(), orderNo, userId });

  return serializeOrder(order);
}

/**
 * 获取订单列表
 * 支持 status 筛选 + 分页
 * @param {string} userId - 用户ID
 * @param {object} params - 查询参数 { status, page, pageSize }
 * @returns {{ list: Array, pagination: object }}
 */
async function getOrderList(userId, params = {}) {
  const { status, page = 1, pageSize = 20 } = params;
  const skip = (Number(page) - 1) * Number(pageSize);
  const take = Number(pageSize);

  // 构建查询条件
  const where = { userId: BigInt(userId) };
  if (status) {
    // 支持逗号分隔的多状态查询
    const statuses = status.split(',').map(s => s.trim()).filter(Boolean);
    if (statuses.length === 1) {
      where.status = statuses[0];
    } else if (statuses.length > 1) {
      where.status = { in: statuses };
    }
  }

  // 查询总数和列表
  const [total, orders] = await Promise.all([
    prisma.order.count({ where }),
    prisma.order.findMany({
      where,
      skip,
      take,
      orderBy: { createdAt: 'desc' },
      include: {
        service: { select: { id: true, name: true, category: true, icon: true } },
        assignedRunner: {
          select: { id: true, realName: true, avatarUrl: true, rating: true }
        }
      }
    })
  ]);

  const list = orders.map(serializeOrder);

  const totalPages = Math.ceil(total / take);
  return {
    list,
    pagination: {
      total,
      page: Number(page),
      pageSize: take,
      totalPages,
      hasMore: Number(page) < totalPages
    }
  };
}

/**
 * 获取订单详情
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单ID
 * @returns {object} 订单详情
 */
async function getOrderDetail(userId, orderId) {
  const order = await prisma.order.findFirst({
    where: { id: BigInt(orderId), userId: BigInt(userId) },
    include: {
      service: { select: { id: true, name: true, category: true, categoryName: true, icon: true, imageUrl: true } },
      assignedRunner: {
        select: { id: true, realName: true, avatarUrl: true, rating: true, totalOrders: true, phone: true }
      },
      quotes: {
        include: {
          runner: { select: { id: true, realName: true, avatarUrl: true, rating: true, totalOrders: true } }
        },
        orderBy: { createdAt: 'desc' }
      },
      _count: { select: { quotes: true, materials: true, progresses: true } }
    }
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  return serializeOrder(order);
}

/**
 * 取消订单
 * 仅 pending/quoted/assigned 状态可取消
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单ID
 * @param {string} reason - 取消原因
 * @returns {object} 取消后的订单
 */
async function cancelOrder(userId, orderId, reason) {
  // 1. 查询订单
  const order = await prisma.order.findFirst({
    where: { id: BigInt(orderId), userId: BigInt(userId) }
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  // 2. 校验状态
  const cancelableStatuses = ['pending', 'quoted', 'assigned'];
  if (!cancelableStatuses.includes(order.status)) {
    throw new Error(`当前订单状态为${order.status}，无法取消`);
  }

  // 3. 更新订单状态
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'cancelled',
      cancelledAt: new Date(),
      cancelReason: reason || '用户取消'
    }
  });

  // 4. 写入进度
  await prisma.orderProgress.create({
    data: {
      orderId: order.id,
      action: 'cancelled',
      title: '订单已取消',
      description: reason || '用户主动取消订单',
      operatorType: 'user',
      operatorId: BigInt(userId)
    }
  });

  // 5. 通知外勤（预留）
  // TODO: if (order.assignedRunnerId) { notifyRunner(order.assignedRunnerId, 'order_cancelled') }
  // TODO: 通知已报价的外勤

  logger.info('订单取消成功', { orderId: orderId, userId, reason });

  return serializeOrder(updated);
}

/**
 * 确认完成
 * 仅 in_progress 状态可确认
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单ID
 * @returns {object} 确认后的订单
 */
async function confirmComplete(userId, orderId) {
  // 1. 查询订单
  const order = await prisma.order.findFirst({
    where: { id: BigInt(orderId), userId: BigInt(userId) }
  });

  if (!order) {
    throw new Error('订单不存在');
  }

  // 2. 校验状态
  if (order.status !== 'in_progress') {
    throw new Error(`当前订单状态为${order.status}，无法确认完成`);
  }

  // 3. 更新订单状态
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      status: 'completed',
      completedAt: new Date()
    }
  });

  // 4. 写入进度
  await prisma.orderProgress.create({
    data: {
      orderId: order.id,
      action: 'completed',
      title: '订单已完成',
      description: '用户确认订单已完成',
      operatorType: 'user',
      operatorId: BigInt(userId)
    }
  });

  // 5. 更新外勤统计数据
  if (order.assignedRunnerId) {
    try {
      await prisma.runner.update({
        where: { id: order.assignedRunnerId },
        data: { totalOrders: { increment: 1 } }
      });
    } catch (err) {
      logger.error('更新外勤统计失败', { runnerId: order.assignedRunnerId.toString(), error: err.message });
    }
  }

  logger.info('订单确认完成', { orderId: orderId, userId });

  return serializeOrder(updated);
}

/**
 * 获取订单进度时间线
 * @param {string} orderId - 订单ID
 * @returns {Array} 进度列表
 */
async function getProgress(orderId) {
  const progresses = await prisma.orderProgress.findMany({
    where: { orderId: BigInt(orderId) },
    orderBy: { createdAt: 'asc' }
  });

  return progresses.map(p => ({
    id: p.id.toString(),
    orderId: p.orderId.toString(),
    action: p.action,
    title: p.title,
    description: p.description,
    operatorType: p.operatorType,
    operatorId: p.operatorId ? p.operatorId.toString() : null,
    createdAt: p.createdAt
  }));
}

/**
 * 获取订单材料清单
 * @param {string} orderId - 订单ID
 * @returns {Array} 材料列表
 */
async function getMaterials(orderId) {
  const materials = await prisma.orderMaterial.findMany({
    where: { orderId: BigInt(orderId) },
    orderBy: { createdAt: 'desc' }
  });

  return materials.map(m => ({
    id: m.id.toString(),
    orderId: m.orderId.toString(),
    fileUrl: m.fileUrl,
    fileName: m.fileName,
    fileType: m.fileType,
    fileSize: m.fileSize,
    uploaderType: m.uploaderType,
    uploaderId: m.uploaderId.toString(),
    createdAt: m.createdAt
  }));
}

/**
 * 上传材料
 * 保存文件信息到 order_materials
 * @param {string} userId - 用户ID
 * @param {string} orderId - 订单ID
 * @param {object} file - multer 上传的文件对象
 * @returns {object} 创建的材料记录
 */
async function uploadMaterial(userId, orderId, file) {
  // 1. 校验订单存在
  const order = await prisma.order.findUnique({ where: { id: BigInt(orderId) } });
  if (!order) {
    throw new Error('订单不存在');
  }

  // 2. 创建材料记录
  // 本地存储：fileUrl 使用相对路径；COS转存预留
  const fileUrl = `/uploads/${file.filename}`;
  const fileSize = file.size || 0;

  const material = await prisma.orderMaterial.create({
    data: {
      orderId: BigInt(orderId),
      fileUrl,
      fileName: file.originalname || file.filename,
      fileType: file.mimetype || 'unknown',
      fileSize,
      uploaderType: 'user',
      uploaderId: BigInt(userId)
    }
  });

  // TODO: COS转存 — 上传到腾讯云COS后更新 fileUrl
  // const cosUrl = await uploadToCOS(file.path, file.filename);
  // await prisma.orderMaterial.update({ where: { id: material.id }, data: { fileUrl: cosUrl } });

  logger.info('材料上传成功', { orderId, materialId: material.id.toString(), userId });

  return {
    id: material.id.toString(),
    orderId: material.orderId.toString(),
    fileUrl: material.fileUrl,
    fileName: material.fileName,
    fileType: material.fileType,
    fileSize: material.fileSize,
    uploaderType: material.uploaderType,
    uploaderId: material.uploaderId.toString(),
    createdAt: material.createdAt
  };
}

/**
 * 序列化订单对象（BigInt → String）
 * @param {object} order - Prisma 查询结果
 * @returns {object} 序列化后的订单
 */
function serializeOrder(order) {
  const result = {
    id: order.id.toString(),
    orderNo: order.orderNo,
    userId: order.userId.toString(),
    serviceId: order.serviceId.toString(),
    serviceName: order.serviceName,
    assignedRunnerId: order.assignedRunnerId ? order.assignedRunnerId.toString() : null,
    status: order.status,
    title: order.title,
    addressId: order.addressId ? order.addressId.toString() : null,
    addressSnapshot: order.addressSnapshot,
    contactName: order.contactName,
    contactPhone: order.contactPhone,
    urgency: order.urgency,
    remark: order.remark,
    quoteCount: order.quoteCount,
    selectedQuoteId: order.selectedQuoteId ? order.selectedQuoteId.toString() : null,
    completedAt: order.completedAt,
    cancelledAt: order.cancelledAt,
    cancelReason: order.cancelReason,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt
  };

  // 关联数据序列化
  if (order.service) {
    result.service = {
      ...order.service,
      id: order.service.id.toString()
    };
  }

  if (order.assignedRunner) {
    result.assignedRunner = {
      ...order.assignedRunner,
      id: order.assignedRunner.id.toString()
    };
  }

  if (order.quotes) {
    result.quotes = order.quotes.map(q => ({
      ...q,
      id: q.id.toString(),
      orderId: q.orderId.toString(),
      runnerId: q.runnerId.toString(),
      price: Number(q.price),
      runner: q.runner ? {
        ...q.runner,
        id: q.runner.id.toString(),
        rating: Number(q.runner.rating)
      } : null
    }));
  }

  if (order._count) {
    result._count = {
      quotes: order._count.quotes,
      materials: order._count.materials,
      progresses: order._count.progresses
    };
  }

  return result;
}

module.exports = {
  createOrder,
  getOrderList,
  getOrderDetail,
  cancelOrder,
  confirmComplete,
  getProgress,
  getMaterials,
  uploadMaterial
};
