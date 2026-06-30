import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'يلا سبورت | Yalla Sport',
  description: 'متجر الملابس والمعدات الرياضية رقم 1 في المملكة العربية السعودية',
  keywords: 'رياضة, ملابس رياضية, معدات رياضية, نايكي, اديداس, السعودية',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
