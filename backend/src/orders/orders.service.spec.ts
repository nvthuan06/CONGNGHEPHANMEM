import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OrdersService } from './orders.service.js';
import { Order } from './entities/order.js';
import { OrderItem } from './entities/orderItem.js';
import { Product } from '../products/products.entity.js';
import { User } from '../users/entities/user.entity.js';
// BỔ SUNG: Import NguyenLieu Entity
import { NguyenLieu } from '../NguyenLieu/Entities/nguyenlieu.entity.js';

describe('OrdersService (transaction/repository mocks; không cần DB)', () => {
  const orderRepo = { findOne: vi.fn(), find: vi.fn(), create: vi.fn(), save: vi.fn() };
  const productRepo = { findOne: vi.fn(), find: vi.fn() };
  const userRepo = { findOne: vi.fn(), save: vi.fn(), increment: vi.fn() };
  const itemsRepo = { find: vi.fn() };
  
  // BỔ SUNG: Khởi tạo repo giả cho NguyenLieu
  const nguyenLieuRepo = { findOne: vi.fn(), save: vi.fn() }; 

  const manager = { getRepository: vi.fn((entity: any) => {
    if (entity === Order) return orderRepo;
    if (entity === Product) return productRepo;
    if (entity === User) return userRepo;
    if (entity === OrderItem) return itemsRepo;
    if (entity === NguyenLieu) return nguyenLieuRepo; // BỔ SUNG: Trả về nguyenLieuRepo
    throw new Error(`Unmocked repository ${entity?.name}`);
  }) };
  const dataSource = {
    transaction: vi.fn(async (callback: (manager: any) => Promise<any>) => callback(manager)),
    getRepository: manager.getRepository,
  };
  const service = new OrdersService(orderRepo as any, productRepo as any, userRepo as any, dataSource as any);
  const dto = (overrides: Record<string, any> = {}): any => ({
    // Đặt 2 ly size M
    items: [{ productId: 1, size: 'M', quantity: 2, toppings: ['tc'] }],
    pointsToRedeem: 0,
    ...overrides,
  });

  beforeEach(() => {
    vi.clearAllMocks();
    
    // SỬA: Bỏ stock của product, thêm ingredients với định lượng
    const product = { 
      id: 1, 
      name: 'Cà phê sữa', 
      price: 35000, 
      ingredients: [
        { dinhluong: 50, nguyenLieu: { id: 101, name: 'Sữa tươi' } }
      ] 
    };
    productRepo.findOne.mockResolvedValue(product);
    productRepo.find.mockResolvedValue([product]);
    const mockNguyenLieu = { id: 101, name: 'Sữa tươi', KhoiLuong: 500 };
    nguyenLieuRepo.findOne.mockResolvedValue(mockNguyenLieu);
    nguyenLieuRepo.save.mockImplementation(async (value: any) => value);

    userRepo.findOne.mockResolvedValue({ id: 7, loyaltyPoints: 2000 });
    userRepo.save.mockImplementation(async (value: any) => value);
    orderRepo.create.mockImplementation((value: any) => value);
    orderRepo.save.mockImplementation(async (value: any) => value);
    itemsRepo.find.mockResolvedValue([]);
  });

  it.each([-1, 1.5, Number.NaN])('từ chối điểm quy đổi không hợp lệ (%s)', async (points) => {
    await expect(service.create(dto({ pointsToRedeem: points }), 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('yêu cầu ít nhất 100 điểm khi quy đổi', async () => {
    await expect(service.create(dto({ pointsToRedeem: 50 }), 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('không tạo đơn rỗng', async () => {
    await expect(service.create(dto({ items: [] }), 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('từ chối người dùng không tồn tại', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.create(dto(), 7)).rejects.toBeInstanceOf(NotFoundException);
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('từ chối quy đổi vượt số điểm hiện có', async () => {
    userRepo.findOne.mockResolvedValue({ id: 7, loyaltyPoints: 100 });
    await expect(service.create(dto({ pointsToRedeem: 200 }), 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('từ chối ID sản phẩm không tồn tại', async () => {
    productRepo.find.mockResolvedValue([]);
    await expect(service.create(dto(), 7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('từ chối khi nguyên liệu không đủ tồn kho', async () => {
    nguyenLieuRepo.findOne.mockResolvedValue({ id: 101, name: 'Sữa tươi', KhoiLuong: 40 });
    
    await expect(service.create(dto(), 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(nguyenLieuRepo.save).not.toHaveBeenCalled();
  });

  it.each([0, -2, 1.5])('từ chối số lượng không hợp lệ (%s)', async (quantity) => {
    await expect(service.create(dto({ items: [{ productId: 1, size: 'S', quantity }] }), 7)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối kích thước ngoài S/M/L', async () => {
    await expect(service.create(dto({ items: [{ productId: 1, size: 'XL', quantity: 1 }] }), 7)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('từ chối nếu giảm giá bằng điểm vượt giá trị đơn', async () => {
    userRepo.findOne.mockResolvedValue({ id: 7, loyaltyPoints: 11000 });
    await expect(service.create(dto({ pointsToRedeem: 10000 }), 7)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('tính giá size M, topping, trừ điểm, lưu kho nguyên liệu và lưu đơn PENDING', async () => {
    const result = await service.create(dto({ pointsToRedeem: 100 }), 7);
    expect(result).toMatchObject({
      userId: 7, status: 'PENDING', subtotal: 90000,
      pointsRedeemed: 100, discountAmount: 1000, total: 89000,
      items: [{ productId: 1, size: 'M', qty: 2, lineTotal: 90000, toppings: ['tc'] }],
    });
    
    expect(userRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 7, loyaltyPoints: 1900 }));

    expect(nguyenLieuRepo.save).toHaveBeenCalledWith(expect.objectContaining({ id: 101, KhoiLuong: 400 }));
    
    expect(orderRepo.save).toHaveBeenCalledOnce();
  });

  it('lọc topping không hợp lệ, chuẩn hóa size và topping', async () => {
    const result = await service.create(dto({ items: [{ productId: 1, size: ' l ', quantity: 1, toppings: ['KEM', 'bad'] }] }), 7);
    expect(result).toMatchObject({ subtotal: 55000, total: 55000 });
    expect(result.items).toEqual([expect.objectContaining({ size: 'L', toppings: ['kem'], lineTotal: 55000 })]);
  });

  it('trả điểm thưởng của người dùng hiện tại', async () => {
    await expect(service.getLoyaltyBalance(7)).resolves.toEqual({ loyaltyPoints: 2000 });
    expect(userRepo.findOne).toHaveBeenCalledWith({ where: { id: 7 }, select: { id: true, loyaltyPoints: true } });
  });

  it('không trả điểm của người dùng không tồn tại', async () => {
    userRepo.findOne.mockResolvedValue(null);
    await expect(service.getLoyaltyBalance(7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('chỉ đọc đơn của đúng chủ sở hữu', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 5, userId: 7 });
    await expect(service.findOne(5, 7)).resolves.toMatchObject({ userId: 7 });
    expect(orderRepo.findOne).toHaveBeenCalledWith({ where: { id: 5, userId: 7 } });
  });

  it('ném 404 nếu đơn không thuộc user hoặc không tồn tại', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await expect(service.findOne(5, 7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('hủy đơn PENDING, hoàn điểm và lưu CANCELLED', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 5, userId: 7, pointsRedeemed: 100, status: 'PENDING' });
    const result = await service.cancelOrder(5, 7);
    expect(result).toMatchObject({ id: 5, status: 'CANCELLED' });
    expect(userRepo.increment).toHaveBeenCalledWith({ id: 7 }, 'loyaltyPoints', 100);
    expect(itemsRepo.find).toHaveBeenCalledWith({ where: { orderId: 5 } });
  });

  it('cho phép hủy PAYMENT_FAILED mà không hoàn điểm nếu không quy đổi', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 5, userId: 7, pointsRedeemed: 0, status: 'PAYMENT_FAILED' });
    await expect(service.cancelOrder(5, 7)).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(userRepo.increment).not.toHaveBeenCalled();
  });

  it('không hủy đơn không tồn tại', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await expect(service.cancelOrder(5, 7)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('không hủy đơn đã PAID', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 5, userId: 7, pointsRedeemed: 0, status: 'PAID' });
    await expect(service.cancelOrder(5, 7)).rejects.toBeInstanceOf(BadRequestException);
    expect(orderRepo.save).not.toHaveBeenCalled();
  });

  it('lọc lịch sử theo userId và lấy kèm sản phẩm', async () => {
    orderRepo.find.mockResolvedValue([{ id: 3, userId: 7 }]);
    await expect(service.getMyOrders(7)).resolves.toHaveLength(1);
    expect(orderRepo.find).toHaveBeenCalledWith({ where: { userId: 7 }, relations: { items: { product: true } } });
  });
});