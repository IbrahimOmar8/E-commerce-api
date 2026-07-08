'use client';
import Header from '@/components/store/Header';
import Footer from '@/components/store/Footer';
import WhatsAppButton from '@/components/store/WhatsAppButton';
import { LanguageProvider } from '@/contexts/language';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <LanguageProvider>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </LanguageProvider>
  );
}
