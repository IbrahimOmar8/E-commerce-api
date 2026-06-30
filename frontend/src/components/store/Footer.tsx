import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center font-bold text-white text-lg">يS</div>
              <div>
                <div className="font-bold text-white text-lg">يلا سبورت</div>
                <div className="text-xs text-gray-400">Yalla Sport</div>
              </div>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              وجهتك الأولى للملابس والمعدات الرياضية في المملكة العربية السعودية. جودة عالية وأسعار منافسة.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="font-semibold text-white mb-4">روابط سريعة</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products" className="hover:text-orange-400 transition-colors">المنتجات</Link></li>
              <li><Link href="/products?productType=bestSeller" className="hover:text-orange-400 transition-colors">الأكثر مبيعاً</Link></li>
              <li><Link href="/products?productType=specialOffer" className="hover:text-orange-400 transition-colors">العروض الخاصة</Link></li>
              <li><Link href="/products?productType=featured" className="hover:text-orange-400 transition-colors">منتجات مميزة</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="font-semibold text-white mb-4">الفئات</h4>
            <ul className="space-y-2 text-sm">
              <li><Link href="/products?gender=men" className="hover:text-orange-400 transition-colors">رجال</Link></li>
              <li><Link href="/products?gender=women" className="hover:text-orange-400 transition-colors">نساء</Link></li>
              <li><Link href="/products?gender=kids" className="hover:text-orange-400 transition-colors">أطفال</Link></li>
              <li><Link href="/products?sport=running" className="hover:text-orange-400 transition-colors">الجري</Link></li>
              <li><Link href="/products?sport=football" className="hover:text-orange-400 transition-colors">كرة القدم</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-semibold text-white mb-4">تواصل معنا</h4>
            <ul className="space-y-2 text-sm">
              <li className="flex items-center gap-2">
                <span>📱</span>
                <span className="ltr">+966 50 000 0000</span>
              </li>
              <li className="flex items-center gap-2">
                <span>📧</span>
                <span className="ltr">info@yallasport.sa</span>
              </li>
              <li className="flex items-center gap-2">
                <span>💬</span>
                <a href="#" className="hover:text-orange-400 transition-colors">واتساب</a>
              </li>
            </ul>
            <div className="mt-4 flex gap-3">
              <a href="#" className="w-9 h-9 bg-gray-700 hover:bg-orange-500 transition-colors rounded-lg flex items-center justify-center text-sm">𝕏</a>
              <a href="#" className="w-9 h-9 bg-gray-700 hover:bg-orange-500 transition-colors rounded-lg flex items-center justify-center text-sm">📸</a>
              <a href="#" className="w-9 h-9 bg-gray-700 hover:bg-orange-500 transition-colors rounded-lg flex items-center justify-center text-sm">▶</a>
            </div>
          </div>
        </div>

        {/* Payment methods */}
        <div className="border-t border-gray-700 mt-8 pt-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">© 2025 يلا سبورت. جميع الحقوق محفوظة.</p>
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <span className="bg-gray-700 px-3 py-1.5 rounded-lg">مدى</span>
            <span className="bg-gray-700 px-3 py-1.5 rounded-lg">Visa</span>
            <span className="bg-gray-700 px-3 py-1.5 rounded-lg">STC Pay</span>
            <span className="bg-gray-700 px-3 py-1.5 rounded-lg">Apple Pay</span>
            <span className="bg-gray-700 px-3 py-1.5 rounded-lg">COD</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
