/**
 * 路由汇总 - 企服外勤代办宝
 * 将所有模块路由挂载到 Express Router
 * 鉴权由各子路由文件内部自行管理（方案A）
 */
const router = require('express').Router();

// ==================== 业务路由挂载 ====================

// 认证模块（登录等无需鉴权，logout等在文件内部加鉴权）
router.use('/auth', require('./auth'));

// 用户模块（内部加鉴权）
router.use('/user', require('./user'));

// 服务模块（全部无需鉴权）
router.use('/service', require('./service'));

// 订单模块（内部加鉴权）
router.use('/order', require('./order'));

// 报价模块（内部加鉴权）
router.use('/quote', require('./quote'));

// 外勤模块（内部加鉴权）
router.use('/runner', require('./runner'));

// 地址模块（内部加鉴权）
router.use('/address', require('./address'));

// 评价模块（create需鉴权，getLatest无需鉴权，内部管理）
router.use('/review', require('./review'));

// 通用模块（部分鉴权，内部管理）
router.use('/common', require('./common'));

module.exports = router;
