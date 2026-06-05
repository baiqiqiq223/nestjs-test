import { IsOptional, IsString, IsUrl, MaxLength, MinLength } from 'class-validator';

export class WechatLoginDto {
  @IsString()
  @MinLength(1)
  @MaxLength(128)
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  nickname?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_protocol: true, require_tld: false, protocols: ['http', 'https'] })
  @MaxLength(2048)
  avatarUrl?: string;
}
