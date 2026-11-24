import { describe, expect, it, vi } from 'vitest';
import { PaymentsController } from './payments.controller.js';

describe('PaymentsController (mock PaymentsService)', () => {
  const payments = { createPayment: vi.fn(), handleSepayWebhook: vi.fn() };
  const controller = new PaymentsController(payments as any);

  it('chuyển DTO thanh toán sang service', async () => {
    const dto = { orderId: 3, method: 'CARD' as const };
    payments.createPayment.mockResolvedValueOnce({ success: true });
    await expect(controller.create(dto)).resolves.toEqual({ success: true });
    expect(payments.createPayment).toHaveBeenCalledWith(dto);
  });

  it('chuyển DTO thanh toán và userId từ token sang service', async () => {
    const dto = { orderId: 3, method: 'CARD' as const };
    const req = { user: { userId: 7, email: 'a@example.com' } } as any;
    payments.createPayment.mockResolvedValueOnce({ success: true });
    await expect(controller.create(dto, req)).resolves.toEqual({ success: true });
    expect(payments.createPayment).toHaveBeenCalledWith(dto, 7);
  });

  it('chuyển payload SePay sang service', async () => {
    const data = { id: 456, content: 'DH3', transferAmount: 35000 };
    payments.handleSepayWebhook.mockResolvedValueOnce({ success: true });
    await expect(controller.sepayWebhook(data)).resolves.toEqual({ success: true });
    expect(payments.handleSepayWebhook).toHaveBeenCalledWith(data);
  });
});
