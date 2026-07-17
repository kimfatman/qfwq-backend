/**
 * 消息通知服务 - 企服外勤代办宝
 * 预留框架：目前仅记录日志，后续对接微信订阅消息
 */
const logger = require('../utils/logger');
const config = require('../config/index');

/**
 * 获取微信 AccessToken（缓存机制）
 * 后续对接时实现：从Redis获取或刷新
 * @returns {string|null} accessToken
 */
async function getAccessToken() {
  // TODO: 实现AccessToken缓存和刷新
  // 1. 从Redis获取缓存的token
  // 2. 如果过期，调用微信API刷新
  // 3. 缓存新token（有效期7200秒，提前5分钟刷新）
  logger.info('获取AccessToken - 待实现');
  return null;
}

/**
 * 发送微信订阅消息
 * @param {string} openId - 用户openId
 * @param {string} templateId - 模板ID
 * @param {object} data - 模板数据
 * @param {string} page - 跳转页面路径
 * @returns {boolean} 是否发送成功
 */
async function sendSubscribeMessage(openId, templateId, data, page = '') {
  try {
    logger.info('发送微信订阅消息（预留）', {
      openId,
      templateId,
      data: JSON.stringify(data),
      page
    });

    // TODO: 实际发送逻辑
    // const accessToken = await getAccessToken();
    // if (!accessToken) {
    //   logger.error('获取AccessToken失败，无法发送订阅消息');
    //   return false;
    // }
    //
    // const axios = require('axios');
    // const url = `https://api.weixin.qq.com/cgi-bin/message/subscribe/send?access_token=${accessToken}`;
    // const result = await axios.post(url, {
    //   touser: openId,
    //   template_id: templateId,
    //   page,
    //   data,
    //   miniprogram_state: config.app.isProd ? 'formal' : 'developer'
    // });
    //
    // if (result.data.errcode !== 0) {
    //   logger.error('微信订阅消息发送失败', { errcode: result.data.errcode, errmsg: result.data.errmsg });
    //   return false;
    // }

    logger.info('微信订阅消息发送成功（模拟）', { openId, templateId });
    return true;
  } catch (err) {
    logger.error('发送微信订阅消息异常', { error: err.message, openId, templateId });
    return false;
  }
}

/**
 * 新订单通知匹配外勤
 * @param {object} order - 订单信息
 * @returns {boolean} 是否通知成功
 */
async function notifyNewOrder(order) {
  try {
    logger.info('新订单通知（预留）', {
      orderId: order.id,
      orderNo: order.orderNo,
      serviceId: order.serviceId,
      title: order.title
    });

    // TODO: 实际通知逻辑
    // 1. 根据订单服务类型+地区匹配外勤
    // 2. 向匹配的外勤发送订阅消息
    // 3. 模板ID从配置中读取
    // const templateId = config.wechat.templates.newOrder;
    // for (const runner of matchedRunners) {
    //   await sendSubscribeMessage(runner.openId, templateId, {
    //     thing1: { value: order.title },
    //     amount2: { value: `${order.basePrice}元` },
    //     time3: { value: order.createdAt.toLocaleString() }
    //   }, `pages/order/detail?id=${order.id}`);
    // }

    return true;
  } catch (err) {
    logger.error('新订单通知失败', { error: err.message, orderId: order.id });
    return false;
  }
}

/**
 * 新报价通知企业
 * @param {object} quote - 报价信息
 * @param {object} order - 订单信息
 * @returns {boolean} 是否通知成功
 */
async function notifyNewQuote(quote, order) {
  try {
    logger.info('新报价通知（预留）', {
      orderId: order.id,
      quoteId: quote.id,
      runnerId: quote.runnerId,
      price: quote.price
    });

    // TODO: 实际通知逻辑
    // const templateId = config.wechat.templates.newQuote;
    // await sendSubscribeMessage(order.user.openId, templateId, {
    //   thing1: { value: order.title },
    //   amount2: { value: `${quote.price}元` },
    //   time3: { value: quote.createdAt.toLocaleString() }
    // }, `pages/order/detail?id=${order.id}`);

    return true;
  } catch (err) {
    logger.error('新报价通知失败', { error: err.message, orderId: order.id });
    return false;
  }
}

/**
 * 订单已分配通知外勤
 * @param {object} order - 订单信息
 * @param {object} runner - 外勤信息
 * @returns {boolean} 是否通知成功
 */
async function notifyOrderAssigned(order, runner) {
  try {
    logger.info('订单分配通知（预留）', {
      orderId: order.id,
      runnerId: runner.id,
      runnerName: runner.realName
    });

    // TODO: 实际通知逻辑
    // const templateId = config.wechat.templates.orderAssigned;
    // await sendSubscribeMessage(runner.user.openId, templateId, {
    //   thing1: { value: order.title },
    //   thing2: { value: order.contactName },
    //   phone_number3: { value: order.contactPhone }
    // }, `pages/runner/order/detail?id=${order.id}`);

    return true;
  } catch (err) {
    logger.error('订单分配通知失败', { error: err.message, orderId: order.id });
    return false;
  }
}

/**
 * 订单完成通知企业
 * @param {object} order - 订单信息
 * @returns {boolean} 是否通知成功
 */
async function notifyOrderCompleted(order) {
  try {
    logger.info('订单完成通知（预留）', {
      orderId: order.id,
      orderNo: order.orderNo,
      userId: order.userId
    });

    // TODO: 实际通知逻辑
    // const templateId = config.wechat.templates.orderCompleted;
    // await sendSubscribeMessage(order.user.openId, templateId, {
    //   thing1: { value: order.title },
    //   time2: { value: new Date().toLocaleString() },
    //   thing3: { value: '请及时确认并评价' }
    // }, `pages/order/detail?id=${order.id}`);

    return true;
  } catch (err) {
    logger.error('订单完成通知失败', { error: err.message, orderId: order.id });
    return false;
  }
}

module.exports = {
  sendSubscribeMessage,
  notifyNewOrder,
  notifyNewQuote,
  notifyOrderAssigned,
  notifyOrderCompleted
};
