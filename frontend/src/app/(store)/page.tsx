import HomeClient from '@/components/store/HomeClient';
import type { Product, Category, Brand } from '@/types';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

async function getFeatured(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?featured=true&limit=8&isActive=true`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

async function getBestSellers(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?productType=bestSeller&limit=8&isActive=true`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

async function getCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API}/categories?isActive=true`, { next: { revalidate: 600 } });
    const data = await res.json();
    return (data.data || []).filter((c: Category) => !c.parent).slice(0, 6);
  } catch { return []; }
}

async function getBrands(): Promise<Brand[]> {
  try {
    const res = await fetch(`${API}/brands`, { next: { revalidate: 600 } });
    const data = await res.json();
    return (data.data || []).slice(0, 8);
  } catch { return []; }
}

async function getSpecialOffers(): Promise<Product[]> {
  try {
    const res = await fetch(`${API}/products?productType=specialOffer&limit=4&isActive=true`, { next: { revalidate: 300 } });
    const data = await res.json();
    return data.data || [];
  } catch { return []; }
}

export default async function HomePage() {
  const [featured, bestSellers, categories, brands, offers] = await Promise.all([
    getFeatured(), getBestSellers(), getCategories(), getBrands(), getSpecialOffers()
  ]);

  return (
    <HomeClient
      featured={featured}
      bestSellers={bestSellers}
      categories={categories}
      brands={brands}
      offers={offers}
    />
  );
}
