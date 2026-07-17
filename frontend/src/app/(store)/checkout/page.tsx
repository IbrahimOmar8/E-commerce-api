'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ordersApi, discountApi, usersApi, type SavedAddress } from '@/lib/api';
import { SAUDI_REGIONS, SAUDI_CITIES } from '@/types';
import { CheckCircle, Loader, MapPin, Trash2, Copy, Check } from 'lucide-react';

const DELIVERY_FEE = 25;
const FREE_SHIPPING = 200;

export default function CheckoutPage() {
  const { items, subtotal, clearCart } = useCartStore();
  const { user } = useAuthStore();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'form' | 'success'>('form');
  const [submitting, setSubmitting] = useState(false);
  const [order, setOrder] = useState<{ orderNumber: string; totalAmount: number; itemsCount: number } | null>(null);
  const [copied, setCopied] = useState(false);

  const [coupon, setCoupon] = useState('');
  const [discount, setDiscount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [discountError, setDiscountError] = useState('');

  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [saveAddress, setSaveAddress] = useState(false);
  const [customCity, setCustomCity] = useState('');

  const [form, setForm] = useState({
    name: '', phone: '', email: '',
    street: '', city: '', region: '',
    paymentMethod: 'cod', notes: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (user?.role === 'user') {
      usersApi.getAddresses().then(r => setSavedAddresses(r.data || [])).catch(() => {});
    }
  }, [user]);

  if (!mounted) return null;
  if (items.length === 0) {
    router.push('/cart');
    return null;
  }

  const sub = subtotal();
  const delivery = sub >= FREE_SHIPPING ? 0 : DELIVERY_FEE;
  const discountAmount = (sub * discount) / 100;
  const total = sub - discountAmount + delivery;

  // Resolved city: from dropdown or custom text input
  const resolvedCity = form.city === '__other__' ? customCity.trim() : form.city;

  const regionCities = form.region ? (SAUDI_CITIES[form.region] || []) : [];

  const update = (k: string, v: string) => {
    if (k === 'region') {
      setForm(p => ({ ...p, region: v, city: '' }));
      setCustomCity('');
    } else {
      setForm(p => ({ ...p, [k]: v }));
    }
    setErrors(p => ({ ...p, [k]: '', city: '' }));
  };

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.name.trim()) e.name = 'الاسم مطلوب';
    if (!form.phone.trim()) e.phone = 'رقم الجوال مطلوب';
    else if (!/^(05|5)\d{8}$/.test(form.phone.replace(/\s/g, ''))) e.phone = 'رقم جوال سعودي غير صحيح';
    if (!form.region) e.region = 'المنطقة مطلوبة';
    if (!resolvedCity) e.city = 'المدينة مطلوبة';
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
          address: { street: form.street, city: resolvedCity, region: form.region },
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
      const num: string = res.data.orderNumber;
      clearCart();
      setOrder({ orderNumber: num, totalAmount: total, itemsCount: items.length });
      setStep('success');

      // Save address for logged-in customer
      if (saveAddress && user?.role === 'user') {
        usersApi.addAddress({
          label: 'عنوان محفوظ',
          name: form.name,
          phone: form.phone,
          address: { street: form.street, city: resolvedCity, region: form.region },
        }).catch(() => {});
      }

      // Save full order to localStorage for guest display (no API call needed later)
      try {
        const localOrder = {
          _id: String(res.data._id || res.data.orderNumber),
          orderNumber: num,
          status: 'pending',
          paymentMethod: form.paymentMethod,
          totalAmount: total,
          subtotal: sub,
          discountCode: appliedCoupon || null,
          discountAmount,
          deliveryFee: delivery,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          customerInfo: {
            name: form.name,
            phone: form.phone.replace(/\s/g, ''),
            address: { street: form.street, city: resolvedCity, region: form.region },
          },
          items: items.map(i => ({
            name: i.product.name,
            nameAr: i.product.nameAr,
            image: i.product.images?.[0] || '',
            size: i.size || '',
            quantity: i.quantity,
            price: i.product.priceAfterDiscount > 0 ? i.product.priceAfterDiscount : i.product.price,
          })),
        };
        const stored = JSON.parse(localStorage.getItem('guest-orders') || '[]');
        stored.unshift(localOrder);
        localStorage.setItem('guest-orders', JSON.stringify(stored));

        // Also keep pending-orders list for claim-on-login
        const pending: string[] = JSON.parse(localStorage.getItem('pending-orders') || '[]');
        if (!pending.includes(num)) {
          pending.push(num);
          localStorage.setItem('pending-orders', JSON.stringify(pending));
        }
      } catch (_) {}
    } catch (err) {
      alert(err instanceof Error ? err.message : 'حدث خطأ، حاول مرة أخرى');
    } finally {
      setSubmitting(false);
    }
  };

  const copyOrderNumber = () => {
    if (!order) return;
    navigator.clipboard.writeText(order.orderNumber).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  // ─── Success screen ──────────────────────────────────────────────────────────
  if (step === 'success' && order) return (
    <div className="max-w-lg mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-6">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-100">
          <CheckCircle size={44} className="text-green-500" />
        </div>
        <h2 className="text-2xl font-black text-gray-900">تم استلام طلبك! 🎉</h2>
        <p className="text-gray-500 mt-1 text-sm">سيتم التواصل معك لتأكيد الطلب وترتيب التوصيل</p>
      </div>

      {/* Order number card */}
      <div className="bg-amber-500 rounded-2xl p-5 text-center text-white mb-5 shadow-lg shadow-amber-200">
        <p className="text-amber-100 text-sm mb-1">رقم طلبك</p>
        <p className="text-3xl font-black ltr tracking-wider mb-3">{order.orderNumber}</p>
        <button
          onClick={copyOrderNumber}
          className="inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors">
          {copied ? <><Check size={14} /> تم النسخ</> : <><Copy size={14} /> نسخ الرقم</>}
        </button>
        <p className="text-amber-100 text-xs mt-3">⚠️ احتفظ برقم طلبك لمتابعة حالته</p>
      </div>

      {/* Summary */}
      <div className="bg-white border border-gray-100 rounded-2xl p-5 mb-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">عدد المنتجات</span>
          <span className="font-semibold">{order.itemsCount} منتج</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-500">طريقة الدفع</span>
          <span className="font-semibold">💵 الدفع عند الاستلام</span>
        </div>
        <div className="flex justify-between border-t border-gray-50 pt-3">
          <span className="font-bold text-gray-900">الإجمالي</span>
          <span className="font-black text-amber-600 text-lg">{order.totalAmount.toFixed(2)} ر.س</span>
        </div>
      </div>

      {/* Delivery info */}
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 mb-5 space-y-3 text-sm">
        <h3 className="font-bold text-slate-800 flex items-center gap-2">📦 معلومات التوصيل</h3>
        <div className="flex items-start gap-3 text-slate-600">
          <span className="text-base mt-0.5">🏙️</span>
          <div>
            <p className="font-semibold text-slate-800">داخل الرياض</p>
            <p className="text-slate-500 text-xs">التوصيل خلال 24 ساعة</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-600">
          <span className="text-base mt-0.5">🚚</span>
          <div>
            <p className="font-semibold text-slate-800">خارج الرياض</p>
            <p className="text-slate-500 text-xs">التوصيل خلال 2–5 أيام عمل</p>
          </div>
        </div>
        <div className="flex items-start gap-3 text-slate-600">
          <span className="text-base mt-0.5">↩️</span>
          <div>
            <p className="font-semibold text-slate-800">سياسة الاستبدال</p>
            <p className="text-slate-500 text-xs">في حالة وجود عيب — استبدال خلال يومين فقط</p>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        <Link href="/account/orders"
          className="flex items-center justify-center gap-2 bg-amber-500 text-white py-3.5 rounded-2xl font-bold hover:bg-amber-600 transition-colors text-sm">
          📋 تتبع طلبي
        </Link>
        <a href="https://wa.me/966597427928" target="_blank" rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 bg-[#25D366] text-white py-3.5 rounded-2xl font-bold hover:opacity-90 transition-opacity text-sm">
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          واتساب
        </a>
      </div>
      <Link href="/products"
        className="w-full flex items-center justify-center border border-gray-200 text-gray-700 py-3 rounded-2xl font-medium hover:bg-gray-50 transition-colors text-sm">
        تسوق أكثر
      </Link>
    </div>
  );

  // ─── Checkout form ───────────────────────────────────────────────────────────
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
            <h2 className="text-lg font-bold text-gray-900 mb-4">عنوان التوصيل</h2>

            {/* Saved addresses picker */}
            {savedAddresses.length > 0 && (
              <div className="mb-5">
                <p className="text-sm font-medium text-gray-600 mb-2 flex items-center gap-1.5"><MapPin size={14} /> عناوين محفوظة</p>
                <div className="space-y-2">
                  {savedAddresses.map(addr => (
                    <div key={addr.id} className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const city = addr.address?.city || '';
                          const regionKey = addr.address?.region || '';
                          const cities = SAUDI_CITIES[regionKey] || [];
                          const isKnown = cities.includes(city);
                          setForm(p => ({
                            ...p,
                            name: addr.name || p.name,
                            phone: addr.phone || p.phone,
                            street: addr.address?.street || '',
                            city: isKnown ? city : (city ? '__other__' : ''),
                            region: regionKey,
                          }));
                          if (!isKnown && city) setCustomCity(city);
                        }}
                        className="flex-1 text-right text-sm bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-xl px-4 py-2.5 transition-colors">
                        <span className="font-semibold text-amber-800">{addr.label}</span>
                        <span className="text-gray-500 mr-2">{addr.address?.city}{addr.address?.region ? ` · ${addr.address.region}` : ''}</span>
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await usersApi.deleteAddress(addr.id).catch(() => {});
                          setSavedAddresses(p => p.filter(a => a.id !== addr.id));
                        }}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-4 mb-4" />
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-4">
              {/* Region */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المنطقة *</label>
                <select value={form.region} onChange={e => update('region', e.target.value)}
                  className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${errors.region ? 'border-red-400' : 'border-gray-200'}`}>
                  <option value="">اختر المنطقة</option>
                  {SAUDI_REGIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
                {errors.region && <p className="text-red-500 text-xs mt-1">{errors.region}</p>}
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">المدينة *</label>
                {regionCities.length > 0 ? (
                  <select value={form.city} onChange={e => { update('city', e.target.value); if (e.target.value !== '__other__') setCustomCity(''); }}
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white ${errors.city ? 'border-red-400' : 'border-gray-200'}`}>
                    <option value="">اختر المدينة</option>
                    {regionCities.map(c => <option key={c} value={c}>{c}</option>)}
                    <option value="__other__">مدينة أخرى...</option>
                  </select>
                ) : (
                  <input value={form.city} onChange={e => update('city', e.target.value)}
                    placeholder="اختر المنطقة أولاً أو اكتب مدينتك"
                    className={`w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.city ? 'border-red-400' : 'border-gray-200'}`} />
                )}
                {form.city === '__other__' && (
                  <input value={customCity} onChange={e => { setCustomCity(e.target.value); setErrors(p => ({ ...p, city: '' })); }}
                    placeholder="اكتب اسم مدينتك"
                    className={`mt-2 w-full border rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 ${errors.city ? 'border-red-400' : 'border-gray-200'}`} />
                )}
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
              {user?.role === 'user' && (
                <div className="sm:col-span-2">
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input type="checkbox" checked={saveAddress} onChange={e => setSaveAddress(e.target.checked)}
                      className="w-4 h-4 accent-amber-500 rounded" />
                    <span className="text-sm text-gray-600">حفظ هذا العنوان للطلبات القادمة</span>
                  </label>
                </div>
              )}
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
              className="mt-5 w-full flex items-center justify-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors text-base">
              {submitting ? <><Loader size={18} className="animate-spin" /> جاري إرسال الطلب...</> : 'تأكيد الطلب ✓'}
            </button>

            <p className="text-center text-xs text-gray-400 mt-3">💵 الدفع عند الاستلام — لا رسوم مسبقة</p>
          </div>
        </div>
      </div>
    </div>
  );
}
