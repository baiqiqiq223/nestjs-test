export interface ImageRecord {
  id: string;
  userId: string;
  imageUrl: string;
  title: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface ImageListResponse {
  items: ImageRecord[];
  total: number;
  page: number;
  pageSize: number;
}
