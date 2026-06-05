import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { WechatLoginDto } from './wechat-login.dto';

describe('WechatLoginDto', () => {
  const validateDto = (payload: Record<string, unknown>) => {
    return validate(plainToInstance(WechatLoginDto, payload));
  };

  it('accepts wechat temporary avatar urls', async () => {
    const errors = await validateDto({
      code: 'wx-code',
      nickname: '白迟',
      avatarUrl: 'http://tmp/2Gi15mYa8P8Mbe5eb9ec15490fcbe71e37f858d8ba32.jpeg',
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects avatar urls without http or https protocol', async () => {
    const errors = await validateDto({
      code: 'wx-code',
      avatarUrl: 'tmp/2Gi15mYa8P8Mbe5eb9ec15490fcbe71e37f858d8ba32.jpeg',
    });

    expect(errors).toHaveLength(1);
    expect(errors[0].property).toBe('avatarUrl');
  });
});
