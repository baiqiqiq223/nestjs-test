import { IsOptional, IsString, Matches, MaxLength } from 'class-validator';

export class CreateUploadSignatureDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message: 'fileName can only contain letters, numbers, dot, underscore and hyphen',
  })
  fileName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(128)
  contentType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(32)
  @Matches(/^[a-zA-Z0-9_-]+$/, {
    message: 'scene can only contain letters, numbers, underscore and hyphen',
  })
  scene?: string;
}
