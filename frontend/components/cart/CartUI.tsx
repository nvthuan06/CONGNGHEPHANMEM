// ./frontend/components/cart/Cart.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/context/CartContext";
import { toppings } from "@/types/option";

export default function Cart() {
  const { cartItems, removeFromCart, totalPrice } = useCart();

  // Nếu giỏ hàng trống
  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center mt-10">
        <h2 className="text-2xl font-bold mb-4">Giỏ hàng của bạn đang trống</h2>
        <Link href="/" className="text-emerald-600 hover:underline">
          &larr; Quay lại Menu để chọn món
        </Link>
      </div>
    );
  }

  // Nếu có hàng thì hiển thị danh sách
  return (
    <main className="container mx-auto p-6 max-w-3xl">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Giỏ hàng của bạn
      </h1>

      <div className="bg-white border rounded-xl shadow-sm overflow-hidden">
        <ul className="divide-y">
          {cartItems.map(function (item) {
            return (
              <li
                key={item.cartItemId}
                className="p-4 flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <img
                    src={`http://localhost:3001${item.imageUrl}`}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md"
                  />
                  <div>
                    <h3 className="font-bold text-lg">
                      {item.name} (x{item.quantity})
                    </h3>
                    <p className="text-sm text-gray-500">
                      Size: {item.size} | Topping:{" "}
                      {item.toppings.length > 0
                        ? item.toppings.map(function (id) {
                          const timTopping = toppings.find(function (topping) {
                            return topping.id === id;
                          });

                          return timTopping?.name;
                        }).join(", ")
                        : "Không"}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-emerald-600 mb-2">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                  </p>
                  <button
                    onClick={function () {
                      removeFromCart(item.cartItemId);
                    }}
                    className="text-sm text-white-500 hover:underline bg-red-500 px-3 py-1 rounded-xl hover:bg-red-600"
                  >
                    Xóa
                  </button>
                </div>
              </li>
            );
          })}
        </ul>

        <div className="p-6 bg-gray-50 border-t flex justify-between items-center">
          <span className="text-xl font-semibold">Tổng cộng:</span>
          <span className="text-2xl font-bold text-emerald-600">
            {totalPrice.toLocaleString("vi-VN")} đ
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-between">
        <Link
          href="/"
          className="px-6 py-3 border rounded-lg hover:bg-gray-100 transition font-medium"
        >
          Tiếp tục mua hàng
        </Link>
        {/* Nút này sẽ dành cho Task 6 */}
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-lg">
          Tiến hành Đặt hàng
        </button>
      </div>
    </main>
  );
}
