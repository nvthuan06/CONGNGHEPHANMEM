// backend/src/payments/entities/payment.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import type { Relation } from 'typeorm';
import { Order } from '../../orders/entities/order.js';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  orderId: number;

  // Để nullable: true ở Task 8, sang Task 10 sẽ dùng để chống thanh toán trùng
  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
    unique: true,
  })
  idempotencyKey: string | null;

  @Column('float')
  amount: number;

  @Column()
  method: string; // 'WALLET' (Ví điện tử) hoặc 'CARD' (Thẻ ngân hàng)

  @Column({ default: 'SUCCESS' })
  status: string; // 'SUCCESS' hoặc 'FAILED'

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Order, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;
}