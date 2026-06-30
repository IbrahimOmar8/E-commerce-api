'use client';
import { useState, useEffect } from 'react';
import { usersApi } from '@/lib/api';
import type { User } from '@/types';
import { Search } from 'lucide-react';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string | number> = { page, limit: 20 };
    if (search) params.search = search;
    usersApi.getAll(params).then(r => {
      setUsers(r.data || []);
      setTotal(r.total || 0);
    }).finally(() => setLoading(false));
  }, [page, search]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">العملاء</h1>
          <p className="text-sm text-gray-500 mt-0.5">{total} عميل مسجل</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 p-4">
        <div className="relative">
          <Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input type="text" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            placeholder="ابحث عن عميل..." className="w-full border border-gray-200 rounded-xl pr-9 pl-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : users.length === 0 ? (
          <div className="p-12 text-center text-gray-400">لا يوجد عملاء</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">العميل</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">اسم المستخدم</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الهاتف</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الحالة</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">التسجيل</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {users.map(user => (
                <tr key={user._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-sm">
                        {user.fullName?.[0] || user.username?.[0] || '?'}
                      </div>
                      <span className="font-medium text-sm text-gray-900">{user.fullName}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-gray-600 ltr">{user.username}</span></td>
                  <td className="px-5 py-3"><span className="text-sm text-gray-600 ltr">{user.phone || '—'}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {user.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className="text-xs text-gray-500">{new Date(user.createdAt).toLocaleDateString('ar-SA')}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
