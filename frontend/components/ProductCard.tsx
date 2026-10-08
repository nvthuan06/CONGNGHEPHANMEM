// ./frontend/components/ProductCard.tsx
import React from 'react';
import { Product } from '../types/product';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({product} : ProductCardProps) {
  return (
    <div className="border rounded-lg p-4 shadow-sm hover:shadow-md transition bg-white">
      <img 
        src={product.imageUrl || 'https://via.placeholder.com/150'} 
        alt={product.name} 
        className="w-full h-40 object-cover rounded-md mb-3"
      />
      <h3 className="font-semibold text-lg">{product.name}</h3>
      <p className="text-emerald-600 font-bold">{product.price.toLocaleString('vi-VN')}đ</p>
      <button className="mt-3 w-full bg-emerald-600 text-white py-2 rounded-md hover:bg-emerald-700 transition">
        Xem chi tiết
      </button>
    </div>
  );
};