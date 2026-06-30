'use client';
import { use, useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ordersApi } from '@/lib/api';
import type { Order } from '@/types';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS, SAUDI_REGIONS } from '@/types';
import { ArrowRight, Phone, MapPin, Package, Truck } from 'lucide-react';

const STATUS_STEPS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered'];
const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState('');

  useEffect(() => {
    ordersApi.getOne(id).then(r => {
      setOrder(r.data);
      setSelectedStatus(r.data.status);
    }).finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async () => {
    if (!order || selectedStatus === order.status) return;
    setUpdating(true);
    try {
      await ordersApi.updateStatus(id, selectedStatus);
      setOrder(prev => prev ? { ...prev, status: selectedStatus as Order['status'] } : null);
      alert('تم تحديث حالة الطلب');
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في التحديث');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">جاري التحميل...</div>;
  if (!order) return (
    <div className="text-center py-20">
      <p className="text-gray-500">الطلب غير موجود</p>
      <Link href="/admin/orders" className="mt-4 inline-block bg-orange-500 text-white px-6 py-2 rounded-xl text-sm">
        العودة للطلبات
      </Link>
    </div>
  );

  const regionLabel = SAUDI_REGIONS.find(r => r.value === order.customerInfo.address?.region)?.label;
  const stepIndex = STATUS_STEPS.indexOf(order.status);
  const isCancelled = order.status === 'cancelled';

  return (
    <div className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link href="/admin/orders" className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
          <ArrowRight size={20} />
        </Link>
        <div>
          <h1 className="text-xl font-bold text-gray-900 ltr">{order.orderNumber}</h1>
          <p className="text-sm text-gray-500">{new Date(order.createdAt).toLocaleDateString('ar-SA', { dateStyle: 'full' })}</p>
        </div>
        <span className={`mr-auto text-sm font-medium px-4 py-1.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
          {ORDER_STATUS_LABELS[order.status]}
        </span>
      </div>

      {/* Progress tracker */}
      {!isCancelled && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 right-0 left-0 h-0.5 bg-gray-200 mx-10" />
            <div className={`absolute top-4 right-0 h-0.5 bg-orange-500 mx-10 transition-all`}
              style={{ width: stepIndex >= 0 ? `${(stepIndex / (STATUS_STEPS.length - 1)) * 100}%` : '0%' }} />
            {STATUS_STEPS.map((s, i) => (
              <div key={s} className="relative flex flex-col items-center z-10">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm ${
                  i <= stepIndex ? 'bg-orange-500 text-white' : 'bg-gray-100 text-gray-400'
                }`}>
                  {i < stepIndex ? '✓' : i + 1}
                </div>
                <span className={`text-xs mt-2 font-medium ${i <= stepIndex ? 'text-orange-600' : 'text-gray-400'}`}>
                  {ORDER_STATUS_LABELS[s]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-5">
        {/* Customer info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Phone size={16} className="text-orange-500" /> بيانات العميل
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">الاسم</span>
              <span className="font-medium">{order.customerInfo.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">الجوال</span>
              <span className="font-medium ltr">{order.customerInfo.phone}</span>
            </div>
            {order.customerInfo.email && (
              <div className="flex justify-between">
                <span className="text-gray-500">البريد</span>
                <span className="font-medium ltr">{order.customerInfo.email}</span>
              </div>
            )}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <MapPin size={16} className="text-orange-500" /> عنوان التوصيل
          </h3>
          <div className="space-y-2 text-sm">
            {regionLabel && <div className="flex justify-between"><span className="text-gray-500">المنطقة</span><span className="font-medium">{regionLabel}</span></div>}
            {order.customerInfo.address?.city && <div className="flex justify-between"><span className="text-gray-500">المدينة</span><span className="font-medium">{order.customerInfo.address.city}</span></div>}
            {order.customerInfo.address?.street && <div className="flex justify-between"><span className="text-gray-500">الحي/الشارع</span><span className="font-medium">{order.customerInfo.address.street}</span></div>}
          </div>
        </div>
      </div>

      {/* Items */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 flex items-center gap-2">
            <Package size={16} className="text-orange-500" /> المنتجات ({order.items.length})
          </h3>
        </div>
        <div className="divide-y divide-gray-50">
          {order.items.map((item, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4">
              {item.image ? (
                <Image src={item.image} alt={item.nameAr || item.name || ''} width={56} height={56} className="rounded-xl object-cover" />
              ) : (
                <div className="w-14 h-14 bg-gray-100 rounded-xl flex items-center justify-center text-2xl">👟</div>
              )}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900">{item.nameAr || item.name}</p>
                {item.size && <p className="text-xs text-gray-500 mt-0.5">المقاس: {item.size}</p>}
              </div>
              <div className="text-left">
                <p className="font-bold text-sm">{(item.price * item.quantity).toFixed(2)} ر.س</p>
                <p className="text-xs text-gray-400">{item.price.toFixed(2)} × {item.quantity}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="border-t border-gray-100 px-5 py-4 bg-gray-50">
          <div className="space-y-2 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>المجموع الفرعي</span><span>{order.subtotal?.toFixed(2)} ر.س</span>
            </div>
            {order.discountAmount > 0 && <div className="flex justify-between text-green-600">
              <span>خصم {order.discountCode && `(${order.discountCode})`}</span>
              <span>-{order.discountAmount?.toFixed(2)} ر.س</span>
            </div>}
            <div className="flex justify-between text-gray-600">
              <span>الشحن</span>
              <span>{order.deliveryFee === 0 ? 'مجاني' : `${order.deliveryFee?.toFixed(2)} ر.س`}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>ضريبة 15%</span><span>{order.vat?.toFixed(2)} ر.س</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t pt-2 mt-2">
              <span>الإجمالي</span>
              <span className="text-orange-600">{order.totalAmount?.toFixed(2)} ر.س</span>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-500 flex items-center gap-2">
            <Truck size={13} />
            <span>طريقة الدفع: {PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
            <span>•</span>
            <span className={order.paymentStatus === 'paid' ? 'text-green-600' : 'text-yellow-600'}>
              {order.paymentStatus === 'paid' ? 'مدفوع' : 'في انتظار الدفع'}
            </span>
          </div>
        </div>
      </div>

      {/* Update status */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5">
        <h3 className="font-bold text-gray-900 mb-4">تحديث حالة الطلب</h3>
        <div className="flex gap-3">
          <select value={selectedStatus} onChange={e => setSelectedStatus(e.target.value)}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
            {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{l}</option>
            ))}
          </select>
          <button onClick={handleUpdateStatus} disabled={updating || selectedStatus === order.status}
            className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors">
            {updating ? 'جاري الحفظ...' : 'حفظ'}
          </button>
        </div>
        {order.notes && (
          <div className="mt-4 bg-blue-50 rounded-xl p-3 text-sm text-blue-700">
            <span className="font-semibold">ملاحظة العميل: </span>{order.notes}
          </div>
        )}
      </div>
    </div>
  );
}
