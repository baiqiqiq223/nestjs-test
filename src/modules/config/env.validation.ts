import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string().valid('development', 'test', 'production').default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().trim().default('api'),
  CORS_ORIGINS: Joi.string().trim().allow('').default(''),
  THROTTLE_TTL_MS: Joi.number().integer().min(1000).default(60_000),
  THROTTLE_LIMIT: Joi.number().integer().min(1).default(60),

  OSS_REGION: Joi.string().trim().required(),
  OSS_BUCKET: Joi.string().trim().required(),
  OSS_ACCESS_KEY_ID: Joi.string().trim().required(),
  OSS_ACCESS_KEY_SECRET: Joi.string().trim().required(),
  OSS_UPLOAD_DIR: Joi.string().trim().default('uploads'),
  OSS_SIGNATURE_EXPIRE_SECONDS: Joi.number().integer().min(30).max(3600).default(300),
  OSS_MAX_FILE_SIZE_MB: Joi.number().integer().min(1).max(500).default(20),
}).unknown(true);
