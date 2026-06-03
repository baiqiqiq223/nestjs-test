import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { OssConfig } from '../config/oss.config';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UploadSignature } from './interfaces/upload-signature.interface';

@Injectable()
export class OssService {
  private readonly ossConfig: OssConfig;

  constructor(private readonly configService: ConfigService) {
    this.ossConfig = this.configService.getOrThrow<OssConfig>('oss');
  }

  createUploadSignature(dto: CreateUploadSignatureDto): UploadSignature {
    const now = new Date();
    const expireAt = new Date(now.getTime() + this.ossConfig.signatureExpireSeconds * 1000);
    const maxFileSize = this.ossConfig.maxFileSizeMb * 1024 * 1024;
    const key = this.buildObjectKey(dto);

    /*
     * 前端直传时，OSS 会校验这个 POST Policy。
     * 后端在这里限制过期时间、对象 Key 和文件大小，即使签名泄露，
     * 攻击者也只能在很短时间内上传到这个唯一对象路径。
     */
    const policy = {
      expiration: expireAt.toISOString(),
      conditions: [
        ['eq', '$key', key],
        ['content-length-range', 1, maxFileSize],
        ['eq', '$success_action_status', '200'],
        ...(dto.contentType ? [['starts-with', '$Content-Type', dto.contentType]] : []),
      ],
    };

    const encodedPolicy = Buffer.from(JSON.stringify(policy)).toString('base64');
    const signature = createHmac('sha1', this.ossConfig.accessKeySecret)
      .update(encodedPolicy)
      .digest('base64');

    return {
      host: this.getHost(),
      key,
      policy: encodedPolicy,
      signature,
      accessId: this.ossConfig.accessKeyId,
      expireAt: expireAt.toISOString(),
      maxFileSize,
      successActionStatus: '200',
    };
  }

  private buildObjectKey(dto: CreateUploadSignatureDto): string {
    const safeScene = this.trimSlashes(dto.scene ?? 'default');
    const datePath = this.formatDatePath(new Date());
    const extension = this.getSafeExtension(dto.fileName);

    return `${safeScene}/${datePath}/${randomUUID()}${extension}`;
  }

  private formatDatePath(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}${month}${day}`;
  }

  private getSafeExtension(fileName?: string): string {
    if (!fileName) {
      return '';
    }

    const extension = extname(fileName).toLowerCase();
    return /^[.][a-z0-9]{1,12}$/.test(extension) ? extension : '';
  }

  private trimSlashes(value: string): string {
    return value.replace(/^\/+|\/+$/g, '');
  }

  private getHost(): string {
    return `https://${this.ossConfig.bucket}.${this.ossConfig.region}.aliyuncs.com`;
  }
}
