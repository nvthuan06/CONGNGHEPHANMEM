import { beforeEach, describe, expect, it, vi } from 'vitest';
import { BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { MockPaymentService } from './mock-payment.service.js';
import { Order } from '../orders/entities/order.js';
import { OrderItem } from '../orders/entities/orderItem.js';
import { Payment } from './entities/payment.js';
import { Product } from '../products/products.entity.js';
import { NguyenLieu } from '../NguyenLieu/Entities/nguyenlieu.entity.js';
import { User } from '../users/entities/user.entity.js';

describe('PaymentsService (transaction/repository mocks; không cần DB)', () => {
  const paymentRepo = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
  const orderRepo = { findOne: vi.fn(), save: vi.fn() };
  const userRepo = { findOne: vi.fn(), save: vi.fn(), increment: vi.fn() };
  const itemsRepo = { find: vi.fn() };
  const productRepo = { find: vi.fn(), save: vi.fn() };
  const ingredientRepo = { save: vi.fn() };
  const mockPayment = { processPayment: vi.fn() };
  const manager = { getRepository: vi.fn((entity: any) => {
    if (entity === Payment) return paymentRepo;
    if (entity === Order) return orderRepo;
    if (entity === User) return userRepo;
    if (entity === OrderItem) return itemsRepo;
    if (entity === Product) return productRepo;
    if (entity === NguyenLieu) return ingredientRepo;
    throw new Error(`Unmocked repository ${entity?.name}`);
  }) };
  const dataSource = { transaction: vi.fn(async (callback: (manager: any) => Promise<any>) => callback(manager)) };
  const service = new PaymentsService(paymentRepo as any, orderRepo as any, userRepo as any, mockPayment as any, dataSource as any);
  const dto = (values: Record<string, any> = {}): any => ({ orderId: 3, method: 'CARD', ...values });

  beforeEach(() => {
    vi.clearAllMocks();
    paymentRepo.findOne.mockResolvedValue(null);
    paymentRepo.create.mockImplementation((x: any) => x);
    paymentRepo.save.mockImplementation(async (x: any) => ({ id: 12, ...x }));
    orderRepo.findOne.mockImplementation(async () => ({ id: 3, userId: 7, total: 25000, status: 'PENDING' }));
    orderRepo.save.mockImplementation(async (x: any) => x);
    itemsRepo.find.mockResolvedValue([]);
    productRepo.find.mockResolvedValue([]);
    mockPayment.processPayment.mockResolvedValue({ success: true, transactionId: 'MOCK_3' });
  });

  it('idempotencyKey trùng trả lại giao dịch đã thành công, không xử lý lại', async () => {
    paymentRepo.findOne.mockResolvedValue({ id: 12, status: 'SUCCESS', orderId: 3 });
    await expect(service.createPayment(dto({ idempotencyKey: 'key-1' }))).resolves.toMatchObject({
      success: true, paymentId: 12, orderId: 3,
    });
    expect(mockPayment.processPayment).not.toHaveBeenCalled();
  });

  it('idempotencyKey trùng của giao dịch thất bại trả success=false', async () => {
    paymentRepo.findOne.mockResolvedValue({ id: 12, status: 'FAILED', orderId: 3 });
    await expect(service.createPayment(dto({ idempotencyKey: 'key-1' }))).resolves.toMatchObject({ success: false });
  });

  it('không thanh toán đơn không tồn tại', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await expect(service.createPayment(dto())).rejects.toBeInstanceOf(NotFoundException);
    expect(mockPayment.processPayment).not.toHaveBeenCalled();
  });

  it('ngăn chặn user A thanh toán đơn hàng của user B', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 3, userId: 7, status: 'PENDING', total: 25000 });
    await expect(service.createPayment(dto(), 99)).rejects.toBeInstanceOf(ForbiddenException);
    expect(mockPayment.processPayment).not.toHaveBeenCalled();
  });

  it('cho phép chủ đơn hàng thanh toán đơn của mình', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 3, userId: 7, status: 'PENDING', total: 25000 });
    const result = await service.createPayment(dto(), 7);
    expect(result).toMatchObject({ success: true, orderId: 3 });
  });

  it('không tạo thanh toán mới cho đơn CANCELLED', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 3, status: 'CANCELLED', total: 25000 });
    await expect(service.createPayment(dto())).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPayment.processPayment).not.toHaveBeenCalled();
  });

  it('thanh toán thành công cập nhật PAID và cộng điểm đúng một lần', async () => {
    const result = await service.createPayment(dto({ idempotencyKey: 'new-key' }));
    expect(result).toMatchObject({ success: true, alreadyPaid: false, orderId: 3, orderStatus: 'PAID', pointsEarned: 25 });
    expect(mockPayment.processPayment).toHaveBeenCalledWith(3, 25000, 'CARD', undefined);
    expect(paymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ idempotencyKey: 'new-key', status: 'SUCCESS' }));
    expect(userRepo.increment).toHaveBeenCalledWith({ id: 7 }, 'loyaltyPoints', 25);
  });

  it('không ghi thêm thanh toán hay điểm nếu order chuyển sang PAID trong transaction', async () => {
    let calls = 0;
    orderRepo.findOne.mockImplementation(async () => ({ id: 3, status: calls++ === 0 ? 'PENDING' : 'PAID', total: 25000 }));
    const result = await service.createPayment(dto());
    expect(result).toMatchObject({ alreadyPaid: true });
    expect(paymentRepo.save).not.toHaveBeenCalled();
    expect(userRepo.increment).not.toHaveBeenCalled();
  });

  it('thanh toán thất bại lưu bản ghi FAILED và trạng thái PAYMENT_FAILED', async () => {
    mockPayment.processPayment.mockResolvedValue({ success: false, errorMessage: 'Thẻ bị từ chối' });
    await expect(service.createPayment(dto({ simulateFail: true }))).rejects.toBeInstanceOf(BadRequestException);
    expect(mockPayment.processPayment).toHaveBeenCalledWith(3, 25000, 'CARD', true);
    expect(paymentRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'FAILED', orderId: 3 }));
    expect(orderRepo.save).toHaveBeenCalledWith(expect.objectContaining({ status: 'PAYMENT_FAILED' }));
  });

  it('thanh toán thành công trừ tồn kho sản phẩm và nguyên liệu, không âm', async () => {
    itemsRepo.find.mockResolvedValue([{ productId: 1, qty: 2 }]);
    const ingredient = { id: 2, KhoiLuong: 35 };
    const product = { id: 1, stock: 1, ingredients: [{ dinhluong: 25, nguyenLieu: ingredient }] };
    productRepo.find.mockResolvedValue([product]);
    await service.createPayment(dto());
    expect(product.stock).toBe(0);
    expect(ingredient.KhoiLuong).toBe(0);
    expect(productRepo.save).toHaveBeenCalledWith(product);
    expect(ingredientRepo.save).toHaveBeenCalledWith(ingredient);
  });

  it('không cộng điểm khi tổng tiền dưới 1000đ', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 3, userId: 7, status: 'PENDING', total: 999 });
    const result = await service.createPayment(dto());
    expect(result).toMatchObject({ pointsEarned: 0 });
    expect(userRepo.increment).not.toHaveBeenCalled();
  });

  it('webhook từ chối thiếu nội dung chuyển khoản', async () => {
    await expect(service.handleSepayWebhook({ content: '', transferAmount: 25000 })).resolves.toMatchObject({ success: false });
    expect(orderRepo.findOne).not.toHaveBeenCalled();
  });

  it('webhook từ chối nội dung không chứa mã đơn', async () => {
    await expect(service.handleSepayWebhook({ content: 'ca phe', transferAmount: 25000 })).resolves.toMatchObject({ success: false });
    expect(orderRepo.findOne).not.toHaveBeenCalled();
  });

  it('webhook từ chối đơn không tồn tại', async () => {
    orderRepo.findOne.mockResolvedValue(null);
    await expect(service.handleSepayWebhook({ content: 'DH 3', transferAmount: 25000, id: 11 })).resolves.toMatchObject({ success: false });
  });

  it('webhook không xử lý lại đơn đã PAID', async () => {
    orderRepo.findOne.mockResolvedValue({ id: 3, status: 'PAID', total: 25000 });
    await expect(service.handleSepayWebhook({ content: 'ORDER3', transferAmount: 25000, id: 11 })).resolves.toMatchObject({ success: true });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('webhook từ chối thiếu tiền', async () => {
    await expect(service.handleSepayWebhook({ content: 'DH3', transferAmount: 24000, id: 11 })).resolves.toMatchObject({ success: false });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('webhook từ chối thiếu ID giao dịch', async () => {
    await expect(service.handleSepayWebhook({ content: 'DH3', transferAmount: 25000 })).resolves.toMatchObject({ success: false });
    expect(dataSource.transaction).not.toHaveBeenCalled();
  });

  it('webhook xác nhận giao dịch hợp lệ với key SEPAY_...', async () => {
    const result = await service.handleSepayWebhook({ content: 'Thanh toan ORDER 3', transferAmount: 25000, id: 432 });
    expect(result).toMatchObject({ success: true, orderId: 3 });
    expect(paymentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ method: 'BANKING', idempotencyKey: 'SEPAY_432' }));
  });
});

describe('MockPaymentService', () => {
  it('mô phỏng lỗi trả thông báo mà không phát sinh transactionId', async () => {
    vi.useFakeTimers();
    try {
      const service = new MockPaymentService();
      const pending = service.processPayment(3, 20000, 'CARD', true);
      await vi.advanceTimersByTimeAsync(100);
      await expect(pending).resolves.toMatchObject({ success: false, errorMessage: expect.any(String) });
    } finally { vi.useRealTimers(); }
  });

  it('giao dịch giả lập thành công có mã nhận diện', async () => {
    vi.useFakeTimers();
    try {
      const service = new MockPaymentService();
      const pending = service.processPayment(3, 20000, 'WALLET');
      await vi.advanceTimersByTimeAsync(100);
      const result = await pending;
      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^MOCK_WALLET_3_\d+$/);
    } finally { vi.useRealTimers(); }
  });
});
