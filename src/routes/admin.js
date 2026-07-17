/**
 * Admin 管理路由 - 企服外勤代办宝
 * 所有接口需要 auth + admin 双重中间件
 */
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const { adminMiddleware } = require('../middleware/admin');
const { singleUpload } = require('../middleware/upload');
const adminCtrl = require('../controllers/adminController');
const dashboardCtrl = require('../controllers/adminDashboardController');

// 双重鉴权：先验证登录，再验证管理员角色
router.use(authMiddleware);
router.use(adminMiddleware);

// ==================== 仪表盘 ====================
router.get('/dashboard', dashboardCtrl.getDashboard);

// ==================== 管理员登录（无需admin中间件） ====================
// 注意：此路由放在上面两个中间件之前，单独挂载
// 实际在 index.js 中单独处理

// ==================== 服务管理 ====================
router.get('/service/list', adminCtrl.getServiceList);
router.get('/service/categories', adminCtrl.getCategories);
router.post('/service/create', adminCtrl.createService);
router.put('/service/update/:id', adminCtrl.updateService);
router.delete('/service/delete/:id', adminCtrl.deleteService);
router.post('/service/toggle/:id', adminCtrl.toggleServiceStatus);

// ==================== Banner 管理 ====================
router.get('/banner/list', adminCtrl.getBannerList);
router.post('/banner/create', adminCtrl.createBanner);
router.put('/banner/update/:id', adminCtrl.updateBanner);
router.delete('/banner/delete/:id', adminCtrl.deleteBanner);

// ==================== 用户管理 ====================
router.get('/user/list', adminCtrl.getUserList);
router.post('/user/toggle/:id', adminCtrl.toggleUserStatus);

// ==================== 外勤管理 ====================
router.get('/runner/list', adminCtrl.getRunnerList);
router.get('/runner/detail/:id', adminCtrl.getRunnerDetail);
router.post('/runner/approve/:id', adminCtrl.approveRunner);
router.post('/runner/reject/:id', adminCtrl.rejectRunner);
router.post('/runner/toggle/:id', adminCtrl.toggleRunnerStatus);

// ==================== 订单管理 ====================
router.get('/order/list', adminCtrl.getOrderList);
router.get('/order/detail/:id', adminCtrl.getOrderDetail);
router.post('/order/cancel/:id', adminCtrl.adminCancelOrder);

// ==================== 评价管理 ====================
router.get('/review/list', adminCtrl.getReviewList);
router.post('/review/toggle/:id', adminCtrl.toggleReviewStatus);
router.post('/review/reply/:id', adminCtrl.replyReview);

// ==================== 系统配置 ====================
router.get('/config/list', adminCtrl.getConfigList);
router.post('/config/update', adminCtrl.updateConfig);
router.post('/config/batch-update', adminCtrl.batchUpdateConfig);

// ==================== 协议管理 ====================
router.get('/agreement/list', adminCtrl.getAgreements);
router.put('/agreement/update/:id', adminCtrl.updateAgreement);

// ==================== 文件上传 ====================
router.post('/upload', singleUpload, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ code: 400, message: '请选择文件' });
  }
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${req.file.filename}`;
  res.json({
    code: 200,
    message: '上传成功',
    data: { url: fileUrl, name: req.file.originalname, size: req.file.size },
  });
});

module.exports = router;
