'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthUser {
  id: string;
  username: string;
  fullName?: string;
  role: 'admin' | 'super-admin' | 'user';
}

interface AuthStore {
  user: AuthUser | null;
  token: string | null;
  setAuth: (user: AuthUser, token: string) => void;
  logout: () => void;
  isAdmin: () => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,

      setAuth: (user, token) => {
        localStorage.setItem('token', token);
        set({ user, token });
      },

      logout: () => {
        localStorage.removeItem('token');
        set({ user: null, token: null });
      },

      isAdmin: () => {
        const role = get().user?.role;
        return role === 'admin' || role === 'super-admin';
      },
    }),
    { name: 'yalla-sport-auth' }
  )
);
