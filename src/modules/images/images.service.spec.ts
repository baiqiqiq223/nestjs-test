import { ImagesService } from './images.service';

describe('ImagesService', () => {
  it('creates image metadata and lists only the current user images', () => {
    const service = new ImagesService();

    const first = service.create('user-1', {
      imageUrl: 'https://example.com/one.png',
      title: '图片一',
      description: '描述一',
    });
    service.create('user-2', {
      imageUrl: 'https://example.com/two.png',
      title: '图片二',
      description: '描述二',
    });

    const result = service.listByUser('user-1', { page: 1, pageSize: 20 });

    expect(first.id).toBeTruthy();
    expect(result.total).toBe(1);
    expect(result.items).toEqual([first]);
  });

  it('paginates image records', () => {
    const service = new ImagesService();

    service.create('user-1', {
      imageUrl: 'https://example.com/one.png',
      title: '图片一',
      description: '描述一',
    });
    const second = service.create('user-1', {
      imageUrl: 'https://example.com/two.png',
      title: '图片二',
      description: '描述二',
    });

    const result = service.listByUser('user-1', { page: 1, pageSize: 1 });

    expect(result.total).toBe(2);
    expect(result.items).toEqual([second]);
  });
});
