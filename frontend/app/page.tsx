// ./frontend/app/page.tsx
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';

const sizes = [
  { name: 'S', extraPrice: 0 },
  { name: 'M', extraPrice: 5000 },
  { name: 'L', extraPrice: 10000 },
];

const toppings = [
  { id: 'tc', name: 'Trân châu', price: 5000 },
  { id: 'kem', name: 'Kem', price: 10000 },
];

export default function ProductDetailPage() {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [selectedSize, setSelectedSize] = useState('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  // Đổi đường dẫn này thành '/product/1' hoặc '/products/1' cho khớp với Backend của bạn
  const API_URL = 'http://localhost:3001/products/2';

  useEffect(() => {
    fetch(API_URL)
      .then(async (res) => {
        if (!res.ok) {
          throw new Error(`Gọi sai đường dẫn API (Lỗi ${res.status}). Hãy thử đổi '/products/1' thành '/product/1'`);
        }
        return res.json();
      })
      .then((data) => {
        console.log('Dữ liệu nhận từ NestJS:', data); // Xem trong F12 -> Console
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setErrorMsg(err.message || 'Không kết nối được tới Backend (Kiểm tra cổng 3001 hoặc CORS)');
        setLoading(false);
      });
  }, []);

  if (loading) return <div className="p-8 text-center">Đang tải chi tiết sản phẩm...</div>;

  // Nếu có lỗi sẽ hiện rõ lý do lên màn hình thay vì trắng trang
  if (errorMsg) {
    return (
      <div className="p-8 text-center text-red-600 bg-red-50 border border-red-200 rounded-lg max-w-xl mx-auto mt-6">
        <p className="font-bold text-lg mb-2">Đã phát hiện lỗi:</p>
        <p>{errorMsg}</p>
        <p className="text-sm text-gray-600 mt-2">Đường dẫn đang gọi: {API_URL}</p>
      </div>
    );
  }

  if (!product) return <div className="p-8 text-center text-red-500">Không tìm thấy sản phẩm.</div>;

  const toggleTopping = (toppingId: string) => {
    if (selectedToppings.includes(toppingId)) {
      setSelectedToppings(selectedToppings.filter((id) => id !== toppingId));
    } else {
      setSelectedToppings([...selectedToppings, toppingId]);
    }
  };

  const sizeExtra = sizes.find((size) => size.name === selectedSize)?.extraPrice || 0;
  const toppingExtra = selectedToppings.reduce((sum, topId) => {
    const item = toppings.find((topping) => topping.id === topId);
    return sum + (item ? item.price : 0);
  }, 0);
  const totalPrice = Number(product.price || 0) + sizeExtra + toppingExtra;

  return (
    <main className="container mx-auto p-6 max-w-xl">
      <Link href="/" className="text-emerald-600 hover:underline mb-4 inline-block">
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
          Giá gốc: {Number(product.price || 0).toLocaleString('vi-VN')} đ
        </p>

        {/* 1. Chọn Size */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Size:</h3>
          <div className="flex gap-3">
            {sizes.map((s) => (
              <button
                key={s.name}
                onClick={() => setSelectedSize(s.name)}
                className={`px-4 py-2 border rounded-md transition ${
                  selectedSize === s.name
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                Size {s.name} {s.extraPrice > 0 ? `(+${s.extraPrice / 1000}k)` : ''}
              </button>
            ))}
          </div>
        </div>

        {/* 2. Chọn Topping */}
        <div className="mb-6">
          <h3 className="font-semibold mb-2">Topping:</h3>
          <div className="flex flex-wrap gap-3">
            {toppings.map((t) => {
              const isSelected = selectedToppings.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => toggleTopping(t.id)}
                  className={`px-4 py-2 border rounded-md transition ${
                    isSelected
                      ? 'bg-amber-600 text-white border-amber-600'
                      : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  {t.name} (+{t.price / 1000}k)
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Hiển thị Tổng tiền */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-lg">Tổng tiền:</span>
            <span className="text-2xl font-bold text-emerald-600">
              {totalPrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <button
            onClick={() =>
              alert(`Đã chọn: ${product.name} (Size ${selectedSize}) - Giá: ${totalPrice.toLocaleString('vi-VN')}đ`)
            }
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-emerald-700 transition"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </main>
  );
}