// backend/src/payments/payments.controller.ts
import { Controller, Post, Body, UseGuards, Req } from '@nestjs/common';
import type { Request } from 'express';
import { PaymentsService } from './payments.service.js';
import { CreatePaymentDto } from './dto/create-payment.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req?: AuthenticatedRequest,
  ) {
    const userId = req?.user?.userId;
    if (userId !== undefined) {
      return this.paymentsService.createPayment(createPaymentDto, userId);
    }
    return this.paymentsService.createPayment(createPaymentDto);
  }

  @Post('sepay-webhook')
  async sepayWebhook(
    @Body() body: any,){

    return this.paymentsService.handleSepayWebhook(body);
  }
}