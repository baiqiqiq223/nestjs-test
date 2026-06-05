import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WechatApiService } from './wechat-api.service';

describe('AuthService', () => {
  const createService = () => {
    const wechatApiService = {
      codeToSession: jest.fn().mockResolvedValue({
        openid: 'openid-1',
        unionid: 'unionid-1',
      }),
    } as unknown as jest.Mocked<WechatApiService>;

    return {
      service: new AuthService(wechatApiService),
      wechatApiService,
    };
  };

  it('logs in with a wechat code and returns a backend token', async () => {
    const { service, wechatApiService } = createService();

    const response = await service.loginWithWechatCode({ code: 'wx-code' });

    expect(wechatApiService.codeToSession).toHaveBeenCalledWith('wx-code');
    expect(response.token).toHaveLength(64);
    expect(response.expiresIn).toBe(30 * 24 * 60 * 60);
    expect(new Date(response.expiresAt).getTime()).toBeGreaterThan(Date.now());
    expect(response.user.openid).toBe('openid-1');
    expect(response.user.unionid).toBe('unionid-1');
  });

  it('authenticates a previously issued token', async () => {
    const { service } = createService();
    const response = await service.loginWithWechatCode({ code: 'wx-code' });

    expect(service.authenticate(response.token)).toEqual(response.user);
  });

  it('rejects unknown tokens', () => {
    const { service } = createService();

    expect(() => service.authenticate('bad-token')).toThrow(UnauthorizedException);
  });

  it('stores optional nickname and avatar url from the mini program', async () => {
    const { service } = createService();

    const response = await service.loginWithWechatCode({
      code: 'wx-code',
      nickname: '张三',
      avatarUrl: 'https://example.com/avatar.png',
    });

    expect(response.user.nickname).toBe('张三');
    expect(response.user.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('keeps existing profile when the next login does not include profile fields', async () => {
    const { service } = createService();

    const first = await service.loginWithWechatCode({
      code: 'wx-code',
      nickname: '张三',
      avatarUrl: 'https://example.com/avatar.png',
    });
    const second = await service.loginWithWechatCode({ code: 'wx-code' });

    expect(second.user.id).toBe(first.user.id);
    expect(second.user.nickname).toBe('张三');
    expect(second.user.avatarUrl).toBe('https://example.com/avatar.png');
  });

  it('expires tokens that have not been used for 30 days', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const { service } = createService();
    const response = await service.loginWithWechatCode({ code: 'wx-code' });

    jest.setSystemTime(new Date('2026-02-01T00:00:00.001Z'));

    expect(() => service.authenticate(response.token)).toThrow(UnauthorizedException);

    jest.useRealTimers();
  });

  it('extends token lifetime after successful authentication', async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-01-01T00:00:00.000Z'));

    const { service } = createService();
    const response = await service.loginWithWechatCode({ code: 'wx-code' });

    jest.setSystemTime(new Date('2026-01-30T00:00:00.000Z'));
    expect(service.authenticate(response.token)).toEqual(response.user);

    jest.setSystemTime(new Date('2026-02-28T00:00:00.000Z'));
    expect(service.authenticate(response.token)).toEqual(response.user);

    jest.useRealTimers();
  });
});
