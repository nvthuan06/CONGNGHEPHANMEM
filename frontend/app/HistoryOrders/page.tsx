// frontend/app/HistoryOrders/page.tsx
"use client";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { OrderItem } from "../../types/orderitem";
import type { Order } from "../../types/order";
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function HistoryOrderPage() {
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { accessToken } = useAuth();
  const [cancellingId, setCancellingId] = useState<number | null>(null);

  useEffect(() => {
    async function QuyenOrder() {
      if (!accessToken) {
        setError("Vui lòng đăng nhập trước khi xem lịch sử mua hàng!");
        setLoading(false);
        return;
      }
      try {
        const res = await fetch(`${API_BASE_URL}/orders/me`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (res.status === 401) {
          throw new Error(
            "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
          );
        }

        if (!res.ok) {
          throw new Error("Không thể tải danh sách đơn hàng");
        }
        const data = await res.json();
        setOrders(Array.isArray(data) ? data : []);
      } catch (err: any) {
        setError(err.message || "Đã có lỗi ");
      } finally {
        setLoading(false);
      }
    }
    QuyenOrder();
  }, []);
  async function handleCancelOrder(orderId: number) {
    if (!confirm("Bạn có chắc chắn muốn hủy đơn hàng này không?")) return;

    setCancellingId(orderId);
    try {
      const res = await fetch(`${API_BASE_URL}/orders/${orderId}/cancel`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "Không thể hủy đơn hàng");
      }

      // Ép giao diện cập nhật ngay lập tức: Đổi status đơn này thành CANCELLED
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.id === orderId ? { ...order, status: "CANCELLED" } : order,
        ),
      );
    } catch (err: any) {
      alert(err.message);
    } finally {
      setCancellingId(null);
    }
  }
  return (
    <div className="w-full mx-auto min-h-screen bg-gray-50 p-4 font-sans">
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 mb-4 bg-white -mx-4 px-4 pt-2 shadow-sm">
        <button
          onClick={() => router.push("/")}
          className="text-gray-500 hover:text-gray-800 text-sm"
        >
          ← Trang chủ
        </button>
        <h1 className="text-lg font-bold text-gray-800">Lịch sử đơn hàng</h1>
        <div className="w-8"></div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-gray-500">
          <span className="animate-spin inline-block w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full mb-2"></span>
          <p>Đang tải danh sách đơn hàng...</p>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-600 p-4 rounded-xl text-center text-sm my-6">
          <p>{error}</p>
          <Link
            href="/login"
            className="mt-3 inline-block font-semibold text-emerald-700 underline"
          >
            Đăng nhập ngay
          </Link>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100 p-6">
          <span className="text-4xl block mb-2">☕</span>
          <p className="text-gray-500 font-medium">Bạn chưa có đơn hàng nào.</p>
          <Link
            href="/"
            className="mt-4 inline-block px-4 py-2 bg-emerald-700 text-white rounded-lg text-sm"
          >
            Đặt món ngay
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-xl p-4 border border-gray-200 shadow-sm"
            >
              <div className="flex justify-between items-start border-b border-gray-100 pb-2 mb-2">
                <div>
                  <span className="font-bold text-gray-800 font-mono">
                    Đơn #{order.id}
                  </span>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("vi-VN")} •{" "}
                    {new Date(order.createdAt).toLocaleTimeString("vi-VN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span
                  className={`text-xs px-2.5 py-1 rounded-full font-semibold ${
                    order.status === "PAID"
                      ? "bg-emerald-100 text-emerald-700"
                      : order.status === "PAYMENT_FAILED"
                        ? "bg-red-100 text-red-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {order.status}
                </span>
              </div>
              Tóm tắt danh sách món
              <div className="text-xs text-gray-600 space-y-1 mb-3">
                {order.items && order.items.length > 0 ? (
                  order.items.map((item) => (
                    <div key={item.id} className="flex justify-between">
                      <span>
                        {item.product?.name || `Món #${item.productId}`} (
                        {item.size}) x {item.qty}
                      </span>
                      <span>
                        {Number(item.lineTotal).toLocaleString("vi-VN")}đ
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-400 italic">
                    Chi tiết món đang cập nhật
                  </p>
                )}
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">Tổng cộng:</span>
                <span className="font-bold text-emerald-800 text-base">
                  {Number(order.total).toLocaleString("vi-VN")}đ
                </span>
              </div>
              {/* Nút thanh toán lại nếu đơn bị thất bại hoặc đang chờ */}
              {(order.status === "PAYMENT_FAILED" ||
                order.status === "PENDING") && (
                <div className="pt-2">
                  <button
                    onClick={() => router.push(`/payments?orderId=${order.id}`)}
                    className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-sm font-semibold transition"
                  >
                    Thanh toán
                  </button>
                </div>
              )}
              {order.status === "PAID" && (
                <div className="pt-2">
                  <button
                    onClick={() => handleCancelOrder(order.id)}
                    disabled={cancellingId === order.id}
                    className="w-full py-2 bg-white border rounded-lg text-sm font-semibold hover:bg-red-500 hover:text-white disabled:opacity-50 transition"
                  >
                    {cancellingId === order.id ? "Đang hủy..." : "Hủy đơn hàng"}
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
