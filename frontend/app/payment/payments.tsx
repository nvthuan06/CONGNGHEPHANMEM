// frontend/app/payment/page.tsx
"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCart } from "@/context/CartContext";

function CheckoutContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const { totalPrice, clearCart, cartItems } = useCart();

  // State phương thức thanh toán: mặc định là WALLET (Ví điện tử)
  const [method, setMethod] = useState<"WALLET" | "CARD">("WALLET");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Cờ giả lập lỗi thanh toán để demo kịch bản thất bại cho giảng viên
  const [simulateFail, setSimulateFail] = useState(false);

  // Nếu không có orderId hoặc giỏ hàng trống và chưa có đơn
  if (!orderId) {
    return (
      <div className="max-w-md mx-auto p-6 text-center">
        <p className="text-red-500 font-medium">Không tìm thấy mã đơn hàng!</p>
        <button
          onClick={() => router.push("/")}
          className="mt-4 px-4 py-2 bg-emerald-700 text-white rounded-lg"
        >
          Quay về trang chủ
        </button>
      </div>
    );
  }

  async function handlePayment() {
    setLoading(true);
    setErrorMsg(null);

    try {
      // Lấy token nếu hệ thống của bạn yêu cầu xác thực JWT ở backend
      const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      // Gọi API POST /payments vừa tạo ở Backend
      const response = await fetch("http://localhost:3001/payments", {
        method: "POST",
        headers,
        body: JSON.stringify({
          orderId: Number(orderId),
          method: method,
          simulateFail: simulateFail, // Gửi cờ test lỗi nếu được tích chọn
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Thanh toán thất bại");
      }

      // 1. THANH TOÁN THÀNH CÔNG:
      // Xóa sạch giỏ hàng theo đúng tiêu chí Acceptance Criteria
      clearCart();

      // Thông báo và chuyển hướng sang màn hình Xác nhận đơn (Wireframe số 5)
      alert(`Thanh toán thành công cho đơn #${orderId}! Trạng thái: PAID`);
      // Nếu bạn đã có trang xác nhận, đổi đường dẫn dưới đây:
      router.push(`/?orderSuccess=${orderId}`);
    } catch (err: any) {
      // 2. THANH TOÁN THẤT BẠI:
      // Giữ nguyên giỏ hàng (không gọi clearCart) và hiển thị thông báo lỗi
      setErrorMsg(err.message || "Đã có lỗi xảy ra trong quá trình thanh toán");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-md mx-auto min-h-screen bg-white p-6 flex flex-col justify-between border-x border-gray-100 shadow-sm font-sans">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between border-b pb-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-500 hover:text-gray-800 text-sm font-medium"
          >
            ← Quay lại
          </button>
          <h1 className="text-xl font-bold text-gray-800">Thanh toán</h1>
          <div className="w-10"></div>
        </div>

        {/* Thông tin đơn và tổng tiền */}
        <div className="bg-gray-50 p-4 rounded-xl mb-6">
          <p className="text-sm text-gray-500">Mã đơn hàng: <strong className="text-gray-800">#{orderId}</strong></p>
          <div className="flex justify-between items-baseline mt-2">
            <span className="text-gray-600 font-medium">Tổng tiền:</span>
            <span className="text-2xl font-bold text-emerald-800">
              {totalPrice.toLocaleString("vi-VN")}đ
            </span>
          </div>
        </div>

        {/* Lựa chọn phương thức thanh toán */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-3">
            Phương thức thanh toán
          </label>

          <div className="space-y-3">
            {/* Phương thức Ví điện tử */}
            <label
              className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                method === "WALLET"
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="WALLET"
                  checked={method === "WALLET"}
                  onChange={() => setMethod("WALLET")}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-gray-800">Ví điện tử (Momo / ZaloPay)</span>
              </div>
              <span className="text-xl">📱</span>
            </label>

            {/* Phương thức Thẻ ngân hàng */}
            <label
              className={`flex items-center justify-between p-4 border rounded-xl cursor-pointer transition ${
                method === "CARD"
                  ? "border-emerald-600 bg-emerald-50/50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center gap-3">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="CARD"
                  checked={method === "CARD"}
                  onChange={() => setMethod("CARD")}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500"
                />
                <span className="font-medium text-gray-800">Thẻ ngân hàng (ATM / Visa)</span>
              </div>
              <span className="text-xl">💳</span>
            </label>
          </div>

          <p className="text-xs text-gray-400 mt-3 text-center italic">
            * Không dùng tiền mặt theo chuẩn BrewLite
          </p>
        </div>

        {/* Công cụ hỗ trợ demo: Giả lập lỗi */}
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4 text-xs text-amber-800 flex items-center gap-2">
          <input
            type="checkbox"
            id="mockError"
            checked={simulateFail}
            onChange={(e) => setSimulateFail(e.target.checked)}
            className="rounded text-amber-600"
          />
          <label htmlFor="mockError" className="cursor-pointer">
            (Demo) Giả lập thanh toán lỗi để kiểm tra `PAYMENT_FAILED`
          </label>
        </div>

        {/* Thông báo lỗi nếu thanh toán thất bại */}
        {errorMsg && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm mb-4">
            ⚠️ {errorMsg}
            <p className="text-xs text-red-500 mt-1">Giỏ hàng của bạn vẫn được giữ nguyên. Hãy thử lại.</p>
          </div>
        )}
      </div>

      {/* Nút hành động */}
      <div className="pt-4 border-t">
        <button
          onClick={handlePayment}
          disabled={loading}
          className="w-full py-3.5 bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-400 text-white font-semibold rounded-xl shadow-md transition duration-200 flex justify-center items-center gap-2"
        >
          {loading ? (
            <>
              <span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"></span>
              Đang xử lý giao dịch...
            </>
          ) : (
            "Xác nhận trả"
          )}
        </button>
      </div>
    </div>
  );
}

export default function CheckoutPage() {
  return (
    <Suspense fallback={<div className="p-6 text-center text-gray-500">Đang tải trang thanh toán...</div>}>
      <CheckoutContent />
    </Suspense>
  );
}