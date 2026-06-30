'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/auth';
import { authApi } from '@/lib/api';
import { User, ShoppingBag, Heart, LogOut } from 'lucide-react';

export default function AccountPage() {
  const { user, setAuth, logout } = useAuthStore();
  const router = useRouter();
  const [tab, setTab] = useState<'login' | 'signup'>('login');
  const [form, setForm] = useState({ username: '', password: '', fullName: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await authApi.userLogin({ username: form.username, password: form.password });
      setAuth({ id: res.user.id, username: res.user.username, fullName: res.user.fullName, role: 'user' }, res.token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'بيانات غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.username || !form.password) { setError('جميع الحقول مطلوبة'); return; }
    if (form.password.length < 6) { setError('كلمة المرور يجب أن تكون 6 أحرف على الأقل'); return; }
    setLoading(true);
    setError('');
    try {
      await authApi.signup({ username: form.username, fullName: form.fullName, password: form.password });
      setSuccess('تم إنشاء حسابك! يمكنك الآن تسجيل الدخول.');
      setTab('login');
      setForm(p => ({ ...p, password: '' }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  };

  if (user) return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      <div className="bg-white rounded-3xl border border-gray-100 p-8 mb-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-600 font-bold text-2xl">
            {(user.fullName || user.username)?.[0]?.toUpperCase()}
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-900">{user.fullName || user.username}</h2>
            <p className="text-gray-500 text-sm">@{user.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <Link href="/account/orders"
            className="flex flex-col items-center gap-2 p-4 bg-orange-50 rounded-2xl hover:bg-orange-100 transition-colors">
            <ShoppingBag className="text-orange-500" size={24} />
            <span className="text-sm font-medium text-gray-700">طلباتي</span>
          </Link>
          <Link href="/wishlist"
            className="flex flex-col items-center gap-2 p-4 bg-red-50 rounded-2xl hover:bg-red-100 transition-colors">
            <Heart className="text-red-500" size={24} />
            <span className="text-sm font-medium text-gray-700">المفضلة</span>
          </Link>
          <button onClick={() => { logout(); router.push('/'); }}
            className="flex flex-col items-center gap-2 p-4 bg-gray-50 rounded-2xl hover:bg-gray-100 transition-colors">
            <LogOut className="text-gray-500" size={24} />
            <span className="text-sm font-medium text-gray-700">خروج</span>
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center text-orange-500 mx-auto mb-4">
          <User size={32} />
        </div>
        <h1 className="text-2xl font-bold text-gray-900">حسابي</h1>
        <p className="text-gray-500 text-sm mt-1">سجل دخولك أو أنشئ حساباً جديداً</p>
      </div>

      <div className="bg-white rounded-3xl border border-gray-100 p-6">
        {/* Tabs */}
        <div className="flex bg-gray-100 rounded-xl p-1 mb-6">
          <button onClick={() => { setTab('login'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'login' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            تسجيل الدخول
          </button>
          <button onClick={() => { setTab('signup'); setError(''); setSuccess(''); }}
            className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${tab === 'signup' ? 'bg-white shadow text-gray-900' : 'text-gray-500 hover:text-gray-700'}`}>
            حساب جديد
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
        {success && <div className="bg-green-50 border border-green-200 text-green-700 text-sm px-4 py-3 rounded-xl mb-4">{success}</div>}

        {tab === 'login' ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="username" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-colors">
              {loading ? 'جاري الدخول...' : 'تسجيل الدخول'}
            </button>
          </form>
        ) : (
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل</label>
              <input value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))}
                placeholder="محمد عبدالله" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم</label>
              <input value={form.username} onChange={e => setForm(p => ({ ...p, username: e.target.value }))}
                placeholder="username" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور (6 أحرف على الأقل)</label>
              <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                placeholder="••••••••" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <button type="submit" disabled={loading}
              className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-2xl transition-colors">
              {loading ? 'جاري الإنشاء...' : 'إنشاء الحساب'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
