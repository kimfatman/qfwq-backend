/**
 * 用户路由 - 企服外勤代办宝
 * 全部需要鉴权
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const userController = require('../controllers/userController');

// 所有用户接口都需要鉴权
router.use(authMiddleware);

// 获取用户信息
router.get('/info', userController.getUserInfo);

// 更新用户信息
router.put('/info', userController.updateUserInfo);

// 获取用户订单统计
router.get('/stats', userController.getUserStats);

module.exports = router;
