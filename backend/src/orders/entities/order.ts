// ./backend/src/orders/entities/order.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, OneToMany } from 'typeorm';
import type { Relation } from 'typeorm';
import { OrderItem } from './orderItem.js';

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn()
  id: number; // Mã đơn hàng

  @Column({ nullable: true })
  userId: number; // Mã khách hàng

  @Column({ default: 'PENDING' })
  status: string; // Trạng thái đơn hàng

  @Column('float')
  total: number; // Tổng tiền của chi tiết đơn hàng

  @CreateDateColumn()
  createdAt: Date; // Ngày lập đơn hàng

  // Quan hệ 1-n: 1 đơn hàng có nhiều chi tiết đơn hàng
  // cascade: true giúp khi lưu Order thì tự động lưu luôn cả mảng OrderItem
  @OneToMany(() => OrderItem, (orderItem) => orderItem.order, { cascade: true })
  items: Relation<OrderItem[]>;
}