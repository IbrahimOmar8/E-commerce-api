import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/store/ProductCard';
import type { Product, Category, Brand } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getFeatured(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?featured=true&limit=8&isActive=true`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

async function getBestSellers(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?productType=bestSeller&limit=8&isActive=true`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/categories?isActive=true`, { next: { revalidate: 600 } });
    const data = await res.json();
    return (data.data || []).filter((c: Category) => !c.parent).slice(0, 6);
  } catch { return []; }
}

async function getBrands(): Promise<Brand[]> {
  try {
    const res = await fetch(`${API}/brands`, { next: { revalidate: 600 } });
    const data = await res.json();
    return (data.data || []).slice(0, 8);
  } catch { return []; }
}

async function getSpecialOffers(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?productType=specialOffer&limit=4&isActive=true`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

export default async function HomePage() {
  const [featured, bestSellers, categories, brands, offers] = await Promise.all([
    getFeatured(), getBestSellers(), getCategories(), getBrands(), getSpecialOffers()
  ]);

  const sports = [
    { icon: '⚽', name: 'كرة القدم', value: 'football' },
    { icon: '🏃', name: 'الجري', value: 'running' },
    { icon: '🏋️', name: 'الصالة', value: 'gym' },
    { icon: '🏊', name: 'السباحة', value: 'swimming' },
    { icon: '🎾', name: 'التنس', value: 'tennis' },
    { icon: '🏀', name: 'كرة السلة', value: 'basketball' },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-orange-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 right-10 w-72 h-72 bg-orange-500 rounded-full blur-3xl" />
          <div className="absolute bottom-10 left-10 w-96 h-96 bg-orange-600 rounded-full blur-3xl" />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <span className="inline-block bg-orange-500/20 border border-orange-500/40 text-orange-300 text-sm px-4 py-1.5 rounded-full mb-6">
              الكولكشن الجديد 2025 🔥
            </span>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight mb-6">
              ارتدِ العزيمة،
              <span className="text-orange-400 block">اعيش الرياضة</span>
            </h1>
            <p className="text-lg text-gray-300 mb-8 leading-relaxed">
              أكبر تشكيلة من الملابس والمعدات الرياضية في المملكة. ماركات عالمية بأسعار تنافسية مع توصيل سريع لجميع مناطق المملكة.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link href="/products" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-4 rounded-2xl transition-all hover:scale-105 shadow-lg shadow-orange-500/30">
                تسوق الآن
              </Link>
              <Link href="/products?productType=specialOffer" className="border border-white/30 hover:bg-white/10 text-white font-semibold px-8 py-4 rounded-2xl transition-all">
                العروض الخاصة
              </Link>
            </div>

            {/* Stats */}
            <div className="flex gap-8 mt-12 pt-8 border-t border-white/10">
              <div>
                <div className="text-2xl font-bold">+500</div>
                <div className="text-sm text-gray-400">منتج رياضي</div>
              </div>
              <div>
                <div className="text-2xl font-bold">+20</div>
                <div className="text-sm text-gray-400">ماركة عالمية</div>
              </div>
              <div>
                <div className="text-2xl font-bold">+10K</div>
                <div className="text-sm text-gray-400">عميل راضٍ</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features bar */}
      <section className="bg-orange-500 text-white">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center text-sm">
            <div className="flex items-center justify-center gap-2">
              <span>🚀</span> شحن سريع لجميع المناطق
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>↩️</span> إرجاع مجاني خلال 14 يوم
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>🔒</span> دفع آمن 100%
            </div>
            <div className="flex items-center justify-center gap-2">
              <span>💬</span> دعم على مدار الساعة
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-16">
        {/* Sports categories */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">تسوق حسب الرياضة</h2>
          </div>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
            {sports.map(sport => (
              <Link
                key={sport.value}
                href={`/products?sport=${sport.value}`}
                className="flex flex-col items-center gap-2 bg-white rounded-2xl p-4 hover:border-orange-300 border border-gray-100 transition-all hover:shadow-md group"
              >
                <span className="text-3xl group-hover:scale-110 transition-transform">{sport.icon}</span>
                <span className="text-xs font-medium text-gray-700 text-center">{sport.name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Main categories */}
        {categories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">الفئات الرئيسية</h2>
              <Link href="/products" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {categories.map(cat => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square bg-gray-100 hover:shadow-lg transition-all"
                >
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-105 transition-transform" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-orange-100 to-orange-200 flex items-center justify-center text-4xl">
                      👕
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-0 right-0 p-3">
                    <p className="text-white font-semibold text-sm">{cat.nameAr || cat.name}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Special offers */}
        {offers.length > 0 && (
          <section className="bg-gradient-to-r from-red-50 to-orange-50 rounded-3xl p-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">🔥 عروض خاصة</h2>
                <p className="text-gray-500 text-sm mt-1">عروض محدودة لا تفوتها</p>
              </div>
              <Link href="/products?productType=specialOffer" className="bg-red-500 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-red-600 transition-colors">
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {offers.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Featured products */}
        {featured.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">منتجات مميزة</h2>
                <p className="text-gray-500 text-sm mt-1">اختيارات موصى بها لك</p>
              </div>
              <Link href="/products?productType=featured" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {featured.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* Brands */}
        {brands.length > 0 && (
          <section className="bg-gray-50 rounded-3xl p-8">
            <h2 className="text-2xl font-bold text-gray-900 text-center mb-8">الماركات العالمية</h2>
            <div className="grid grid-cols-4 md:grid-cols-8 gap-4">
              {brands.map(brand => (
                <Link
                  key={brand._id}
                  href={`/products?brand=${brand._id}`}
                  className="bg-white rounded-xl p-3 flex items-center justify-center hover:shadow-md transition-all hover:border-orange-200 border border-transparent aspect-square"
                >
                  {brand.logo ? (
                    <Image src={brand.logo} alt={brand.name} width={60} height={60} className="object-contain" />
                  ) : (
                    <span className="text-xs font-bold text-gray-700 text-center">{brand.nameAr || brand.name}</span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Best sellers */}
        {bestSellers.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">الأكثر مبيعاً</h2>
                <p className="text-gray-500 text-sm mt-1">الأعلى تقييماً من عملائنا</p>
              </div>
              <Link href="/products?productType=bestSeller" className="text-orange-500 hover:text-orange-600 text-sm font-medium">
                عرض الكل ←
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {bestSellers.map(p => <ProductCard key={p._id} product={p} />)}
            </div>
          </section>
        )}

        {/* CTA */}
        <section className="bg-gray-900 text-white rounded-3xl p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">انضم لمجتمع يلا سبورت</h2>
          <p className="text-gray-400 mb-8">اشترك للحصول على أحدث العروض والمنتجات الجديدة</p>
          <div className="flex max-w-md mx-auto gap-2">
            <input
              type="email"
              placeholder="بريدك الإلكتروني"
              className="flex-1 bg-gray-800 text-white px-4 py-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
              اشترك
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
