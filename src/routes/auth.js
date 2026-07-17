/**
 * 认证路由 - 企服外勤代办宝
 */
const express = require('express');
const router = express.Router();
const { authMiddleware } = require('../middleware/auth');
const { validate, loginRules } = require('../middleware/validator');
const authController = require('../controllers/authController');

// 微信登录（无需鉴权）
router.post('/wx-login', authController.wxLogin);

// 手机号登录（无需鉴权）
router.post('/phone-login', authController.phoneLogin);

// 刷新Token（无需鉴权）
router.post('/refresh', authController.refreshToken);

// 退出登录（需要鉴权）
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;
