'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { Heart, ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import type { Product } from '@/types';

interface Props {
  product: Product;
}

export default function ProductCard({ product }: Props) {
  const { addItem } = useCartStore();
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const price = product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
  const hasDiscount = product.discount > 0 && product.priceAfterDiscount > 0;
  const image = !imgError && product.images?.[0] ? product.images[0] : null;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (product.hasSizes) return; // Go to product page to select size
    addItem(product, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <Link href={`/products/${product._id}`} className="group block">
      <div className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 hover:border-orange-200">
        {/* Image */}
        <div className="relative aspect-square bg-gray-50 overflow-hidden">
          {image ? (
            <Image
              src={image}
              alt={product.nameAr || product.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              onError={() => setImgError(true)}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <div className="text-5xl">👟</div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            {hasDiscount && (
              <span className="bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                -{product.discount}%
              </span>
            )}
            {product.bestSeller && (
              <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                الأكثر مبيعاً
              </span>
            )}
            {product.featured && (
              <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                مميز
              </span>
            )}
          </div>

          {/* Wishlist */}
          <button
            onClick={e => e.preventDefault()}
            className="absolute top-2 left-2 w-8 h-8 bg-white/80 backdrop-blur rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:bg-red-50 hover:text-red-500"
          >
            <Heart size={14} />
          </button>
        </div>

        {/* Info */}
        <div className="p-3">
          {/* Brand */}
          {product.brand && typeof product.brand === 'object' && (
            <p className="text-xs text-orange-500 font-medium mb-1">
              {product.brand.nameAr || product.brand.name}
            </p>
          )}

          {/* Name */}
          <h3 className="font-semibold text-gray-900 text-sm line-clamp-2 mb-2 leading-relaxed">
            {product.nameAr || product.name}
          </h3>

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-1 mb-2">
              <Star size={12} className="fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{product.averageRating.toFixed(1)}</span>
              <span className="text-xs text-gray-400">({product.totalReviews})</span>
            </div>
          )}

          {/* Sizes preview */}
          {product.hasSizes && product.sizes.length > 0 && (
            <div className="flex gap-1 mb-2 flex-wrap">
              {product.sizes.slice(0, 4).map(s => (
                <span key={s.size} className="text-xs border border-gray-200 px-1.5 py-0.5 rounded text-gray-500">
                  {s.size}
                </span>
              ))}
              {product.sizes.length > 4 && <span className="text-xs text-gray-400">...</span>}
            </div>
          )}

          {/* Price & Add to Cart */}
          <div className="flex items-center justify-between mt-auto">
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-lg font-bold text-gray-900">
                  {price.toFixed(0)} <span className="text-sm font-normal text-gray-500">ر.س</span>
                </span>
              </div>
              {hasDiscount && (
                <span className="text-xs text-gray-400 line-through">
                  {product.price.toFixed(0)} ر.س
                </span>
              )}
            </div>

            <button
              onClick={handleAddToCart}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all ${
                added
                  ? 'bg-green-500 text-white'
                  : product.hasSizes
                  ? 'bg-gray-100 text-gray-700 hover:bg-orange-50 hover:text-orange-600'
                  : 'bg-orange-500 text-white hover:bg-orange-600'
              }`}
            >
              <ShoppingCart size={14} />
              {added ? 'تمت الإضافة' : product.hasSizes ? 'اختر مقاس' : 'أضف'}
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}
