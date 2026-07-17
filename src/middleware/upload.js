/**
 * 文件上传中间件 - 企服外勤代办宝
 * 基于 multer，临时存储到 uploads/ 目录
 */
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const { error } = require('../utils/response');
const config = require('../config/index');

// 存储配置
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, config.upload.uploadDir);
  },
  filename(req, file, cb) {
    // 文件名格式: timestamp_random.ext
    const timestamp = Date.now();
    const random = crypto.randomBytes(4).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${timestamp}_${random}${ext}`);
  }
});

// 文件过滤
function fileFilter(req, file, cb) {
  const ext = path.extname(file.originalname).toLowerCase();
  if (config.upload.allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`不支持的文件类型: ${ext}，仅支持 ${config.upload.allowedExtensions.join(', ')}`), false);
  }
}

// 创建 multer 实例
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxSize // 10MB
  }
});

/**
 * 单文件上传中间件
 * @param {string} fieldName - 表单字段名，默认 'file'
 */
function singleUpload(fieldName = 'file') {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, '文件大小超出限制（最大10MB）', 413, 413);
        }
        return error(res, `上传错误: ${err.message}`, 400, 400);
      }
      if (err) {
        return error(res, err.message, 400, 400);
      }
      next();
    });
  };
}

/**
 * 多文件上传中间件
 * @param {string} fieldName - 表单字段名
 * @param {number} maxCount - 最大文件数，默认5
 */
function multiUpload(fieldName = 'files', maxCount = 5) {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return error(res, '文件大小超出限制（最大10MB）', 413, 413);
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
          return error(res, `文件数量超出限制（最多${maxCount}个）`, 400, 400);
        }
        return error(res, `上传错误: ${err.message}`, 400, 400);
      }
      if (err) {
        return error(res, err.message, 400, 400);
      }
      next();
    });
  };
}

module.exports = {
  upload,
  singleUpload,
  multiUpload
};
