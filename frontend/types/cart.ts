// ./frontend/types/cart.ts
export interface CartItem {
  cartItemId: string;
  productId: string; // product.id
  name: string;
  price: number; // product.price + size + topping
  size: string;
  toppings: string[]; // mảng ID của topping
  quantity: number;
  imageUrl: string;
}