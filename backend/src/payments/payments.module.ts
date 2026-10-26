// backend/src/payments/payments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PaymentsController } from './payments.controller.js';
import { PaymentsService } from './payments.service.js';
import { MockPaymentService } from './mock-payment.service.js';
import { Payment } from './entities/payment.js';
import { Order } from '../orders/entities/order.js';
import { User } from '../users/entities/user.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([Payment, Order, User])],
  controllers: [PaymentsController],
  providers: [PaymentsService, MockPaymentService],
  exports: [PaymentsService],
})
export class PaymentsModule {}