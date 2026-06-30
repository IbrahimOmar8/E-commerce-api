'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { productsApi } from '@/lib/api';
import type { Product } from '@/types';
import { Plus, Search, Edit, Trash2, Star, Package } from 'lucide-react';

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { page, limit: 15 };
      if (search) params.search = search;
      const res = await productsApi.getAll(params);
      setProducts(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    setDeleting(id);
    try {
      await productsApi.delete(id);
      fetchProducts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الحذف');
    } finally {
      setDeleting(null);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المنتجات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} منتج</p>
        </div>
        <Link href="/admin/products/new"
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> إضافة منتج
        </Link>
      </div>

      {/* Search */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث عن منتج..."
            className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Products table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500">لا توجد منتجات</p>
            <Link href="/admin/products/new" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-xl text-sm">
              أضف أول منتج
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">المنتج</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">السعر</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">المخزون</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">النوع</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">التقييم</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">الحالة</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {products.map(product => {
                  const img = product.images?.[0];
                  const price = product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
                  const totalStock = product.hasSizes
                    ? product.sizes.reduce((s, sz) => s + sz.stock, 0)
                    : product.stock;
                  return (
                    <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                            {img ? (
                              <Image src={img} alt={product.name} width={48} height={48} className="object-cover w-full h-full" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">👟</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm text-gray-900 line-clamp-1">{product.nameAr || product.name}</p>
                            {product.sku && <p className="text-xs text-gray-400 ltr">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="font-bold text-sm">{price.toFixed(2)} ر.س</span>
                          {product.discount > 0 && (
                            <span className="block text-xs text-red-500">-{product.discount}%</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-sm font-semibold ${totalStock === 0 ? 'text-red-500' : totalStock < 5 ? 'text-yellow-600' : 'text-green-600'}`}>
                          {totalStock}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-1">
                          {product.featured && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">مميز</span>}
                          {product.bestSeller && <span className="text-xs bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full">الأكثر مبيعاً</span>}
                          {product.specialOffer && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">عرض</span>}
                          {!product.featured && !product.bestSeller && !product.specialOffer && (
                            <span className="text-xs text-gray-400">عادي</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.totalReviews > 0 ? (
                          <div className="flex items-center gap-1">
                            <Star size={12} className="fill-yellow-400 text-yellow-400" />
                            <span className="text-xs font-semibold">{product.averageRating.toFixed(1)}</span>
                            <span className="text-xs text-gray-400">({product.totalReviews})</span>
                          </div>
                        ) : <span className="text-xs text-gray-300">—</span>}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {product.isActive ? 'نشط' : 'مخفي'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <Link href={`/admin/products/${product._id}/edit`}
                            className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors">
                            <Edit size={15} />
                          </Link>
                          <button onClick={() => handleDelete(product._id, product.nameAr || product.name)}
                            disabled={deleting === product._id}
                            className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-40">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">السابق</button>
            <span className="px-4 py-2 text-sm text-gray-600">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
