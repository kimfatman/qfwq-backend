/**
 * 加解密工具 - 企服外勤代办宝
 * AES-256-CBC 加解密 + 订单号生成 + 随机字符串
 */
const crypto = require('crypto');
const config = require('../config/index');

// AES-256-CBC 密钥和 IV（必须为32字节和16字节）
const SECRET_KEY = config.crypto.secretKey.padEnd(32, '0').slice(0, 32);
const IV = config.crypto.iv.padEnd(16, '0').slice(0, 16);

/**
 * AES-256-CBC 加密
 * @param {string} text - 待加密明文
 * @returns {string} 加密后的 Base64 字符串
 */
function encrypt(text) {
  if (!text) return '';
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), Buffer.from(IV));
  let encrypted = cipher.update(text, 'utf8', 'base64');
  encrypted += cipher.final('base64');
  return encrypted;
}

/**
 * AES-256-CBC 解密
 * @param {string} encryptedText - 加密后的 Base64 字符串
 * @returns {string} 解密后的明文
 */
function decrypt(encryptedText) {
  if (!encryptedText) return '';
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(SECRET_KEY), Buffer.from(IV));
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (error) {
    console.error('解密失败:', error.message);
    return '';
  }
}

/**
 * 生成订单编号
 * 格式: QW + YYYYMMDD + 6位随机序号
 * @returns {string} 订单编号，如 QW20260717012345
 */
function generateOrderNo() {
  const now = new Date();
  const dateStr = now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  return `QW${dateStr}${random}`;
}

/**
 * 生成随机字符串
 * @param {number} length - 字符串长度，默认16
 * @returns {string} 随机字符串
 */
function generateRandomString(length = 16) {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
}

module.exports = {
  encrypt,
  decrypt,
  generateOrderNo,
  generateRandomString
};
