// backend/src/payments/mock-payment.service.ts
import { Injectable } from '@nestjs/common';

export interface MockPaymentResult {
  success: boolean;
  transactionId?: string;
  errorMessage?: string;
}

@Injectable()
export class MockPaymentService {
  async processPayment(
    orderId: number,
    amount: number,
    method: 'WALLET' | 'CARD',
    simulateFail = false,
  ): Promise<MockPaymentResult> {
    // Giả lập độ trễ mạng 100ms (đảm bảo yêu cầu phi chức năng API < 500ms)
    await new Promise((resolve) => setTimeout(resolve, 100));

    if (simulateFail) {
      return {
        success: false,
        errorMessage: 'Giao dịch bị từ chối bởi cổng thanh toán (Mô phỏng lỗi).',
      };
    }

    return {
      success: true,
      transactionId: `MOCK_${method}_${orderId}_${Date.now()}`,
    };
  }
}