import { Test, TestingModule } from '@nestjs/testing';
import { ProductsController } from './products.controller.js';
import { ProductsService } from './products.service.js';

describe('ProductsController', () => {
  let controller: ProductsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ProductsController],
      providers: [ProductsService],
    }).compile();

    controller = module.get<ProductsController>(ProductsController);
  });

  it('findAll trả về danh sách có id, name, price, imageUrl', () => {
    const result = controller.findAll();
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

  it('findOne ném lỗi 404 khi không tìm thấy', () => {
    expect(() => controller.findOne(9999)).toThrow();
  });
});