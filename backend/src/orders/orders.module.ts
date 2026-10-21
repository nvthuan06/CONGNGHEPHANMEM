// backend/src/order/orders.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.js';
import { OrderItem } from './entities/orderItem.js';
import { OrdersController } from './orders.controller.js';
import { OrdersService } from './orders.service.js';
import { Product } from '../products/products.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem,Product])],
  controllers: [OrdersController],
  providers: [OrdersService],
})
export class OrdersModule {}