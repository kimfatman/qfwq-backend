/**
 * 认证业务逻辑 - 企服外勤代办宝
 * 微信登录、手机号登录、Token刷新、退出登录
 */
const { prisma } = require('../config/database');
const { generateAccessToken, generateRefreshToken, verifyRefreshToken } = require('../utils/jwt');
const { encrypt, decrypt } = require('../utils/crypto');
const { set: redisSet, del: redisDel, get: redisGet } = require('../config/redis');
const wechatService = require('./wechatService');
const logger = require('../utils/logger');
const config = require('../config/index');

/**
 * 微信登录
 * 调用微信 code2Session 获取 openid → 查找/创建用户 → 生成 JWT → 返回
 * @param {string} code - 微信登录凭证
 * @param {string} platform - 平台标识（wechat_mini / wechat_h5）
 * @returns {{ token: string, refreshToken: string, isNewUser: boolean, userInfo: object }}
 */
async function wxLogin(code, platform = 'wechat_mini') {
  // 1. 调用微信接口获取 openid
  const { openid, session_key, unionid } = await wechatService.code2Session(code);

  // 2. 查找或创建用户
  let user = await prisma.user.findUnique({ where: { openid } });
  let isNewUser = false;

  if (!user) {
    // 新用户注册
    user = await prisma.user.create({
      data: {
        openid,
        unionid,
        sessionKey: session_key,
        role: 'user',
        status: 1
      }
    });
    isNewUser = true;
    logger.info('新用户注册', { userId: user.id.toString(), openid });
  } else {
    // 更新 session_key
    await prisma.user.update({
      where: { id: user.id },
      data: { sessionKey: session_key }
    });
  }

  // 3. 检查用户状态
  if (user.status === 0) {
    throw new Error('账号已被禁用，请联系客服');
  }

  // 4. 生成 JWT Token
  const userId = user.id.toString();
  const token = generateAccessToken(userId, user.role);
  const refreshToken = generateRefreshToken(userId);

  // 5. 组装用户信息
  const userInfo = {
    id: userId,
    openid: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: user.phone ? decrypt(user.phone) : '',
    companyName: user.companyName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };

  logger.info('微信登录成功', { userId, isNewUser });

  return {
    token,
    refreshToken,
    isNewUser,
    userInfo
  };
}

/**
 * 手机号登录
 * 获取手机号 → 查找/更新用户 → 生成 JWT
 * @param {string} code - getPhoneNumber 返回的 code
 * @param {string} [encryptedData] - 旧版加密数据（兼容）
 * @param {string} [iv] - 旧版初始向量（兼容）
 * @returns {{ token: string, refreshToken: string, isNewUser: boolean, userInfo: object }}
 */
async function phoneLogin(code, encryptedData, iv) {
  let purePhoneNumber = '';

  // 1. 获取手机号
  if (encryptedData && iv) {
    // 旧版方式：先 code2Session 获取 session_key，再解密
    const sessionData = await wechatService.code2Session(code);
    const decoded = wechatService.decryptData(sessionData.session_key, encryptedData, iv);
    purePhoneNumber = decoded.purePhoneNumber;
  } else {
    // 新版方式：使用 code 直接获取手机号
    const phoneData = await wechatService.getPhoneNumber(code);
    purePhoneNumber = phoneData.purePhoneNumber;
  }

  if (!purePhoneNumber) {
    throw new Error('获取手机号失败');
  }

  const encryptedPhone = encrypt(purePhoneNumber);

  // 2. 查找已有手机号的用户（按加密值匹配）
  let user = await prisma.user.findFirst({
    where: { phone: encryptedPhone }
  });

  let isNewUser = false;

  if (!user) {
    // 无匹配用户，需先通过微信登录流程创建
    throw new Error('该手机号未注册，请先使用微信登录');
  }

  // 3. 更新手机号（确保最新）
  await prisma.user.update({
    where: { id: user.id },
    data: { phone: encryptedPhone }
  });

  // 4. 检查用户状态
  if (user.status === 0) {
    throw new Error('账号已被禁用，请联系客服');
  }

  // 5. 生成 JWT Token
  const userId = user.id.toString();
  const token = generateAccessToken(userId, user.role);
  const refreshToken = generateRefreshToken(userId);

  // 6. 组装用户信息
  const userInfo = {
    id: userId,
    openid: user.openid,
    nickname: user.nickname,
    avatarUrl: user.avatarUrl,
    phone: purePhoneNumber,
    companyName: user.companyName,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt
  };

  logger.info('手机号登录成功', { userId });

  return {
    token,
    refreshToken,
    isNewUser,
    userInfo
  };
}

/**
 * 刷新 Token
 * 验证 refreshToken → 生成新 token 对 → 旧 refreshToken 加入黑名单
 * @param {string} refreshTokenStr - 刷新令牌
 * @returns {{ token: string, refreshToken: string }}
 */
async function refreshAccessToken(refreshTokenStr) {
  // 1. 验证 refreshToken
  const decoded = verifyRefreshToken(refreshTokenStr);
  const userId = decoded.userId;

  // 2. 检查 refreshToken 是否在黑名单中
  const blacklisted = await redisGet(`token:blacklist:${refreshTokenStr}`);
  if (blacklisted) {
    throw new Error('刷新令牌已失效');
  }

  // 3. 查询用户确保存在且状态正常
  const user = await prisma.user.findUnique({ where: { id: BigInt(userId) } });
  if (!user) {
    throw new Error('用户不存在');
  }
  if (user.status === 0) {
    throw new Error('账号已被禁用');
  }

  // 4. 生成新的 token 对
  const newToken = generateAccessToken(userId, user.role);
  const newRefreshToken = generateRefreshToken(userId);

  // 5. 旧 refreshToken 加入黑名单（过期时间与 JWT 配置一致）
  const refreshExpiresIn = config.jwt.refreshExpiresIn;
  const ttlSeconds = parseExpiryToSeconds(refreshExpiresIn);
  await redisSet(`token:blacklist:${refreshTokenStr}`, { invalidated: true }, ttlSeconds);

  logger.info('Token刷新成功', { userId });

  return {
    token: newToken,
    refreshToken: newRefreshToken
  };
}

/**
 * 退出登录
 * 将当前 token 加入 Redis 黑名单
 * @param {string} userId - 用户ID
 * @param {string} token - 当前 access token
 */
async function logout(userId, token) {
  try {
    // 将 token 加入黑名单，过期时间与 JWT 过期时间一致
    const ttlSeconds = parseExpiryToSeconds(config.jwt.expiresIn);
    await redisSet(`token:blacklist:${token}`, { userId, logoutAt: new Date().toISOString() }, ttlSeconds);

    logger.info('用户退出登录', { userId });
  } catch (err) {
    logger.error('退出登录处理失败', { userId, error: err.message });
    // 不阻断退出流程，即使 Redis 失败也允许退出
  }
}

/**
 * 解析 JWT 过期时间字符串为秒数
 * @param {string} expiry - 如 '7d', '30d', '24h', '3600s'
 * @returns {number} 秒数
 */
function parseExpiryToSeconds(expiry) {
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 3600; // 默认7天

  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return 7 * 24 * 3600;
  }
}

module.exports = {
  wxLogin,
  phoneLogin,
  refreshAccessToken,
  logout
};
