// backend/src/payments/payments.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Payment } from './entities/payment.js';
import { Order } from '../orders/entities/order.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { MockPaymentService } from './mock-payment.service.js';
import { User } from '../users/entities/user.entity.js';
import { DataSource } from 'typeorm';
import { OrderItem } from '../orders/entities/orderItem.js';
import { Product } from '../products/products.entity.js';
import { NguyenLieu } from '../NguyenLieu/Entities/nguyenlieu.entity.js';

@Injectable()
export class PaymentsService {
  private readonly logger = new Logger(PaymentsService.name);

  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly mockPaymentService: MockPaymentService,
    private readonly dataSource: DataSource,
  ) {}
  private async rewardPoints(userId: number, totalAmount: number) {  // sửa lại quy tắc tích điểm 1.000đ = 1 điểm.
    if (!userId) return;

    const user = await this.userRepo.findOne({
      where: { id: userId },
    });

    if (user) {
      // 1.000đ = 1 điểm
      const pointsEarned = Math.floor(totalAmount / 1000);

      user.loyaltyPoints += pointsEarned;

      await this.userRepo.save(user);

      this.logger.log(
        `Cộng ${pointsEarned} điểm cho user #${userId}`
      );
    }
  }

  private async confirmPayment(
    orderId: number,
    amount: number,
    method: string,
    idempotencyKey?: string,
  ) {
    return this.dataSource.transaction(async (manager) => {
      const orderRepo = manager.getRepository(Order);
      const paymentRepo = manager.getRepository(Payment);
      const userRepo = manager.getRepository(User);

      // Khóa đơn hàng để tránh hai giao dịch cùng xác nhận
      const order = await orderRepo.findOne({
        where: { id: orderId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!order) {
        throw new NotFoundException(
          `Không tìm thấy đơn hàng #${orderId}`,
        );
      }

      // Đơn đã thanh toán: không cộng điểm lần nữa
      if (order.status === 'PAID') {
        return {
          success: true,
          alreadyPaid: true,
          orderId: order.id,
          orderStatus: order.status,
        };
      }

      if (!['PENDING', 'PAYMENT_FAILED'].includes(order.status)) {
        throw new BadRequestException(
          `Không thể thanh toán đơn hàng ở trạng thái ${order.status}`,
        );
      }

      if (!Number.isFinite(amount) || amount < Number(order.total)) {
        throw new BadRequestException(
          'Số tiền thanh toán không đủ',
        );
      }

      // Lưu thanh toán
      const payment = paymentRepo.create({
        orderId: order.id,
        amount,
        method,
        idempotencyKey: idempotencyKey ?? null,
        status: 'SUCCESS',
      });

      const savedPayment = await paymentRepo.save(payment);

      // Xác nhận đơn hàng
      order.status = 'PAID';
      await orderRepo.save(order);

      const orderItems = await manager.getRepository(OrderItem).find({
        where: { orderId: order.id }
      });
      if (orderItems.length > 0) {
        const productIds = orderItems.map(item => item.productId);

        await manager.getRepository(Product).find({
          where: { id: In(productIds) },
          select: { id: true },
          lock: { mode: 'pessimistic_write' }
        });

        const productList = await manager.getRepository(Product).find({
          where: { id: In(productIds) },
          relations: { ingredients: { nguyenLieu: true } }
        });
        const products = new Map(productList.map(p => [p.id, p]));

        // Lặp qua từng món trong đơn và trừ
        for (const item of orderItems) {
          const product = products.get(item.productId);
          if (!product) continue;

          product.stock = Math.max(0, product.stock - item.qty);
          await manager.getRepository(Product).save(product);

          const ingredients = product.ingredients ?? [];
          for (const detail of ingredients) {
            const nguyenLieu = detail.nguyenLieu;
            const tongCanTru = detail.dinhluong * item.qty;

            nguyenLieu.KhoiLuong = Math.max(0, nguyenLieu.KhoiLuong - tongCanTru);
            await manager.getRepository(NguyenLieu).save(nguyenLieu);
          }
        }
      }


      // 1.000đ thanh toán = 1 điểm
      const pointsEarned = Math.floor(Number(order.total) / 1000);

      if (order.userId && pointsEarned > 0) {
        await userRepo.increment(
          { id: order.userId },
          'loyaltyPoints',
          pointsEarned,
        );
      }

      return {
        success: true,
        alreadyPaid: false,
        orderId: order.id,
        orderStatus: order.status,
        paymentId: savedPayment.id,
        amount: savedPayment.amount,
        method: savedPayment.method,
        pointsEarned,
      };
    });
  }

  async createPayment(dto: CreatePaymentDto) {
    if (dto.idempotencyKey) {
      const currentPayment = await this.paymentRepo.findOne({
        where: { idempotencyKey: dto.idempotencyKey },
      });
      if (currentPayment) {
        return {
          success: currentPayment.status === "SUCCESS",
          message: "Giao dịch đã được xử lý trước đó",
          orderId: currentPayment.orderId,
          paymentId: currentPayment.id,
        };
      }
    }
    const order = await this.orderRepo.findOne({
      where: { id: dto.orderId },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${dto.orderId}`);
    }

    if (order.status !== "PENDING" && order.status !== "PAYMENT_FAILED") {
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

    if (mockResult.success) {
      return await this.confirmPayment(
        order.id,
        Number(order.total),
        dto.method,
        dto.idempotencyKey,
      );
    }

    const failureResult = await this.dataSource.transaction(
      async (manager) => {
        const orderRepo = manager.getRepository(Order);
        const paymentRepo = manager.getRepository(Payment);

        const lockedOrder = await orderRepo.findOne({
          where: { id: order.id },
          lock: { mode: 'pessimistic_write' },
        });

        if (!lockedOrder) {
          throw new NotFoundException(
            `Không tìm thấy đơn hàng #${order.id}`,
          );
        }

        // Không cho thanh toán thất bại ghi đè đơn đã PAID hoặc CANCELLED
        if (!['PENDING', 'PAYMENT_FAILED'].includes(lockedOrder.status)) {
          throw new BadRequestException(
            `Không thể ghi nhận thanh toán thất bại cho đơn ${lockedOrder.status}`,
          );
        }

        const payment = paymentRepo.create({
          orderId: lockedOrder.id,
          amount: lockedOrder.total,
          method: dto.method,
          idempotencyKey: dto.idempotencyKey ?? null,
          status: 'FAILED',
        });

        await paymentRepo.save(payment);

        lockedOrder.status = 'PAYMENT_FAILED';
        await orderRepo.save(lockedOrder);

        return {
          success: false,
          message: mockResult.errorMessage || 'Thanh toán thất bại',
          orderId: lockedOrder.id,
          orderStatus: lockedOrder.status,
        };
      },
    );

    // Ném lỗi bên ngoài transaction để không rollback bản ghi thất bại
    throw new BadRequestException(failureResult);
  }

  async handleSepayWebhook(data: any) {
    this.logger.log(`[SePay Webhook] Nhận dữ liệu: ${JSON.stringify(data)}`);

    const { content, transferAmount, id: transactionId } = data;

    if (!content) {
      this.logger.warn("[SePay Webhook] Bỏ qua: Nội dung chuyển khoản rỗng");
      return { success: false, message: "Nội dung chuyển khoản rỗng" };
    }

    // 1. Tách orderId từ nội dung chuyển khoản (bắt các mẫu như DH18, DH 18, ORDER18)
    const match = content.match(/(?:DH|ORDER)\s*(\d+)/i);
    if (!match) {
      this.logger.warn(
        `[SePay Webhook] Bỏ qua: Không tìm thấy cú pháp mã đơn trong "${content}"`,
      );
      return { success: false, message: "Nội dung không chứa mã đơn hợp lệ" };
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
    if (order.status === "PAID") {
      this.logger.log(
        `[SePay Webhook] Đơn hàng #${orderId} đã được thanh toán trước đó`,
      );
      return { success: true, message: "Đơn hàng đã thanh toán" };
    }

    // 3. Đối soát số tiền thanh toán thực tế với tổng tiền đơn hàng
    const amountReceived = Number(transferAmount);
    if (amountReceived < Number(order.total)) {
      this.logger.warn(
        `[SePay Webhook] Đơn hàng #${orderId} thiếu tiền: Cần ${order.total}, nhận ${amountReceived}`,
      );
      return { success: false, message: "Số tiền thanh toán không đủ" };
    }

    // 4. Xác nhận thanh toán qua transaction chung
    if (!transactionId) {
      this.logger.warn(
        `[SePay Webhook] Thiếu mã giao dịch cho đơn #${orderId}`,
      );

      return {
        success: false,
        message: 'Thiếu mã giao dịch SePay',
      };
    }

    const result = await this.confirmPayment(
      order.id,
      amountReceived,
      'BANKING',
      `SEPAY_${transactionId}`,
    );

    this.logger.log(
      `[SePay Webhook] Xử lý thanh toán đơn #${orderId}`,
    );

    return {
      success: true,
      message: result.alreadyPaid
        ? 'Đơn hàng đã được thanh toán trước đó'
        : 'Xác nhận thanh toán thành công',
      orderId: order.id,
    };
  }
}
