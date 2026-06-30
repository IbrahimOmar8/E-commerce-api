'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { ordersApi, discountApi } from '@/lib/api';
import { SAUDI_REGIONS } from '@/types';
import { CheckCircle, Loader } from 'lucide-react';

const DELIVERY_FEE = 25;
const VAT_RATE = 0.15;
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
  const vatBase = sub - discountAmount + delivery;
  const vat = vatBase * VAT_RATE;
  const total = vatBase + vat;

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
        vat,
        totalAmount: total,
        paymentMethod: form.paymentMethod,
        notes: form.notes || undefined,
      };
      const res = await ordersApi.create(orderBody);
      clearCart();
      setOrder({ orderNumber: res.data.orderNumber });
      setStep('success');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  if (step === 'success' && order) return (
    <div className="max-w-lg mx-auto px-4 py-20 text-center">
      <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle size={48} className="text-green-500" />
      </div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إرسال طلبك بنجاح! 🎉</h2>
      <p className="text-gray-500 mb-2">رقم الطلب:</p>
      <p className="text-2xl font-bold text-orange-500 mb-6 ltr">{order.orderNumber}</p>
      <p className="text-gray-600 mb-8 leading-relaxed">
        شكراً لتسوقك معنا! سيتم التواصل معك قريباً لتأكيد الطلب.
        يمكنك تتبع طلبك من خلال رقم الطلب.
      </p>
      <div className="flex gap-3 justify-center">
        <Link href="/" className="bg-orange-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-orange-600 transition-colors">
          الرئيسية
        </Link>
        <Link href="/products" className="border border-gray-200 text-gray-700 px-8 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-colors">
          تسوق أكثر
        </Link>
      </div>
    </div>
  );

  const PAYMENT_METHODS = [
    { value: 'cod', label: 'الدفع عند الاستلام', icon: '💵', desc: 'ادفع نقداً عند استلام طلبك' },
    { value: 'mada', label: 'مدى', icon: '💳', desc: 'بطاقة مدى السعودية' },
    { value: 'stcpay', label: 'STC Pay', icon: '📱', desc: 'ادفع عبر تطبيق STC Pay' },
    { value: 'applepay', label: 'Apple Pay', icon: '🍎', desc: 'ادفع بـ Apple Pay' },
  ];

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
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.name ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">رقم الجوال *</label>
                <input value={form.phone} onChange={e => update('phone', e.target.value)}
                  placeholder="05xxxxxxxx" dir="ltr"
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.phone ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">البريد الإلكتروني (اختياري)</label>
                <input value={form.email} onChange={e => update('email', e.target.value)}
                  placeholder="example@email.com" dir="ltr" type="email"
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white ${errors.region ? 'border-red-400' : 'border-gray-200'}`}>
                  <option value="">اختر المنطقة</option>
                  {SAUDI_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة *</label>
                <input value={form.city} onChange={e => update('city', e.target.value)}
                  placeholder="الرياض / جدة / ..."
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 ${errors.city ? 'border-red-400' : 'border-gray-200'}`} />
                {errors.city && <p className="text-red-500 text-xs mt-1">{errors.city}</p>}
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">الحي / الشارع</label>
                <input value={form.street} onChange={e => update('street', e.target.value)}
                  placeholder="حي النزهة، شارع الملك فهد..."
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">ملاحظات إضافية</label>
                <textarea value={form.notes} onChange={e => update('notes', e.target.value)}
                  placeholder="أي تعليمات خاصة للتوصيل..." rows={2}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white rounded-2xl p-6 border border-gray-100">
            <h2 className="text-lg font-bold text-gray-900 mb-5">طريقة الدفع</h2>
            <div className="grid sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map(m => (
                <label key={m.value} className={`flex items-center gap-3 p-4 border-2 rounded-xl cursor-pointer transition-all ${
                  form.paymentMethod === m.value ? 'border-orange-500 bg-orange-50' : 'border-gray-200 hover:border-orange-200'
                }`}>
                  <input type="radio" name="payment" value={m.value} checked={form.paymentMethod === m.value}
                    onChange={() => update('paymentMethod', m.value)} className="accent-orange-500" />
                  <div>
                    <div className="flex items-center gap-2">
                      <span>{m.icon}</span>
                      <span className="font-semibold text-sm text-gray-800">{m.label}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">{m.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {form.paymentMethod !== 'cod' && (
              <div className="mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-700">
                سيتم توجيهك لبوابة الدفع الآمنة عند إتمام الطلب
              </div>
            )}
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
                    placeholder="أدخل الكود" className="flex-1 border border-gray-200 rounded-xl px-3 py-2 text-sm ltr uppercase placeholder:normal-case focus:outline-none focus:ring-2 focus:ring-orange-500" />
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
              <div className="flex justify-between">
                <span className="text-gray-600">ضريبة 15%</span>
                <span>{vat.toFixed(2)} ر.س</span>
              </div>
              <div className="border-t border-gray-100 pt-2 flex justify-between font-bold text-base">
                <span>الإجمالي</span>
                <span className="text-orange-600">{total.toFixed(2)} ر.س</span>
              </div>
            </div>

            <button onClick={handleSubmit} disabled={submitting}
              className="mt-5 w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors">
              {submitting ? <><Loader size={18} className="animate-spin" /> جاري إرسال الطلب...</> : 'تأكيد الطلب'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
