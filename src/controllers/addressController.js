/**
 * 地址控制器 - 企服外勤代办宝
 * 地址的增删改查和默认设置，全部需鉴权
 */
const { prisma } = require('../config/database');
const { success, error } = require('../utils/response');
const { asyncHandler } = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * 获取当前用户的地址列表
 * GET /address/list
 * 默认地址排在前面
 */
const getList = asyncHandler(async (req, res) => {
  const userId = req.user.userId;

  try {
    const list = await prisma.address.findMany({
      where: { userId: BigInt(userId) },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return success(res, list, '获取地址列表成功');
  } catch (err) {
    logger.error('获取地址列表失败', { error: err.message, userId });
    return error(res, '获取地址列表失败', 500);
  }
});

/**
 * 添加地址
 * POST /address/add
 * 参数 {name, detail, contactName, contactPhone, isDefault, province, city, district}
 * 如果isDefault=true则取消其他默认
 */
const add = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const {
    name,
    detail,
    contactName,
    contactPhone,
    isDefault = false,
    province = '',
    city = '',
    district = ''
  } = req.body;

  // 参数校验
  if (!name || !detail || !contactName || !contactPhone) {
    return error(res, '缺少必填参数（name, detail, contactName, contactPhone）', 400, 400);
  }

  try {
    // 如果设置为默认地址，先取消其他默认
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: BigInt(userId),
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    const address = await prisma.address.create({
      data: {
        userId: BigInt(userId),
        name,
        detail,
        contactName,
        contactPhone,
        isDefault: Boolean(isDefault),
        province,
        city,
        district
      }
    });

    logger.info('添加地址成功', { userId, addressId: address.id });
    return success(res, address, '添加地址成功');
  } catch (err) {
    logger.error('添加地址失败', { error: err.message, userId });
    return error(res, '添加地址失败', 500);
  }
});

/**
 * 更新地址
 * PUT /address/update/:id
 * 参数同add
 */
const update = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const {
    name,
    detail,
    contactName,
    contactPhone,
    isDefault,
    province,
    city,
    district
  } = req.body;

  try {
    // 校验地址属于当前用户
    const existing = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId)
      }
    });

    if (!existing) {
      return error(res, '地址不存在或无权操作', 404, 404);
    }

    // 如果设置为默认地址，先取消其他默认
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: BigInt(userId),
          isDefault: true
        },
        data: { isDefault: false }
      });
    }

    // 构建更新数据（只更新传入的字段）
    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (detail !== undefined) updateData.detail = detail;
    if (contactName !== undefined) updateData.contactName = contactName;
    if (contactPhone !== undefined) updateData.contactPhone = contactPhone;
    if (isDefault !== undefined) updateData.isDefault = Boolean(isDefault);
    if (province !== undefined) updateData.province = province;
    if (city !== undefined) updateData.city = city;
    if (district !== undefined) updateData.district = district;

    const address = await prisma.address.update({
      where: { id: BigInt(id) },
      data: updateData
    });

    logger.info('更新地址成功', { userId, addressId: id });
    return success(res, address, '更新地址成功');
  } catch (err) {
    logger.error('更新地址失败', { error: err.message, userId, addressId: id });
    return error(res, '更新地址失败', 500);
  }
});

/**
 * 删除地址
 * DELETE /address/delete/:id
 * 校验是否属于当前用户
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    // 校验地址属于当前用户
    const existing = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId)
      }
    });

    if (!existing) {
      return error(res, '地址不存在或无权操作', 404, 404);
    }

    await prisma.address.delete({
      where: { id: BigInt(id) }
    });

    logger.info('删除地址成功', { userId, addressId: id });
    return success(res, null, '删除地址成功');
  } catch (err) {
    logger.error('删除地址失败', { error: err.message, userId, addressId: id });
    return error(res, '删除地址失败', 500);
  }
});

/**
 * 设置默认地址
 * POST /address/default/:id
 * 先取消所有默认再设置当前
 */
const setDefault = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  try {
    // 校验地址属于当前用户
    const existing = await prisma.address.findFirst({
      where: {
        id: BigInt(id),
        userId: BigInt(userId)
      }
    });

    if (!existing) {
      return error(res, '地址不存在或无权操作', 404, 404);
    }

    // 使用事务：先取消所有默认，再设置当前
    await prisma.$transaction([
      prisma.address.updateMany({
        where: {
          userId: BigInt(userId),
          isDefault: true
        },
        data: { isDefault: false }
      }),
      prisma.address.update({
        where: { id: BigInt(id) },
        data: { isDefault: true }
      })
    ]);

    logger.info('设置默认地址成功', { userId, addressId: id });
    return success(res, null, '设置默认地址成功');
  } catch (err) {
    logger.error('设置默认地址失败', { error: err.message, userId, addressId: id });
    return error(res, '设置默认地址失败', 500);
  }
});

module.exports = {
  getList,
  add,
  update,
  delete: deleteAddress,
  setDefault
};
