import { describe, expect, it, vi } from 'vitest';
import { OrdersController } from './orders.controller.js';

describe('OrdersController (mock OrdersService)', () => {
  const orders = {
    create: vi.fn(), getMyOrders: vi.fn(), getLoyaltyBalance: vi.fn(),
    findOne: vi.fn(), cancelOrder: vi.fn(),
  };
  const controller = new OrdersController(orders as any);
  const request = { user: { userId: 7, email: 'a@example.com' } } as any;

  it('tạo đơn bằng userId lấy từ JWT', async () => {
    const dto = { items: [{ productId: 1, size: 'M', quantity: 2 }] };
    orders.create.mockResolvedValueOnce({ id: 9 });
    await expect(controller.create(dto, request)).resolves.toEqual({ id: 9 });
    expect(orders.create).toHaveBeenCalledWith(dto, 7);
  });

  it('chỉ lấy lịch sử đơn hàng của người đăng nhập', async () => {
    orders.getMyOrders.mockResolvedValueOnce([{ id: 1 }]);
    await expect(controller.findAll(request)).resolves.toEqual([{ id: 1 }]);
    expect(orders.getMyOrders).toHaveBeenCalledWith(7);
  });

  it('lấy số dư điểm thưởng từ userId của JWT', async () => {
    orders.getLoyaltyBalance.mockResolvedValueOnce({ loyaltyPoints: 100 });
    await expect(controller.getLoyaltyBalance(request)).resolves.toEqual({ loyaltyPoints: 100 });
    expect(orders.getLoyaltyBalance).toHaveBeenCalledWith(7);
  });

  it('giới hạn tra cứu một đơn theo userId', async () => {
    orders.findOne.mockResolvedValueOnce({ id: 3 });
    await expect(controller.findOne(3, request)).resolves.toEqual({ id: 3 });
    expect(orders.findOne).toHaveBeenCalledWith(3, 7);
  });

  it('hủy đơn theo userId của JWT', async () => {
    orders.cancelOrder.mockResolvedValueOnce({ id: 3, status: 'CANCELLED' });
    await expect(controller.cancel(3, request)).resolves.toMatchObject({ status: 'CANCELLED' });
    expect(orders.cancelOrder).toHaveBeenCalledWith(3, 7);
  });
});
