import { Body, Controller, Get, Post, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthUser } from '../auth/interfaces/auth-user.interface';
import { CreateImageDto } from './dto/create-image.dto';
import { ListImagesDto } from './dto/list-images.dto';
import { ImageListResponse, ImageRecord } from './interfaces/image-record.interface';
import { ImagesService } from './images.service';

@Controller({ path: 'images', version: '1' })
@UseGuards(AuthGuard)
export class ImagesController {
  constructor(private readonly imagesService: ImagesService) {}

  @Post()
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateImageDto): ImageRecord {
    return this.imagesService.create(user.id, dto);
  }

  @Get()
  list(@CurrentUser() user: AuthUser, @Query() query: ListImagesDto): ImageListResponse {
    return this.imagesService.listByUser(user.id, query);
  }
}
