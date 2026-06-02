import { registerAs } from '@nestjs/config';

export interface OssConfig {
  region: string;
  bucket: string;
  accessKeyId: string;
  accessKeySecret: string;
  uploadDir: string;
  signatureExpireSeconds: number;
  maxFileSizeMb: number;
}

export const ossConfig = registerAs(
  'oss',
  (): OssConfig => ({
    region: process.env.OSS_REGION ?? '',
    bucket: process.env.OSS_BUCKET ?? '',
    accessKeyId: process.env.OSS_ACCESS_KEY_ID ?? '',
    accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET ?? '',
    uploadDir: process.env.OSS_UPLOAD_DIR ?? 'uploads',
    signatureExpireSeconds: Number(process.env.OSS_SIGNATURE_EXPIRE_SECONDS ?? 300),
    maxFileSizeMb: Number(process.env.OSS_MAX_FILE_SIZE_MB ?? 20),
  }),
);
