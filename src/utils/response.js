/**
 * 统一响应格式工具 - 企服外勤代办宝
 * 所有接口统一返回 { code, message, data } 格式
 */

/**
 * 成功响应
 * @param {import('express').Response} res - Express 响应对象
 * @param {any} data - 响应数据
 * @param {string} message - 响应消息
 * @param {number} httpStatus - HTTP 状态码
 */
function success(res, data = null, message = '操作成功', httpStatus = 200) {
  return res.status(httpStatus).json({
    code: 200,
    message,
    data
  });
}

/**
 * 错误响应
 * @param {import('express').Response} res - Express 响应对象
 * @param {string} message - 错误消息
 * @param {number} code - 业务错误码
 * @param {number} httpStatus - HTTP 状态码
 */
function error(res, message = '操作失败', code = 500, httpStatus = 400) {
  return res.status(httpStatus).json({
    code,
    message,
    data: null
  });
}

/**
 * 分页响应
 * @param {Array} list - 数据列表
 * @param {number} total - 总记录数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页条数
 * @returns {object} 分页数据结构
 */
function paginate(list, total, page, pageSize) {
  const totalPages = Math.ceil(total / pageSize);
  return {
    list,
    pagination: {
      total,
      page: Number(page),
      pageSize: Number(pageSize),
      totalPages,
      hasMore: page < totalPages
    }
  };
}

/**
 * 成功响应（带分页）
 * @param {import('express').Response} res
 * @param {Array} list - 数据列表
 * @param {number} total - 总记录数
 * @param {number} page - 当前页码
 * @param {number} pageSize - 每页条数
 * @param {string} message - 响应消息
 */
function successWithPaginate(res, list, total, page, pageSize, message = '查询成功') {
  return success(res, paginate(list, total, page, pageSize), message);
}

module.exports = {
  success,
  error,
  paginate,
  successWithPaginate
};
