/**
 * 外勤路由 - 企服外勤代办宝
 * 全部需鉴权
 */
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const runnerController = require('../controllers/runnerController');

// 所有外勤路由都需要鉴权
router.use(authMiddleware);

// 外勤详情
router.get('/detail/:id', runnerController.getDetail);

// 外勤评价列表
router.get('/reviews/:id', runnerController.getReviews);

// 获取虚拟号码
router.get('/virtual-phone/:orderId', runnerController.getVirtualPhone);

module.exports = router;
