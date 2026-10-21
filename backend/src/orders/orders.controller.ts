
import {
    Controller,
    Post,
    Body,
    UseGuards,
    Req,
    Get,
    Param,
    ParseIntPipe,
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
    constructor(
        private readonly ordersService: OrdersService,
    ) { }

    @Post()
    @UseGuards(JwtAuthGuard)
    create(
        @Body() orderDto: OrderDto,
        @Req() request: AuthenticatedRequest,
    ) {
        const userId = request.user.userId;

        return this.ordersService.create(orderDto, userId);
    }
    @Get(':id')
    @UseGuards(JwtAuthGuard)
    findOne(
        @Param('id', ParseIntPipe) id:number,
        @Req() request: any,
    ){
        const userId = request.user.userId;
        return this.ordersService.findOne(id, userId);

    }


}
