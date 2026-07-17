/**
 * 服务路由 - 企服外勤代办宝
 * 全部无需鉴权
 */
const router = require('express').Router();
const serviceController = require('../controllers/serviceController');

// 服务分类
router.get('/categories', serviceController.getCategories);

// 服务列表
router.get('/list', serviceController.getList);

// 热门服务
router.get('/hot', serviceController.getHot);

// 搜索服务
router.get('/search', serviceController.search);

// 服务详情
router.get('/detail/:id', serviceController.getDetail);

// 服务流程
router.get('/process/:id', serviceController.getProcess);

// 所需材料
router.get('/materials/:id', serviceController.getMaterials);

// 常见问题
router.get('/faq/:id', serviceController.getFAQ);

// 价格信息
router.get('/pricing/:id', serviceController.getPricing);

module.exports = router;
