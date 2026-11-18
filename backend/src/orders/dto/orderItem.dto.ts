// backend/src/orders/dto/orderItem.dto.ts
import { IsNumber, IsString, IsNotEmpty, Min, IsArray, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ 
    example: 12, 
    description: 'ID của sản phẩm (món nước)' 
  })
  @IsNumber()
  productId: number; 

  @ApiProperty({ 
    example: 'L', 
    description: 'Kích cỡ ly (S, M, L)' 
  })
  @IsString()
  @IsNotEmpty()
  size: string; 

  @ApiProperty({ 
    example: 2, 
    description: 'Số lượng đặt mua', 
    minimum: 1 
  })
  @IsNumber()
  @Min(1)
  quantity: number; 

  @ApiPropertyOptional({ 
    example: ['Trân châu', 'Kem'], 
    description: 'Danh sách các món topping thêm vào' 
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  toppings?: string[];
}