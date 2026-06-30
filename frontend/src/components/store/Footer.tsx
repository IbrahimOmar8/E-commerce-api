'use client';
import Link from 'next/link';
import { useLanguage } from '@/contexts/language';

export default function Footer() {
  const { t, isRTL } = useLanguage();

  return (
    <footer className="bg-[#0a0f1e] text-slate-400 mt-auto border-t border-white/5">
      {/* Newsletter strip */}
      <div className="bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-bold text-xl">{t('newsletterTitle')}</h3>
              <p className="text-orange-100 text-sm mt-1">{t('newsletterDesc')}</p>
            </div>
            <div className="flex gap-2 w-full md:w-auto">
              <input
                type="email"
                placeholder={t('emailPlaceholder')}
                className="flex-1 md:w-72 bg-white/20 backdrop-blur text-white placeholder-orange-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:bg-white/30 border border-white/20"
              />
              <button className="bg-white text-orange-600 font-bold px-6 py-3 rounded-xl hover:bg-orange-50 transition-colors text-sm whitespace-nowrap">
                {t('subscribe')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main footer */}
      <div className="max-w-7xl mx-auto px-4 py-14">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <Link href="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-orange-500/30">
                Y
              </div>
              <div>
                <div className="font-black text-white text-lg">{isRTL ? 'يلا سبورت' : 'Yalla Sport'}</div>
                <div className="text-[10px] text-orange-400 tracking-widest uppercase">{isRTL ? 'Yalla Sport' : 'يلا سبورت'}</div>
              </div>
            </Link>
            <p className="text-sm text-slate-500 leading-relaxed">{t('footerTagline')}</p>

            {/* Social */}
            <div className="mt-6 flex gap-2.5">
              {[
                { icon: '𝕏', label: 'Twitter' },
                { icon: '📸', label: 'Instagram' },
                { icon: '▶', label: 'YouTube' },
                { icon: '📘', label: 'Facebook' },
              ].map(s => (
                <a
                  key={s.label}
                  href="#"
                  aria-label={s.label}
                  className="w-9 h-9 bg-white/5 hover:bg-orange-500 border border-white/10 hover:border-orange-500 transition-all rounded-xl flex items-center justify-center text-sm"
                >
                  {s.icon}
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">{t('quickLinks')}</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '/products', label: t('allProducts') },
                { href: '/products?productType=bestSeller', label: t('bestSellers') },
                { href: '/products?productType=specialOffer', label: t('offers') },
                { href: '/products?productType=featured', label: t('featuredProducts') },
                { href: '/products?gender=men', label: t('men') },
                { href: '/products?gender=women', label: t('women') },
              ].map(item => (
                <li key={item.href}>
                  <Link href={item.href} className="text-slate-500 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-orange-500 transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Customer Service */}
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">{t('customerService')}</h4>
            <ul className="space-y-3 text-sm">
              {[
                { href: '#', label: t('contactUs') },
                { href: '#', label: t('returnPolicy') },
                { href: '#', label: t('privacyPolicy') },
                { href: '#', label: t('faq') },
              ].map(item => (
                <li key={item.label}>
                  <Link href={item.href} className="text-slate-500 hover:text-orange-400 transition-colors flex items-center gap-2 group">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-700 group-hover:bg-orange-500 transition-colors" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-bold text-white mb-5 text-sm uppercase tracking-wider">{t('contactUs')}</h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <span className="text-orange-500">📱</span>
                <span className="ltr text-slate-400">+966 50 000 0000</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-orange-500">📧</span>
                <span className="ltr text-slate-400">info@yallasport.sa</span>
              </li>
              <li className="flex items-center gap-3">
                <span className="text-orange-500">📍</span>
                <span className="text-slate-400">{isRTL ? 'الرياض، المملكة العربية السعودية' : 'Riyadh, Saudi Arabia'}</span>
              </li>
            </ul>

            {/* Live chat badge */}
            <div className="mt-5 flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
              <div className="pulse-dot" />
              <span className="text-xs text-slate-400">{isRTL ? 'الدعم متاح الآن' : 'Support is online'}</span>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 mt-12 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-600">{t('allRights')}</p>
          <div className="flex items-center gap-2">
            {['مدى', 'Visa', 'STC Pay', 'Apple Pay', 'COD'].map(m => (
              <span key={m} className="text-xs bg-white/5 border border-white/10 text-slate-500 px-2.5 py-1.5 rounded-lg font-medium">
                {m}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
