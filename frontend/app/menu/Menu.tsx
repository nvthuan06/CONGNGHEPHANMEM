// ./frontend/app/menu/Menu.tsx
'use client';

import { useEffect, useState } from 'react';
import { Product } from '@/types/product';
import { ProductCard } from '@/components/ProductCard';

export default function Menu() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(function () {
    fetch('http://localhost:3000/products')
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
        setErrorMsg(e.message || 'Không kết nối được tới Backend');
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
    return <div className="p-8 text-center">Chưa có sản phẩm nào trong menu.</div>;
  }

  return (
    <main className="container mx-auto p-6 min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Menu cà phê BrewLite</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
        {products.map(function (item) {
          return <ProductCard key={item.id} product={item} />;
        })}
      </div>
    </main>
  );
}