import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { WechatLoginDto } from './dto/wechat-login.dto';
import { LoginResponse } from './interfaces/login-response.interface';

@Controller({ path: 'auth', version: '1' })
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('wechat/login')
  loginWithWechatCode(@Body() dto: WechatLoginDto): Promise<LoginResponse> {
    return this.authService.loginWithWechatCode(dto);
  }
}
