import {
  IsArray,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { OrderItemDto } from './orderItem.dto.js';

export class OrderDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Số điểm khách muốn sử dụng để giảm giá
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  pointsToRedeem?: number;
}