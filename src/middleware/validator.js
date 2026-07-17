/**
 * 参数校验中间件 - 企服外勤代办宝
 * 基于 express-validator 封装
 */
const { validationResult, body, param, query } = require('express-validator');
const { error } = require('../utils/response');

/**
 * 执行校验并返回格式化错误
 * 使用方式：router.post('/xxx', validate(rules), controller)
 */
function validate(rules) {
  return async (req, res, next) => {
    // 执行所有校验规则
    await Promise.all(rules.map((rule) => rule.run(req)));

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      const formatted = errors.array().map((e) => ({
        field: e.path,
        message: e.msg,
        value: e.value
      }));
      return error(res, '参数校验失败', 422, 422, { errors: formatted });
    }
    next();
  };
}

// ==================== 常用校验规则 ====================

/** 微信登录校验 */
const loginRules = [
  body('code').notEmpty().withMessage('微信登录code不能为空')
];

/** 创建订单校验 */
const orderCreateRules = [
  body('serviceId').isInt({ min: 1 }).withMessage('服务ID无效'),
  body('title').notEmpty().withMessage('订单标题不能为空').isLength({ max: 128 }).withMessage('标题最长128字'),
  body('addressId').optional().isInt({ min: 1 }).withMessage('地址ID无效'),
  body('contactName').notEmpty().withMessage('联系人不能为空'),
  body('contactPhone').notEmpty().withMessage('联系电话不能为空').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('urgency').optional().isBoolean().withMessage('加急标识无效'),
  body('remark').optional().isLength({ max: 1000 }).withMessage('备注最长1000字')
];

/** 地址校验 */
const addressRules = [
  body('name').notEmpty().withMessage('地址名称不能为空').isLength({ max: 128 }).withMessage('名称最长128字'),
  body('detail').notEmpty().withMessage('详细地址不能为空').isLength({ max: 512 }).withMessage('地址最长512字'),
  body('contactName').notEmpty().withMessage('联系人不能为空'),
  body('contactPhone').notEmpty().withMessage('联系电话不能为空').isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('province').optional().isLength({ max: 32 }),
  body('city').optional().isLength({ max: 32 }),
  body('district').optional().isLength({ max: 32 }),
  body('isDefault').optional().isBoolean()
];

/** 评价校验 */
const reviewRules = [
  body('rating').isFloat({ min: 1, max: 5 }).withMessage('评分范围1-5'),
  body('content').notEmpty().withMessage('评价内容不能为空').isLength({ max: 500 }).withMessage('评价最长500字'),
  body('images').optional().isArray().withMessage('图片格式错误')
];

/** 报价校验 */
const quoteRules = [
  body('price').isFloat({ min: 0 }).withMessage('报价必须大于0'),
  body('timeEstimate').notEmpty().withMessage('预估时间不能为空'),
  body('description').optional().isLength({ max: 1000 }).withMessage('描述最长1000字')
];

/** 分页查询校验 */
const paginationRules = [
  query('page').optional().isInt({ min: 1 }).withMessage('页码必须大于0'),
  query('pageSize').optional().isInt({ min: 1, max: 100 }).withMessage('每页条数1-100')
];

/** ID 参数校验 */
const idParamRule = param('id').isInt({ min: 1 }).withMessage('ID参数无效');

module.exports = {
  validate,
  loginRules,
  orderCreateRules,
  addressRules,
  reviewRules,
  quoteRules,
  paginationRules,
  idParamRule
};
