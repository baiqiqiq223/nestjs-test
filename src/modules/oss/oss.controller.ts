import { Controller, Get, Query } from '@nestjs/common';
import { CreateUploadSignatureDto } from './dto/create-upload-signature.dto';
import { UploadSignature } from './interfaces/upload-signature.interface';
import { OssService } from './oss.service';

@Controller({ path: 'oss', version: '1' })
export class OssController {
  constructor(private readonly ossService: OssService) {}

  @Get('upload/signature')
  createUploadSignature(@Query() query: CreateUploadSignatureDto): UploadSignature {
    return this.ossService.createUploadSignature(query);
  }
}
