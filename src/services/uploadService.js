/**
 * 文件上传服务 - 企服外勤代办宝
 * 支持本地存储（开发环境）和腾讯云COS（生产环境）
 */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config/index');

// 本地上传目录
const UPLOAD_DIR = path.resolve(process.cwd(), config.upload.uploadDir);

// 确保上传目录存在
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

/**
 * 生成本地文件URL
 * @param {string} filename - 文件名
 * @returns {string} 文件访问URL
 */
function buildLocalUrl(filename) {
  return `/uploads/${filename}`;
}

/**
 * 生成COS文件路径
 * @param {string} orderId - 订单ID
 * @param {string} ext - 文件扩展名
 * @returns {string} COS对象路径
 */
function buildCosKey(orderId, ext) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(4).toString('hex');
  return `orders/${orderId}/${timestamp}_${random}${ext}`;
}

/**
 * 上传文件到本地存储（开发环境）
 * @param {object} file - multer 处理后的文件对象
 * @returns {object} { url, filename, size }
 */
function uploadToLocal(file) {
  try {
    // multer 已经将文件保存到 uploads/ 目录
    const filename = file.filename;
    const url = buildLocalUrl(filename);

    logger.info('文件上传到本地存储', { filename, url });

    return {
      url,
      filename,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (err) {
    logger.error('本地文件上传失败', { error: err.message });
    throw new Error('文件上传失败');
  }
}

/**
 * 上传文件到腾讯云COS（生产环境）
 * 使用 cos-nodejs-sdk-v5
 * @param {object} file - multer 处理后的文件对象
 * @param {string} orderId - 关联订单ID
 * @returns {object} { url, key, size }
 */
async function uploadToCOS(file, orderId = 'default') {
  try {
    const COS = require('cos-nodejs-sdk-v5');
    const cos = new COS({
      SecretId: config.cos.secretId,
      SecretKey: config.cos.secretKey
    });

    const ext = path.extname(file.originalname).toLowerCase();
    const key = buildCosKey(orderId, ext);

    await cos.putObject({
      Bucket: config.cos.bucket,
      Region: config.cos.region,
      Key: key,
      Body: fs.createReadStream(file.path),
      ContentLength: file.size,
      ContentType: file.mimetype
    });

    // CDN URL（如果有CDN域名则使用CDN，否则使用COS默认域名）
    const cdnDomain = process.env.COS_CDN_DOMAIN || '';
    const url = cdnDomain
      ? `https://${cdnDomain}/${key}`
      : `https://${config.cos.bucket}.cos.${config.cos.region}.myqcloud.com/${key}`;

    // 上传到COS后删除本地临时文件
    try {
      fs.unlinkSync(file.path);
    } catch (e) {
      logger.warn('删除临时文件失败', { path: file.path, error: e.message });
    }

    logger.info('文件上传到COS', { key, url });

    return {
      url,
      key,
      size: file.size,
      mimeType: file.mimetype
    };
  } catch (err) {
    logger.error('COS文件上传失败', { error: err.message, orderId });
    throw new Error('文件上传失败');
  }
}

/**
 * 统一上传入口 - 根据环境自动选择存储方式
 * @param {object} file - multer 处理后的文件对象
 * @param {string} orderId - 关联订单ID（COS路径需要）
 * @returns {object} { url, filename/key, size }
 */
async function upload(file, orderId = 'default') {
  if (config.app.isProd && config.cos.secretId && config.cos.bucket) {
    return uploadToCOS(file, orderId);
  }
  return uploadToLocal(file);
}

/**
 * 删除文件
 * @param {string} fileUrl - 文件URL
 * @returns {boolean} 是否删除成功
 */
async function deleteFile(fileUrl) {
  try {
    // 本地文件删除
    if (fileUrl.startsWith('/uploads/')) {
      const filename = fileUrl.replace('/uploads/', '');
      const filePath = path.join(UPLOAD_DIR, filename);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        logger.info('本地文件已删除', { fileUrl });
      }
      return true;
    }

    // COS 文件删除
    if (fileUrl.includes('.cos.') || fileUrl.includes(process.env.COS_CDN_DOMAIN || '__invalid__')) {
      const COS = require('cos-nodejs-sdk-v5');
      const cos = new COS({
        SecretId: config.cos.secretId,
        SecretKey: config.cos.secretKey
      });

      // 从URL提取key
      const urlObj = new URL(fileUrl);
      const key = urlObj.pathname.substring(1);

      await cos.deleteObject({
        Bucket: config.cos.bucket,
        Region: config.cos.region,
        Key: key
      });

      logger.info('COS文件已删除', { key });
      return true;
    }

    logger.warn('无法识别的文件URL格式', { fileUrl });
    return false;
  } catch (err) {
    logger.error('文件删除失败', { fileUrl, error: err.message });
    return false;
  }
}

/**
 * 生成预签名上传URL（可选功能）
 * 用于客户端直传COS场景
 * @param {string} fileType - 文件MIME类型
 * @param {string} fileName - 原始文件名
 * @param {string} orderId - 关联订单ID
 * @param {number} expires - URL有效期（秒），默认3600
 * @returns {object} { uploadUrl, key, url }
 */
async function getUploadUrl(fileType, fileName, orderId = 'default', expires = 3600) {
  try {
    const COS = require('cos-nodejs-sdk-v5');
    const cos = new COS({
      SecretId: config.cos.secretId,
      SecretKey: config.cos.secretKey
    });

    const ext = path.extname(fileName).toLowerCase();
    const key = buildCosKey(orderId, ext);

    const uploadUrl = cos.getObjectUrl({
      Bucket: config.cos.bucket,
      Region: config.cos.region,
      Key: key,
      Sign: true,
      Expires: expires,
      Query: {
        'content-type': fileType
      }
    });

    const cdnDomain = process.env.COS_CDN_DOMAIN || '';
    const url = cdnDomain
      ? `https://${cdnDomain}/${key}`
      : `https://${config.cos.bucket}.cos.${config.cos.region}.myqcloud.com/${key}`;

    logger.info('生成预签名上传URL', { key, orderId });

    return { uploadUrl, key, url };
  } catch (err) {
    logger.error('生成预签名URL失败', { error: err.message, fileName, orderId });
    throw new Error('生成上传地址失败');
  }
}

module.exports = {
  uploadToLocal,
  uploadToCOS,
  upload,
  deleteFile,
  getUploadUrl
};
