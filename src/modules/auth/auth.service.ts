import { Injectable, UnauthorizedException } from '@nestjs/common';
import { randomBytes, randomUUID } from 'node:crypto';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { AuthUser } from './interfaces/auth-user.interface';
import { LoginResponse } from './interfaces/login-response.interface';
import { WechatApiService } from './wechat-api.service';

interface StoredUser extends AuthUser {
  createdAt: string;
  lastLoginAt: string;
}

interface StoredTokenSession {
  user: StoredUser;
  lastUsedAt: number;
  expiresAt: number;
}

@Injectable()
export class AuthService {
  static readonly tokenIdleTimeoutMs = 30 * 24 * 60 * 60 * 1000;
  static readonly tokenIdleTimeoutSeconds = AuthService.tokenIdleTimeoutMs / 1000;

  private readonly usersByOpenid = new Map<string, StoredUser>();
  private readonly sessionsByToken = new Map<string, StoredTokenSession>();

  constructor(private readonly wechatApiService: WechatApiService) {}

  async loginWithWechatCode(dto: WechatLoginDto): Promise<LoginResponse> {
    const session = await this.wechatApiService.codeToSession(dto.code);
    const now = new Date().toISOString();
    const user = this.usersByOpenid.get(session.openid) ?? {
      id: randomUUID(),
      openid: session.openid,
      unionid: session.unionid,
      createdAt: now,
      lastLoginAt: now,
    };

    user.unionid = session.unionid ?? user.unionid;
    user.nickname = dto.nickname ?? user.nickname;
    user.avatarUrl = dto.avatarUrl ?? user.avatarUrl;
    user.lastLoginAt = now;
    this.usersByOpenid.set(user.openid, user);

    const token = randomBytes(32).toString('hex');
    const expiresAt = this.createSession(token, user);

    return {
      token,
      expiresIn: AuthService.tokenIdleTimeoutSeconds,
      expiresAt: new Date(expiresAt).toISOString(),
      user: this.toAuthUser(user),
    };
  }

  authenticate(token: string): AuthUser {
    const session = this.sessionsByToken.get(token);

    if (!session) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const now = Date.now();

    if (session.expiresAt <= now) {
      this.sessionsByToken.delete(token);
      throw new UnauthorizedException('Invalid or expired token');
    }

    session.lastUsedAt = now;
    session.expiresAt = now + AuthService.tokenIdleTimeoutMs;

    return this.toAuthUser(session.user);
  }

  private createSession(token: string, user: StoredUser): number {
    const now = Date.now();
    const expiresAt = now + AuthService.tokenIdleTimeoutMs;

    this.sessionsByToken.set(token, {
      user,
      lastUsedAt: now,
      expiresAt,
    });

    return expiresAt;
  }

  private toAuthUser(user: StoredUser): AuthUser {
    return {
      id: user.id,
      openid: user.openid,
      unionid: user.unionid,
      nickname: user.nickname,
      avatarUrl: user.avatarUrl,
    };
  }
}
