// backend/src/orders/dto/orderItem.dto.ts
import { IsNumber, IsString, IsNotEmpty, Min, IsArray, IsOptional } from 'class-validator';

export class OrderItemDto {
  @IsNumber()
  productId: number; 

  @IsString()
  @IsNotEmpty()
  size: string; 

  @IsNumber()
  @Min(1)
  quantity: number; 

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];
}