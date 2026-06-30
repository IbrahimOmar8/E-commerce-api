'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product, CartItem } from '@/types';

interface CartStore {
  items: CartItem[];
  addItem: (product: Product, quantity: number, size?: string | null) => void;
  removeItem: (productId: string, size?: string | null) => void;
  updateQuantity: (productId: string, quantity: number, size?: string | null) => void;
  clearCart: () => void;
  itemCount: () => number;
  subtotal: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product, quantity, size = null) => {
        set(state => {
          const existing = state.items.find(
            i => i.product._id === product._id && i.size === size
          );
          if (existing) {
            return {
              items: state.items.map(i =>
                i.product._id === product._id && i.size === size
                  ? { ...i, quantity: i.quantity + quantity }
                  : i
              ),
            };
          }
          return { items: [...state.items, { product, quantity, size }] };
        });
      },

      removeItem: (productId, size = null) => {
        set(state => ({
          items: state.items.filter(
            i => !(i.product._id === productId && i.size === size)
          ),
        }));
      },

      updateQuantity: (productId, quantity, size = null) => {
        if (quantity <= 0) {
          get().removeItem(productId, size);
          return;
        }
        set(state => ({
          items: state.items.map(i =>
            i.product._id === productId && i.size === size ? { ...i, quantity } : i
          ),
        }));
      },

      clearCart: () => set({ items: [] }),

      itemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),

      subtotal: () =>
        get().items.reduce((sum, i) => {
          const price = i.product.priceAfterDiscount > 0 ? i.product.priceAfterDiscount : i.product.price;
          return sum + price * i.quantity;
        }, 0),
    }),
    { name: 'yalla-sport-cart' }
  )
);
