'use client';
import { useState, useEffect, use } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { productsApi, reviewsApi } from '@/lib/api';
import type { Product, Review } from '@/types';
import { ShoppingCart, Star, Heart, ArrowRight, Truck, RotateCcw, Shield } from 'lucide-react';
import { GENDER_LABELS } from '@/types';

export default function ProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [sizeError, setSizeError] = useState(false);
  const { addItem } = useCartStore();

  useEffect(() => {
    Promise.all([productsApi.getOne(id), reviewsApi.getForProduct(id)])
      .then(([pRes, rRes]) => {
        setProduct(pRes.data);
        setReviews(rRes.data || []);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    if (product.hasSizes && !selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    setAdding(true);
    addItem(product, quantity, selectedSize);
    setAdded(true);
    setTimeout(() => { setAdding(false); setAdded(false); }, 2000);
  };

  if (loading) return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-square skeleton rounded-3xl" />
        <div className="space-y-4">
          <div className="h-8 skeleton rounded w-3/4" />
          <div className="h-6 skeleton rounded w-1/2" />
          <div className="h-32 skeleton rounded" />
        </div>
      </div>
    </div>
  );

  if (!product) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">😔</div>
      <h2 className="text-xl font-bold">المنتج غير موجود</h2>
      <Link href="/products" className="mt-4 inline-block bg-orange-500 text-white px-6 py-3 rounded-xl">
        العودة للمنتجات
      </Link>
    </div>
  );

  const price = product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
  const hasDiscount = product.discount > 0 && product.priceAfterDiscount > 0;
  const currentImages = product.images.length > 0 ? product.images : [null];
  const totalStock = product.hasSizes
    ? (selectedSize ? (product.sizes.find(s => s.size === selectedSize)?.stock || 0) : product.sizes.reduce((s, sz) => s + sz.stock, 0))
    : product.stock;

  const renderStars = (rating: number) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star key={i} size={16} className={i < Math.round(rating) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-200'} />
    ));

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-8">
        <Link href="/" className="hover:text-orange-500">الرئيسية</Link>
        <ArrowRight size={14} className="rotate-180" />
        <Link href="/products" className="hover:text-orange-500">المنتجات</Link>
        <ArrowRight size={14} className="rotate-180" />
        <span className="text-gray-900">{product.nameAr || product.name}</span>
      </nav>

      <div className="grid md:grid-cols-2 gap-10 mb-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-square rounded-3xl overflow-hidden bg-gray-50 relative">
            {currentImages[selectedImage] ? (
              <Image src={currentImages[selectedImage]!} alt={product.nameAr || product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl">👟</div>
            )}
            {hasDiscount && (
              <span className="absolute top-4 right-4 bg-red-500 text-white font-bold text-lg px-4 py-2 rounded-2xl">
                -{product.discount}%
              </span>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3 overflow-x-auto pb-1">
              {product.images.map((img, i) => (
                <button key={i} onClick={() => setSelectedImage(i)}
                  className={`w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-colors ${selectedImage === i ? 'border-orange-500' : 'border-transparent'}`}>
                  <Image src={img} alt="" width={80} height={80} className="object-cover w-full h-full" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          {product.brand && typeof product.brand === 'object' && (
            <Link href={`/products?brand=${product.brand._id}`}
              className="inline-block bg-orange-50 text-orange-600 text-sm font-semibold px-3 py-1 rounded-full mb-3 hover:bg-orange-100">
              {product.brand.nameAr || product.brand.name}
            </Link>
          )}

          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 leading-tight">
            {product.nameAr || product.name}
          </h1>

          {product.name !== product.nameAr && product.name && (
            <p className="text-gray-500 text-sm mb-3 ltr">{product.name}</p>
          )}

          {/* Rating */}
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-2 mb-4">
              <div className="flex">{renderStars(product.averageRating)}</div>
              <span className="font-semibold text-gray-900">{product.averageRating.toFixed(1)}</span>
              <span className="text-gray-500 text-sm">({product.totalReviews} تقييم)</span>
            </div>
          )}

          {/* Price */}
          <div className="flex items-end gap-3 mb-6">
            <div className="text-4xl font-bold text-gray-900">
              {price.toFixed(2)}
              <span className="text-lg font-normal text-gray-500 mr-1">ر.س</span>
            </div>
            {hasDiscount && (
              <div>
                <span className="text-gray-400 line-through text-lg">{product.price.toFixed(2)} ر.س</span>
                <span className="block text-xs text-green-600 font-medium">
                  وفّرت {(product.price - price).toFixed(2)} ر.س
                </span>
              </div>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {product.gender && <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">{GENDER_LABELS[product.gender]}</span>}
            {(product.sportAr || product.sport) && <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">{product.sportAr || product.sport}</span>}
            {product.material && <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full">{product.material}</span>}
            {product.sku && <span className="bg-gray-100 text-gray-600 text-xs px-3 py-1.5 rounded-full ltr">SKU: {product.sku}</span>}
          </div>

          {/* Sizes */}
          {product.hasSizes && product.sizes.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-semibold text-gray-900">اختر المقاس</h3>
                {sizeError && <span className="text-red-500 text-sm">يرجى اختيار المقاس</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map(s => (
                  <button key={s.size} disabled={s.stock === 0} onClick={() => { setSelectedSize(s.size); setSizeError(false); }}
                    className={`px-4 py-2.5 rounded-xl text-sm font-medium border-2 transition-all ${
                      selectedSize === s.size ? 'border-orange-500 bg-orange-50 text-orange-700' :
                      s.stock === 0 ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed line-through' :
                      'border-gray-200 hover:border-orange-300 text-gray-700'
                    }`}>
                    {s.size}
                    {s.stock === 0 && <span className="text-xs mr-1 text-gray-300">نفد</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Quantity */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">الكمية</h3>
            <div className="flex items-center gap-3">
              <button onClick={() => setQuantity(q => Math.max(1, q - 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-50">−</button>
              <span className="w-10 text-center font-bold text-lg">{quantity}</span>
              <button onClick={() => setQuantity(q => Math.min(totalStock || 99, q + 1))}
                className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center text-xl hover:bg-gray-50">+</button>
              <span className="text-sm text-gray-500">
                {totalStock > 0 ? `متاح: ${totalStock}` : <span className="text-red-500">نفد المخزون</span>}
              </span>
            </div>
          </div>

          {/* Add to cart */}
          <div className="flex gap-3">
            <button onClick={handleAddToCart} disabled={totalStock === 0 || adding}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-base font-bold transition-all ${
                added ? 'bg-green-500 text-white' :
                totalStock === 0 ? 'bg-gray-200 text-gray-400 cursor-not-allowed' :
                'bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-200'
              }`}>
              <ShoppingCart size={20} />
              {added ? 'تمت الإضافة للسلة ✓' : totalStock === 0 ? 'نفد المخزون' : 'أضف إلى السلة'}
            </button>
            <button className="w-14 h-14 rounded-2xl border-2 border-gray-200 flex items-center justify-center hover:border-red-300 hover:bg-red-50 transition-all">
              <Heart size={20} className="text-gray-400 hover:text-red-500" />
            </button>
          </div>

          {/* Benefits */}
          <div className="grid grid-cols-3 gap-3 mt-6 pt-6 border-t border-gray-100">
            <div className="text-center">
              <Truck className="mx-auto mb-1 text-orange-500" size={20} />
              <p className="text-xs text-gray-600">شحن سريع</p>
            </div>
            <div className="text-center">
              <RotateCcw className="mx-auto mb-1 text-orange-500" size={20} />
              <p className="text-xs text-gray-600">إرجاع 14 يوم</p>
            </div>
            <div className="text-center">
              <Shield className="mx-auto mb-1 text-orange-500" size={20} />
              <p className="text-xs text-gray-600">منتج أصلي</p>
            </div>
          </div>
        </div>
      </div>

      {/* Description */}
      {(product.descriptionAr || product.description) && (
        <div className="bg-white rounded-3xl p-8 mb-8 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900 mb-4">وصف المنتج</h2>
          <p className="text-gray-600 leading-relaxed whitespace-pre-line">
            {product.descriptionAr || product.description}
          </p>
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white rounded-3xl p-8 border border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900">التقييمات ({reviews.length})</h2>
          {product.totalReviews > 0 && (
            <div className="flex items-center gap-2">
              <div className="flex">{renderStars(product.averageRating)}</div>
              <span className="font-bold text-xl text-gray-900">{product.averageRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {reviews.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <Star size={40} className="mx-auto mb-3 opacity-30" />
            <p>لا توجد تقييمات بعد. كن أول من يقيّم هذا المنتج!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {reviews.map(review => (
              <div key={review._id} className="border-b border-gray-50 pb-4 last:border-0">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                      {review.user.fullName[0]}
                    </div>
                    <div>
                      <p className="font-semibold text-sm text-gray-900">{review.user.fullName}</p>
                      <p className="text-xs text-gray-400">{new Date(review.createdAt).toLocaleDateString('ar-SA')}</p>
                    </div>
                  </div>
                  <div className="flex">{renderStars(review.rating)}</div>
                </div>
                {review.comment && <p className="text-gray-600 text-sm leading-relaxed">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
