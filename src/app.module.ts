import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuthModule } from './modules/auth/auth.module';
import { HealthModule } from './modules/health/health.module';
import { ImagesModule } from './modules/images/images.module';
import { OssModule } from './modules/oss/oss.module';
import { appConfig } from './modules/config/app.config';
import { ossConfig } from './modules/config/oss.config';
import { envValidationSchema } from './modules/config/env.validation';
import { wechatConfig } from './modules/config/wechat.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      envFilePath: ['.env.local', '.env'],
      load: [appConfig, ossConfig, wechatConfig],
      validationSchema: envValidationSchema,
    }),
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => [
        {
          ttl: configService.getOrThrow<number>('app.throttleTtlMs'),
          limit: configService.getOrThrow<number>('app.throttleLimit'),
        },
      ],
    }),
    HealthModule,
    OssModule,
    AuthModule,
    ImagesModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
