// backend/src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.js';
import { OrderDto } from './dto/order.dto.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
  ) {}

  async create(orderDto: OrderDto) {
    let totalAmount = 0;
    const itemsToSave = [];

    for (const item of orderDto.items) {
      // Dùng productId để Query vào bảng Product lấy giá gốc.
      // Giả lập
      const pricePerCup = 35000;

      const lineTotal = pricePerCup * item.quantity;
      totalAmount += lineTotal;

      itemsToSave.push({
        productId: item.productId,
        size: item.size,
        qty: item.quantity,
        lineTotal: lineTotal,
      });
    }

    // 2. Tạo đơn hàng mới trong bộ nhớ tạm
    const newOrder = this.orderRepository.create({
      status: 'PENDING', // Trạng thái mặc định
      total: totalAmount, // Tổng tiền
      items: itemsToSave, // TypeORM sẽ tự động lưu mảng này vào bảng OrderItem nhờ cascade: true
    });

    return await this.orderRepository.save(newOrder);
  }
}
