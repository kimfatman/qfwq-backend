/**
 * 通用路由 - 企服外勤代办宝
 * 部分需鉴权，部分无需鉴权（在路由级别控制）
 */
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const commonController = require('../controllers/commonController');

// 获取Banner列表 - 无需鉴权
router.get('/banners', commonController.getBanners);

// 获取客服配置 - 需鉴权
router.get('/chat-config', authMiddleware, commonController.getChatConfig);

// 获取协议内容 - 无需鉴权
router.get('/agreement/:type', commonController.getAgreement);

// 提交意见反馈 - 需鉴权
router.post('/feedback', authMiddleware, commonController.submitFeedback);

// 获取公开系统配置 - 无需鉴权
router.get('/config', commonController.getConfig);

module.exports = router;
