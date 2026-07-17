/**
 * 订单路由 - 企服外勤代办宝
 * 全部需要鉴权
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validate, orderCreateRules, paginationRules, idParamRule } = require('../middleware/validator');
const { singleUpload } = require('../middleware/upload');
const orderController = require('../controllers/orderController');

// 所有订单接口都需要鉴权
router.use(authMiddleware);

// 创建订单
router.post('/create', orderController.create);

// 获取订单列表
router.get('/list', orderController.getList);

// 获取订单详情
router.get('/detail/:id', orderController.getDetail);

// 取消订单
router.post('/cancel/:id', orderController.cancel);

// 确认完成
router.post('/confirm/:id', orderController.confirmComplete);

// 获取订单进度
router.get('/progress/:id', orderController.getProgress);

// 获取订单材料
router.get('/materials/:id', orderController.getMaterials);

// 上传材料（multipart/form-data）
router.post('/upload/:id', singleUpload('file'), orderController.uploadMaterial);

module.exports = router;
