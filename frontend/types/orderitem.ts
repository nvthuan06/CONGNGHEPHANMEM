export interface OrderItem {
  id: number;
  size: string;
  qty: number;
  lineTotal: number;
  productId:number;
  toppings?: string[];
  product?: {
    name: string;
  };
}