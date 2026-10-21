// backend/src/payments/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Payment } from './entities/payment.js';
import { Order } from '../orders/entities/order.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { MockPaymentService } from './mock-payment.service.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly mockPaymentService: MockPaymentService,
  ) {}

  async createPayment(dto: CreatePaymentDto) {
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
    }

    if (order.status !== 'PENDING' && order.status !== 'PAYMENT_FAILED') {
      throw new BadRequestException(
        `Đơn hàng đang ở trạng thái ${order.status}, không thể thanh toán.`,
      );
    }

    const mockResult = await this.mockPaymentService.processPayment(
      order.id,
      order.total,
      dto.method,
      dto.simulateFail,
    );

    const payment = this.paymentRepo.create({
      orderId: order.id,
      amount: order.total,
      method: dto.method,
      idempotencyKey: dto.idempotencyKey,
      status: mockResult.success ? 'SUCCESS' : 'FAILED',
    });
    await this.paymentRepo.save(payment);

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

  async handleSepayWebhook(data: any) {
    this.logger.log(`[SePay Webhook] Nhận dữ liệu: ${JSON.stringify(data)}`);

    const { content, transferAmount, id: transactionId } = data;

    if (!content) {
      this.logger.warn('[SePay Webhook] Bỏ qua: Nội dung chuyển khoản rỗng');
      return { success: false, message: 'Nội dung chuyển khoản rỗng' };
    }

    // 1. Tách orderId từ nội dung chuyển khoản (bắt các mẫu như DH18, DH 18, ORDER18)
    const match = content.match(/(?:DH|ORDER)\s*(\d+)/i);
    if (!match) {
      this.logger.warn(`[SePay Webhook] Bỏ qua: Không tìm thấy cú pháp mã đơn trong "${content}"`);
      return { success: false, message: 'Nội dung không chứa mã đơn hợp lệ' };
    }

    const orderId = Number(match[1]);
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      this.logger.error(`[SePay Webhook] Không tìm thấy đơn hàng #${orderId}`);
      return { success: false, message: `Không tìm thấy đơn hàng #${orderId}` };
    }

    // 2. Kiểm tra nếu đơn hàng đã được xử lý thanh toán trước đó
    if (order.status === 'PAID') {
      this.logger.log(`[SePay Webhook] Đơn hàng #${orderId} đã được thanh toán trước đó`);
      return { success: true, message: 'Đơn hàng đã thanh toán' };
    }

    // 3. Đối soát số tiền thanh toán thực tế với tổng tiền đơn hàng
    const amountReceived = Number(transferAmount);
    if (amountReceived < Number(order.total)) {
      this.logger.warn(
        `[SePay Webhook] Đơn hàng #${orderId} thiếu tiền: Cần ${order.total}, nhận ${amountReceived}`,
      );
      return { success: false, message: 'Số tiền thanh toán không đủ' };
    }

    // 4. Cập nhật trạng thái đơn hàng sang PAID
    order.status = 'PAID';
    await this.orderRepo.save(order);

    // 5. Lưu bản ghi thanh toán vào database
    const payment = this.paymentRepo.create({
      orderId: order.id,
      amount: amountReceived,
      method: 'BANKING',
      status: 'SUCCESS',
      idempotencyKey: transactionId ? String(transactionId) : `SEPAY_${Date.now()}`,
    });
    await this.paymentRepo.save(payment);

    this.logger.log(`[SePay Webhook] Thanh toán thành công cho đơn hàng #${orderId}`);

    return {
      success: true,
      message: 'Xác nhận thanh toán thành công',
      orderId: order.id,
    };
  }
}