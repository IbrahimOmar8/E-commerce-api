'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { productsApi } from '@/lib/api';
import type { Product } from '@/types';
import ProductForm from '@/components/admin/ProductForm';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.getOne(id).then(r => setProduct(r.data)).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  if (!product) return <div className="text-center py-20 text-gray-500">المنتج غير موجود</div>;

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">تعديل: {product.nameAr || product.name}</h1>
          <p className="text-sm text-gray-500">تحديث بيانات المنتج</p>
        </div>
      </div>
      <ProductForm product={product} mode="edit" />
    </div>
  );
}
