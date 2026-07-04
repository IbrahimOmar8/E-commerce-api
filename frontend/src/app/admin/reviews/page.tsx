'use client';
import { useState, useEffect, useCallback } from 'react';
import { reviewsApi } from '@/lib/api';
import type { Review } from '@/types';
import { Star, Check, X, Trash2, MessageSquare } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all');

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = { page, limit: 20 };
      if (filter === 'pending') params.isApproved = 'false';
      if (filter === 'approved') params.isApproved = 'true';
      const res = await reviewsApi.getAll(params);
      setReviews(res.data || []);
      setTotal(res.total || 0);
      setPages(res.pages || 1);
    } finally {
      setLoading(false);
    }
  }, [page, filter]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleApprove = async (id: string, approve: boolean) => {
    try {
      await reviewsApi.approve(id, approve);
      fetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('حذف هذا التقييم؟')) return;
    try {
      await reviewsApi.delete(id);
      fetch();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الحذف');
    }
  };

  const pendingCount = reviews.filter(r => !r.isApproved).length;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">التقييمات</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} تقييم إجمالاً</p>
        </div>
        {pendingCount > 0 && (
          <span className="bg-yellow-100 text-yellow-700 text-sm font-semibold px-3 py-1.5 rounded-xl">
            {pendingCount} بانتظار الموافقة
          </span>
        )}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2">
        {[
          { key: 'all', label: 'الكل' },
          { key: 'pending', label: 'بانتظار الموافقة' },
          { key: 'approved', label: 'معتمد' },
        ].map(f => (
          <button key={f.key} onClick={() => { setFilter(f.key as typeof filter); setPage(1); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              filter === f.key ? 'bg-orange-500 text-white border-orange-500' : 'border-gray-200 text-gray-600 hover:border-orange-200'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : reviews.length === 0 ? (
          <div className="p-12 text-center">
            <MessageSquare size={48} className="mx-auto mb-3 text-gray-200" />
            <p className="text-gray-500">لا توجد تقييمات</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {reviews.map(review => (
              <div key={review._id} className="p-5">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm flex-shrink-0">
                    {review.user?.fullName?.[0] || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-sm text-gray-900">{review.user?.fullName}</span>
                      <span className="text-xs text-gray-400">@{review.user?.username}</span>
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star key={i} size={12} className={i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-200 fill-gray-200'} />
                        ))}
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${review.isApproved ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                        {review.isApproved ? 'معتمد' : 'بانتظار الموافقة'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-1.5">
                      المنتج: <span className="font-medium text-gray-700">{(review.product as unknown as { nameAr?: string; name?: string })?.nameAr || (review.product as unknown as { name?: string })?.name || review.product}</span>
                      {' · '}{new Date(review.createdAt).toLocaleDateString('ar-SA')}
                    </p>
                    {review.comment && (
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-xl px-4 py-2.5">{review.comment}</p>
                    )}
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    {!review.isApproved ? (
                      <button onClick={() => handleApprove(review._id, true)}
                        className="flex items-center gap-1 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-xl text-xs font-medium transition-colors">
                        <Check size={12} /> موافقة
                      </button>
                    ) : (
                      <button onClick={() => handleApprove(review._id, false)}
                        className="flex items-center gap-1 px-3 py-1.5 border border-yellow-300 text-yellow-600 hover:bg-yellow-50 rounded-xl text-xs font-medium transition-colors">
                        <X size={12} /> إلغاء الموافقة
                      </button>
                    )}
                    <button onClick={() => handleDelete(review._id)}
                      className="p-1.5 text-red-400 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="flex justify-center gap-2 p-4 border-t border-gray-100">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">السابق</button>
            <span className="px-4 py-2 text-sm text-gray-600">{page} / {pages}</span>
            <button disabled={page >= pages} onClick={() => setPage(p => p + 1)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm disabled:opacity-40">التالي</button>
          </div>
        )}
      </div>
    </div>
  );
}
