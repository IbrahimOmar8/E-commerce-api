const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

function getAuthHeaders(): HeadersInit {
  if (typeof window === 'undefined') return {};
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options?.headers,
    },
    ...options,
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message || 'Request failed');
  return data;
}

// ── Products ──────────────────────────────────────────────────────────────
export const productsApi = {
  getAll: (params?: Record<string, string | number | boolean>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ success: boolean; data: import('@/types').Product[]; total: number; pages: number }>(`/products${qs}`);
  },
  getOne: (id: string) => request<{ success: boolean; data: import('@/types').Product }>(`/products/${id}`),
  create: (body: FormData) =>
    fetch(`${BASE_URL}/products`, {
      method: 'POST',
      headers: { ...getAuthHeaders() },
      body,
    }).then(r => r.json()),
  update: (id: string, body: FormData) =>
    fetch(`${BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: { ...getAuthHeaders() },
      body,
    }).then(r => r.json()),
  delete: (id: string) => request(`/products/${id}`, { method: 'DELETE' }),
  notifyWhenAvailable: (productId: string, phone: string) =>
    request<{ success: boolean; message: string }>(`/products/${productId}/notify`, { method: 'POST', body: JSON.stringify({ phone }) }),
};

// ── Categories ────────────────────────────────────────────────────────────
export const categoriesApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; data: import('@/types').Category[] }>(`/categories${qs}`);
  },
  getOne: (id: string) => request<{ success: boolean; data: import('@/types').Category }>(`/categories/${id}`),
  create: (body: object) => request('/categories', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request(`/categories/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/categories/${id}`, { method: 'DELETE' }),
};

// ── Brands ────────────────────────────────────────────────────────────────
export const brandsApi = {
  getAll: () => request<{ success: boolean; data: import('@/types').Brand[] }>('/brands'),
  getOne: (id: string) => request<{ success: boolean; data: import('@/types').Brand }>(`/brands/${id}`),
  create: (body: object) => request('/brands', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request(`/brands/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/brands/${id}`, { method: 'DELETE' }),
};

// ── Sports ────────────────────────────────────────────────────────────────
export const sportsApi = {
  getAll: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : '';
    return request<{ success: boolean; data: import('@/types').Sport[] }>(`/sports${qs}`);
  },
  create: (body: object) => request('/sports', { method: 'POST', body: JSON.stringify(body) }),
  update: (id: string, body: object) => request(`/sports/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/sports/${id}`, { method: 'DELETE' }),
};

// ── Orders ────────────────────────────────────────────────────────────────
export const ordersApi = {
  getAll: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ success: boolean; data: import('@/types').Order[]; total: number; pages: number }>(`/orders${qs}`);
  },
  getOne: (id: string) => request<{ success: boolean; data: import('@/types').Order }>(`/orders/${id}`),
  getByNumber: (orderNumber: string) =>
    request<{ success: boolean; data: import('@/types').Order }>(`/orders/track/${orderNumber}`),
  create: (body: object) => request<{ success: boolean; data: import('@/types').Order }>('/orders', { method: 'POST', body: JSON.stringify(body) }),
  updateStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  getMyOrders: () => request<{ success: boolean; data: import('@/types').Order[] }>('/orders/user'),
  claimOrders: (orderNumbers: string[]) =>
    request<{ success: boolean; claimed: number }>('/orders/claim', { method: 'POST', body: JSON.stringify({ orderNumbers }) }),
  cancel: (id: string) =>
    request<{ success: boolean; message: string }>(`/orders/${id}/cancel`, { method: 'PATCH' }),
};

// ── Auth ──────────────────────────────────────────────────────────────────
export const authApi = {
  login: (body: { username: string; password: string }) =>
    request<{ success: boolean; token: string; admin: { id: string; username: string; role: string } }>(
      '/auth/login', { method: 'POST', body: JSON.stringify(body) }
    ),
  userLogin: (body: { username: string; password: string }) =>
    request<{ success: boolean; token: string; user: { id: string; username: string; fullName: string; role: string } }>(
      '/auth/user-login', { method: 'POST', body: JSON.stringify(body) }
    ),
  signup: (body: { username: string; fullName: string; password: string; phone?: string }) =>
    request('/auth/signup', { method: 'POST', body: JSON.stringify(body) }),
  verify: () => request<{ success: boolean; admin: { id: string; username: string; role: string } }>('/auth/verify'),
};

// ── Stats ─────────────────────────────────────────────────────────────────
export const statsApi = {
  get: () => request<{ success: boolean; data: import('@/types').DashboardStats }>('/stats'),
};

// ── Discount Codes ────────────────────────────────────────────────────────
export const discountApi = {
  validate: (code: string, total: number) =>
    request<{ success: boolean; discount: number; discountAmount: number }>(
      `/discount-codes/validate`, { method: 'POST', body: JSON.stringify({ code, total }) }
    ),
  getAll: () => request<{ success: boolean; data: unknown[] }>('/discount-codes'),
  create: (body: object) => request('/discount-codes', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/discount-codes/${id}`, { method: 'DELETE' }),
};

