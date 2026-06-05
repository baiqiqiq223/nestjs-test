import { BadGatewayException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WechatConfig } from '../config/wechat.config';

interface WechatSessionResponse {
  openid?: string;
  unionid?: string;
  session_key?: string;
  errcode?: number;
  errmsg?: string;
}

export interface WechatSession {
  openid: string;
  unionid?: string;
}

@Injectable()
export class WechatApiService {
  private readonly wechatConfig: WechatConfig;

  constructor(private readonly configService: ConfigService) {
    this.wechatConfig = this.configService.getOrThrow<WechatConfig>('wechat');
  }

  async codeToSession(code: string): Promise<WechatSession> {
    const url = new URL(this.wechatConfig.loginUrl);
    url.searchParams.set('appid', this.wechatConfig.appId);
    url.searchParams.set('secret', this.wechatConfig.appSecret);
    url.searchParams.set('js_code', code);
    url.searchParams.set('grant_type', 'authorization_code');

    const response = await fetch(url);

    if (!response.ok) {
      throw new BadGatewayException('Wechat login service is unavailable');
    }

    const payload = (await response.json()) as WechatSessionResponse;

    if (payload.errcode || !payload.openid) {
      throw new BadGatewayException(payload.errmsg ?? 'Wechat login failed');
    }

    return {
      openid: payload.openid,
      unionid: payload.unionid,
    };
  }
}
