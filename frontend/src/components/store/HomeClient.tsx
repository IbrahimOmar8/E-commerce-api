'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProductCard from '@/components/store/ProductCard';
import { useLanguage } from '@/contexts/language';
import type { Product, Category, Brand, Sport } from '@/types';
import { ArrowLeft, ArrowRight, Zap, RotateCcw, Shield, Headphones } from 'lucide-react';

interface Props {
  featured: Product[];
  bestSellers: Product[];
  categories: Category[];
  brands: Brand[];
  offers: Product[];
  sports: Sport[];
}

export default function HomeClient({ featured, bestSellers, categories, brands, offers, sports }: Props) {
  const { t, isRTL, lang } = useLanguage();

  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right');
    const observer = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
      }),
      { threshold: 0.12 }
    );
    els.forEach(el => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const features = [
    { icon: <Zap size={18} />, label: t('fastShipping') },
    { icon: <RotateCcw size={18} />, label: t('freeReturn') },
    { icon: <Shield size={18} />, label: t('securePay') },
    { icon: <Headphones size={18} />, label: t('support') },
  ];

  return (
    <div className="min-h-screen">
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[#070d1a]" style={{ minHeight: '90vh' }}>
        {/* Animated blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="blob blob-1 absolute -top-32 -end-32 w-[500px] h-[500px] bg-amber-600/20" />
          <div className="blob blob-2 absolute top-1/2 start-1/4 w-[300px] h-[300px] bg-amber-500/15" />
          <div className="blob blob-3 absolute -bottom-20 end-1/3 w-[400px] h-[400px] bg-amber-700/10" />
          {/* Grid overlay */}
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.04) 1px, transparent 0)',
            backgroundSize: '40px 40px'
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 py-24 md:py-36 flex flex-col lg:flex-row items-center gap-16">
          {/* Text */}
          <div className="flex-1 text-center lg:text-start fade-in">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 text-sm px-5 py-2 rounded-full mb-8 backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              {t('heroBadge')}
            </div>

            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-white leading-[1.1] mb-6 tracking-tight">
              {t('heroTitle1')}
              <br />
              <span className="text-gradient">{t('heroTitle2')}</span>
            </h1>

            <p className="text-lg text-slate-400 max-w-lg mb-10 leading-relaxed mx-auto lg:mx-0">
              {t('heroDesc')}
            </p>

            <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
              <Link
                href="/products"
                className="btn-primary px-8 py-4 text-base rounded-2xl inline-flex items-center gap-2"
              >
                {t('shopNow')}
                <ArrowIcon size={18} />
              </Link>
              <Link
                href="/products?productType=specialOffer"
                className="px-8 py-4 text-base rounded-2xl inline-flex items-center gap-2 border border-white/20 text-white hover:bg-white/5 transition-all font-semibold backdrop-blur-sm"
              >
                {t('specialOffers')}
              </Link>
            </div>

            {/* Stats */}
            <div className="flex flex-wrap gap-8 justify-center lg:justify-start mt-14 pt-8 border-t border-white/10">
              {[
                { value: '+500', label: lang === 'ar' ? 'منتج رياضي' : 'Sports Products' },
                { value: '+20', label: lang === 'ar' ? 'ماركة عالمية' : 'Global Brands' },
                { value: '+10K', label: lang === 'ar' ? 'عميل راضٍ' : 'Happy Customers' },
              ].map(stat => (
                <div key={stat.value} className="count-anim">
                  <div className="text-3xl font-black text-white mb-1">{stat.value}</div>
                  <div className="text-xs text-slate-500 font-medium">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Right side: floating cards visual */}
          <div className="hidden lg:flex flex-1 items-center justify-center relative">
            <div className="relative w-[360px] h-[420px]">
              {/* Main product preview card */}
              <div className="absolute inset-0 glass rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                <div className="w-full h-full bg-gradient-to-br from-amber-500/20 to-amber-700/20 flex items-center justify-center">
                  <div className="text-[10rem] opacity-50">👟</div>
                </div>
              </div>
              {/* Floating info cards */}
              <div className="absolute -top-6 -start-12 glass rounded-2xl px-4 py-3 shadow-xl border border-white/10">
                <div className="text-xs text-amber-400 font-bold">🔥 {lang === 'ar' ? 'أكثر مبيعاً' : 'Best Seller'}</div>
                <div className="text-white font-bold text-sm mt-0.5">{lang === 'ar' ? 'حذاء الجري Pro' : 'Pro Running Shoe'}</div>
                <div className="text-amber-400 font-black text-lg">299 {t('sar')}</div>
              </div>
              <div className="absolute -bottom-6 -end-10 glass rounded-2xl px-4 py-3 shadow-xl border border-white/10">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">✓</div>
                  <div>
                    <div className="text-white text-xs font-bold">{lang === 'ar' ? 'تم الطلب!' : 'Order Placed!'}</div>
                    <div className="text-slate-400 text-[10px]">{lang === 'ar' ? 'يصلك غداً' : 'Arrives Tomorrow'}</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom wave */}
        <div className="absolute bottom-0 inset-x-0">
          <svg viewBox="0 0 1440 60" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 60L1440 60L1440 20C1200 55 960 5 720 25C480 45 240 0 0 20L0 60Z" fill="#f8fafc"/>
          </svg>
        </div>
      </section>

      {/* ── Features bar ── */}
      <section className="bg-white border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 py-5">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className="flex items-center gap-3 justify-center text-sm text-slate-600">
                <span className="text-amber-500">{f.icon}</span>
                <span className="font-medium">{f.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-12 space-y-20">

        {/* ── Sports categories ── */}
        {sports.length > 0 && (
          <section className="reveal">
            <SectionHeader title={t('shopBySport')} />
            <div className={`grid gap-4 ${sports.length <= 3 ? 'grid-cols-3' : sports.length <= 4 ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3 md:grid-cols-6'}`}>
              {sports.map(sport => (
                <Link
                  key={sport._id}
                  href={`/products?sport=${sport.name}`}
                  className="sport-card flex flex-col items-center gap-3 py-5 px-3 group"
                >
                  <span className="text-4xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3">
                    {sport.icon}
                  </span>
                  <span className="text-xs font-bold text-slate-600 group-hover:text-amber-600 transition-colors text-center">
                    {lang === 'ar' ? sport.nameAr : sport.name}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Main categories ── */}
        {categories.length > 0 && (
          <section className="reveal reveal-d1">
            <SectionHeader title={t('mainCategories')} href="/products" hrefLabel={t('viewAll')} />
            <div className="h-scroll sm:grid sm:grid-cols-3 sm:gap-4 sm:overflow-x-visible md:grid-cols-3 lg:grid-cols-6">
              {categories.map((cat, i) => (
                <Link
                  key={cat._id}
                  href={`/products?category=${cat._id}`}
                  className="group relative overflow-hidden rounded-2xl aspect-square bg-gradient-to-br from-slate-100 to-slate-200 hover:shadow-xl transition-all duration-300 w-32 sm:w-auto flex-shrink-0"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  {cat.image ? (
                    <Image src={cat.image} alt={cat.name} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-amber-100 to-amber-200 flex items-center justify-center text-5xl opacity-60">
                      👕
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <p className="text-white font-bold text-sm drop-shadow">
                      {lang === 'ar' ? cat.nameAr || cat.name : cat.name || cat.nameAr}
                    </p>
                  </div>
                  <div className="absolute inset-0 ring-2 ring-amber-500 ring-opacity-0 group-hover:ring-opacity-100 rounded-2xl transition-all duration-300" />
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Special offers ── */}
        {offers.length > 0 && (
          <section className="relative overflow-hidden rounded-3xl reveal">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-rose-600 opacity-[0.06]" />
            <div className="absolute inset-0 border-2 border-amber-200 rounded-3xl pointer-events-none" />
            <div className="relative p-8">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="section-title">{t('hotDeals')}</h2>
                  <p className="section-subtitle">{t('hotDealsDesc')}</p>
                </div>
                <Link
                  href="/products?productType=specialOffer"
                  className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2"
                >
                  {t('viewAll')} <ArrowIcon size={14} />
                </Link>
              </div>
              <div className="h-scroll sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-x-visible lg:grid-cols-4">
                {offers.map(p => <div key={p._id} className="w-44 sm:w-auto"><ProductCard product={p} /></div>)}
              </div>
            </div>
          </section>
        )}

        {/* ── Featured ── */}
        {featured.length > 0 && (
          <section className="reveal">
            <SectionHeader
              title={t('featuredProducts')}
              subtitle={t('featuredDesc')}
              href="/products?productType=featured"
              hrefLabel={t('viewAll')}
            />
            <div className="h-scroll sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-x-visible md:grid-cols-3 lg:grid-cols-4">
              {featured.map(p => <div key={p._id} className="w-44 sm:w-auto"><ProductCard product={p} /></div>)}
            </div>
          </section>
        )}

        {/* ── Brands ── */}
        {brands.length > 0 && (
          <section className="reveal">
            <SectionHeader title={t('globalBrands')} centered />
            <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
              {brands.map(brand => (
                <Link key={brand._id} href={`/products?brand=${brand._id}`} className="brand-card p-3 group">
                  {brand.logo ? (
                    <Image
                      src={brand.logo}
                      alt={brand.name}
                      width={60}
                      height={60}
                      className="object-contain grayscale group-hover:grayscale-0 transition-all"
                    />
                  ) : (
                    <span className="text-xs font-black text-slate-600 group-hover:text-amber-600 transition-colors text-center">
                      {lang === 'ar' ? brand.nameAr || brand.name : brand.name || brand.nameAr}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* ── Best sellers ── */}
        {bestSellers.length > 0 && (
          <section className="reveal">
            <SectionHeader
              title={t('bestSellers')}
              subtitle={t('bestSellersDesc')}
              href="/products?productType=bestSeller"
              hrefLabel={t('viewAll')}
            />
            <div className="h-scroll sm:grid sm:grid-cols-2 sm:gap-5 sm:overflow-x-visible md:grid-cols-3 lg:grid-cols-4">
              {bestSellers.map(p => <div key={p._id} className="w-44 sm:w-auto"><ProductCard product={p} /></div>)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  href,
  hrefLabel,
  centered,
}: {
  title: string;
  subtitle?: string;
  href?: string;
  hrefLabel?: string;
  centered?: boolean;
}) {
  const { isRTL } = useLanguage();
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  return (
    <div className={`flex items-end justify-between mb-7 ${centered ? 'justify-center' : ''}`}>
      <div className={centered ? 'text-center' : ''}>
        <h2 className="section-title">{title}</h2>
        {subtitle && <p className="section-subtitle">{subtitle}</p>}
      </div>
      {href && hrefLabel && (
        <Link
          href={href}
          className="flex items-center gap-1.5 text-sm font-semibold text-amber-500 hover:text-amber-600 transition-colors group flex-shrink-0"
        >
          {hrefLabel}
          <ArrowIcon size={15} className="group-hover:translate-x-0.5 transition-transform" />
        </Link>
      )}
    </div>
  );
}
