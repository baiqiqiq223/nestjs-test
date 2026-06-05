import { IsString, IsUrl, MaxLength } from 'class-validator';

export class CreateImageDto {
  @IsString()
  @IsUrl({ require_protocol: true })
  @MaxLength(2048)
  imageUrl!: string;

  @IsString()
  @MaxLength(20)
  title!: string;

  @IsString()
  @MaxLength(100)
  description!: string;
}
