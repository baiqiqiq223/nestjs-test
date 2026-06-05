import { registerAs } from '@nestjs/config';

export interface WechatConfig {
  appId: string;
  appSecret: string;
  loginUrl: string;
}

export const wechatConfig = registerAs('wechat', (): WechatConfig => {
  return {
    appId: process.env.WECHAT_MINI_APP_ID ?? '',
    appSecret: process.env.WECHAT_MINI_APP_SECRET ?? '',
    loginUrl: 'https://api.weixin.qq.com/sns/jscode2session',
  };
});
