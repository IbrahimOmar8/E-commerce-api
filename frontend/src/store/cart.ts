'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size?: string | null, color?: string | null) => void;
  removeItem: (productId: string, size?: string | null, color?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, size?: string | null, color?: string | null) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

// Stable product ID: prefer _id (set by toClient on backend), fall back to raw Prisma id
function pid(p: Product): string {
  return p._id || (p as unknown as { id?: string }).id || '';
}

// Normalize a product to always have _id set (handles old localStorage data)
function normalizeProduct(p: Product): Product {
  const stableId = pid(p);
  return stableId && !p._id ? { ...p, _id: stableId } : p;
}

function getEffectivePrice(product: Product, size?: string | null): number {
  if (size && product.sizes?.length) {
    const sizeData = product.sizes.find(s => s.size === size);
    if (sizeData?.price && sizeData.price > 0) return sizeData.price;
  }
  return product.priceAfterDiscount > 0 ? product.priceAfterDiscount : product.price;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, size = null, color = null) => {
        const p = normalizeProduct(product);
        const key = pid(p);
        const unitPrice = getEffectivePrice(p, size);
        set(state => {
          const existing = state.items.find(
            i => pid(i.product) === key && i.size === size && i.color === color
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                pid(i.product) === key && i.size === size && i.color === color
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product: p, quantity, size, color, unitPrice }] };
        });
      },

      removeItem: (productId, size = null, color = null) => {
        set(state => ({
          items: state.items.filter(
            i => !(pid(i.product) === productId && i.size === size && i.color === color)
          ),
        }));
      },

      updateQuantity: (productId, quantity, size = null, color = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, size, color);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            pid(i.product) === productId && i.size === size && i.color === color ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.unitPrice ?? getEffectivePrice(i.product, i.size);
          return sum + price * i.quantity;
        }, 0),
    }),
    {
      name: 'clay-sport-cart',
      version: 1,
      migrate: (persisted, version) => {
        const state = persisted as { items?: CartItem[] };
        if (version < 1 && Array.isArray(state?.items)) {
          // Normalize old items that had _id: undefined — copy id → _id
          state.items = state.items.map(item => ({
            ...item,
            product: normalizeProduct(item.product),
          }));
        }
        return state as CartStore;
      },
    }
  )
);

// Export pid so cart UI can get a stable product key
export { pid as getProductId };
