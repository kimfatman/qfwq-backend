/**
 * 报价控制器 - 企服外勤代办宝
 * 报价列表、详情、选择报价、报价统计
 */
const { asyncHandler } = require('../middleware/errorHandler');
const { success, error } = require('../utils/response');
const quoteService = require('../services/quoteService');

/**
 * 获取订单报价列表
 * GET /quote/list/:orderId
 */
const getList = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const quotes = await quoteService.getQuoteList(orderId);
  return success(res, quotes, '查询成功');
});

/**
 * 获取报价详情
 * GET /quote/detail/:id
 */
const getDetail = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const quote = await quoteService.getQuoteDetail(id);
  return success(res, quote, '查询成功');
});

/**
 * 选择报价
 * POST /quote/select/:id
 */
const selectQuote = asyncHandler(async (req, res) => {
  const userId = req.user.userId;
  const { id } = req.params;

  const result = await quoteService.selectQuote(userId, id);
  return success(res, result, '报价选择成功');
});

/**
 * 获取报价统计
 * GET /quote/stats/:orderId
 */
const getStats = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const stats = await quoteService.getQuoteStats(orderId);
  return success(res, stats, '查询成功');
});

module.exports = {
  getList,
  getDetail,
  selectQuote,
  getStats
};
