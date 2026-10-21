// backend/src/payments/payments.controller.ts
import { Controller, Post, Body } from '@nestjs/common';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  async create(@Body() createPaymentDto: CreatePaymentDto) {
    return this.paymentsService.createPayment(createPaymentDto);
  }
  @Post('sepay-webhook')
  async sepayWebhook(
    @Body() body: any,){

    return this.paymentsService.handleSepayWebhook(body);
  }
}