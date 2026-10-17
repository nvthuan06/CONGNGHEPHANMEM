import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';
import { Product } from './products.entity.js';

const sample = {
  id: 1,
  name: 'Cà phê sữa',
  price: 35000,
  imageUrl: '/images/ca-phe-sua.jpg',
  stock: 100,
};

const mockRepository = {
  find: async () => [sample],
  findOneBy: async () => null,
  count: async () => 1,
};

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [
        ProductsService,
        { provide: getRepositoryToken(Product), useValue: mockRepository },
      ],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('findAll trả về danh sách có id, name, price, imageUrl', async () => {
    const result = await controller.findAll();
    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toEqual(
      expect.objectContaining({
        id: expect.any(Number),
        name: expect.any(String),
        price: expect.any(Number),
        imageUrl: expect.any(String),
      }),
    );
  });

  it('findOne ném lỗi 404 khi không tìm thấy', async () => {
    await expect(controller.findOne(9999)).rejects.toThrow();
  });
});