/**
 * 地址路由 - 企服外勤代办宝
 * 全部需鉴权
 */
const router = require('express').Router();
const { authMiddleware } = require('../middleware/auth');
const addressController = require('../controllers/addressController');

// 所有地址路由都需要鉴权
router.use(authMiddleware);

// 获取地址列表
router.get('/list', addressController.getList);

// 添加地址
router.post('/add', addressController.add);

// 更新地址
router.put('/update/:id', addressController.update);

// 删除地址
router.delete('/delete/:id', addressController.delete);

// 设置默认地址
router.post('/default/:id', addressController.setDefault);

module.exports = router;
