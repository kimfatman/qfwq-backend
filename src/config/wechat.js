/**
 * 微信小程序配置 - 企服外勤代办宝
 * 提供微信登录和接口调用所需配置
 */
const config = require('./index');

const wechatConfig = {
  /** 小程序 AppID */
  appId: config.wechat.appId,

  /** 小程序 Secret */
  secret: config.wechat.secret,

  /** code2Session 接口地址 */
  code2SessionUrl: config.wechat.code2SessionUrl,

  /** AccessToken 接口地址 */
  accessTokenUrl: config.wechat.accessTokenUrl,

  /**
   * 获取 code2Session 完整 URL
   * @param {string} code - 微信登录凭证 code
   * @returns {string} 完整请求 URL
   */
  getCode2SessionUrl(code) {
    return `${this.code2SessionUrl}?appid=${this.appId}&secret=${this.secret}&js_code=${code}&grant_type=authorization_code`;
  },

  /**
   * 获取 AccessToken 完整 URL
   * @returns {string} 完整请求 URL
   */
  getAccessTokenUrl() {
    return `${this.accessTokenUrl}?grant_type=client_credential&appid=${this.appId}&secret=${this.secret}`;
  }
};

module.exports = wechatConfig;
