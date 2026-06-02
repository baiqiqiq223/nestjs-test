import { ConfigService } from '@nestjs/config';
import { OssService } from './oss.service';

describe('OssService', () => {
  it('creates a temporary upload signature scoped to one object key', () => {
    const service = new OssService(
      new ConfigService({
        oss: {
          region: 'oss-cn-hangzhou',
          bucket: 'demo-bucket',
          accessKeyId: 'access-id',
          accessKeySecret: 'access-secret',
          uploadDir: 'uploads',
          signatureExpireSeconds: 300,
          maxFileSizeMb: 20,
        },
      }),
    );

    const signature = service.createUploadSignature({
      fileName: 'avatar.png',
      contentType: 'image/png',
      scene: 'avatar',
    });

    const policy = JSON.parse(Buffer.from(signature.policy, 'base64').toString('utf8'));

    expect(signature.host).toBe('https://demo-bucket.oss-cn-hangzhou.aliyuncs.com');
    expect(signature.key).toMatch(/^uploads\/avatar\/\d{4}\/\d{2}\/\d{2}\/.+\.png$/);
    expect(signature.signature).toBeTruthy();
    expect(policy.conditions).toContainEqual(['eq', '$key', signature.key]);
    expect(policy.conditions).toContainEqual(['content-length-range', 1, 20 * 1024 * 1024]);
  });
});
