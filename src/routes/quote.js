/**
 * 报价路由 - 企服外勤代办宝
 * 全部需要鉴权
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const quoteController = require('../controllers/quoteController');

// 所有报价接口都需要鉴权
router.use(authMiddleware);

// 获取订单报价列表
router.get('/list/:orderId', quoteController.getList);

// 获取报价详情
router.get('/detail/:id', quoteController.getDetail);

// 选择报价
router.post('/select/:id', quoteController.selectQuote);

// 获取报价统计
router.get('/stats/:orderId', quoteController.getStats);

module.exports = router;
