import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { WechatApiService } from './wechat-api.service';

@Module({
  controllers: [AuthController],
  providers: [AuthService, WechatApiService, AuthGuard],
  exports: [AuthService, AuthGuard],
})
export class AuthModule {}
