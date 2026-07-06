import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'كلاي سبورت | Clay Sport',
  description: 'وجهتك الأولى للأدوات والمعدات الرياضية في المملكة العربية السعودية',
  keywords: 'رياضة, معدات رياضية, ملاكمة, تايكوندو, كاراتيه, السعودية, clay sport, كلاي سبورت',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
