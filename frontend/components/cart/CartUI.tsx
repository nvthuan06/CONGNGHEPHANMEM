// frontend/components/cart/CartUI.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toppings } from "@/types/option";

export default function Cart() {
  const router = useRouter();

  const { cartItems, removeFromCart, clearCart, totalPrice } = useCart();

  const { accessToken, isAuthenticated, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Gửi đơn hàng lên Backend
  async function handleCheckout() {
    setError("");
    setSuccess("");

    // Chưa đăng nhập thì chuyển đến trang đăng nhập
    if (!isAuthenticated || !accessToken) {
      router.push("/login?redirect=%2Fcart");
      return;
    }

    // Kiểm tra giỏ hàng
    if (cartItems.length === 0) {
      setError("Giỏ hàng đang trống.");
      return;
    }

    // Chuyển dữ liệu giỏ hàng thành OrderDto
    const items = cartItems.map((item) => ({
      productId: Number(item.productId),
      size: item.size,
      quantity: item.quantity,
    }));

    // Kiểm tra dữ liệu trước khi gửi
    const invalidItem = items.some(
      (item) =>
        !Number.isSafeInteger(item.productId) ||
        item.productId <= 0 ||
        !item.size.trim() ||
        !Number.isInteger(item.quantity) ||
        item.quantity < 1,
    );

    if (invalidItem) {
      setError("Giỏ hàng có sản phẩm không hợp lệ.");
      return;
    }

    setLoading(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ items }),
      });

      // JWT không hợp lệ hoặc hết hạn
      if (response.status === 401) {
        logout();
        setError(
          "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
        );
        return;
      }

      if (!response.ok) {
        setError(`Không thể tạo đơn hàng (HTTP ${response.status}).`);
        return;
      }

      // Backend tạo đơn hàng thành công
      const order = await response.json();
      clearCart();
      router.push(`payments?orderId=${order.id}`);
    } catch {
      setError("Không thể kết nối đến Backend. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  }

  // Nếu giỏ hàng trống
  if (cartItems.length === 0) {
    return (
      <div className="p-8 text-center mt-10">
        {success && (
          <p
            role="status"
            className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-700"
          >
            {success}
          </p>
        )}

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

      {error && (
        <p role="alert" className="mb-4 rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}

      {success && (
        <p
          role="status"
          className="mb-4 rounded-lg bg-emerald-50 p-4 text-emerald-700"
        >
          {success}
        </p>
      )}

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
                        ? item.toppings
                            .map(function (id) {
                              const timTopping = toppings.find(
                                function (topping) {
                                  return topping.id === id;
                                },
                              );

                              return timTopping?.name;
                            })
                            .join(", ")
                        : "Không"}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-bold text-emerald-600 mb-2">
                    {(item.price * item.quantity).toLocaleString("vi-VN")} đ
                  </p>

                  <button
                    type="button"
                    onClick={function () {
                      removeFromCart(item.cartItemId);
                    }}
                    className="text-sm text-white bg-red-500 px-3 py-1 rounded-xl hover:bg-red-600"
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

      <div className="mt-6 flex justify-between gap-3">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-lg disabled:opacity-50">
          <Link href="/">Tiếp tục mua hàng</Link>
        </button>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-lg disabled:opacity-50"
        >
          {loading ? "Đang đặt hàng..." : "Tiến hành Đặt hàng"}
        </button>
      </div>
    </main>
  );
}
