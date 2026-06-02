import { registerAs } from '@nestjs/config';

export interface AppConfig {
  nodeEnv: string;
  port: number;
  apiPrefix: string;
  corsOrigins: string[];
  throttleTtlMs: number;
  throttleLimit: number;
}

export const appConfig = registerAs('app', (): AppConfig => {
  const corsOrigins = process.env.CORS_ORIGINS ?? '';

  return {
    nodeEnv: process.env.NODE_ENV ?? 'development',
    port: Number(process.env.PORT ?? 3000),
    apiPrefix: process.env.API_PREFIX ?? 'api',
    corsOrigins: corsOrigins
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean),
    throttleTtlMs: Number(process.env.THROTTLE_TTL_MS ?? 60_000),
    throttleLimit: Number(process.env.THROTTLE_LIMIT ?? 60),
  };
});
