'use client';
import { useState, useEffect, useCallback, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductCard from '@/components/store/ProductCard';
import { productsApi, categoriesApi, brandsApi } from '@/lib/api';
import { useLanguage } from '@/contexts/language';
import type { Product, Category, Brand } from '@/types';
import { SlidersHorizontal, X, ChevronDown } from 'lucide-react';

function ProductsContent() {
  const searchParams = useSearchParams();
  const { t, lang } = useLanguage();

  const GENDER_OPTIONS = [
    { value: 'men', label: t('men') },
    { value: 'women', label: t('women') },
    { value: 'kids', label: t('kids') },
    { value: 'unisex', label: lang === 'ar' ? 'للجميع' : 'Unisex' },
  ];

  const SORT_OPTIONS = [
    { value: '-createdAt', label: t('newest') },
    { value: 'price', label: t('priceLow') },
    { value: '-price', label: t('priceHigh') },
    { value: '-averageRating', label: t('topRated') },
    { value: '-totalReviews', label: t('mostReviewed') },
  ];

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
    cats.then(r => setCategories((r.data || []).filter((c: Category) => !c.parent)));
    brnds.then(r => setBrands(r.data || []));
  }, []);

  const updateFilter = (key: string, value: string | number) => {
    setFilters(prev => ({ ...prev, [key]: value, ...(key !== 'page' ? { page: 1 } : {}) }));
  };
  const clearFilter = (key: string) => updateFilter(key, '');

  const activeFiltersCount = [filters.category, filters.brand, filters.gender, filters.sport, filters.minPrice, filters.maxPrice, filters.productType]
    .filter(Boolean).length;

  const clearAllFilters = () => setFilters(prev => ({
    ...prev, category: '', brand: '', gender: '', sport: '', minPrice: '', maxPrice: '', productType: '', page: 1
  }));

  const SkeletonCard = () => (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm">
      <div className="aspect-square skeleton" />
      <div className="p-3.5 space-y-2">
        <div className="h-3 skeleton rounded w-16" />
        <div className="h-4 skeleton rounded" />
        <div className="h-4 skeleton rounded w-3/4" />
        <div className="h-8 skeleton rounded mt-2" />
      </div>
    </div>
  );

  const FilterPanel = () => (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-bold text-slate-900">{t('filter')}</h3>
        {activeFiltersCount > 0 && (
          <button onClick={clearAllFilters} className="text-xs text-red-500 hover:text-red-600 font-semibold">
            {t('clearAll')}
          </button>
        )}
      </div>

      {/* Product type */}
      <div className="mb-5 pb-5 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('productType')}</h4>
        <div className="space-y-2">
          {[
            { value: 'featured', label: t('featured2') },
            { value: 'bestSeller', label: t('bestSeller2') },
            { value: 'specialOffer', label: t('specialOffer') },
          ].map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                filters.productType === opt.value ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'
              }`}>
                {filters.productType === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 cursor-pointer"
                onClick={() => updateFilter('productType', filters.productType === opt.value ? '' : opt.value)}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Gender */}
      <div className="mb-5 pb-5 border-b border-slate-100">
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('gender')}</h4>
        <div className="space-y-2">
          {GENDER_OPTIONS.map(opt => (
            <label key={opt.value} className="flex items-center gap-2.5 cursor-pointer group">
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                filters.gender === opt.value ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'
              }`}>
                {filters.gender === opt.value && <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
              <span className="text-sm text-slate-600 group-hover:text-slate-900 cursor-pointer"
                onClick={() => updateFilter('gender', filters.gender === opt.value ? '' : opt.value)}>
                {opt.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Category */}
      {categories.length > 0 && (
        <div className="mb-5 pb-5 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('category')}</h4>
          <div className="space-y-2 max-h-44 overflow-y-auto pe-1">
            {categories.map(cat => (
              <label key={cat._id} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  filters.category === cat._id ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'
                }`}>
                  {filters.category === cat._id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 cursor-pointer"
                  onClick={() => updateFilter('category', filters.category === cat._id ? '' : cat._id)}>
                  {lang === 'ar' ? cat.nameAr || cat.name : cat.name || cat.nameAr}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Brand */}
      {brands.length > 0 && (
        <div className="mb-5 pb-5 border-b border-slate-100">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('brand')}</h4>
          <div className="space-y-2 max-h-44 overflow-y-auto pe-1">
            {brands.map(b => (
              <label key={b._id} className="flex items-center gap-2.5 cursor-pointer group">
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all flex-shrink-0 ${
                  filters.brand === b._id ? 'bg-amber-500 border-amber-500' : 'border-slate-300 group-hover:border-amber-400'
                }`}>
                  {filters.brand === b._id && <div className="w-2 h-2 rounded-full bg-white" />}
                </div>
                <span className="text-sm text-slate-600 group-hover:text-slate-900 cursor-pointer"
                  onClick={() => updateFilter('brand', filters.brand === b._id ? '' : b._id)}>
                  {lang === 'ar' ? b.nameAr || b.name : b.name || b.nameAr}
                </span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Price */}
      <div>
        <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">{t('priceRange')}</h4>
        <div className="flex gap-2">
          <input type="number" placeholder={t('priceFrom')} value={filters.minPrice}
            onChange={e => updateFilter('minPrice', e.target.value)}
            className="input-base" />
          <input type="number" placeholder={t('priceTo')} value={filters.maxPrice}
            onChange={e => updateFilter('maxPrice', e.target.value)}
            className="input-base" />
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      <div className="mb-7">
        <h1 className="text-3xl font-black text-slate-900 mb-1">
          {filters.search ? `${t('searchResults')}: "${filters.search}"` : t('allProductsTitle')}
        </h1>
        <p className="text-slate-500 text-sm">{total} {t('products')}</p>
      </div>

      <div className="mb-6">
        <form onSubmit={e => { e.preventDefault(); fetchProducts(); }}>
          <input
            type="text"
            value={filters.search}
            onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
            placeholder={t('searchInProducts')}
            className="input-base text-base py-3.5"
          />
        </form>
      </div>

      <div className="flex gap-6">
        <aside className="hidden lg:block w-60 flex-shrink-0">
          <div className="sticky top-24">
            <FilterPanel />
          </div>
        </aside>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-5 gap-3">
            <button
              onClick={() => setFiltersOpen(!filtersOpen)}
              className="lg:hidden flex items-center gap-2 border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm font-medium hover:border-amber-300 transition-colors shadow-sm"
            >
              <SlidersHorizontal size={15} />
              {t('filter')}
              {activeFiltersCount > 0 && (
                <span className="bg-amber-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {activeFiltersCount}
                </span>
              )}
            </button>

            <div className="flex flex-wrap gap-2 flex-1">
              {filters.gender && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium">
                  {GENDER_OPTIONS.find(g => g.value === filters.gender)?.label}
                  <button onClick={() => clearFilter('gender')}><X size={11} /></button>
                </span>
              )}
              {filters.productType && (
                <span className="inline-flex items-center gap-1.5 bg-amber-100 text-amber-700 text-xs px-3 py-1.5 rounded-full font-medium">
                  {filters.productType}
                  <button onClick={() => clearFilter('productType')}><X size={11} /></button>
                </span>
              )}
            </div>

            <div className="relative flex-shrink-0">
              <select
                value={filters.sort}
                onChange={e => updateFilter('sort', e.target.value)}
                className="appearance-none border border-slate-200 bg-white rounded-xl px-4 py-2.5 text-sm pe-8 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm font-medium"
              >
                {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="absolute top-1/2 -translate-y-1/2 end-2.5 text-slate-400 pointer-events-none" />
            </div>
          </div>

          {filtersOpen && (
            <div className="lg:hidden mb-5">
              <FilterPanel />
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 12 }).map((_, i) => <SkeletonCard key={i} />)}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-6xl mb-5">🔍</div>
              <h3 className="text-xl font-bold text-slate-700 mb-2">{t('noResults')}</h3>
              <p className="text-slate-500 text-sm mb-6">{t('noResultsDesc')}</p>
              <button onClick={clearAllFilters} className="btn-primary px-8 py-3 text-sm">
                {t('clearFilters')}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {products.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          )}

          {pages > 1 && (
            <div className="flex justify-center gap-2 mt-10">
              <button disabled={filters.page <= 1} onClick={() => updateFilter('page', filters.page - 1)}
                className="px-5 py-2 border border-slate-200 bg-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-slate-50 shadow-sm">
                {t('prev')}
              </button>
              {(() => {
                const windowSize = 5;
                const half = Math.floor(windowSize / 2);
                let start = Math.max(1, filters.page - half);
                let end = Math.min(pages, start + windowSize - 1);
                if (end - start < windowSize - 1) start = Math.max(1, end - windowSize + 1);
                return Array.from({ length: end - start + 1 }, (_, i) => start + i);
              })().map(p => (
                <button key={p} onClick={() => updateFilter('page', p)}
                  className={`w-10 h-10 rounded-xl text-sm font-bold transition-all ${
                    filters.page === p
                      ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-lg shadow-amber-500/30'
                      : 'border border-slate-200 bg-white hover:bg-slate-50'
                  }`}>
                  {p}
                </button>
              ))}
              <button disabled={filters.page >= pages} onClick={() => updateFilter('page', filters.page + 1)}
                className="px-5 py-2 border border-slate-200 bg-white rounded-xl text-sm font-medium disabled:opacity-40 hover:bg-slate-50 shadow-sm">
                {t('next')}
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
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-16 text-center text-slate-400 text-sm">
        جاري التحميل... / Loading...
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
