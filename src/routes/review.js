/**
 * 评价路由 - 企服外勤代办宝
 * create 需鉴权，getLatest 无需鉴权
 */
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const reviewController = require('../controllers/reviewController');

// 创建评价 - 需鉴权
router.post('/create', authMiddleware, reviewController.create);

// 获取最新评价 - 无需鉴权
router.get('/latest', reviewController.getLatest);

module.exports = router;
