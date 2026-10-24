export interface OrderItem {
  id: number;
  size: string;
  qty: number;
  lineTotal: number;
  productId:number;
  product?: {
    name: string;
  };
}