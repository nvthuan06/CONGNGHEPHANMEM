// backend/src/orders/orders.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './entities/order.js';
import { OrderDto } from './dto/order.dto.js';
import { Product } from '../products/products.entity.js';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    

  ) { }

  async create(orderDto: OrderDto, userId: number) {
    let totalAmount = 0;
    const itemsToSave = [];
    for(const item of orderDto.items){
      const pd = await this.productRepository.findOne({
        where:{id:item.productId}
      });
      let sizeExtra = 0;
      const sizeUpper = item.size.trim().toUpperCase();
      if (sizeUpper === 'M') sizeExtra = 5000;
      if (sizeUpper === 'L') sizeExtra = 10000;

      const unitPrice = Number(pd?.price) + sizeExtra;
      const lineTotal = unitPrice * item.quantity;
      totalAmount += lineTotal;

      itemsToSave.push({
        productId: pd?.id,
        size: sizeUpper,
        qty: item.quantity,
        lineTotal: lineTotal,
      });
    }




    // 2. Tạo đơn hàng mới trong bộ nhớ tạm
    const newOrder = this.orderRepository.create({
      userId: userId,  // id người mua, lấy từ JWT đã xác thực
      status: 'PENDING', // Trạng thái mặc định
      total: totalAmount, // Tổng tiền
      items: itemsToSave, // TypeORM sẽ tự động lưu mảng này vào bảng OrderItem nhờ cascade: true
    });

    return await this.orderRepository.save(newOrder);
  }
  async findOne(orderId:number, userId:number){
    const pd = await this.orderRepository.findOne({
      where: {
        id:orderId,
        userId:userId
      }
    })
    return await pd;
  }
}
