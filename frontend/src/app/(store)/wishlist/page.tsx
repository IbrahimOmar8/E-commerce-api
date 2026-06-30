'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { useLanguage } from '@/contexts/language';
import { wishlistApi } from '@/lib/api';
import type { Product } from '@/types';
import ProductCard from '@/components/store/ProductCard';
import { Heart } from 'lucide-react';

export default function WishlistPage() {
  const { user } = useAuthStore();
  const { t } = useLanguage();
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
    <div className="max-w-2xl mx-auto px-4 py-24 text-center fade-in">
      <div className="w-24 h-24 bg-pink-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <Heart size={40} className="text-pink-400" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">{t('wishlistTitle')}</h2>
      <p className="text-slate-500 mb-8">{t('wishlistLogin')}</p>
      <Link href="/account" className="btn-primary px-10 py-4 inline-block rounded-2xl text-base">
        {t('loginBtn')}
      </Link>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 fade-in">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-slate-900 flex items-center gap-3">
          <Heart size={28} className="text-pink-500" />
          {t('wishlistTitle')}
          <span className="text-slate-400 font-medium text-xl">({products.length})</span>
        </h1>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <div className="aspect-square skeleton" />
              <div className="p-3.5 space-y-2">
                <div className="h-4 skeleton rounded" />
                <div className="h-4 skeleton rounded w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-24">
          <div className="w-20 h-20 bg-pink-50 rounded-full flex items-center justify-center mx-auto mb-5">
            <Heart size={36} className="text-pink-300" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">{t('wishlistEmpty')}</h3>
          <p className="text-slate-500 mb-8">{t('wishlistEmptyDesc')}</p>
          <Link href="/products" className="btn-primary px-10 py-3.5 inline-block rounded-2xl">
            {t('browseProducts')}
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
