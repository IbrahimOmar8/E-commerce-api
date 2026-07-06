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
        const unitPrice = getEffectivePrice(product, size);
        set(state => {
          const existing = state.items.find(
            i => i.product._id === product._id && i.size === size && i.color === color
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product._id === product._id && i.size === size && i.color === color
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity, size, color, unitPrice }] };
        });
      },

      removeItem: (productId, size = null, color = null) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.product._id === productId && i.size === size && i.color === color)
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
            i.product._id === productId && i.size === size && i.color === color ? { ...i, quantity } : i
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
    { name: 'clay-sport-cart' }
  )
);
