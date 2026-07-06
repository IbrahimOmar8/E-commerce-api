'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import { useLanguage } from '@/contexts/language';
import type { CartItem } from '@/types';
import { Trash2, Plus, Minus, ShoppingBag, ArrowLeft, ArrowRight, Tag, CheckCircle } from 'lucide-react';
import { discountApi } from '@/lib/api';

const DELIVERY_FEE = 25;
const VAT_RATE = 0.15;
const FREE_SHIPPING_THRESHOLD = 200;

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
  const { t, isRTL, lang } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState('');

  const ArrowIcon = isRTL ? ArrowRight : ArrowLeft;

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const sub = subtotal();
  const delivery = sub >= FREE_SHIPPING_THRESHOLD ? 0 : DELIVERY_FEE;
  const discountAmount = (sub * discount) / 100;
  const vatBase = sub - discountAmount + delivery;
  const vat = vatBase * VAT_RATE;
  const total = vatBase + vat;

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setCouponLoading(true);
    setDiscountError('');
    try {
      const res = await discountApi.validate(coupon.trim().toUpperCase(), sub);
      if (res.success) {
        setDiscount(res.discount);
        setAppliedCoupon(coupon.trim().toUpperCase());
        setCoupon('');
      } else {
        setDiscountError(t('couponInvalid'));
      }
    } catch {
      setDiscountError(t('couponExpired'));
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-24 text-center fade-in">
      <div className="w-24 h-24 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <ShoppingBag size={40} className="text-amber-500" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 mb-3">{t('emptyCart')}</h2>
      <p className="text-slate-500 mb-8">{t('emptyCartDesc')}</p>
      <Link href="/products" className="btn-primary px-10 py-4 inline-flex items-center gap-2 text-base rounded-2xl">
        <ShoppingBag size={18} />
        {t('shopNow2')}
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 fade-in">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-black text-slate-900">
          {t('cartTitle')} <span className="text-slate-400 font-medium text-lg">({items.length})</span>
        </h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1.5">
          <Trash2 size={14} /> {t('emptyCartBtn')}
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-3">
          {items.map((item: CartItem) => {
            const itemPrice = item.product.priceAfterDiscount > 0 ? item.product.priceAfterDiscount : item.product.price;
            const img = item.product.images?.[0];
            const name = (lang === 'ar' ? item.product.nameAr || item.product.name : item.product.name || item.product.nameAr) || '';

            return (
              <div key={`${item.product._id}-${item.size}`}
                className="bg-white rounded-2xl p-4 border border-slate-100 flex gap-4 shadow-sm hover:shadow-md transition-shadow">
                <Link href={`/products/${item.product._id}`}
                  className="w-24 h-24 rounded-xl overflow-hidden bg-slate-50 flex-shrink-0">
                  {img ? (
                    <Image src={img} alt={name} width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👟</div>
                  )}
                </Link>

                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product._id}`}
                    className="font-semibold text-slate-900 hover:text-amber-600 text-sm leading-snug line-clamp-2">
                    {name}
                  </Link>
                  {item.size && (
                    <p className="text-xs text-slate-500 mt-1">
                      {t('size')}: <span className="font-bold">{item.size}</span>
                    </p>
                  )}
                  {item.product.discount > 0 && (
                    <p className="text-xs text-red-500 mt-0.5">-{item.product.discount}% {lang === 'ar' ? 'خصم' : 'off'}</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-1 border border-slate-200 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.size)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg">
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.size)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-slate-100 rounded-lg">
                        <Plus size={13} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-black text-slate-900">
                        {(itemPrice * item.quantity).toFixed(2)}
                        <span className="text-xs text-slate-400 font-normal ms-1">{t('sar')}</span>
                      </span>
                      <button onClick={() => removeItem(item.product._id, item.size)}
                        className="text-slate-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Tag size={16} className="text-amber-500" />
              {t('couponCode')}
            </h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div className="flex items-center gap-2">
                  <CheckCircle size={16} className="text-green-500" />
                  <div>
                    <span className="text-green-700 font-bold text-sm ltr">{appliedCoupon}</span>
                    <p className="text-green-600 text-xs">
                      {lang === 'ar' ? `خصم ${discount}% مطبق` : `${discount}% discount applied`}
                    </p>
                  </div>
                </div>
                <button onClick={() => { setAppliedCoupon(''); setDiscount(0); }}
                  className="text-red-400 text-xs hover:text-red-600 font-medium">
                  {t('remove')}
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input type="text" value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder={t('enterCoupon')}
                    className="input-base uppercase ltr-full"
                    onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()} />
                  <button onClick={handleApplyCoupon} disabled={couponLoading || !coupon.trim()}
                    className="btn-primary px-4 py-2 text-sm rounded-xl whitespace-nowrap disabled:opacity-50">
                    {couponLoading ? '...' : t('apply')}
                  </button>
                </div>
                {discountError && <p className="text-red-500 text-xs">{discountError}</p>}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-5">{t('orderSummary')}</h3>
            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">{t('subtotal')}</span>
                <span className="font-semibold">{sub.toFixed(2)} {t('sar')}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>{lang === 'ar' ? `خصم (${discount}%)` : `Discount (${discount}%)`}</span>
                  <span>-{discountAmount.toFixed(2)} {t('sar')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t('shippingFee')}</span>
                {delivery === 0
                  ? <span className="text-green-600 font-semibold">{t('freeShipping')}</span>
                  : <span className="font-semibold">{delivery.toFixed(2)} {t('sar')}</span>}
              </div>
              {sub < FREE_SHIPPING_THRESHOLD && delivery > 0 && (
                <div className="text-xs text-amber-700 bg-amber-50 border border-amber-100 px-3 py-2.5 rounded-xl">
                  {lang === 'ar'
                    ? `أضف منتجات بـ ${(FREE_SHIPPING_THRESHOLD - sub).toFixed(0)} ر.س للشحن المجاني`
                    : `Add SAR ${(FREE_SHIPPING_THRESHOLD - sub).toFixed(0)} more for free shipping`}
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">{t('vatLabel')}</span>
                <span className="font-semibold">{vat.toFixed(2)} {t('sar')}</span>
              </div>
              <div className="border-t border-slate-100 pt-4 flex justify-between">
                <span className="font-bold text-slate-900 text-base">{t('total')}</span>
                <span className="font-black text-amber-600 text-xl">{total.toFixed(2)} {t('sar')}</span>
              </div>
            </div>

            <Link href="/checkout"
              className="mt-5 w-full flex items-center justify-center gap-2 btn-primary py-4 rounded-2xl text-base">
              {t('checkout')} <ArrowIcon size={18} />
            </Link>

            <Link href="/products"
              className="mt-3 w-full flex items-center justify-center border border-slate-200 text-slate-700 font-medium py-3 rounded-2xl hover:bg-slate-50 text-sm">
              {t('continueShopping')}
            </Link>

            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex justify-center gap-2">
                {['مدى', 'Visa', 'STC', 'COD'].map(m => (
                  <span key={m} className="text-xs bg-slate-100 text-slate-500 px-2.5 py-1.5 rounded-lg font-medium">{m}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
