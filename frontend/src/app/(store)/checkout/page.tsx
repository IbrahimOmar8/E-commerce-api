'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ordersApi, discountApi } from '@/lib/api';
import { SAUDI_REGIONS } from '@/types';
import { CheckCircle, Loader } from 'lucide-react';

const DELIVERY_FEE = 25;
const FREE_SHIPPING = 200;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<{ orderNumber: string } | null>(null);

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountError, setDiscountError] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    street: '', city: '', region: '',
    paymentMethod: 'cod', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const sub = subtotal();
  const delivery = sub >= FREE_SHIPPING ? 0 : DELIVERY_FEE;
  const discountAmount = (sub * discount) / 100;
  const total = sub - discountAmount + delivery;

  const update = (k: string, v: string) => {
    setForm(p => ({ ...p, [k]: v }));
    setErrors(p => ({ ...p, [k]: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.phone.trim()) e.phone = 'رقم الجوال مطلوب';
    else if (!/^(05|5)\d{8}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'رقم جوال سعودي غير صحيح';
    if (!form.region) e.region = 'المنطقة مطلوبة';
    if (!form.city.trim()) e.city = 'المدينة مطلوبة';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    setDiscountError('');
    try {
      const res = await discountApi.validate(coupon.trim().toUpperCase(), sub);
      if (res.success) { setDiscount(res.discount); setAppliedCoupon(coupon.trim().toUpperCase()); setCoupon(''); }
      else setDiscountError('كود الخصم غير صالح');
    } catch { setDiscountError('كود غير صالح أو منتهي الصلاحية'); }
  };

  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);
    try {
      const orderBody = {
        customerInfo: {
          name: form.name,
          phone: form.phone.replace(/\s/g, ''),
          email: form.email || undefined,
          address: { street: form.street, city: form.city, region: form.region },
        },
        items: items.map(i => ({
          product: i.product._id,
          name: i.product.name,
          nameAr: i.product.nameAr,
          image: i.product.images?.[0],
          size: i.size || undefined,
          quantity: i.quantity,
          price: i.product.priceAfterDiscount > 0 ? i.product.priceAfterDiscount : i.product.price,
        })),
        subtotal: sub,
        discountCode: appliedCoupon || undefined,
        discountAmount,
        deliveryFee: delivery,
        totalAmount: total,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      };
      const res = await ordersApi.create(orderBody);
      clearCart();
      setOrder({ orderNumber: res.data.orderNumber });
      setStep('success');

      // Save order number so it can be claimed when user logs in later
      try {
        const pending: string[] = JSON.parse(localStorage.getItem('pending-orders') || '[]');
        if (!pending.includes(res.data.orderNumber)) {
          pending.push(res.data.orderNumber);
          localStorage.setItem('pending-orders', JSON.stringify(pending));
        }
      } catch (_) {}
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success' && order) return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال طلبك بنجاح! 🎉</h2>
      <p className="text-gray-500 mb-2">رقم الطلب:</p>
      <p className="text-2xl font-bold text-amber-500 mb-6 ltr">{order.orderNumber}</p>

      {/* Delivery info */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6 text-right space-y-3">
        <h3 className="font-bold text-amber-800 text-sm mb-3">📦 معلومات التوصيل</h3>
        <div className="flex items-start gap-3 text-sm text-amber-700">
          <span className="text-lg">🏙️</span>
          <div>
            <p className="font-semibold">داخل الرياض</p>
            <p className="text-amber-600 text-xs">التوصيل خلال 24 ساعة</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm text-amber-700">
          <span className="text-lg">🚚</span>
          <div>
            <p className="font-semibold">خارج الرياض</p>
            <p className="text-amber-600 text-xs">التوصيل خلال 2–5 أيام عمل</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-sm text-amber-700">
          <span className="text-lg">↩️</span>
          <div>
            <p className="font-semibold">سياسة الاستبدال</p>
            <p className="text-amber-600 text-xs">في حالة وجود عيب — استبدال خلال يومين فقط</p>
          </div>
        </div>
      </div>

      <p className="text-gray-500 text-sm mb-6">سيتم التواصل معك قريباً لتأكيد الطلب وترتيب التوصيل.</p>

      <div className="flex gap-3 justify-center flex-wrap">
        <Link href="/account/orders" className="bg-amber-500 text-white px-7 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-colors">
          تتبع طلبي
        </Link>
        <a href="https://wa.me/966597427928" target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-[#25D366] text-white px-7 py-3 rounded-2xl font-bold hover:opacity-90 transition-opacity">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          واتساب
        </a>
        <Link href="/products" className="border border-gray-200 text-gray-700 px-7 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-colors">
          تسوق أكثر
        </Link>
      </div>
    </div>
  );


  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/cart" className="text-gray-500 hover:text-gray-700 text-sm">السلة</Link>
        <span className="text-gray-300">/</span>
        <span className="font-semibold text-gray-900 text-sm">إتمام الطلب</span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Form */}
        <div className="lg:col-span-2 space-y-6">
          {/* Customer info */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">بيانات العميل</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الاسم الكامل *</label>
                <input value={form.name} onChange={e => update('name', e.target.value)}
                  placeholder="محمد عبدالله الأحمدي"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال *</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="05xxxxxxxx" dir="ltr"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
                <input value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder="example@email.com" dir="ltr" type="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">عنوان التوصيل</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة *</label>
                <select value={form.region} onChange={e => update('region', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${errors.region ? 'border-red-400' : 'border-gray-200'}`}>
                  <option value="">اختر المنطقة</option>
                  {SAUDI_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة *</label>
                <input value={form.city} onChange={e => update('city', e.target.value)}
                  placeholder="الرياض / جدة / ..."
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.city ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الحي / الشارع</label>
                <input value={form.street} onChange={e => update('street', e.target.value)}
                  placeholder="حي النزهة، شارع الملك فهد..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                  placeholder="أي تعليمات خاصة للتوصيل..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-4">طريقة الدفع</h2>
            <div className="flex items-center gap-3 p-4 border-2 border-amber-500 bg-amber-50 rounded-xl">
              <span className="text-2xl">💵</span>
              <div>
                <p className="font-bold text-gray-900">الدفع عند الاستلام</p>
                <p className="text-xs text-gray-500 mt-0.5">ادفع نقداً عند استلام طلبك</p>
              </div>
              <span className="mr-auto text-amber-500 text-lg">✓</span>
            </div>
          </div>
        </div>

        {/* Order summary */}
        <div className="space-y-4">
          {/* Coupon */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-3">كود الخصم</h3>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl px-4 py-3">
                <div>
                  <span className="font-bold text-green-700 text-sm ltr">{appliedCoupon}</span>
                  <p className="text-green-600 text-xs">خصم {discount}%</p>
                </div>
                <button onClick={() => { setAppliedCoupon(''); setDiscount(0); }} className="text-red-400 text-xs hover:text-red-600">إزالة</button>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input value={coupon} onChange={e => setCoupon(e.target.value.toUpperCase())}
                    placeholder="أدخل الكود" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm ltr uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-amber-500" />
                  <button onClick={handleApplyCoupon} className="bg-gray-900 text-white px-4 py-2 rounded-xl text-sm hover:bg-gray-700">تطبيق</button>
                </div>
                {discountError && <p className="text-red-500 text-xs">{discountError}</p>}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="font-bold text-gray-900 mb-4">ملخص الطلب</h3>

            {/* Items */}
            <div className="space-y-2 mb-4 max-h-48 overflow-y-auto">
              {items.map(item => {
                const p = item.product.priceAfterDiscount > 0 ? item.product.priceAfterDiscount : item.product.price;
                return (
                  <div key={`${item.product._id}-${item.size}`} className="flex justify-between text-sm">
                    <span className="text-gray-600 line-clamp-1 flex-1">
                      {item.product.nameAr || item.product.name}
                      {item.size && ` (${item.size})`}
                      <span className="text-gray-400"> ×{item.quantity}</span>
                    </span>
                    <span className="font-medium flex-shrink-0 mr-2">{(p * item.quantity).toFixed(2)}</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-gray-100 pt-3 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">المجموع الفرعي</span>
                <span>{sub.toFixed(2)} ر.س</span>
              </div>
              {discountAmount > 0 && <div className="flex justify-between text-green-600">
                <span>خصم ({discount}%)</span><span>-{discountAmount.toFixed(2)} ر.س</span>
              </div>}
              <div className="flex justify-between">
                <span className="text-gray-600">الشحن</span>
                <span>{delivery === 0 ? 'مجاني 🎉' : `${delivery} ر.س`}</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                <span>الإجمالي</span>
                <span className="text-amber-600">{total.toFixed(2)} ر.س</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors">
              {submitting ? <><Loader size={18} className="animate-spin" /> جاري إرسال الطلب...</> : 'تأكيد الطلب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
