'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { ordersApi } from '@/lib/api';
import type { Order } from '@/types';
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight, Search, Ban } from 'lucide-react';

const STATUS_MAP: Record<string, { label: string; color: string; icon: React.ReactNode; step: number }> = {
  pending:    { label: 'قيد المراجعة',   color: 'text-yellow-600 bg-yellow-50 border-yellow-200', icon: <Clock size={16} />,        step: 1 },
  confirmed:  { label: 'تم التأكيد',     color: 'text-blue-600 bg-blue-50 border-blue-200',       icon: <CheckCircle size={16} />,  step: 2 },
  processing: { label: 'جاري التجهيز',   color: 'text-purple-600 bg-purple-50 border-purple-200', icon: <Package size={16} />,      step: 3 },
  shipped:    { label: 'في الطريق إليك', color: 'text-indigo-600 bg-indigo-50 border-indigo-200', icon: <Truck size={16} />,        step: 4 },
  delivered:  { label: 'تم التسليم',     color: 'text-green-600 bg-green-50 border-green-200',    icon: <CheckCircle size={16} />,  step: 5 },
  cancelled:  { label: 'ملغي',           color: 'text-red-600 bg-red-50 border-red-200',          icon: <XCircle size={16} />,      step: 0 },
};

const STEPS = ['قيد المراجعة', 'تم التأكيد', 'جاري التجهيز', 'في الطريق', 'تم التسليم'];

function DeliveryBadge({ region }: { region?: string | null }) {
  const isRiyadh = region?.includes('رياض') || region?.toLowerCase().includes('riyadh');
  return (
    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
      <Truck size={13} />
      <span>{isRiyadh ? 'التوصيل خلال 24 ساعة داخل الرياض' : 'التوصيل خلال 2-5 أيام عمل'}</span>
    </div>
  );
}

