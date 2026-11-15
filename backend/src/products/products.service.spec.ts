import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NotFoundException } from '@nestjs/common';
import { ProductsService } from './products.service.js';

describe('ProductsService (mock TypeORM repository)', () => {
  const repo = { count: vi.fn(), save: vi.fn(), findOne: vi.fn(), find: vi.fn(), findOneBy: vi.fn() };
  const service = new ProductsService(repo as any);
  beforeEach(() => vi.resetAllMocks());

  it('không seed nếu đã có sản phẩm', async () => {
    repo.count.mockResolvedValue(4);
    await service.seedProducts();
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('seed 4 sản phẩm khi bảng rỗng', async () => {
    repo.count.mockResolvedValue(0);
    await service.seedProducts();
    const saved = repo.save.mock.calls[0][0];
    expect(saved).toHaveLength(4);
    expect(saved.every((p: any) => p.price > 0 && p.imageUrl && p.stock === 0)).toBe(true);
  });

  it('không ghi kho khi sản phẩm không tồn tại', async () => {
    repo.findOne.mockResolvedValue(null);
    await service.syncProductStock(100);
    expect(repo.save).not.toHaveBeenCalled();
  });

  it('sản phẩm không có công thức thì tồn kho bằng 0', async () => {
    const product = { id: 2, stock: 99, ingredients: [] };
    repo.findOne.mockResolvedValue(product);
    await service.syncProductStock(2);
    expect(product.stock).toBe(0);
    expect(repo.save).toHaveBeenCalledWith(product);
  });

  it('tính tồn kho theo nguyên liệu giới hạn nhất (floor)', async () => {
    const product = { id: 1, stock: 0, ingredients: [
      { dinhluong: 30, nguyenLieu: { KhoiLuong: 100 } },
      { dinhluong: 20, nguyenLieu: { KhoiLuong: 200 } },
    ] };
    repo.findOne.mockResolvedValue(product);
    await service.syncProductStock(1);
    expect(product.stock).toBe(3);
    expect(repo.findOne).toHaveBeenCalledWith({ where: { id: 1 }, relations: { ingredients: { nguyenLieu: true } } });
  });

  it('đồng bộ tồn kho toàn bộ sản phẩm', async () => {
    const spy = vi.spyOn(service, 'syncProductStock').mockResolvedValue(undefined);
    repo.find.mockResolvedValue([{ id: 1 }, { id: 2 }]);
    const log = vi.spyOn(console, 'log').mockImplementation(() => {});
    try {
      await service.syncAllProductsStock();
      expect(spy).toHaveBeenCalledTimes(2);
      expect(spy).toHaveBeenNthCalledWith(1, 1);
      expect(spy).toHaveBeenNthCalledWith(2, 2);
    } finally { spy.mockRestore(); log.mockRestore(); }
  });

  it('sắp xếp sản phẩm theo ID tăng dần', async () => {
    repo.find.mockResolvedValue([{ id: 1 }]);
    await service.findAll();
    expect(repo.find).toHaveBeenCalledWith({ order: { id: 'ASC' } });
  });

  it('trả sản phẩm khi tìm thấy', async () => {
    repo.findOneBy.mockResolvedValue({ id: 3, name: 'Trà đào' });
    await expect(service.findOne(3)).resolves.toMatchObject({ id: 3 });
  });

  it('ném NotFoundException khi không tìm thấy sản phẩm', async () => {
    repo.findOneBy.mockResolvedValue(null);
    await expect(service.findOne(3)).rejects.toBeInstanceOf(NotFoundException);
  });
});
