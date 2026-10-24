// ./backend/src/orders/entities/order-item.entity.ts
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import type { Relation } from 'typeorm';
import { Order } from './order.js';
import { Product } from '../../products/products.entity.js';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn()
  id: number; // Mã chi tiết

  @Column()
  orderId: number; // Mã đơn hàng (Khóa ngoại)

  @Column()
  productId: number; // Mã sản phẩm

  @Column()
  size: string; // Size S, M, L

  @Column()
  qty: number; // Số lượng

  @Column('float')
  lineTotal: number; // Thành tiền

  // Quan hệ n-1: Nhiều chi tiết thuộc về 1 đơn hàng
  @ManyToOne(() => Order, (order) => order.items)
  @JoinColumn({ name: 'orderId' })
  order: Relation<Order>;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'productId' })
  product: Relation<Product>;
}