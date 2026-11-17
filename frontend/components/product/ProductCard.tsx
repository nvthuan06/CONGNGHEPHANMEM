// ./frontend/components/product/ProductCard.tsx
import React from "react";
import Link from "next/link";
import { Product } from "../../types/product";

interface ProductCardProps {
  product: Product;
}

// Lấy link Backend từ biến môi trường, fallback về localhost
const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:3001";

export function ProductCard({ product }: ProductCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white">
      <img
        // SỬA Ở ĐÂY: Thay localhost bằng BASE_URL
        src={`${BASE_URL}${product.imageUrl}`}
        alt={product.name}
        className="w-100 h-100 object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold text-lg">{product.name}</h3>
      <p className="text-emerald-600 font-bold">
        {product.price.toLocaleString("vi-VN")}đ
      </p>
      <Link
        href={`/products/${product.id}`}
        className="block mt-3 w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition text-center"
      >
        Xem chi tiết
      </Link>
    </div>
  );
}