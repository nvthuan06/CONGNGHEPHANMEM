// frontend/components/cart/CartUI.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@/context/AuthContext";
import { toppings } from "@/types/option";

const MIN_REDEEM_POINTS = 100;
const VND_PER_POINT = 10;

export default function Cart() {
  const router = useRouter();

  const { cartItems, removeFromCart, clearCart, totalPrice } = useCart();

  const { accessToken, isAuthenticated, logout } = useAuth();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [loyaltyPoints, setLoyaltyPoints] = useState<number | null>(null);
  const [pointsInput, setPointsInput] = useState("0");
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState("");
  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (!accessToken) {
      setLoyaltyPoints(null);
      setPointsInput("0");
      return;
    }
    const controller = new AbortController();
    setLoyaltyLoading(true);
    setLoyaltyError("");
    fetch(`${apiUrl}/orders/loyalty/balance`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("Không thể tải số dư điểm Loyalty.");
        return response.json();
      })
      .then((data: { loyaltyPoints: number }) => {
        if (!Number.isSafeInteger(data.loyaltyPoints) || data.loyaltyPoints < 0) {
          throw new Error("Số dư điểm Loyalty không hợp lệ.");
        }
        setLoyaltyPoints(data.loyaltyPoints);
      })
      .catch((err: unknown) => {
        if (controller.signal.aborted) return;
        setLoyaltyPoints(null);
        setLoyaltyError(err instanceof Error ? err.message : "Không tải được điểm.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoyaltyLoading(false);
      });
    return () => controller.abort();
  }, [accessToken, apiUrl]);

  const rawPointsToRedeem = Number(pointsInput);
  const maxRedeemablePoints = Math.min(
    loyaltyPoints ?? 0,
    Math.floor(totalPrice / VND_PER_POINT),
  );
  const canUsePoints = maxRedeemablePoints >= MIN_REDEEM_POINTS;
  const pointsToRedeem = canUsePoints ? rawPointsToRedeem : 0;
  const pointsValid = !canUsePoints || (
    /^\d+$/.test(pointsInput) &&
    Number.isSafeInteger(pointsToRedeem) &&
    (pointsToRedeem === 0 || (
      pointsToRedeem >= MIN_REDEEM_POINTS &&
      pointsToRedeem <= maxRedeemablePoints
    ))
  );
  const discountAmount = pointsValid ? pointsToRedeem * VND_PER_POINT : 0;
  const payableTotal = totalPrice - discountAmount;


  // Gửi đơn hàng lên Backend
  async function handleCheckout() {
    setError("");

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

    if (loyaltyLoading || loyaltyPoints === null) {
      setError("Chưa tải được số dư điểm. Vui lòng thử lại.");
      return;
    }
    if (!pointsValid) {
      setError(canUsePoints
        ? `Nhập 0 điểm hoặc từ ${MIN_REDEEM_POINTS} đến ${maxRedeemablePoints} điểm.`
        : "Đơn hàng chưa đủ điều kiện đổi điểm. Vui lòng không sử dụng điểm.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ items, pointsToRedeem }),
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
        const detail = await response.json().catch(() => null);
        const message = detail?.message;
        setError(typeof message === "string" ? message :
          Array.isArray(message) ? message.join("; ") :
          `Không thể tạo đơn hàng (HTTP ${response.status}).`);
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

      <section className="mt-5 border border-gray-200 bg-white p-5" aria-label="Sử dụng điểm Loyalty">
        <h2 className="text-lg font-semibold text-gray-800">Sử dụng điểm tích lũy</h2>
        {!isAuthenticated ? (
          <p className="mt-2 text-sm text-gray-600">Đăng nhập để xem và sử dụng điểm thành viên.</p>
        ) : loyaltyLoading ? (
          <p className="mt-2 text-sm text-gray-600">Đang tải số dư điểm...</p>
        ) : loyaltyError ? (
          <p role="alert" className="mt-2 text-sm text-red-700">{loyaltyError}</p>
        ) : (
          <>
            <p className="mt-2 text-sm text-gray-600">
              Điểm hiện có: <strong>{loyaltyPoints?.toLocaleString("vi-VN")}</strong> điểm
              {" · "}100 điểm giảm 1000đ
            </p>
            {loyaltyPoints !== null && loyaltyPoints < MIN_REDEEM_POINTS ? (
              <p className="mt-2 text-sm text-amber-700" role="status">
                Bạn cần tích lũy thêm {MIN_REDEEM_POINTS - loyaltyPoints} điểm
                để được sử dụng điểm giảm giá (tối thiểu {MIN_REDEEM_POINTS} điểm).
              </p>
            ) : !canUsePoints ? (
              <p className="mt-2 text-sm text-amber-700" role="status">
                Giá trị đơn hàng chưa đủ điều kiện đổi tối thiểu {MIN_REDEEM_POINTS} điểm.
              </p>
            ) : (
              <p className="mt-2 text-sm text-gray-600">
                Có thể sử dụng từ {MIN_REDEEM_POINTS} đến {maxRedeemablePoints} điểm,
                hoặc chọn 0 điểm để không sử dụng.
              </p>
            )}
            <label htmlFor="loyalty-points" className="mt-4 block text-sm font-medium text-gray-700">
              Số điểm muốn sử dụng
            </label>
            <div className="mt-2 flex gap-2">
              <input
                id="loyalty-points"
                type="number"
                min={canUsePoints ? MIN_REDEEM_POINTS : 0}
                max={maxRedeemablePoints}
                step="1"
                value={canUsePoints ? pointsInput : "0"}
                disabled={!canUsePoints}
                onChange={(event) => setPointsInput(event.target.value)}
                aria-invalid={canUsePoints && !pointsValid}
                className="min-w-0 flex-1 border border-gray-300 px-3 py-2 text-gray-900 focus:outline-2 focus:outline-emerald-600 disabled:bg-gray-100 disabled:text-gray-500"
              />
              <button
                type="button"
                onClick={() => setPointsInput(String(maxRedeemablePoints))}
                disabled={!canUsePoints}
                className="border border-emerald-700 px-4 py-2 text-sm font-semibold text-emerald-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Dùng tối đa
              </button>
            </div>
            {canUsePoints && !pointsValid && pointsInput !== "" && (
              <p role="alert" className="mt-2 text-sm text-red-700">
                Nhập 0 điểm hoặc từ {MIN_REDEEM_POINTS} đến {maxRedeemablePoints} điểm.
              </p>
            )}
          </>
        )}
        <div className="mt-5 space-y-2 border-t border-gray-200 pt-4 text-sm">
          <div className="flex justify-between"><span>Tạm tính</span><span>{totalPrice.toLocaleString("vi-VN")} đ</span></div>
          <div className="flex justify-between"><span>Giảm từ điểm</span><span className="text-emerald-700">-{discountAmount.toLocaleString("vi-VN")} đ</span></div>
          <div className="flex justify-between text-lg font-bold"><span>Tổng thanh toán dự kiến</span><span>{payableTotal.toLocaleString("vi-VN")} đ</span></div>
          <p className="text-xs text-gray-500">Dự kiến tích thêm {Math.floor(payableTotal / 1000)} điểm sau khi thanh toán thành công.</p>
        </div>
      </section>

      <div className="mt-6 flex justify-between gap-3">
        <button className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-lg disabled:opacity-50">
          <Link href="/">Tiếp tục mua hàng</Link>
        </button>

        <button
          type="button"
          onClick={handleCheckout}
          disabled={loading || (isAuthenticated && (loyaltyLoading || loyaltyPoints === null || !pointsValid))}
          className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition font-bold text-lg disabled:opacity-50"
        >
          {loading ? "Đang đặt hàng..." : "Tiến hành Đặt hàng"}
        </button>
      </div>
    </main>
  );
}
