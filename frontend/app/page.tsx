// ./frontend/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { Product } from '../types/product';
import { ProductCard } from '../components/ProductCard';

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Gọi API Task 2 từ Backend NestJS
    fetch('http://localhost:3000/products')
      .then((response) => {
        if (!response.ok) throw new Error('Không thể tải danh sách sản phẩm');
        return response.json();
      })
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center text-lg">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-500 font-semibold">{error}</div>;
  if (products.length === 0) return <div className="p-8 text-center">Chưa có sản phẩm nào trong menu.</div>;

  return (
    <main className="container mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Menu Đồ Uống BrewLite</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map((item) => (
          <ProductCard key={item.id} product={item} />
        ))}
      </div>
    </main>
  );
}