export default function OrdersPage() {
  const { user } = useAuthStore();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');
  const [mounted, setMounted] = useState(false);
  const [trackNum, setTrackNum] = useState('');
  const [trackedOrder, setTrackedOrder] = useState<Order | null>(null);
  const [trackLoading, setTrackLoading] = useState(false);
  const [trackError, setTrackError] = useState('');
  const [cancellingId, setCancellingId] = useState<string | null>(null);

  const handleCancel = async (orderId: string) => {
    if (!confirm('هل أنت متأكد من إلغاء هذا الطلب؟')) return;
    setCancellingId(orderId);
    try {
      await ordersApi.cancel(orderId);
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: 'cancelled' } : o));
    } catch (err) {
      alert(err instanceof Error ? err.message : 'تعذّر إلغاء الطلب');
    } finally {
      setCancellingId(null);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;

    if (!user) {
      // Guest: load full order data saved locally at checkout
      try {
        const stored: Order[] = JSON.parse(localStorage.getItem('guest-orders') || '[]');
        setOrders(stored);
        setLoading(false);
        // Background refresh — only update status from API (keep local item/address data)
        if (stored.length > 0) {
          Promise.all(
            stored.map(o =>
              ordersApi.getByNumber(o.orderNumber)
                .then(r => ({ ...o, status: r.data.status, updatedAt: r.data.updatedAt }))
                .catch(() => o)
            )
          ).then(refreshed => {
            setOrders(refreshed as Order[]);
            localStorage.setItem('guest-orders', JSON.stringify(refreshed));
          });
        }
      } catch {
        setLoading(false);
      }
      return;
    }

    if (user.role !== 'user') {
      setLoading(false);
      setFetchError('not-user');
      return;
    }
    ordersApi.getMyOrders()
      .then(res => setOrders(res.data || []))
      .catch(err => {
        const msg = err instanceof Error ? err.message : '';
        if (msg.toLowerCase().includes('token') || msg.includes('401') || msg.includes('403')) {
          router.push('/account');
        } else {
          setFetchError('network');
        }
      })
      .finally(() => setLoading(false));
  }, [mounted, user, router]);

  if (!mounted) return null;

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-36 skeleton rounded-2xl" />)}
    </div>
  );

  if (fetchError === 'not-user') return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <Package size={48} className="mx-auto mb-4 text-slate-200" />
      <h2 className="text-xl font-bold text-slate-700 mb-2">هذه الصفحة للعملاء فقط</h2>
      <p className="text-slate-400 mb-6">سجّل دخول بحساب عميل لعرض طلباتك</p>
      <Link href="/account" className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-colors">
        تسجيل الدخول
      </Link>
    </div>
  );

  if (fetchError === 'network') return (
    <div className="max-w-3xl mx-auto px-4 py-20 text-center">
      <p className="text-slate-500 mb-4">تعذّر تحميل الطلبات</p>
      <button onClick={() => { setFetchError(''); setLoading(true); ordersApi.getMyOrders().then(r => setOrders(r.data || [])).catch(() => setFetchError('network')).finally(() => setLoading(false)); }}
        className="bg-amber-500 text-white px-6 py-2 rounded-xl font-bold hover:bg-amber-600">
        إعادة المحاولة
      </button>
    </div>
  );

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <Link href="/account" className="text-slate-400 hover:text-slate-600">
          <ArrowRight size={20} className="rotate-180" />
        </Link>
        <h1 className="text-2xl font-black text-slate-900">طلباتي</h1>
        <span className="text-slate-400 text-lg font-normal">({orders.length})</span>
      </div>

      {/* Guest login prompt */}
      {!user && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="font-bold text-slate-800 text-sm">سجّل دخول لحفظ طلباتك دائماً</p>
            <p className="text-slate-400 text-xs mt-0.5">الطلبات المعروضة محفوظة على هذا الجهاز فقط</p>
          </div>
          <Link href="/account" className="bg-amber-500 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-amber-600 transition-colors whitespace-nowrap">
            تسجيل الدخول
          </Link>
        </div>
      )}

      {/* Order number lookup */}
      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-5 mb-6">
        <h3 className="font-bold text-amber-800 text-sm mb-3 flex items-center gap-2">
          <Search size={15} /> تتبع طلب برقمه
        </h3>
        <div className="flex gap-2">
          <input
            value={trackNum}
            onChange={e => { setTrackNum(e.target.value.toUpperCase()); setTrackedOrder(null); setTrackError(''); }}
            placeholder="YS-20240101-1234"
            className="flex-1 border border-amber-200 bg-white rounded-xl px-4 py-2.5 text-sm ltr font-mono focus:outline-none focus:ring-2 focus:ring-amber-400"
          />
          <button
            disabled={!trackNum.trim() || trackLoading}
            onClick={async () => {
              setTrackLoading(true); setTrackError(''); setTrackedOrder(null);
              try {
                const r = await ordersApi.getByNumber(trackNum.trim());
                setTrackedOrder(r.data);
              } catch { setTrackError('رقم الطلب غير موجود'); }
              finally { setTrackLoading(false); }
            }}
            className="bg-amber-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-amber-600 disabled:opacity-50">
            {trackLoading ? '...' : 'بحث'}
          </button>
        </div>
        {trackError && <p className="text-red-500 text-xs mt-2">{trackError}</p>}
        {trackedOrder && (
          <div className="mt-3 bg-white rounded-xl p-4 border border-amber-100 text-sm">
            <div className="flex justify-between items-center">
              <span className="font-bold text-slate-900 ltr">{trackedOrder.orderNumber}</span>
              <span className={`px-2 py-1 rounded-full text-xs font-semibold border ${STATUS_MAP[trackedOrder.status]?.color || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                {STATUS_MAP[trackedOrder.status]?.label || trackedOrder.status}
              </span>
            </div>
            <p className="text-slate-500 text-xs mt-1">الإجمالي: {trackedOrder.totalAmount?.toFixed(2)} ر.س</p>
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-16">
          <Package size={56} className="mx-auto mb-4 text-slate-200" />
          {user ? (
            <>
              <h2 className="text-xl font-bold text-slate-700 mb-2">لا توجد طلبات مرتبطة بحسابك</h2>
              <p className="text-slate-400 text-sm mb-2">إذا طلبت بدون تسجيل دخول، ابحث برقم الطلب أعلاه</p>
            </>
          ) : (
            <>
              <h2 className="text-xl font-bold text-slate-700 mb-2">لا توجد طلبات على هذا الجهاز</h2>
              <p className="text-slate-400 text-sm mb-2">عند إتمام طلب تظهر هنا مباشرة، أو ابحث برقم الطلب أعلاه</p>
            </>
          )}
          <p className="text-slate-400 mb-6 text-sm">ابدأ تسوقك الآن!</p>
          <Link href="/products" className="bg-amber-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-amber-600 transition-colors">
            تسوق الآن
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {orders.map(order => {
            const status = STATUS_MAP[order.status] || STATUS_MAP.pending;
            const step = status.step;
            const isCancelled = order.status === 'cancelled';

            return (
              <div key={order._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
                {/* Order header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-slate-50">
                  <div>
                    <span className="text-xs text-slate-400">رقم الطلب</span>
                    <p className="font-bold text-slate-900 ltr text-sm">{order.orderNumber}</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {new Date(order.createdAt).toLocaleDateString('ar-SA', { year: 'numeric', month: 'long', day: 'numeric' })}
                    </p>
                  </div>
                  <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold ${status.color}`}>
                    {status.icon}
                    {status.label}
                  </div>
                </div>

                {/* Progress bar */}
                {!isCancelled && (
                  <div className="px-5 pt-4 pb-2">
                    <div className="flex items-center justify-between mb-2">
                      {STEPS.map((s, i) => (
                        <div key={s} className="flex flex-col items-center flex-1">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            i < step ? 'bg-amber-500 text-white' :
                            i === step - 1 ? 'bg-amber-500 text-white ring-4 ring-amber-100' :
                            'bg-slate-100 text-slate-400'
                          }`}>
                            {i < step ? '✓' : i + 1}
                          </div>
                          {i < STEPS.length - 1 && (
                            <div className="hidden sm:block absolute" />
                          )}
                        </div>
                      ))}
                    </div>
                    <div className="relative h-1.5 bg-slate-100 rounded-full mt-1">
                      <div
                        className="absolute top-0 right-0 h-full bg-gradient-to-l from-amber-500 to-amber-400 rounded-full transition-all duration-700"
                        style={{ width: `${Math.max(0, ((step - 1) / (STEPS.length - 1)) * 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1">
                      {STEPS.map((s, i) => (
                        <span key={s} className={`text-[10px] flex-1 text-center ${i < step ? 'text-amber-600 font-semibold' : 'text-slate-400'}`}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Delivery estimate */}
                {!isCancelled && order.status !== 'delivered' && (
                  <div className="px-5 pb-3">
                    <DeliveryBadge region={order.customerInfo?.address?.region} />
                  </div>
                )}

                {/* Items */}
                <div className="px-5 pb-4 space-y-2 mt-1">
                  {(order.items || []).slice(0, 3).map((item, i) => (
                    <div key={i} className="flex items-center gap-3 text-sm">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-lg flex-shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.nameAr || item.name} className="w-full h-full object-cover rounded-xl" />
                        ) : '📦'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 truncate">{item.nameAr || item.name}</p>
                        <p className="text-xs text-slate-400">الكمية: {item.quantity} {item.size ? `· مقاس ${item.size}` : ''}</p>
                      </div>
                      <span className="font-bold text-slate-800 text-sm">{(item.price * item.quantity).toFixed(0)} ر.س</span>
                    </div>
                  ))}
                  {(order.items || []).length > 3 && (
                    <p className="text-xs text-slate-400 text-center">+{order.items.length - 3} منتجات أخرى</p>
                  )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-100">
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      {order.paymentMethod === 'cod' ? '💵 الدفع عند الاستلام' : `💳 ${order.paymentMethod?.toUpperCase()}`}
                    </span>
                    {order.status === 'pending' && user && (
                      <button
                        onClick={() => handleCancel(order._id)}
                        disabled={cancellingId === order._id}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 disabled:opacity-50 border border-red-200 hover:border-red-400 px-2 py-1 rounded-lg transition-colors">
                        <Ban size={12} />
                        {cancellingId === order._id ? 'جاري الإلغاء...' : 'إلغاء الطلب'}
                      </button>
                    )}
                  </div>
                  <div className="font-black text-amber-600">
                    {order.totalAmount?.toFixed(2)} ر.س
                  </div>
                </div>

                {/* Return policy notice */}
                {order.status === 'delivered' && (
                  <div className="px-5 py-3 bg-amber-50 border-t border-amber-100 text-xs text-amber-700 flex items-center gap-2">
                    <span>⚠️</span>
                    <span>في حالة وجود عيب، يمكن الاستبدال خلال يومين من استلام الطلب. تواصل معنا عبر واتساب.</span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
