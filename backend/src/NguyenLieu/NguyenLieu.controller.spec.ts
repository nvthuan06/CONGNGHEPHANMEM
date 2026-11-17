import { describe, expect, it, vi } from 'vitest';
import { NguyenLieuController } from './NguyenLieu.controller.js';

describe('NguyenLieuController', () => {
  const ingredients = { findAll: vi.fn(), findAllChiTiet: vi.fn() };
  const controller = new NguyenLieuController(ingredients as any);
  it('lấy toàn bộ nguyên liệu', async () => {
    ingredients.findAll.mockResolvedValueOnce([{ id: 1 }]);
    await expect(controller.getAllNguyenLieu()).resolves.toEqual([{ id: 1 }]);
    expect(ingredients.findAll).toHaveBeenCalled();
  });
  it('lấy công thức có thông tin chi tiết', async () => {
    ingredients.findAllChiTiet.mockResolvedValueOnce([{ id: 4 }]);
    await expect(controller.getAllChiTiet()).resolves.toEqual([{ id: 4 }]);
    expect(ingredients.findAllChiTiet).toHaveBeenCalled();
  });
});
