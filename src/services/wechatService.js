/**
 * 微信API服务 - 企服外勤代办宝
 * 封装微信小程序接口调用：code2Session、手机号获取、数据解密
 */
const axios = require('axios');
const wechatConfig = require('../config/wechat');
const logger = require('../utils/logger');

/**
 * 调用微信 code2Session 接口
 * 通过临时登录凭证 code 换取用户唯一标识 openid 和会话密钥 session_key
 * @param {string} code - 微信登录凭证 code
 * @returns {{ openid: string, session_key: string, unionid?: string }}
 */
async function code2Session(code) {
  try {
    const url = wechatConfig.getCode2SessionUrl(code);
    const { data } = await axios.get(url, { timeout: 10000 });

    if (data.errcode) {
      logger.error('微信code2Session失败', { errcode: data.errcode, errmsg: data.errmsg });
      throw new Error(`微信登录失败: ${data.errmsg || '未知错误'}`);
    }

    logger.info('微信code2Session成功', { openid: data.openid });
    return {
      openid: data.openid,
      session_key: data.session_key,
      unionid: data.unionid || null
    };
  } catch (err) {
    if (err.response) {
      logger.error('微信code2Session网络错误', {
        status: err.response.status,
        data: err.response.data
      });
      throw new Error('微信服务请求失败，请稍后重试');
    }
    throw err;
  }
}

/**
 * 新版手机号获取接口（使用 code 换取手机号）
 * 微信小程序 getPhoneNumber 接口返回的 code 换取用户手机号
 * 需要先获取 access_token，再调用 getUserPhoneNumber 接口
 * @param {string} code - getPhoneNumber 返回的 code
 * @returns {{ phoneNumber: string, purePhoneNumber: string, countryCode: string }}
 */
async function getPhoneNumber(code) {
  try {
    // 1. 获取 access_token
    const accessTokenUrl = wechatConfig.getAccessTokenUrl();
    const { data: tokenData } = await axios.get(accessTokenUrl, { timeout: 10000 });

    if (tokenData.errcode) {
      logger.error('获取微信access_token失败', { errcode: tokenData.errcode, errmsg: tokenData.errmsg });
      throw new Error(`获取access_token失败: ${tokenData.errmsg}`);
    }

    const accessToken = tokenData.access_token;

    // 2. 使用 code + access_token 获取手机号
    const phoneUrl = `https://api.weixin.qq.com/wxa/business/getuserphonenumber?access_token=${accessToken}`;
    const { data: phoneData } = await axios.post(phoneUrl, { code }, { timeout: 10000 });

    if (phoneData.errcode !== 0) {
      logger.error('获取微信手机号失败', { errcode: phoneData.errcode, errmsg: phoneData.errmsg });
      throw new Error(`获取手机号失败: ${phoneData.errmsg || '未知错误'}`);
    }

    const info = phoneData.phone_info;
    return {
      phoneNumber: info.phoneNumber,
      purePhoneNumber: info.purePhoneNumber,
      countryCode: info.countryCode
    };
  } catch (err) {
    if (err.response) {
      logger.error('获取微信手机号网络错误', {
        status: err.response.status,
        data: err.response.data
      });
      throw new Error('微信手机号服务请求失败，请稍后重试');
    }
    throw err;
  }
}

/**
 * 旧版微信数据解密（兼容）
 * 使用 session_key 解密微信返回的加密数据
 * @param {string} sessionKey - 会话密钥
 * @param {string} encryptedData - 加密数据
 * @param {string} iv - 初始向量
 * @returns {object} 解密后的数据对象
 */
function decryptData(sessionKey, encryptedData, iv) {
  try {
    const crypto = require('crypto');

    // Base64 解码
    const sessionKeyBuf = Buffer.from(sessionKey, 'base64');
    const encryptedDataBuf = Buffer.from(encryptedData, 'base64');
    const ivBuf = Buffer.from(iv, 'base64');

    // AES-128-CBC 解密
    const decipher = crypto.createDecipheriv('aes-128-cbc', sessionKeyBuf, ivBuf);
    decipher.setAutoPadding(true);

    let decrypted = decipher.update(encryptedDataBuf, null, 'utf8');
    decrypted += decipher.final('utf8');

    const decoded = JSON.parse(decrypted);

    // 校验 appId
    if (decoded.watermark && decoded.watermark.appid !== wechatConfig.appId) {
      logger.error('微信数据解密appId校验失败', {
        expected: wechatConfig.appId,
        actual: decoded.watermark.appid
      });
      throw new Error('数据校验失败');
    }

    return decoded;
  } catch (err) {
    logger.error('微信数据解密失败', { error: err.message });
    throw new Error('数据解密失败');
  }
}

module.exports = {
  code2Session,
  getPhoneNumber,
  decryptData
};
