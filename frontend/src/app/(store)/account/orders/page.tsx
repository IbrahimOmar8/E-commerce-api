'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { ordersApi } from '@/lib/api';
import type { Order } from '@/types';
import { Package, Clock, CheckCircle, Truck, XCircle, ArrowRight } from 'lucide-react';

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
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!user) { router.push('/account'); return; }
    ordersApi.getMyOrders()
      .then(res => setOrders(res.data || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [mounted, user, router]);

  if (!mounted) return null;

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 py-16 space-y-4">
      {[1, 2, 3].map(i => <div key={i} className="h-36 skeleton rounded-2xl" />)}
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

      {orders.length === 0 ? (
        <div className="text-center py-20">
          <Package size={56} className="mx-auto mb-4 text-slate-200" />
          <h2 className="text-xl font-bold text-slate-700 mb-2">لا توجد طلبات بعد</h2>
          <p className="text-slate-400 mb-6">ابدأ تسوقك الآن!</p>
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
                  <div className="text-xs text-slate-500">
                    {order.paymentMethod === 'cod' ? '💵 الدفع عند الاستلام' : `💳 ${order.paymentMethod?.toUpperCase()}`}
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
