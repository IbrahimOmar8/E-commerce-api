'use client';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ordersApi } from '@/lib/api';
import type { Order } from '@/types';
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '@/types';
import { Search, Filter, Eye, RefreshCw } from 'lucide-react';

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  confirmed: 'bg-blue-100 text-blue-700 border-blue-200',
  processing: 'bg-indigo-100 text-indigo-700 border-indigo-200',
  shipped: 'bg-purple-100 text-purple-700 border-purple-200',
  delivered: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
};

export default function AdminOrdersPage() {
  const searchParams = useSearchParams();
  const [orders, setOrders] = useState<Order[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [page, setPage] = useState(1);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (search) params.search = search;
      if (status) params.status = status;
      const res = await ordersApi.getAll(params);
      setOrders(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, search, status]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleQuickStatus = async (orderId: string, newStatus: string) => {
    try {
      await ordersApi.updateStatus(orderId, newStatus);
      fetchOrders();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في التحديث');
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">الطلبات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} طلب إجمالاً</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 border border-gray-200 rounded-xl px-4 py-2 text-sm hover:bg-gray-50">
          <RefreshCw size={14} /> تحديث
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              placeholder="ابحث برقم الطلب، الاسم، الجوال..."
              className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => { setStatus(''); setPage(1); }}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${!status ? 'bg-gray-900 text-white border-gray-900' : 'border-gray-200 text-gray-600 hover:border-gray-300'}`}>
              الكل
            </button>
            {Object.entries(ORDER_STATUS_LABELS).map(([val, label]) => (
              <button key={val} onClick={() => { setStatus(val); setPage(1); }}
                className={`px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${status === val ? 'bg-amber-500 text-white border-amber-500' : 'border-gray-200 text-gray-600 hover:border-amber-200'}`}>
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center">
            <div className="text-4xl mb-3">📦</div>
            <p className="text-gray-500">لا توجد طلبات</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">رقم الطلب</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">العميل</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">المبلغ</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">الدفع</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">الحالة</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">التاريخ</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">إجراء</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {orders.map(order => (
                  <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3">
                      <span className="font-mono text-sm font-semibold text-gray-900 ltr">{order.orderNumber}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{order.customerInfo?.name}</p>
                        <p className="text-xs text-gray-400 ltr">{order.customerInfo?.phone}</p>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-gray-900 text-sm">{order.totalAmount?.toFixed(2)} ر.س</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-600">{PAYMENT_METHOD_LABELS[order.paymentMethod] || order.paymentMethod}</span>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={order.status}
                        onChange={e => handleQuickStatus(order._id, e.target.value)}
                        className={`text-xs font-medium px-2.5 py-1.5 rounded-lg border cursor-pointer focus:outline-none ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600 border-gray-200'}`}
                      >
                        {Object.entries(ORDER_STATUS_LABELS).map(([v, l]) => (
                          <option key={v} value={v}>{l}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-xs text-gray-500">
                        {new Date(order.createdAt).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/orders/${order._id}`}
                        className="flex items-center gap-1.5 text-amber-500 hover:text-amber-600 text-sm font-medium">
                        <Eye size={14} /> تفاصيل
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              السابق
            </button>
            <span className="px-4 py-2 text-sm text-gray-600">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40 hover:bg-gray-50">
              التالي
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
