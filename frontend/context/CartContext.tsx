
"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { CartItem } from "@/types/cart";

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (cartItemId: string) => void;
  clearCart: () => void;
  totalPrice: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  // Thêm vào giỏ
  function addToCart(item: CartItem) {
    setCartItems(function (danhSachCu) {
      const monDaCo = danhSachCu.find(function (monHienTai) {
        return monHienTai.cartItemId === item.cartItemId;
      });

      if (monDaCo) {
        return danhSachCu.map(function (monHienTai) {
          if (monHienTai.cartItemId === item.cartItemId) {
            return {
              ...monHienTai,
              quantity: monHienTai.quantity + item.quantity,
            };
          }
          return monHienTai;
        });
      }

      return [...danhSachCu, item];
    });
  }

  // Xóa khỏi giỏ
  function removeFromCart(cartItemId: string) {
    setCartItems(function (danhSachCu) {
      return danhSachCu.filter(function (monHienTai) {
        return monHienTai.cartItemId !== cartItemId;
      });
    });
  }

  // Xóa toàn bộ giỏ hàng sau khi đặt hàng thành công
  function clearCart() {
    setCartItems([]);
  }

  // Tính tổng tiền
  let totalPrice = 0;
  for (let i = 0; i < cartItems.length; i++) {
    totalPrice = totalPrice + cartItems[i].price * cartItems[i].quantity;
  }

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        clearCart,
        totalPrice,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

// Xuất dữ liệu cho file khác sử dụng
export function useCart() {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error("Hàm useCart phải được gọi bên trong thẻ CartProvider");
  }

  return context;
}
