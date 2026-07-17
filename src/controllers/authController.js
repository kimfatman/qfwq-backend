/**
 * 认证控制器 - 企服外勤代办宝
 * 微信登录、手机号登录、Token刷新、退出登录
 */
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/response');
const authService = require('../services/authService');

/**
 * 微信登录
 * POST /auth/wx-login
 * 参数: { code, platform }
 */
const wxLogin = asyncHandler(async (req, res) => {
  const { code, platform } = req.body;

  if (!code) {
    return error(res, '微信登录code不能为空', 422, 422);
  }

  const result = await authService.wxLogin(code, platform);
  return success(res, result, '登录成功');
});

/**
 * 手机号登录
 * POST /auth/phone-login
 * 参数: { code, encryptedData, iv }
 */
const phoneLogin = asyncHandler(async (req, res) => {
  const { code, encryptedData, iv } = req.body;

  if (!code) {
    return error(res, '手机号授权code不能为空', 422, 422);
  }

  const result = await authService.phoneLogin(code, encryptedData, iv);
  return success(res, result, '登录成功');
});

/**
 * 刷新 Token
 * POST /auth/refresh
 * 参数: { refreshToken }
 */
const refreshToken = asyncHandler(async (req, res) => {
  const { refreshToken: refreshTokenStr } = req.body;

  if (!refreshTokenStr) {
    return error(res, 'refreshToken不能为空', 422, 422);
  }

  const result = await authService.refreshAccessToken(refreshTokenStr);
  return success(res, result, '刷新成功');
});

/**
 * 退出登录
 * POST /auth/logout（需鉴权）
 */
const logout = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const token = req.headers.authorization?.split(' ')[1];

  await authService.logout(userId, token);
  return success(res, null, '退出成功');
});

module.exports = {
  wxLogin,
  phoneLogin,
  refreshToken,
  logout
};
