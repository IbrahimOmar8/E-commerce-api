'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import {
  LayoutDashboard, Package, ShoppingBag, Tag, Award,
  Ticket, Users, LogOut, Menu, X, ChevronLeft,
  MessageSquare, ShieldCheck, Dumbbell
} from 'lucide-react';

const NAV_ITEMS = [
  { href: '/admin', label: 'الرئيسية', icon: LayoutDashboard, exact: true },
  { href: '/admin/orders', label: 'الطلبات', icon: ShoppingBag },
  { href: '/admin/products', label: 'المنتجات', icon: Package },
  { href: '/admin/categories', label: 'الفئات', icon: Tag },
  { href: '/admin/brands', label: 'الماركات', icon: Award },
  { href: '/admin/sports', label: 'الرياضات', icon: Dumbbell },
  { href: '/admin/discount-codes', label: 'كودات الخصم', icon: Ticket },
  { href: '/admin/reviews', label: 'التقييمات', icon: MessageSquare },
  { href: '/admin/users', label: 'العملاء', icon: Users },
  { href: '/admin/admins', label: 'المديرون', icon: ShieldCheck },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, isAdmin, logout } = useAuthStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (mounted && pathname !== '/admin/login' && !isAdmin()) {
      router.push('/admin/login');
    }
  }, [mounted, pathname, isAdmin, router]);

  if (!mounted) return null;
  if (pathname === '/admin/login') return <>{children}</>;
  if (!isAdmin()) return null;

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex" dir="rtl">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed top-0 right-0 h-full w-60 bg-gray-900 text-white z-50 flex flex-col transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'
      } lg:static lg:translate-x-0`}>
        {/* Logo */}
        <div className="p-5 border-b border-gray-700">
          <div className="flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2.5">
              <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center font-bold text-white">CS</div>
              <div>
                <div className="font-bold text-white">كلاي سبورت</div>
                <div className="text-xs text-gray-400">لوحة التحكم</div>
              </div>
            </Link>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 p-3 overflow-y-auto">
          <div className="space-y-1">
            {NAV_ITEMS.map(item => {
              const Icon = item.icon;
              const active = isActive(item.href, item.exact);
              return (
                <Link key={item.href} href={item.href} onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    active ? 'bg-amber-500 text-white' : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}>
                  <Icon size={18} />
                  {item.label}
                  {active && <ChevronLeft size={14} className="mr-auto" />}
                </Link>
              );
            })}
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 bg-amber-500/20 rounded-full flex items-center justify-center text-amber-400 font-bold text-sm">
              {user?.username?.[0]?.toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.username}</p>
              <p className="text-xs text-gray-400">مدير النظام</p>
            </div>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3 py-2 text-gray-400 hover:text-red-400 hover:bg-gray-800 rounded-xl text-sm transition-colors">
            <LogOut size={16} /> تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top bar */}
        <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-4 sticky top-0 z-30">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 hover:bg-gray-100 rounded-lg">
            <Menu size={20} />
          </button>
          <h1 className="text-lg font-bold text-gray-900 flex-1">
            {NAV_ITEMS.find(n => isActive(n.href, n.exact))?.label || 'لوحة التحكم'}
          </h1>
          <Link href="/" target="_blank" className="text-sm text-amber-500 hover:text-amber-600 font-medium">
            عرض المتجر ←
          </Link>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
