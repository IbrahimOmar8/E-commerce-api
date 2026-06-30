'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cart';
import type { CartItem } from '@/types';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react';
import { discountApi } from '@/lib/api';

const DELIVERY_FEE = 25;
const VAT_RATE = 0.15;
const FREE_SHIPPING_THRESHOLD = 200;

export default function CartPage() {
  const { items, removeItem, updateQuantity, subtotal, clearCart } = useCartStore();
  const [mounted, setMounted] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [discountError, setDiscountError] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState('');

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
        setDiscountError('كود الخصم غير صالح');
      }
    } catch {
      setDiscountError('كود الخصم غير صالح أو منتهي الصلاحية');
    } finally {
      setCouponLoading(false);
    }
  };

  if (items.length === 0) return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <div className="text-8xl mb-6">🛒</div>
      <h2 className="text-2xl font-bold text-gray-900 mb-3">سلة التسوق فارغة</h2>
      <p className="text-gray-500 mb-8">لم تقم بإضافة أي منتجات بعد. ابدأ التسوق الآن!</p>
      <Link href="/products" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-8 py-4 rounded-2xl font-bold transition-colors">
        <ShoppingBag size={20} />
        تسوق الآن
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-gray-900">سلة التسوق ({items.length} منتج)</h1>
        <button onClick={clearCart} className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1">
          <Trash2 size={14} /> إفراغ السلة
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item: CartItem) => {
            const itemPrice = item.product.priceAfterDiscount > 0 ? item.product.priceAfterDiscount : item.product.price;
            const img = item.product.images?.[0];
            return (
              <div key={`${item.product._id}-${item.size}`} className="bg-white rounded-2xl p-4 border border-gray-100 flex gap-4">
                {/* Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 flex-shrink-0">
                  {img ? (
                    <Image src={img} alt={item.product.nameAr || item.product.name} width={96} height={96} className="object-cover w-full h-full" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-3xl">👟</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <Link href={`/products/${item.product._id}`} className="font-semibold text-gray-900 hover:text-orange-600 text-sm leading-snug line-clamp-2">
                    {item.product.nameAr || item.product.name}
                  </Link>
                  {item.size && <p className="text-xs text-gray-500 mt-1">المقاس: <span className="font-semibold">{item.size}</span></p>}
                  {item.product.discount > 0 && (
                    <p className="text-xs text-red-500 mt-1">خصم {item.product.discount}% مطبق</p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    {/* Qty */}
                    <div className="flex items-center gap-2 border border-gray-200 rounded-xl p-1">
                      <button onClick={() => updateQuantity(item.product._id, item.quantity - 1, item.size)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg">
                        <Minus size={14} />
                      </button>
                      <span className="w-7 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product._id, item.quantity + 1, item.size)}
                        className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 rounded-lg">
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="font-bold text-gray-900">{(itemPrice * item.quantity).toFixed(2)} ر.س</span>
                      <button onClick={() => removeItem(item.product._id, item.size)} className="text-red-400 hover:text-red-600">
                        <Trash2 size={16} />
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
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">كود الخصم</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <span className="text-green-700 font-bold text-sm ltr">{appliedCoupon}</span>
                  <p className="text-green-600 text-xs">خصم {discount}% مطبق</p>
                </div>
                <button onClick={() => { setAppliedCoupon(''); setDiscount(0); }} className="text-red-400 text-xs hover:text-red-600">إزالة</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={coupon}
                    onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود"
                    className="flex-1 border border-gray-200 rounded-xl px-3 py-2.5 text-sm uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-orange-500 ltr"
                  />
                  <button onClick={handleApplyCoupon} disabled={couponLoading}
                    className="bg-gray-900 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 disabled:opacity-50">
                    {couponLoading ? '...' : 'تطبيق'}
                  </button>
                </div>
                {discountError && <p className="text-red-500 text-xs">{discountError}</p>}
              </div>
            )}
          </div>

          {/* Order summary */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">ملخص الطلب</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span className="font-medium">{sub.toFixed(2)} ر.س</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>خصم ({discount}%)</span>
                  <span>-{discountAmount.toFixed(2)} ر.س</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">رسوم الشحن</span>
                {delivery === 0 ? (
                  <span className="text-green-600 font-medium">مجاني 🎉</span>
                ) : (
                  <span className="font-medium">{delivery.toFixed(2)} ر.س</span>
                )}
              </div>
              {sub < FREE_SHIPPING_THRESHOLD && delivery > 0 && (
                <p className="text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded-lg">
                  أضف منتجات بـ {(FREE_SHIPPING_THRESHOLD - sub).toFixed(0)} ر.س للحصول على شحن مجاني
                </p>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">ضريبة القيمة المضافة (15%)</span>
                <span className="font-medium">{vat.toFixed(2)} ر.س</span>
              </div>
              <div className="border-t border-gray-100 pt-3 flex justify-between text-base font-bold">
                <span>الإجمالي</span>
                <span className="text-orange-600">{total.toFixed(2)} ر.س</span>
              </div>
            </div>

            <Link href="/checkout"
              className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold py-4 rounded-2xl transition-colors">
              إتمام الشراء
              <ArrowRight size={18} className="rotate-180" />
            </Link>

            <Link href="/products" className="mt-3 w-full flex items-center justify-center gap-2 border border-gray-200 text-gray-700 font-medium py-3 rounded-2xl hover:bg-gray-50 transition-colors text-sm">
              متابعة التسوق
            </Link>

            {/* Payment icons */}
            <div className="mt-4 flex justify-center gap-2">
              {['مدى', 'Visa', 'STC', 'COD'].map(m => (
                <span key={m} className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded-lg">{m}</span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
