// frontend/app/payments/page.tsx
"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

type Order = {
  id: number;
  total: number | string;
  status: string;
};

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { accessToken } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState("");
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleMockPayment(method: "WALLET" | "CARD") {
    if (!orderId || !accessToken) return;
    setIsProcessing(true);

    // Tạo khóa chống trùng lặp độc nhất cho lần bấm này
    const idempotencyKey = `MOCK_${orderId}_${Date.now()}`;

    try {
      const res = await fetch(`${apiUrl}/payments`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          orderId: Number(orderId),
          method: method,
          idempotencyKey: idempotencyKey, // Gửi khóa xuống Backend
          simulateFail: false, // Đổi thành true nếu bạn muốn test màn hình lỗi chữ thập đỏ
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Thanh toán thất bại");
      }
      // Nếu thành công, cơ chế Polling 3s hiện tại của bạn sẽ tự động
      // lấy trạng thái PAID mới từ DB và chuyển sang màn hình xanh lá!
    } catch (err: any) {
      setError("Lỗi kết nối khi thanh toán");
    } finally {
      setIsProcessing(false);
    }
  }
  // Tài khoản ngân hàng nhận tiền (Test Mode)
  const BANK_ID = "MB";
  const ACCOUNT_NO = "0000000002";
  const ACCOUNT_NAME = "NGUYEN VU THUAN";

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  // Kiểm tra trạng thái đơn hàng từ Backend
  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      setError("Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }

    if (!accessToken) {
      setOrder(null);
      setError("");
      setLoading(false);
      return;
    }

    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function fetchOrderStatus() {
      try {
        const response = await fetch(`${apiUrl}/orders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        });

        if (response.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn hoặc không hợp lệ. Vui lòng đăng nhập lại.",
          );
        }

        if (response.status === 403) {
          throw new Error("Bạn không có quyền xem đơn hàng này.");
        }

        if (response.status === 404) {
          throw new Error("Không tìm thấy đơn hàng.");
        }

        if (!response.ok) {
          throw new Error(
            "Không thể tải thông tin đơn hàng. Vui lòng thử lại.",
          );
        }

        const data: Order = await response.json();

        if (cancelled) return;

        setOrder(data);
        setError("");
        setLoading(false);

        // Chỉ kiểm tra lại khi đơn đang PENDING.
        // setTimeout tránh request chồng nhau.
        if (data.status === "PENDING") {
          timer = setTimeout(fetchOrderStatus, 3000);
        }
      } catch (err) {
        if (cancelled) return;

        setError(
          err instanceof Error ? err.message : "Đã xảy ra lỗi không xác định.",
        );
        setLoading(false);
      }
    }

    setOrder(null);
    setError("");
    setLoading(true);

    void fetchOrderStatus();

    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [orderId, accessToken, apiUrl]);

  // 1. Không có mã đơn hàng
  if (!orderId) {
    return (
      <div className="p-6 bg-red-50 text-red-700 border border-red-200 rounded-xl text-center">
        <p className="mb-4">Không tìm thấy mã đơn hàng.</p>
        <Link href="/cart" className="underline font-semibold">
          Quay lại giỏ hàng
        </Link>
      </div>
    );
  }

  // 2. Chưa đăng nhập
  if (!accessToken) {
    const redirectPath = `/payments?orderId=${encodeURIComponent(orderId)}`;

    return (
      <div className="p-6 bg-amber-50 border border-amber-200 rounded-xl text-center">
        <h2 className="text-xl font-bold text-amber-800 mb-3">
          Bạn chưa đăng nhập
        </h2>

        <p className="text-gray-700 mb-5">
          Vui lòng đăng nhập để xem và thanh toán đơn hàng #{orderId}.
        </p>

        <Link
          href={`/login?redirect=${encodeURIComponent(redirectPath)}`}
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
        >
          Đăng nhập ngay
        </Link>
      </div>
    );
  }

  // 3. Đang tải thông tin đơn hàng
  if (loading) {
    return (
      <p className="text-center p-8 text-gray-600">
        Đang tải hóa đơn thanh toán...
      </p>
    );
  }

  // 4. Có lỗi từ Backend
  if (error) {
    const isAuthError = error.includes("Phiên đăng nhập");

    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl text-center border border-red-200">
        <h2 className="text-xl font-bold mb-3">Không thể tải đơn hàng</h2>

        <p className="mb-5">{error}</p>

        {isAuthError ? (
          <Link
            href={`/login?redirect=${encodeURIComponent(
              `/payments?orderId=${encodeURIComponent(orderId)}`,
            )}`}
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg"
          >
            Đăng nhập lại
          </Link>
        ) : (
          <Link
            href="/HistoryOrders"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg"
          >
            Xem lịch sử đơn hàng
          </Link>
        )}
      </div>
    );
  }

  // 5. Không có dữ liệu đơn hàng
  if (!order) {
    return (
      <div className="p-6 bg-red-50 text-red-700 rounded-xl text-center border border-red-200">
        Không có dữ liệu đơn hàng.
      </div>
    );
  }

  // 6. Thanh toán thành công
  if (order.status === "PAID") {
    return (
      <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          ✓
        </div>

        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          Thanh toán thành công!
        </h1>

        <p className="text-gray-500 mb-6">
          Đơn hàng #{orderId} đã được hệ thống ghi nhận.
        </p>

        <div className="flex flex-wrap justify-center gap-3">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
          >
            Quay lại Trang chủ
          </Link>

          <Link
            href="/HistoryOrders"
            className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
          >
            Lịch sử mua hàng
          </Link>
        </div>
      </div>
    );
  }

  // 7. Thanh toán thất bại
  if (order.status === "PAYMENT_FAILED") {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 shadow-sm text-center">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl font-bold">
          ✕
        </div>

        <h1 className="text-2xl font-bold text-red-700 mb-2">
          Thanh toán thất bại
        </h1>

        <p className="text-gray-600 mb-6">
          Đơn hàng #{orderId} chưa được thanh toán thành công.
        </p>

        <Link
          href="/HistoryOrders"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700"
        >
          Xem lịch sử đơn hàng
        </Link>
      </div>
    );
  }

  // 8. Đơn hàng bị hủy
  if (order.status === "CANCELLED") {
    return (
      <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-3">
          Đơn hàng đã bị hủy
        </h1>

        <p className="text-gray-600 mb-6">
          Đơn hàng #{orderId} hiện không thể tiếp tục thanh toán.
        </p>

        <Link
          href="/cart"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg"
        >
          Trở lại giỏ hàng
        </Link>
      </div>
    );
  }

  // 9. Các trạng thái khác không được hiển thị QR
  if (order.status !== "PENDING") {
    return (
      <div className="bg-white border rounded-2xl p-8 shadow-sm text-center">
        <h1 className="text-xl font-bold text-gray-800 mb-3">
          Trạng thái đơn hàng: {order.status}
        </h1>

        <p className="text-gray-600 mb-6">
          Đơn hàng #{orderId} không còn ở trạng thái chờ thanh toán.
        </p>

        <Link
          href="/HistoryOrders"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg"
        >
          Xem lịch sử đơn hàng
        </Link>
      </div>
    );
  }

  // 10. Đơn PENDING: Hiển thị QR SePay
  const transferContent = `DH${orderId}`;

  const qrParams = new URLSearchParams({
    bank: BANK_ID,
    acc: ACCOUNT_NO,
    template: "compact",
    amount: String(order.total),
    des: transferContent,
  });

  const qrUrl = `https://qr.sepay.vn/img?${qrParams.toString()}`;

  // Hủy đơn hàng
  async function handleCancelOrder() {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;
    if (!orderId || !accessToken) return;

    setIsCancelling(true);
    try {
      const res = await fetch(`${apiUrl}/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Không thể hủy đơn hàng.");
      }

      // Ép giao diện cập nhật ngay lập tức sang CANCELLED
      setOrder((prev) => (prev ? { ...prev, status: "CANCELLED" } : null));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsCancelling(false);
    }
  }

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm text-center">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">
        Thanh toán đơn hàng #{orderId}
      </h1>

      <p className="text-sm text-gray-500 mb-6">
        Quét mã QR bằng ứng dụng ngân hàng để hoàn tất thanh toán
      </p>

      <div className="flex justify-center mb-6">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={qrUrl}
          alt={`Mã QR thanh toán đơn hàng ${orderId}`}
          className="w-72 h-auto border rounded-xl shadow-md"
        />
      </div>

      <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2.5 mb-6 border">
        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Ngân hàng:</span>
          <span className="font-bold text-gray-800">{BANK_ID}</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Chủ tài khoản:</span>
          <span className="font-bold text-gray-800">{ACCOUNT_NAME}</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Số tài khoản:</span>
          <span className="font-bold text-gray-800">{ACCOUNT_NO}</span>
        </div>

        <div className="flex justify-between gap-3">
          <span className="text-gray-500">Số tiền:</span>
          <span className="font-extrabold text-emerald-600 text-base">
            {Number(order.total).toLocaleString("vi-VN")} đ
          </span>
        </div>

        <div className="flex justify-between items-center gap-3">
          <span className="text-gray-500">Nội dung chuyển khoản:</span>

          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            {transferContent}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-amber-600 text-sm animate-pulse">
        <span> Chờ chuyển khoản...</span>
      </div>
      <div className="mt-4">
        <button
          onClick={handleCancelOrder}
          disabled={isCancelling}
          className="w-full py-2.5 bg-white border border-black rounded-lg text-sm font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition"
        >
          {isCancelling ? "Đang xử lý..." : "Hủy đơn hàng"}
        </button>
      </div>
      {/* <div className="mt-8 border-t border-gray-100 pt-6">
        <p className="text-sm text-gray-500 mb-4">
          Hoặc thử nghiệm thanh toán nội bộ:
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={() => handleMockPayment("WALLET")}
            disabled={isProcessing}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isProcessing ? "Đang xử lý..." : "Thanh toán Ví (MOCK)"}
          </button>

          <button
            onClick={() => handleMockPayment("CARD")}
            disabled={isProcessing}
            className="px-6 py-2 bg-emerald-600 text-white rounded-lg text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50 transition"
          >
            {isProcessing ? "Đang xử lý..." : "Thanh toán Thẻ (MOCK)"}
          </button>
        </div>
      </div> */}
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="container mx-auto p-6 max-w-lg mt-8">
      <Suspense
        fallback={<div className="text-center p-8">Đang tải trang...</div>}
      >
        <PaymentContent />
      </Suspense>
    </main>
  );
}
