import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { NguyenLieuService } from './NguyenLieu.service.js';
import { NguyenLieu } from './Entities/nguyenlieu.entity.js';

describe('NguyenLieuService (mock repositories)', () => {
  const ingredientRepo = { count: vi.fn(), save: vi.fn(), find: vi.fn() };
  const detailRepo = { count: vi.fn(), save: vi.fn(), find: vi.fn() };
  const products = { seedProducts: vi.fn(), syncAllProductsStock: vi.fn() };
  const service = new NguyenLieuService(ingredientRepo as any, detailRepo as any, products as any);
  beforeEach(() => {
    vi.resetAllMocks();
    ingredientRepo.save.mockImplementation(async (value: any) => value);
  });

  it('bỏ qua seed khi đã có nguyên liệu và công thức', async () => {
    ingredientRepo.count.mockResolvedValue(2);
    detailRepo.count.mockResolvedValue(3);
    await service.onModuleInit();
    expect(products.seedProducts).not.toHaveBeenCalled();
  });

  it('seed nguyên liệu/công thức và đồng bộ tồn kho khi DB rỗng', async () => {
    ingredientRepo.count.mockResolvedValue(0);
    detailRepo.count.mockResolvedValue(0);
    await service.onModuleInit();
    expect(products.seedProducts).toHaveBeenCalledTimes(2);
    expect(ingredientRepo.save).toHaveBeenCalledTimes(6);
    expect(detailRepo.save.mock.calls[0][0]).toHaveLength(10);
    expect(products.syncAllProductsStock).toHaveBeenCalledOnce();
  });

  it('không trừ tồn kho khi thiếu nguyên liệu', async () => {
    const manager = { findOne: vi.fn().mockResolvedValue(null), save: vi.fn() };
    await expect(service.deductStock(1, 5, manager as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('không trừ tồn kho khi nguyên liệu không đủ', async () => {
    const manager = { findOne: vi.fn().mockResolvedValue({ id: 1, name: 'Sữa', KhoiLuong: 3 }), save: vi.fn() };
    await expect(service.deductStock(1, 5, manager as any)).rejects.toBeInstanceOf(BadRequestException);
    expect(manager.save).not.toHaveBeenCalled();
  });

  it('trừ đúng định lượng và lưu trong transaction manager', async () => {
    const ingredient = { id: 1, name: 'Cà phê', KhoiLuong: 100 };
    const manager = { findOne: vi.fn().mockResolvedValue(ingredient), save: vi.fn().mockImplementation(async (x: any) => x) };
    await service.deductStock(1, 25, manager as any);
    expect(manager.findOne).toHaveBeenCalledWith(NguyenLieu, { where: { id: 1 } });
    expect(ingredient.KhoiLuong).toBe(75);
    expect(manager.save).toHaveBeenCalledWith(ingredient);
  });

  it('trả danh sách nguyên liệu và chi tiết kèm quan hệ', async () => {
    ingredientRepo.find.mockResolvedValue([{ id: 1 }]);
    detailRepo.find.mockResolvedValue([{ id: 10 }]);
    await expect(service.findAll()).resolves.toEqual([{ id: 1 }]);
    await expect(service.findAllChiTiet()).resolves.toEqual([{ id: 10 }]);
    expect(detailRepo.find).toHaveBeenCalledWith({ relations: { product: true, nguyenLieu: true } });
  });
});
