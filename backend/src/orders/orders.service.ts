// backend/src/orders/orders.service.ts
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.js';
import { OrderDto } from './dto/order.dto.js';
import { Product } from '../products/products.entity.js';
import { DataSource } from 'typeorm';
import { User } from '../users/entities/user.entity.js';
import { OrderItem } from './entities/orderItem.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,

    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    @InjectRepository(User)
    private readonly userRepository: Repository<User>,

    private readonly dataSource: DataSource,
  ) {}

  async create(orderDto: OrderDto, userId: number) {
    const pointsToRedeem = orderDto.pointsToRedeem ?? 0;

    if (
      !Number.isSafeInteger(pointsToRedeem) ||
      pointsToRedeem < 0
    ) {
      throw new BadRequestException('Số điểm sử dụng không hợp lệ');
    }

    if (!orderDto.items?.length) {
      throw new BadRequestException('Đơn hàng phải có ít nhất một sản phẩm');
    }

    return this.dataSource.transaction(async (manager) => {
      // 1. Khóa tài khoản để tránh dùng điểm đồng thời
      const user = await manager.getRepository(User).findOne({
        where: { id: userId },
        lock: { mode: 'pessimistic_write' },
      });

      if (!user) {
        throw new NotFoundException('Không tìm thấy tài khoản');
      }

      if (user.loyaltyPoints < pointsToRedeem) {
        throw new BadRequestException(
          `Bạn chỉ có ${user.loyaltyPoints} điểm thưởng`,
        );
      }

      let subtotal = 0;
      const itemsToSave: {
        productId: number;
        size: string;
        qty: number;
        lineTotal: number;
      }[] = [];

      // 2. Gộp sản phẩm trùng ID để kiểm tra tổng số lượng
      const productIds = [
        ...new Set(orderDto.items.map((item) => item.productId)),
      ].sort((a, b) => a - b);

      // Khóa sản phẩm theo thứ tự ID cố định
      const products = new Map<number, Product>();

      for (const productId of productIds) {
        const product = await manager.getRepository(Product).findOne({
          where: { id: productId },
          lock: { mode: 'pessimistic_write' },
        });

        if (!product) {
          throw new NotFoundException(
            `Không tìm thấy sản phẩm #${productId}`,
          );
        }

        products.set(productId, product);
      }

      const requestedQuantities = new Map<number, number>();

      for (const item of orderDto.items) {
        if (!Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
          throw new BadRequestException('Số lượng sản phẩm không hợp lệ');
        }

        requestedQuantities.set(
          item.productId,
          (requestedQuantities.get(item.productId) ?? 0) + item.quantity,
        );

        const product = products.get(item.productId)!;
        const sizeUpper = item.size.trim().toUpperCase();

        if (!['S', 'M', 'L'].includes(sizeUpper)) {
          throw new BadRequestException('Kích thước sản phẩm không hợp lệ');
        }

        const sizeExtra =
          sizeUpper === 'M' ? 5000 : sizeUpper === 'L' ? 10000 : 0;

        const unitPrice = Number(product.price) + sizeExtra;
        const lineTotal = unitPrice * item.quantity;

        subtotal += lineTotal;

        itemsToSave.push({
          productId: product.id,
          size: sizeUpper,
          qty: item.quantity,
          lineTotal,
        });
      }

      // 3. Kiểm tra và trừ tồn kho
      for (const [productId, quantity] of requestedQuantities) {
        const product = products.get(productId)!;

        if (product.stock < quantity) {
          throw new BadRequestException(
            `Sản phẩm "${product.name}" chỉ còn ${product.stock} sản phẩm`,
          );
        }

        product.stock -= quantity;
        await manager.getRepository(Product).save(product);
      }

      // 4. Quy đổi điểm: 1 điểm = 10đ
      const discountAmount = pointsToRedeem * 10;

      if (discountAmount > subtotal) {
        throw new BadRequestException(
          'Số điểm sử dụng vượt quá giá trị đơn hàng',
        );
      }

      const total = subtotal - discountAmount;

      // 5. Giữ điểm bằng cách trừ khỏi số dư khả dụng
      user.loyaltyPoints -= pointsToRedeem;
      await manager.getRepository(User).save(user);

      // 6. Tạo đơn hàng PENDING
      const newOrder = manager.getRepository(Order).create({
        userId,
        status: 'PENDING',
        subtotal,
        pointsRedeemed: pointsToRedeem,
        discountAmount,
        total,
        items: itemsToSave,
      });

      return manager.getRepository(Order).save(newOrder);
    });
  }
  async findOne(orderId: number, userId: number) {
    const order = await this.orderRepository.findOne({
      where: {
        id: orderId,
        userId: userId,
      },
    });

    if (!order) {
      throw new NotFoundException(`Không tìm thấy đơn hàng #${orderId}`);
    }

    return order;
  }

  // Hủy thanh toán
  async cancelOrder(orderId: number, userId: number) {
    return this.dataSource.transaction(async (manager) => {
      // 1. Khóa đơn hàng trước, không JOIN bảng order_items
      const order = await manager.getRepository(Order).findOne({
        where: { id: orderId, userId },
        lock: { mode: 'pessimistic_write' },
      });

      // 2. Kiểm tra đơn hàng tồn tại
      if (!order) {
        throw new NotFoundException('Không tìm thấy đơn hàng');
      }

      // 3. Lấy danh sách sản phẩm riêng trong cùng transaction
      order.items = await manager.getRepository(OrderItem).find({
        where: { orderId: order.id },
      });

      if (!order) {
        throw new NotFoundException(
          `Không tìm thấy đơn hàng #${orderId}`,
        );
      }

      if (!['PENDING', 'PAYMENT_FAILED'].includes(order.status)) {
        throw new BadRequestException(
          `Không thể hủy đơn hàng ở trạng thái ${order.status}`,
        );
      }

      // Hoàn tồn kho
      const quantities = new Map<number, number>();

      for (const item of order.items) {
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) + item.qty,
        );
      }

      for (const [productId, quantity] of [...quantities].sort(
        (a, b) => a[0] - b[0],
      )) {
        await manager
          .getRepository(Product)
          .increment({ id: productId }, 'stock', quantity);
      }

      // Hoàn điểm đã giữ khi tạo đơn
      if (order.pointsRedeemed > 0) {
        await manager.getRepository(User).increment(
          { id: userId },
          'loyaltyPoints',
          order.pointsRedeemed,
        );
      }

      order.status = 'CANCELLED';

      return manager.getRepository(Order).save(order);
    });
  }

  //Lịch sử đơn hàng
  async getMyOrders(userid: number) {
    const pd = await this.orderRepository.find({
      where: {
        userId: userid,
      },
      relations: {
        items: {
          product: true,
        },
      },
    });
    return await pd;
  }
}
