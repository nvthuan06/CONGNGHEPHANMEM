"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Product } from "@/types/product";
import { sizes, toppings } from "@/types/option";

export default function ProductDetail({ productID }: { productID: string }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState("S");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  const API_URL = `http://localhost:3001/products/${productID}`;

  useEffect(() => {
    fetch(API_URL)
      .then(async (response) => {
        if (!response.ok) throw new Error(`Lỗi gọi API (${response.status})`);
        return response.json();
      })
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((e) => {
        setErrorMsg(e.message || "Không kết nối được tới Backend");
        setLoading(false);
      });
  }, [API_URL]);

  if (loading)
    return <div className="p-8 text-center">Đang tải chi tiết sản phẩm...</div>;

  if (errorMsg) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto mt-6">
        <p className="font-bold text-lg mb-2">Lỗi:</p>
        <p>{errorMsg}</p>
      </div>
    );
  }

  if (!product)
    return (
      <div className="p-8 text-center text-red-500">
        Không tìm thấy sản phẩm.
      </div>
    );

  const toggleTopping = (toppingId: string) => {
    setSelectedToppings((prev) =>
      prev.includes(toppingId)
        ? prev.filter((id) => id !== toppingId)
        : [...prev, toppingId],
    );
  };

  const sizeExtra = sizes.find((s) => s.name === selectedSize)?.extraPrice || 0;
  const toppingExtra = selectedToppings.reduce((sum, topId) => {
    const item = toppings.find((t) => t.id === topId);
    return sum + (item ? item.price : 0);
  }, 0);
  const totalPrice = Number(product.price || 0) + sizeExtra + toppingExtra;

  return (
    <main className="container mx-auto p-6 max-w-xl">
      <Link
        href="/"
        className="text-emerald-600 hover:underline mb-4 inline-block"
      >
        &larr; Quay lại Menu
      </Link>
      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <img
          src={`http://localhost:3001${product.imageUrl}`}
          alt={product.name}
          className="w-full h-auto object-cover rounded-lg mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-gray-500 mb-6">
          Giá gốc: {Number(product.price || 0).toLocaleString("vi-VN")} đ
        </p>

        {/* Size */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Size:</h3>
          <div className="flex gap-3">
            {sizes.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelectedSize(s.name)}
                className={`px-4 py-2 border rounded-md transition ${selectedSize === s.name ? "bg-emerald-600 text-white" : "bg-gray-50"}`}
              >
                Size {s.name}{" "}
                {s.extraPrice > 0 ? `(+${s.extraPrice / 1000}k)` : ""}
              </button>
            ))}
          </div>
        </div>

        {/* Topping */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Topping:</h3>
          <div className="flex flex-wrap gap-3">
            {toppings.map((t) => (
              <button
                key={t.id}
                onClick={() => toggleTopping(t.id)}
                className={`px-4 py-2 border rounded-md transition ${selectedToppings.includes(t.id) ? "bg-amber-600 text-white" : "bg-gray-50"}`}
              >
                {t.name} (+{t.price / 1000}k)
              </button>
            ))}
          </div>
        </div>

        {/* Tổng tiền */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-lg">Tổng tiền:</span>
            <span className="text-2xl font-bold text-emerald-600">
              {totalPrice.toLocaleString("vi-VN")} đ
            </span>
          </div>
          <button className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold">
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </main>
  );
}
