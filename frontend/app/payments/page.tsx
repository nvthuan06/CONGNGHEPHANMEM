"use client";

import { Suspense, useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

function PaymentContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { accessToken } = useAuth();

  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Cấu hình tài khoản nhận tiền (thay bằng STK của bạn)
  const BANK_ID = "MB"; // Ngân hàng: MB, VCB, ACB, TPB,...
  const ACCOUNT_NO = "0000000002"; // Số tài khoản ngân hàng
  const ACCOUNT_NAME = "NGUYEN VU THUAN"; // Tên chủ tài khoản

  const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

  useEffect(() => {
    if (!orderId) {
      setError("Không tìm thấy mã đơn hàng.");
      setLoading(false);
      return;
    }

    if (!accessToken) return;

    // 1. Hàm kiểm tra trạng thái đơn hàng từ Backend
    function fetchOrderStatus() {
      fetch(`${apiUrl}/orders/${orderId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })
        .then(async (res) => {
          if (!res.ok) throw new Error("Không thể tải thông tin đơn hàng.");
          return res.json();
        })
        .then((data) => {
          setOrder(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }

    // Lấy thông tin đơn hàng ngay khi vào trang
    fetchOrderStatus();

    // 2. Tự động kiểm tra lại mỗi 3 giây xem webhook đã cập nhật đơn sang PAID chưa
    const interval = setInterval(() => {
      if (order?.status !== "PAID") {
        fetchOrderStatus();
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [orderId, accessToken, apiUrl, order?.status]);

  if (loading) {
    return <p className="text-center p-8">Đang tải hóa đơn thanh toán...</p>;
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 text-red-700 rounded-xl text-center border border-red-200">
        {error}
      </div>
    );
  }

  // MÀN HÌNH 1: Khi đơn hàng đã được cập nhật thành PAID
  if (order?.status === "PAID") {
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
        <Link
          href="/"
          className="inline-block px-6 py-3 bg-emerald-600 text-white font-bold rounded-lg hover:bg-emerald-700 transition"
        >
          Quay lại Trang chủ
        </Link>
      </div>
    );
  }

  // MÀN HÌNH 2: Hiển thị mã QR để chuyển khoản
  // Cú pháp nội dung chuyển khoản phải đúng dạng "DH<orderId>" để webhook bóc tách
  const transferContent = `DH${orderId}`;
  const qrUrl = `https://qr.sepay.vn/img?bank=${BANK_ID}&acc=${ACCOUNT_NO}&template=compact&amount=${order?.total}&des=${transferContent}`;

  return (
    <div className="bg-white border rounded-2xl p-6 shadow-sm text-center">
      <h1 className="text-2xl font-bold mb-2 text-gray-800">
        Thanh toán đơn hàng #{orderId}
      </h1>
      <p className="text-sm text-gray-500 mb-6">
        Quét mã QR bằng ứng dụng ngân hàng bất kỳ để hoàn tất thanh toán
      </p>

      {/* KHUNG HIỂN THỊ ẢNH MÃ QR */}
      <div className="flex justify-center mb-6">
        <img
          src={qrUrl}
          alt="Mã QR Chuyển khoản"
          className="w-72 h-auto border rounded-xl shadow-md"
        />
      </div>

      {/* CHI TIẾT THÔNG TIN CHUYỂN KHOẢN */}
      <div className="bg-gray-50 rounded-xl p-4 text-left text-sm space-y-2.5 mb-6 border">
        <div className="flex justify-between">
          <span className="text-gray-500">Ngân hàng:</span>
          <span className="font-bold text-gray-800">{BANK_ID}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Chủ tài khoản:</span>
          <span className="font-bold text-gray-800">{ACCOUNT_NAME}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Số tài khoản:</span>
          <span className="font-bold text-gray-800">{ACCOUNT_NO}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Số tiền:</span>
          <span className="font-extrabold text-emerald-600 text-base">
            {Number(order?.total).toLocaleString("vi-VN")} đ
          </span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500">Nội dung chuyển khoản:</span>
          <span className="font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded border border-red-200">
            {transferContent}
          </span>
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 text-amber-600 text-sm animate-pulse">
        <span>⏳ Đang chờ hệ thống ghi nhận chuyển khoản...</span>
      </div>
    </div>
  );
}

export default function PaymentPage() {
  return (
    <main className="container mx-auto p-6 max-w-lg mt-8">
      <Suspense fallback={<div className="text-center p-8">Đang tải trang...</div>}>
        <PaymentContent />
      </Suspense>
    </main>
  );
}