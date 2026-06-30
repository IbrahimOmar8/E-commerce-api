'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { ShoppingCart, User, Search, Menu, X, Heart, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { itemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState('');
  const router = useRouter();

  // Avoid hydration mismatch
  useEffect(() => { setCount(itemCount()); }, [itemCount]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className="bg-gray-900 text-white sticky top-0 z-50 shadow-lg">
      {/* Top bar */}
      <div className="bg-orange-500 text-white text-center text-sm py-1.5 px-4">
        شحن مجاني للطلبات فوق 200 ريال | توصيل لجميع مناطق المملكة
      </div>

      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-lg">
              يS
            </div>
            <div className="hidden sm:block">
              <div className="font-bold text-lg leading-none">يلا سبورت</div>
              <div className="text-xs text-gray-400">Yalla Sport</div>
            </div>
          </Link>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="ابحث عن منتج، ماركة، رياضة..."
                className="w-full bg-gray-800 text-white placeholder-gray-400 rounded-xl px-4 py-2.5 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <button type="submit" className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-orange-400">
                <Search size={18} />
              </button>
            </div>
          </form>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {/* Wishlist */}
            <Link href="/wishlist" className="p-2 hover:text-orange-400 transition-colors hidden sm:block">
              <Heart size={22} />
            </Link>

            {/* Cart */}
            <Link href="/cart" className="relative p-2 hover:text-orange-400 transition-colors">
              <ShoppingCart size={22} />
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                  {count > 9 ? '9+' : count}
                </span>
              )}
            </Link>

            {/* Account */}
            {user ? (
              <div className="relative group hidden sm:block">
                <button className="flex items-center gap-1.5 p-2 hover:text-orange-400 transition-colors">
                  <User size={22} />
                  <span className="text-sm">{user.fullName || user.username}</span>
                </button>
                <div className="absolute left-0 top-full mt-1 bg-white text-gray-800 rounded-xl shadow-xl py-2 w-48 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                  <Link href="/account" className="block px-4 py-2 hover:bg-orange-50 text-sm">حسابي</Link>
                  <Link href="/account/orders" className="block px-4 py-2 hover:bg-orange-50 text-sm">طلباتي</Link>
                  <button onClick={() => { logout(); router.push('/'); }} className="w-full text-right px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2">
                    <LogOut size={14} /> تسجيل الخروج
                  </button>
                </div>
              </div>
            ) : (
              <Link href="/account" className="hidden sm:flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 transition-colors rounded-xl px-4 py-2 text-sm font-medium">
                <User size={16} /> دخول
              </Link>
            )}

            {/* Mobile menu */}
            <button onClick={() => setMobileOpen(!mobileOpen)} className="sm:hidden p-2">
              {mobileOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Nav links */}
        <nav className="hidden sm:flex items-center gap-6 mt-3 text-sm border-t border-gray-700 pt-3">
          <Link href="/" className="hover:text-orange-400 transition-colors">الرئيسية</Link>
          <Link href="/products" className="hover:text-orange-400 transition-colors">جميع المنتجات</Link>
          <Link href="/products?gender=men" className="hover:text-orange-400 transition-colors">رجال</Link>
          <Link href="/products?gender=women" className="hover:text-orange-400 transition-colors">نساء</Link>
          <Link href="/products?gender=kids" className="hover:text-orange-400 transition-colors">أطفال</Link>
          <Link href="/products?productType=specialOffer" className="hover:text-orange-400 transition-colors text-orange-400 font-semibold">
            🔥 العروض
          </Link>
        </nav>
      </div>

      {/* Mobile menu drawer */}
      {mobileOpen && (
        <div className="sm:hidden bg-gray-800 px-4 py-4 border-t border-gray-700">
          <nav className="flex flex-col gap-3 text-sm">
            <Link href="/" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">الرئيسية</Link>
            <Link href="/products" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">جميع المنتجات</Link>
            <Link href="/products?gender=men" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">رجال</Link>
            <Link href="/products?gender=women" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">نساء</Link>
            <Link href="/products?gender=kids" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">أطفال</Link>
            <Link href="/wishlist" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">المفضلة</Link>
            <Link href="/account" onClick={() => setMobileOpen(false)} className="hover:text-orange-400">حسابي</Link>
            {user && (
              <button onClick={() => { logout(); setMobileOpen(false); }} className="text-right text-red-400">تسجيل الخروج</button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
