'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { useLanguage } from '@/contexts/language';
import { ShoppingCart, User, Search, Menu, X, Heart, LogOut, ChevronDown } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function Header() {
  const { itemCount } = useCartStore();
  const { user, logout } = useAuthStore();
  const { lang, setLang, t, isRTL } = useLanguage();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [search, setSearch] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();

  useEffect(() => { setCount(itemCount()); }, [itemCount]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (search.trim()) router.push(`/products?search=${encodeURIComponent(search)}`);
  };

  return (
    <header className={`sticky top-0 z-50 transition-all duration-300 ${scrolled ? 'shadow-xl' : ''}`}>
      {/* Top announcement bar */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500 text-white text-center text-xs py-2 px-4 font-medium tracking-wide">
        {t('topBar')}
      </div>

      {/* Main header */}
      <div className="bg-[#0f172a] header-blur border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 py-3.5">
          <div className="flex items-center gap-4">

            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-orange-500/30 group-hover:scale-105 transition-transform">
                Y
              </div>
              <div className="hidden sm:block">
                <div className="font-black text-white text-lg leading-tight">
                  {isRTL ? 'يلا سبورت' : 'Yalla Sport'}
                </div>
                <div className="text-[10px] text-orange-400 font-semibold tracking-widest uppercase">
                  {isRTL ? 'Yalla Sport' : 'يلا سبورت'}
                </div>
              </div>
            </Link>

            {/* Search */}
            <form onSubmit={handleSearch} className="flex-1 max-w-xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder={t('searchPlaceholder')}
                  className="w-full bg-white/8 text-white placeholder-slate-400 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:bg-white/12 transition-all border border-white/10"
                  style={{ background: 'rgba(255,255,255,0.07)' }}
                />
                <button
                  type="submit"
                  className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-orange-400 transition-colors"
                  style={{ [isRTL ? 'left' : 'right']: '12px' }}
                >
                  <Search size={17} />
                </button>
              </div>
            </form>

            {/* Right actions */}
            <div className="flex items-center gap-1">

              {/* Language toggle */}
              <button
                onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
                className="hidden sm:flex items-center gap-1 px-3 py-1.5 rounded-lg border border-white/15 text-xs font-bold text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-all"
              >
                {lang === 'ar' ? 'EN' : 'عر'}
              </button>

              {/* Wishlist */}
              <Link
                href="/wishlist"
                className="hidden sm:flex p-2.5 text-slate-300 hover:text-orange-400 transition-colors rounded-xl hover:bg-white/5"
                title={t('wishlist')}
              >
                <Heart size={21} />
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2.5 text-slate-300 hover:text-orange-400 transition-colors rounded-xl hover:bg-white/5"
              >
                <ShoppingCart size={21} />
                {count > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-gradient-to-br from-orange-500 to-orange-600 text-white text-[10px] rounded-full w-5 h-5 flex items-center justify-center font-black shadow-lg shadow-orange-500/40">
                    {count > 9 ? '9+' : count}
                  </span>
                )}
              </Link>

              {/* Account */}
              {user ? (
                <div className="relative group hidden sm:block">
                  <button className="flex items-center gap-2 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/5 transition-all">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-xs font-black">
                      {(user.fullName || user.username || 'U')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium">{(user.fullName || user.username || '').split(' ')[0]}</span>
                    <ChevronDown size={14} className="text-slate-400" />
                  </button>
                  <div className="absolute top-full mt-2 bg-white rounded-2xl shadow-2xl py-2 w-52 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 border border-gray-100"
                    style={{ [isRTL ? 'left' : 'right']: 0 }}>
                    <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 text-sm text-gray-700 hover:text-orange-600 transition-colors">
                      <User size={15} /> {t('account')}
                    </Link>
                    <Link href="/account" className="flex items-center gap-2.5 px-4 py-2.5 hover:bg-orange-50 text-sm text-gray-700 hover:text-orange-600 transition-colors">
                      <ShoppingCart size={15} /> {t('myOrders')}
                    </Link>
                    <div className="border-t border-gray-100 mt-1 pt-1">
                      <button
                        onClick={() => { logout(); router.push('/'); }}
                        className="w-full flex items-center gap-2.5 px-4 py-2.5 hover:bg-red-50 text-sm text-red-500 hover:text-red-600 transition-colors"
                        style={{ textAlign: isRTL ? 'right' : 'left' }}
                      >
                        <LogOut size={15} /> {t('logout')}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <Link
                  href="/account"
                  className="hidden sm:flex items-center gap-2 btn-primary px-5 py-2.5 text-sm"
                >
                  <User size={15} /> {t('login')}
                </Link>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="sm:hidden p-2.5 text-slate-300 hover:text-white rounded-xl hover:bg-white/5"
              >
                {mobileOpen ? <X size={22} /> : <Menu size={22} />}
              </button>
            </div>
          </div>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 mt-3 pt-3 border-t border-white/5">
            {[
              { href: '/', label: t('home') },
              { href: '/products', label: t('allProducts') },
              { href: '/products?gender=men', label: t('men') },
              { href: '/products?gender=women', label: t('women') },
              { href: '/products?gender=kids', label: t('kids') },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                className="px-3.5 py-1.5 text-sm text-slate-300 hover:text-white hover:bg-white/8 rounded-lg transition-all font-medium"
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/products?productType=specialOffer"
              className="px-3.5 py-1.5 text-sm text-orange-400 hover:text-orange-300 hover:bg-orange-500/10 rounded-lg transition-all font-bold"
            >
              {t('offers')}
            </Link>
          </nav>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="sm:hidden bg-[#0f172a] border-t border-white/5 px-4 py-5">
          <nav className="flex flex-col gap-1 text-sm mb-4">
            {[
              { href: '/', label: t('home') },
              { href: '/products', label: t('allProducts') },
              { href: '/products?gender=men', label: t('men') },
              { href: '/products?gender=women', label: t('women') },
              { href: '/products?gender=kids', label: t('kids') },
              { href: '/products?productType=specialOffer', label: t('offers') },
              { href: '/wishlist', label: t('wishlist') },
              { href: '/account', label: t('account') },
            ].map(item => (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className="px-3 py-2.5 text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition-all"
              >
                {item.label}
              </Link>
            ))}
            {user && (
              <button
                onClick={() => { logout(); setMobileOpen(false); }}
                className="px-3 py-2.5 text-red-400 hover:bg-red-500/10 rounded-xl transition-all text-right"
              >
                {t('logout')}
              </button>
            )}
          </nav>
          <div className="flex items-center justify-between pt-3 border-t border-white/5">
            <span className="text-slate-400 text-xs">{lang === 'ar' ? 'اللغة' : 'Language'}</span>
            <button
              onClick={() => setLang(lang === 'ar' ? 'en' : 'ar')}
              className="flex items-center gap-2 px-4 py-2 border border-white/15 rounded-xl text-sm font-bold text-slate-300 hover:border-orange-500 hover:text-orange-400 transition-all"
            >
              {lang === 'ar' ? '🇺🇸 English' : '🇸🇦 عربي'}
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
