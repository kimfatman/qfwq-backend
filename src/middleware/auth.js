/**
 * JWT 鉴权中间件 - 企服外勤代办宝
 * 提供 token 校验、角色检查等功能
 */
const { verifyToken } = require('../utils/jwt');
const { error } = require('../utils/response');

/**
 * 必须登录中间件 - 校验 Bearer Token
 * 解析 userId 和 role 注入 req.user
 */
function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return error(res, '未提供认证令牌', 401, 401);
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verifyToken(token);
    req.user = {
      userId: decoded.userId,
      role: decoded.role
    };
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return error(res, '认证令牌已过期', 401, 401);
    }
    return error(res, '无效的认证令牌', 401, 401);
  }
}

/**
 * 可选鉴权中间件
 * 有 token 就解析注入 req.user，没有也放行
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.split(' ')[1];
    try {
      const decoded = verifyToken(token);
      req.user = {
        userId: decoded.userId,
        role: decoded.role
      };
    } catch {
      // Token 无效，但不阻断请求
      req.user = null;
    }
  } else {
    req.user = null;
  }

  next();
}

/**
 * 角色校验中间件
 * @param {...string} roles - 允许的角色列表
 * @returns {Function} Express 中间件
 */
function roleCheck(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return error(res, '请先登录', 401, 401);
    }

    if (!roles.includes(req.user.role)) {
      return error(res, '无权访问该资源', 403, 403);
    }

    next();
  };
}

module.exports = {
  authMiddleware,
  optionalAuth,
  roleCheck
};
