/**
 * 订单控制器 - 企服外勤代办宝
 * 订单创建、列表、详情、取消、确认完成、进度、材料管理
 */
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error, successWithPaginate } = require('../utils/response');
const orderService = require('../services/orderService');

/**
 * 创建订单
 * POST /order/create
 */
const create = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const data = req.body;

  // 基本参数校验
  if (!data.serviceId) {
    return error(res, '服务ID不能为空', 422, 422);
  }
  if (!data.title) {
    return error(res, '订单标题不能为空', 422, 422);
  }
  if (!data.contactName) {
    return error(res, '联系人不能为空', 422, 422);
  }
  if (!data.contactPhone) {
    return error(res, '联系电话不能为空', 422, 422);
  }

  const order = await orderService.createOrder(userId, data);
  return success(res, order, '订单创建成功', 201);
});

/**
 * 获取订单列表
 * GET /order/list
 * 参数: status, page, pageSize
 */
const getList = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { status, page = 1, pageSize = 20 } = req.query;

  const result = await orderService.getOrderList(userId, { status, page, pageSize });
  return successWithPaginate(res, result.list, result.pagination.total, result.pagination.page, result.pagination.pageSize);
});

/**
 * 获取订单详情
 * GET /order/detail/:id
 */
const getDetail = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const order = await orderService.getOrderDetail(userId, id);
  return success(res, order, '查询成功');
});

/**
 * 取消订单
 * POST /order/cancel/:id
 * 参数: { reason }
 */
const cancel = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;
  const { reason } = req.body;

  const order = await orderService.cancelOrder(userId, id, reason);
  return success(res, order, '订单已取消');
});

/**
 * 确认完成
 * POST /order/confirm/:id
 */
const confirmComplete = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const order = await orderService.confirmComplete(userId, id);
  return success(res, order, '订单已完成');
});

/**
 * 获取订单进度
 * GET /order/progress/:id
 */
const getProgress = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const progresses = await orderService.getProgress(id);
  return success(res, progresses, '查询成功');
});

/**
 * 获取订单材料
 * GET /order/materials/:id
 */
const getMaterials = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const materials = await orderService.getMaterials(id);
  return success(res, materials, '查询成功');
});

/**
 * 上传材料
 * POST /order/upload/:id（multipart/form-data）
 */
const uploadMaterial = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  if (!req.file) {
    return error(res, '请选择要上传的文件', 422, 422);
  }

  const material = await orderService.uploadMaterial(userId, id, req.file);
  return success(res, material, '上传成功');
});

module.exports = {
  create,
  getList,
  getDetail,
  cancel,
  confirmComplete,
  getProgress,
  getMaterials,
  uploadMaterial
};
