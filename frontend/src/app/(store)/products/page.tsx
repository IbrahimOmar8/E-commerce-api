'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import ProductCard from '@/components/store/ProductCard';
import { productsApi, categoriesApi, brandsApi } from '@/lib/api';
import type { Product, Category, Brand } from '@/types';
import { SlidersHorizontal, ChevronDown, X } from 'lucide-react';

const GENDER_OPTIONS = [
  { value: 'men', label: 'رجال' },
  { value: 'women', label: 'نساء' },
  { value: 'kids', label: 'أطفال' },
  { value: 'unisex', label: 'للجميع' },
];

const SORT_OPTIONS = [
  { value: '-createdAt', label: 'الأحدث' },
  { value: 'price', label: 'السعر: الأقل أولاً' },
  { value: '-price', label: 'السعر: الأعلى أولاً' },
  { value: '-averageRating', label: 'الأعلى تقييماً' },
  { value: '-totalReviews', label: 'الأكثر مراجعات' },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [filtersOpen, setFiltersOpen] = useState(false);

  const [filters, setFilters] = useState({
    search: searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    brand: searchParams.get('brand') || '',
    gender: searchParams.get('gender') || '',
    sport: searchParams.get('sport') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    productType: searchParams.get('productType') || '',
    sort: searchParams.get('sort') || '-createdAt',
    page: Number(searchParams.get('page')) || 1,
  });

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number | boolean> = { limit: 12, isActive: true };
      if (filters.search) params.search = filters.search;
      if (filters.category) params.subcategory = filters.category;
      if (filters.brand) params.brand = filters.brand;
      if (filters.gender) params.gender = filters.gender;
      if (filters.sport) params.sport = filters.sport;
      if (filters.minPrice) params.minPrice = filters.minPrice;
      if (filters.maxPrice) params.maxPrice = filters.maxPrice;
      if (filters.productType) params.productType = filters.productType;
      if (filters.sort) params.sort = filters.sort;
      params.page = filters.page;

      const res = await productsApi.getAll(params);
      setProducts(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  useEffect(() => {
    const [cats, brnds] = [categoriesApi.getAll({ isActive: 'true' }), brandsApi.getAll()];
    cats.then(r => setCategories((r.data || []).filter(c => !c.parent)));
    brnds.then(r => setBrands(r.data || []));
  }, []);

  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilter = (key: string) => updateFilter(key, '');

  const activeFiltersCount = [filters.category, filters.brand, filters.gender, filters.sport, filters.minPrice, filters.maxPrice, filters.productType]
    .filter(Boolean).length;

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="h-3 skeleton rounded w-16" />
        <div className="h-4 skeleton rounded" />
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-8 skeleton rounded" />
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">
          {filters.search ? `نتائج البحث: "${filters.search}"` : 'جميع المنتجات'}
        </h1>
        <p className="text-gray-500 text-sm">{total} منتج</p>
      </div>

      {/* Search bar */}
      <div className="mb-6">
        <form onSubmit={e => { e.preventDefault(); fetchProducts(); }}>
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder="ابحث في المنتجات..."
            className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </form>
      </div>

      <div className="flex gap-6">
        {/* Sidebar Filters - Desktop */}
        <aside className="hidden lg:block w-56 flex-shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-24">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">تصفية</h3>
              {activeFiltersCount > 0 && (
                <button onClick={() => setFilters(prev => ({ ...prev, category: '', brand: '', gender: '', sport: '', minPrice: '', maxPrice: '', productType: '', page: 1 }))}
                  className="text-xs text-red-500 hover:text-red-600">مسح الكل</button>
              )}
            </div>

            {/* Product type */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">نوع المنتج</h4>
              <div className="space-y-1">
                {[{ value: 'featured', label: 'مميزة' }, { value: 'bestSeller', label: 'الأكثر مبيعاً' }, { value: 'specialOffer', label: 'عروض' }].map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="radio" name="productType" value={opt.value} checked={filters.productType === opt.value}
                      onChange={() => updateFilter('productType', filters.productType === opt.value ? '' : opt.value)}
                      className="text-orange-500 accent-orange-500" />
                    <span className="text-sm text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Gender */}
            <div className="mb-5">
              <h4 className="text-sm font-semibold text-gray-700 mb-2">الفئة</h4>
              <div className="space-y-1">
                {GENDER_OPTIONS.map(opt => (
                  <label key={opt.value} className="flex items-center gap-2 cursor-pointer py-1">
                    <input type="radio" name="gender" value={opt.value} checked={filters.gender === opt.value}
                      onChange={() => updateFilter('gender', filters.gender === opt.value ? '' : opt.value)}
                      className="accent-orange-500" />
                    <span className="text-sm text-gray-600">{opt.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            {categories.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">التصنيف</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {categories.map(cat => (
                    <label key={cat._id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input type="radio" name="category" value={cat._id} checked={filters.category === cat._id}
                        onChange={() => updateFilter('category', filters.category === cat._id ? '' : cat._id)}
                        className="accent-orange-500" />
                      <span className="text-sm text-gray-600">{cat.nameAr || cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Brand */}
            {brands.length > 0 && (
              <div className="mb-5">
                <h4 className="text-sm font-semibold text-gray-700 mb-2">الماركة</h4>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {brands.map(b => (
                    <label key={b._id} className="flex items-center gap-2 cursor-pointer py-1">
                      <input type="radio" name="brand" value={b._id} checked={filters.brand === b._id}
                        onChange={() => updateFilter('brand', filters.brand === b._id ? '' : b._id)}
                        className="accent-orange-500" />
                      <span className="text-sm text-gray-600">{b.nameAr || b.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price range */}
            <div>
              <h4 className="text-sm font-semibold text-gray-700 mb-2">نطاق السعر (ريال)</h4>
              <div className="flex gap-2">
                <input type="number" placeholder="من" value={filters.minPrice}
                  onChange={e => updateFilter('minPrice', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
                <input type="number" placeholder="إلى" value={filters.maxPrice}
                  onChange={e => updateFilter('maxPrice', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" />
              </div>
            </div>
          </div>
        </aside>

        {/* Products area */}
        <div className="flex-1 min-w-0">
          {/* Toolbar */}
          <div className="flex items-center justify-between mb-4 gap-3">
            {/* Mobile filters button */}
            <button onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm">
              <SlidersHorizontal size={16} />
              تصفية
              {activeFiltersCount > 0 && <span className="bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{activeFiltersCount}</span>}
            </button>

            {/* Active filters pills */}
            <div className="flex flex-wrap gap-2 flex-1">
              {filters.gender && <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {GENDER_OPTIONS.find(g => g.value === filters.gender)?.label}
                <button onClick={() => clearFilter('gender')}><X size={12} /></button>
              </span>}
              {filters.productType && <span className="bg-orange-100 text-orange-700 text-xs px-3 py-1 rounded-full flex items-center gap-1">
                {filters.productType}
                <button onClick={() => clearFilter('productType')}><X size={12} /></button>
              </span>}
            </div>

            {/* Sort */}
            <div className="relative flex-shrink-0">
              <select value={filters.sort} onChange={e => updateFilter('sort', e.target.value)}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm pr-8 appearance-none focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
          </div>

          {/* Products grid */}
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">لا توجد نتائج</h3>
              <p className="text-gray-500 text-sm">جرب تغيير معايير البحث أو التصفية</p>
              <button onClick={() => setFilters(prev => ({ ...prev, search: '', category: '', brand: '', gender: '', sport: '', minPrice: '', maxPrice: '', productType: '', page: 1 }))}
                className="mt-4 bg-orange-500 text-white px-6 py-2 rounded-xl text-sm hover:bg-orange-600 transition-colors">
                مسح الفلاتر
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {/* Pagination */}
          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
                السابق
              </button>
              {Array.from({ length: Math.min(pages, 5) }, (_, i) => i + 1).map(p => (
                <button key={p} onClick={() => updateFilter('page', p)}
                  className={`w-10 h-10 rounded-xl text-sm font-medium ${filters.page === p ? 'bg-orange-500 text-white' : 'border border-gray-200 hover:bg-gray-50'}`}>
                  {p}
                </button>
              ))}
              <button disabled={filters.page >= pages} onClick={() => updateFilter('page', filters.page + 1)}
                className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
                التالي
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-12 text-center text-gray-400">جاري التحميل...</div>}>
      <ProductsContent />
    </Suspense>
  );
}
