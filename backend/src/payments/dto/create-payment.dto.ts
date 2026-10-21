// backend/src/payments/dto/create-payment.dto.ts
import { IsInt, IsIn, IsOptional, IsBoolean, IsString } from 'class-validator';

export class CreatePaymentDto {
  @IsInt()
  orderId: number;

  @IsString()
  @IsIn(['WALLET', 'CARD'], {
    message: 'Phương thức thanh toán chỉ chấp nhận WALLET (Ví) hoặc CARD (Thẻ)',
  })
  method: 'WALLET' | 'CARD';

  @IsOptional()
  @IsString()
  idempotencyKey?: string;

  // Cờ hỗ trợ test/demo: gửi simulateFail = true để ép thanh toán lỗi (PAYMENT_FAILED)
  @IsOptional()
  @IsBoolean()
  simulateFail?: boolean;
}