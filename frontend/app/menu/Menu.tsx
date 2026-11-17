// ./frontend/app/menu/Menu.tsx
"use client";

import { useEffect, useState } from "react";
import { Product } from "@/types/product";
import { ProductCard } from "@/components/product/ProductCard";

// Lấy link Backend từ biến môi trường, fallback về localhost
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(function () {
    // SỬA Ở ĐÂY: Dùng BASE_URL thay vì URL cứng
    fetch(`${BASE_URL}/products`)
      .then(async function (response) {
        if (!response.ok) {
          throw new Error(`Lỗi gọi API (${response.status})`);
        }
        return response.json();
      })
      .then(function (data) {
        setProducts(data);
        setLoading(false);
      })
      .catch(function (e) {
        console.error(e);
        setErrorMsg(e.message || "Không kết nối được tới Backend");
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <div className="p-8 text-center text-lg">Loading...</div>;
  }

  if (errorMsg) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto mt-6">
        <p className="font-bold text-lg mb-2">Lỗi:</p>
        <p>{errorMsg}</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="p-8 text-center">Chưa có sản phẩm nào trong menu.</div>
    );
  }

  return (
    <main className="container mx-auto p-6 min-h-screen bg-black-50">
      <h1 className="text-3xl font-bold mb-6 text-green-900">
        Menu cà phê BrewLite
      </h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map(function (item) {
          return <ProductCard key={item.id} product={item} />;
        })}
      </div>
    </main>
  );
}