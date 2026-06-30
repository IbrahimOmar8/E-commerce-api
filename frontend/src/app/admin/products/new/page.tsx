import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import ProductForm from '@/components/admin/ProductForm';

export default function NewProductPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin/products" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900">إضافة منتج جديد</h1>
          <p className="text-sm text-gray-500">أضف منتجاً جديداً إلى المتجر</p>
        </div>
      </div>
      <ProductForm mode="create" />
    </div>
  );
}
