// backend/src/payments/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.js';
import { Order } from '../orders/entities/order.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { MockPaymentService } from './mock-payment.service.js';

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly mockPaymentService: MockPaymentService,
  ) {}

  async createPayment(dto: CreatePaymentDto) {
    // 1. Tìm đơn hàng trong CSDL
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
    }

    // 2. Chỉ cho phép thanh toán khi đơn đang ở PENDING hoặc PAYMENT_FAILED (thử lại)
    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      throw new BadRequestException(
        `Đơn hàng đang ở trạng thái ${order.status}, không thể thanh toán.`,
      );
    }

    // 3. Gọi cổng thanh toán giả lập với số tiền lấy từ Order trong DB
    const mockResult = await this.mockPaymentService.processPayment(
      order.id,
      order.total,
      dto.method,
      dto.simulateFail,
    );

    // 4. Lưu thông tin giao dịch vào bảng payments
    const payment = this.paymentRepo.create({
      orderId: order.id,
      amount: order.total,
      method: dto.method,
      idempotencyKey: dto.idempotencyKey,
      status: mockResult.success ? 'SUCCESS' : 'FAILED',
    });
    await this.paymentRepo.save(payment);

    // 5. Cập nhật trạng thái đơn hàng theo kết quả thanh toán
    if (mockResult.success) {
      order.status = 'PAID';
      await this.orderRepo.save(order);

      return {
        success: true,
        message: 'Thanh toán thành công',
        orderId: order.id,
        orderStatus: order.status,
        paymentId: payment.id,
        amount: payment.amount,
        method: payment.method,
      };
    } else {
      order.status = 'PAYMENT_FAILED';
      await this.orderRepo.save(order);

      throw new BadRequestException({
        success: false,
        message: mockResult.errorMessage || 'Thanh toán thất bại',
        orderId: order.id,
        orderStatus: order.status,
      });
    }
  }
}