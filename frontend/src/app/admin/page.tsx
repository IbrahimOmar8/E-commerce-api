'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { statsApi } from '@/lib/api';
import type { DashboardStats } from '@/types';
import { ORDER_STATUS_LABELS } from '@/types';
import {
  TrendingUp, TrendingDown, ShoppingBag, Package,
  Users, Clock, DollarSign, BarChart3
} from 'lucide-react';

function StatCard({ label, value, sub, trend, icon: Icon, color }: {
  label: string; value: string; sub?: string;
  trend?: { value: number }; icon: React.ElementType; color: string;
}) {
  const isUp = (trend?.value ?? 0) >= 0;
  return (
    <div className="bg-white rounded-2xl p-5 border border-gray-100 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
          <Icon size={22} className="text-white" />
        </div>
        {trend !== undefined && (
          <div className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full ${isUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
            {isUp ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
            {Math.abs(trend.value)}%
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
      {sub && <div className="text-xs text-gray-400 mt-1">{sub}</div>}
    </div>
  );
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  confirmed: 'bg-blue-100 text-blue-700',
  processing: 'bg-indigo-100 text-indigo-700',
  shipped: 'bg-purple-100 text-purple-700',
  delivered: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsApi.get().then(r => setStats(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="w-12 h-12 skeleton rounded-xl mb-4" />
            <div className="h-7 skeleton rounded w-24 mb-2" />
            <div className="h-4 skeleton rounded w-32" />
          </div>
        ))}
      </div>
    </div>
  );

  if (!stats) return (
    <div className="text-center py-20 text-gray-500">
      <BarChart3 size={48} className="mx-auto mb-4 opacity-30" />
      <p>تعذر تحميل الإحصائيات</p>
    </div>
  );

  const { overview } = stats;

  return (
    <div className="space-y-6">
      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="إجمالي الطلبات"
          value={overview.totalOrders.toLocaleString('ar')}
          sub={`${overview.monthOrders} هذا الشهر`}
          trend={{ value: overview.ordersGrowth }}
          icon={ShoppingBag}
          color="bg-blue-500"
        />
        <StatCard
          label="إجمالي الإيرادات"
          value={`${overview.totalRevenue.toLocaleString('ar', { minimumFractionDigits: 0 })} ر.س`}
          sub={`${overview.monthRevenue.toLocaleString('ar', { minimumFractionDigits: 0 })} هذا الشهر`}
          trend={{ value: overview.revenueGrowth }}
          icon={DollarSign}
          color="bg-green-500"
        />
        <StatCard
          label="المنتجات"
          value={overview.totalProducts.toLocaleString('ar')}
          sub={`${overview.activeProducts} منتج نشط`}
          icon={Package}
          color="bg-amber-500"
        />
        <StatCard
          label="العملاء"
          value={overview.totalUsers.toLocaleString('ar')}
          icon={Users}
          color="bg-purple-500"
        />
      </div>

      {/* Pending alert */}
      {overview.pendingOrders > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="text-yellow-500" size={20} />
            <div>
              <p className="font-semibold text-yellow-800">لديك {overview.pendingOrders} طلب في انتظار المراجعة</p>
              <p className="text-sm text-yellow-600">يرجى مراجعة الطلبات الجديدة</p>
            </div>
          </div>
          <Link href="/admin/orders?status=pending"
            className="bg-yellow-500 hover:bg-yellow-600 text-white px-5 py-2 rounded-xl text-sm font-semibold transition-colors">
            عرض الطلبات
          </Link>
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Recent orders */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">آخر الطلبات</h3>
            <Link href="/admin/orders" className="text-amber-500 text-sm hover:text-amber-600">عرض الكل</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {stats.recentOrders.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">لا توجد طلبات بعد</div>
            ) : (
              stats.recentOrders.slice(0, 6).map(order => (
                <Link key={order._id} href={`/admin/orders/${order._id}`}
                  className="flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm text-gray-900 ltr">{order.orderNumber}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-600'}`}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {order.customerInfo?.name} • {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                  </div>
                  <span className="font-bold text-gray-900 text-sm flex-shrink-0">
                    {order.totalAmount?.toFixed(2)} ر.س
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>

        {/* Orders by status */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-bold text-gray-900">الطلبات حسب الحالة</h3>
          </div>
          <div className="p-5 space-y-3">
            {stats.ordersByStatus.map(s => {
              const total = stats.ordersByStatus.reduce((a, b) => a + b.count, 0);
              const pct = total > 0 ? (s.count / total * 100) : 0;
              return (
                <div key={s._id}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-700">{ORDER_STATUS_LABELS[s._id] || s._id}</span>
                    <span className="font-semibold">{s.count}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`h-2 rounded-full ${
                      s._id === 'delivered' ? 'bg-green-500' :
                      s._id === 'cancelled' ? 'bg-red-400' :
                      s._id === 'pending' ? 'bg-yellow-400' :
                      'bg-amber-500'
                    }`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Top products */}
          {stats.topProducts.length > 0 && (
            <div className="border-t border-gray-100 px-5 py-4">
              <h4 className="font-semibold text-gray-800 mb-3 text-sm">الأكثر مبيعاً</h4>
              <div className="space-y-2">
                {stats.topProducts.slice(0, 4).map((p, i) => (
                  <div key={p._id} className="flex items-center gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                    <span className="flex-1 text-gray-700 line-clamp-1">{p.name}</span>
                    <span className="font-semibold text-gray-900">{p.totalSold} قطعة</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'إضافة منتج', href: '/admin/products/new', icon: '📦', color: 'bg-amber-50 border-amber-200 text-amber-700' },
          { label: 'إضافة فئة', href: '/admin/categories', icon: '🏷️', color: 'bg-blue-50 border-blue-200 text-blue-700' },
          { label: 'إضافة ماركة', href: '/admin/brands', icon: '🏆', color: 'bg-purple-50 border-purple-200 text-purple-700' },
          { label: 'كود خصم جديد', href: '/admin/discount-codes', icon: '🎟️', color: 'bg-green-50 border-green-200 text-green-700' },
        ].map(a => (
          <Link key={a.href} href={a.href}
            className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-all hover:shadow-md ${a.color}`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="font-semibold text-sm">{a.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
