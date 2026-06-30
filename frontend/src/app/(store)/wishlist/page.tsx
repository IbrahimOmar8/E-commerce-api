'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { wishlistApi } from '@/lib/api';
import type { Product } from '@/types';
import ProductCard from '@/components/store/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && user) {
      wishlistApi.get().then(r => setProducts(r.data || [])).finally(() => setLoading(false));
    } else if (mounted) {
      setLoading(false);
    }
  }, [mounted, user]);

  if (!mounted) return null;

  if (!user) return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <Heart size={64} className="mx-auto mb-4 text-gray-200" />
      <h2 className="text-2xl font-bold text-gray-900 mb-3">قائمة المفضلة</h2>
      <p className="text-gray-500 mb-6">سجل دخولك لعرض منتجاتك المفضلة</p>
      <Link href="/account" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-600">
        تسجيل الدخول
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        المفضلة ({products.length})
      </h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100">
              <div className="aspect-square skeleton" />
              <div className="p-3 space-y-2">
                <div className="h-4 skeleton rounded" />
                <div className="h-4 skeleton rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20">
          <Heart size={64} className="mx-auto mb-4 text-gray-200" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">قائمة المفضلة فارغة</h3>
          <p className="text-gray-500 mb-6">أضف منتجات إلى مفضلتك للعودة إليها لاحقاً</p>
          <Link href="/products" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-600">
            تصفح المنتجات
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(p => <ProductCard key={p._id} product={p} />)}
        </div>
      )}
    </div>
  );
}
