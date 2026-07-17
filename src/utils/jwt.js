/**
 * JWT 工具 - 企服外勤代办宝
 * 提供 Token 生成、验证等功能
 */
const jwt = require('jsonwebtoken');
const config = require('../config/index');

/**
 * 生成 Token 对（access + refresh）
 * @param {object} payload - 载荷数据
 * @returns {{ token: string, refreshToken: string }}
 */
function generateTokens(payload) {
  const token = jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn
  });
  const refreshToken = jwt.sign(payload, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiresIn
  });
  return { token, refreshToken };
}

/**
 * 验证 Access Token
 * @param {string} token - JWT Token
 * @returns {object} 解码后的载荷
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyToken(token) {
  return jwt.verify(token, config.jwt.secret);
}

/**
 * 验证 Refresh Token
 * @param {string} refreshToken - 刷新令牌
 * @returns {object} 解码后的载荷
 * @throws {jwt.JsonWebTokenError|jwt.TokenExpiredError}
 */
function verifyRefreshToken(refreshToken) {
  return jwt.verify(refreshToken, config.jwt.refreshSecret);
}

/**
 * 生成 Access Token（简化版）
 * @param {BigInt|number} userId - 用户ID
 * @param {string} role - 用户角色
 * @returns {string} JWT Token
 */
function generateAccessToken(userId, role) {
  return jwt.sign(
    { userId: userId.toString(), role },
    config.jwt.secret,
    { expiresIn: config.jwt.expiresIn }
  );
}

/**
 * 生成 Refresh Token（简化版）
 * @param {BigInt|number} userId - 用户ID
 * @returns {string} Refresh Token
 */
function generateRefreshToken(userId) {
  return jwt.sign(
    { userId: userId.toString(), type: 'refresh' },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiresIn }
  );
}

module.exports = {
  generateTokens,
  verifyToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken
};
