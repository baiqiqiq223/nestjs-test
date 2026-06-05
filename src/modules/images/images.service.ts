import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { CreateImageDto } from './dto/create-image.dto';
import { ListImagesDto } from './dto/list-images.dto';
import { ImageListResponse, ImageRecord } from './interfaces/image-record.interface';

@Injectable()
export class ImagesService {
  private readonly images: ImageRecord[] = [];

  create(userId: string, dto: CreateImageDto): ImageRecord {
    const now = new Date().toISOString();
    const image: ImageRecord = {
      id: randomUUID(),
      userId,
      imageUrl: dto.imageUrl,
      title: dto.title,
      description: dto.description,
      createdAt: now,
      updatedAt: now,
    };

    this.images.unshift(image);
    return image;
  }

  listByUser(userId: string, query: ListImagesDto): ImageListResponse {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const userImages = this.images.filter((image) => image.userId === userId);
    const start = (page - 1) * pageSize;

    return {
      items: userImages.slice(start, start + pageSize),
      total: userImages.length,
      page,
      pageSize,
    };
  }
}