// ── Reviews ───────────────────────────────────────────────────────────────
export const reviewsApi = {
  getForProduct: (productId: string) =>
    request<{ success: boolean; data: import('@/types').Review[] }>(`/reviews/product/${productId}`),
  getAll: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ success: boolean; data: import('@/types').Review[]; total: number; pages: number }>(`/reviews${qs}`);
  },
  approve: (id: string, isApproved: boolean) =>
    request(`/reviews/${id}/approve`, { method: 'PATCH', body: JSON.stringify({ isApproved }) }),
  create: (body: { productId: string; rating: number; comment?: string }) =>
    request('/reviews', { method: 'POST', body: JSON.stringify(body) }),
  delete: (id: string) => request(`/reviews/${id}`, { method: 'DELETE' }),
};

// ── Wishlist ──────────────────────────────────────────────────────────────
export const wishlistApi = {
  get: () => request<{ success: boolean; data: import('@/types').Product[] }>('/wishlist'),
  add: (productId: string) =>
    request<{ success: boolean; message: string }>(`/wishlist/${productId}`, { method: 'POST' }),
  remove: (productId: string) =>
    request<{ success: boolean; message: string }>(`/wishlist/${productId}`, { method: 'DELETE' }),
};

export interface SavedAddress {
  id: string;
  label: string;
  name: string;
  phone: string;
  address: { street: string; city: string; region: string };
}

// ── Users (admin) ─────────────────────────────────────────────────────────
export const usersApi = {
  getAll: (params?: Record<string, string | number>) => {
    const qs = params ? '?' + new URLSearchParams(params as Record<string, string>).toString() : '';
    return request<{ success: boolean; data: import('@/types').User[]; total: number }>(`/users${qs}`);
  },
  setStatus: (id: string, isActive: boolean) =>
    request(`/users/${id}/status`, { method: 'PATCH', body: JSON.stringify({ isActive }) }),
  getAddresses: () =>
    request<{ success: boolean; data: SavedAddress[] }>('/users/me/addresses'),
  addAddress: (body: Omit<SavedAddress, 'id'>) =>
    request<{ success: boolean; data: SavedAddress }>('/users/me/addresses', { method: 'POST', body: JSON.stringify(body) }),
  deleteAddress: (id: string) =>
    request(`/users/me/addresses/${id}`, { method: 'DELETE' }),
};

// ── Admins ────────────────────────────────────────────────────────────────
export const adminsApi = {
  getAll: () => request<{ success: boolean; data: { _id: string; username: string; email: string; role: string; isActive: boolean; createdAt: string }[] }>('/auth/admins'),
  create: (body: { username: string; email?: string; password: string; role?: string }) =>
    request('/auth/admins', { method: 'POST', body: JSON.stringify(body) }),
  deactivate: (id: string) => request(`/auth/admins/${id}`, { method: 'DELETE' }),
};
