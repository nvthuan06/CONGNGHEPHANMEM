// ./frontend/app/page.tsx
'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import { Product } from '@/types/product';

// Cấu hình danh sách Size và Topping (theo wireframe Màn hình 2 trong đề bài)
const sizes = [
  { name: 'S', extraPrice: 0 },
  { name: 'M', extraPrice: 5000 },
  { name: 'L', extraPrice: 10000 },
];

const toppings = [
  { id: 'tc', name: 'Trân châu', price: 5000 },
  { id: 'kem', name: 'Kem', price: 10000 },
];

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  // State lưu lựa chọn của người dùng
  const [selectedSize, setSelectedSize] = useState('S');
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);

  useEffect(() => {
    // Gọi API Task 2 từ Backend NestJS
    fetch(`http://localhost:3001/products/${resolvedParams.id}`)
      .then((res) => res.json())
      .then((data) => {
        setProduct(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [resolvedParams.id]);

  if (loading) return <div className="p-8 text-center">Đang tải chi tiết sản phẩm...</div>;
  if (!product) return <div className="p-8 text-center text-red-500">Không tìm thấy sản phẩm.</div>;

  // Xử lý chọn / bỏ chọn Topping
  const toggleTopping = (toppingId: string) => {
    if (selectedToppings.includes(toppingId)) {
      setSelectedToppings(selectedToppings.filter((id) => id !== toppingId));
    } else {
      setSelectedToppings([...selectedToppings, toppingId]);
    }
  };

  // TÍNH TỔNG TIỀN THEO TÙY CHỌN (Yêu cầu Task 4)
  const sizeExtra = sizes.find((size) => size.name === selectedSize)?.extraPrice || 0;
  const toppingExtra = selectedToppings.reduce((sum, topId) => {
    const item = toppings.find((topping) => topping.id === topId);
    return sum + (item ? item.price : 0);
  }, 0);
  const totalPrice = product.price + sizeExtra + toppingExtra;

  return (
    <main className="container mx-auto p-6 max-w-xl">
      <Link href="/" className="text-emerald-600 hover:underline mb-4 inline-block">
        &larr; Quay lại Menu
      </Link>

      <div className="bg-white border rounded-xl p-6 shadow-sm">
        <img
          src={product.imageUrl || 'https://via.placeholder.com/150'}
          alt={product.name}
          className="w-full h-56 object-cover rounded-lg mb-4"
        />
        <h1 className="text-2xl font-bold mb-2">{product.name}</h1>
        <p className="text-gray-500 mb-6">Giá gốc: {product.price?.toLocaleString('vi-VN')} đ</p>

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

        {/* 3. Hiển thị Tổng tiền & Nút Thêm vào giỏ */}
        <div className="border-t pt-4 mt-6">
          <div className="flex justify-between items-center mb-4">
            <span className="font-semibold text-lg">Tổng tiền:</span>
            <span className="text-2xl font-bold text-emerald-600">
              {totalPrice.toLocaleString('vi-VN')} đ
            </span>
          </div>
          <button
            onClick={() => alert(`Đã chọn: ${product.name} (Size ${selectedSize}) - Giá: ${totalPrice.toLocaleString('vi-VN')}đ`)}
            className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-emerald-700 transition"
          >
            Thêm vào giỏ hàng
          </button>
        </div>
      </div>
    </main>
  );
}