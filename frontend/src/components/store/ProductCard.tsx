'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, ShoppingCart, Star, Eye } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/contexts/language';
import type { Product } from '@/types';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const { t, lang } = useLanguage();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const price = product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
  const hasDiscount = product.discount > 0 && product.priceAfterDiscount > 0;
  const image = !imgError && product.images?.[0] ? product.images[0] : null;
  const name = (lang === 'ar' ? (product.nameAr || product.name) : (product.name || product.nameAr)) || '';
  const brandName = product.brand && typeof product.brand === 'object'
    ? (lang === 'ar' ? product.brand.nameAr || product.brand.name : product.brand.name || product.brand.nameAr)
    : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasSizes) return;
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  };

  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="product-card h-full flex flex-col">
        {/* Image */}
        <div className="card-image">
          {image ? (
            <Image
              src={image}
              alt={name}
              fill
              className="object-cover"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
              <div className="text-5xl opacity-30">👟</div>
            </div>
          )}

          {/* Gradient overlay on hover */}
          <div className="card-overlay" />

          {/* Badges */}
          <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5 z-10">
            {hasDiscount && (
              <span className="badge bg-gradient-to-r from-red-500 to-rose-500 text-white shadow-lg">
                -{product.discount}%
              </span>
            )}
            {product.bestSeller && (
              <span className="badge bg-gradient-to-r from-amber-500 to-amber-500 text-white shadow-lg">
                {t('bestSeller')}
              </span>
            )}
            {product.featured && !product.bestSeller && (
              <span className="badge bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg">
                {t('featured')}
              </span>
            )}
          </div>

          {/* Wishlist + Quick view - visible on hover */}
          <div className="absolute top-2.5 end-2.5 flex flex-col gap-1.5 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
            <button
              onClick={e => e.preventDefault()}
              className="w-8 h-8 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-red-50 hover:text-red-500 text-slate-600 transition-all"
              aria-label="Wishlist"
            >
              <Heart size={14} />
            </button>
            <button
              onClick={e => e.preventDefault()}
              className="w-8 h-8 bg-white/95 backdrop-blur rounded-full flex items-center justify-center shadow-md hover:bg-amber-50 hover:text-amber-500 text-slate-600 transition-all"
              aria-label="Quick view"
            >
              <Eye size={14} />
            </button>
          </div>

          {/* Add to cart — visible on hover over image */}
          <div className="absolute bottom-0 inset-x-0 z-10 p-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
            <button
              onClick={handleAddToCart}
              className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : product.hasSizes
                  ? 'bg-white/90 backdrop-blur text-slate-800 hover:bg-white'
                  : 'btn-primary'
              }`}
            >
              <ShoppingCart size={15} />
              {added ? t('addedToCart') : product.hasSizes ? t('chooseSizeLabel') : t('addToCart')}
            </button>
          </div>
        </div>

        {/* Info */}
        <div className="p-3.5 flex flex-col flex-1">
          {/* Brand */}
          {brandName && (
            <p className="text-xs font-bold text-amber-500 uppercase tracking-wide mb-1">
              {brandName}
            </p>
          )}

          {/* Name */}
          <h3 className="font-semibold text-slate-800 text-sm line-clamp-2 leading-snug mb-2 flex-1">
            {name}
          </h3>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-1.5 mb-2">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    size={11}
                    className={i < Math.round(product.averageRating) ? 'fill-amber-400 text-amber-400' : 'text-slate-200 fill-slate-200'}
                  />
                ))}
              </div>
              <span className="text-xs text-slate-500">({product.totalReviews})</span>
            </div>
          )}

          {/* Sizes */}
          {product.hasSizes && product.sizes.length > 0 && (
            <div className="flex gap-1 mb-2.5 flex-wrap">
              {product.sizes.slice(0, 5).map(s => (
                <span key={s.size} className="text-[10px] border border-slate-200 px-1.5 py-0.5 rounded-md text-slate-500 font-medium">
                  {s.size}
                </span>
              ))}
              {product.sizes.length > 5 && (
                <span className="text-[10px] text-slate-400">+{product.sizes.length - 5}</span>
              )}
            </div>
          )}

          {/* Price row */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              <div className="flex items-baseline gap-1">
                <span className="text-lg font-black text-slate-900">{price.toFixed(0)}</span>
                <span className="text-xs text-slate-400 font-medium">{t('sar')}</span>
              </div>
              {hasDiscount && (
                <span className="text-xs text-slate-400 line-through">
                  {product.price.toFixed(0)} {t('sar')}
                </span>
              )}
            </div>

            {/* Mobile add to cart button (visible always on mobile) */}
            <button
              onClick={handleAddToCart}
              className={`sm:hidden flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : product.hasSizes
                  ? 'bg-slate-100 text-slate-700 hover:bg-amber-50 hover:text-amber-600'
                  : 'btn-primary'
              }`}
            >
              <ShoppingCart size={13} />
              {added ? '✓' : product.hasSizes ? t('chooseSizeLabel') : t('addToCart')}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
