'use client';
import { useState, useEffect } from 'react';
import { adminsApi } from '@/lib/api';
import { Plus, Trash2, Shield, X, Check } from 'lucide-react';

interface AdminUser {
  _id: string;
  username: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const DEFAULT_FORM = { username: '', email: '', password: '', role: 'admin' };

export default function AdminAdminsPage() {
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchAdmins = () => {
    setLoading(true);
    adminsApi.getAll().then(r => setAdmins(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchAdmins(); }, []);

  const handleCreate = async () => {
    if (!form.username || !form.password) { setError('اسم المستخدم وكلمة المرور مطلوبان'); return; }
    setSaving(true);
    setError('');
    try {
      await adminsApi.create(form);
      setForm({ ...DEFAULT_FORM });
      setShowForm(false);
      fetchAdmins();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الإنشاء');
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id: string, username: string) => {
    if (!confirm(`إلغاء تفعيل "${username}"؟`)) return;
    try {
      await adminsApi.deactivate(id);
      fetchAdmins();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">المديرون</h1>
          <p className="text-sm text-gray-500 mt-0.5">{admins.length} مدير</p>
        </div>
        <button onClick={() => { setShowForm(true); setError(''); setForm({ ...DEFAULT_FORM }); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> إضافة مدير
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">إضافة مدير جديد</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم *</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="admin2" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <input value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="admin@example.com" dir="ltr" type="email"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور *</label>
              <input value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" dir="ltr" type="password"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الصلاحية</label>
              <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500">
                <option value="admin">مدير</option>
                <option value="super-admin">مدير أعلى</option>
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={handleCreate} disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              <Check size={16} /> {saving ? 'جاري الإنشاء...' : 'إنشاء'}
            </button>
            <button onClick={() => setShowForm(false)}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">المدير</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">البريد</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الصلاحية</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الحالة</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {admins.map(admin => (
                <tr key={admin._id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-amber-100 rounded-full flex items-center justify-center">
                        <Shield size={16} className="text-amber-500" />
                      </div>
                      <span className="font-medium text-sm text-gray-900 ltr">{admin.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3"><span className="text-sm text-gray-500 ltr">{admin.email || '—'}</span></td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${admin.role === 'super-admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                      {admin.role === 'super-admin' ? 'مدير أعلى' : 'مدير'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full ${admin.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                      {admin.isActive ? 'نشط' : 'موقوف'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    {admin.isActive && (
                      <button onClick={() => handleDeactivate(admin._id, admin.username)}
                        className="flex items-center gap-1 px-3 py-1.5 text-red-400 hover:bg-red-50 border border-red-200 rounded-xl text-xs transition-colors">
                        <Trash2 size={12} /> إلغاء التفعيل
                      </button>
                    )}
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
