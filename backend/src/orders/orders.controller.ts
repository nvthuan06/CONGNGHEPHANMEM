// backend/src/orders/orders.controller.ts
import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  ParseIntPipe,
  Patch,
} from '@nestjs/common';
import type { Request } from 'express';
import { OrdersService } from './orders.service.js';
import { OrderDto } from './dto/order.dto.js';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard.js';

interface AuthenticatedRequest extends Request {
  user: {
    userId: number;
    email: string;
  };
}

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() orderDto: OrderDto, @Req() request: AuthenticatedRequest) {
    const userId = request.user.userId;

    return this.ordersService.create(orderDto, userId);
  }
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findAll(@Req() request: AuthenticatedRequest) {
    return this.ordersService.getMyOrders(request.user.userId);
  }

  @Get('loyalty/balance')
  @UseGuards(JwtAuthGuard)
  getLoyaltyBalance(@Req() request: AuthenticatedRequest) {
    return this.ordersService.getLoyaltyBalance(request.user.userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() request: any) {
    const userId = request.user.userId;
    return this.ordersService.findOne(id, userId);
  }

  @Patch(':id/cancel')
  @UseGuards(JwtAuthGuard)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Req() request: AuthenticatedRequest,
  ) {
    const userId = request.user.userId;
    return this.ordersService.cancelOrder(id, userId);
  }
}