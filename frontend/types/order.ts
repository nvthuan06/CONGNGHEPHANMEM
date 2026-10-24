import type { OrderItem } from './orderitem';
export interface Order {
    id: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
}