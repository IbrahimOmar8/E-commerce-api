export interface Sport {
  _id: string;
  name: string;
  nameAr: string;
  icon: string;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
}

export interface Brand {
  _id: string;
  name: string;
  nameAr?: string;
  logo?: string;
  description?: string;
  descriptionAr?: string;
  isActive: boolean;
  createdAt: string;
}

export interface Category {
  _id: string;
  name: string;
  nameAr?: string;
  description?: string;
  image?: string;
  parent?: string | null;
  ancestors?: string[];
  subcategories?: Category[];
  isActive: boolean;
}

export interface SizeStock {
  size: string;
  stock: number;
  price?: number;
}

export interface Product {
  _id: string;
  name: string;
  nameAr?: string;
  description: string;
  descriptionAr?: string;
  price: number;
  discount: number;
  priceAfterDiscount: number;
  subcategory: Category | string;
  brand?: Brand | string | null;
  images: string[];
  stock: number;
  sizes: SizeStock[];
  hasSizes: boolean;
  colors: string[];
  sport?: string;
  sportAr?: string;
  gender: 'men' | 'women' | 'kids' | 'unisex';
  material?: string;
  sku?: string;
  isActive: boolean;
  productType: 'normal' | 'featured' | 'bestSeller' | 'specialOffer';
  featured: boolean;
  bestSeller: boolean;
  specialOffer: boolean;
  averageRating: number;
  totalReviews: number;
  createdAt: string;
}

export interface OrderItem {
  product: Product | string;
  name?: string;
  nameAr?: string;
  image?: string;
  size?: string | null;
  quantity: number;
  price: number;
}

export interface Order {
  _id: string;
  orderNumber: string;
  customerInfo: {
    name: string;
    email?: string;
    phone: string;
    address: {
      street?: string;
      city?: string;
      region?: string;
    };
  };
  items: OrderItem[];
  subtotal: number;
  discountCode?: string | null;
  discountAmount: number;
  deliveryFee: number;
  vat: number;
  totalAmount: number;
  paymentMethod: 'cod' | 'card' | 'mada' | 'stcpay' | 'applepay';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  user?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Review {
  _id: string;
  product: string;
  user: { _id: string; fullName: string; username: string };
  rating: number;
  comment?: string;
  isApproved: boolean;
  createdAt: string;
}

export interface User {
  _id: string;
  username: string;
  fullName: string;
  email?: string;
  phone?: string;
  isActive: boolean;
  createdAt: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  size?: string | null;
  color?: string | null;
  unitPrice?: number;
}

export interface DashboardStats {
  overview: {
    totalOrders: number;
    monthOrders: number;
    ordersGrowth: number;
    totalRevenue: number;
    monthRevenue: number;
    revenueGrowth: number;
    totalProducts: number;
    activeProducts: number;
    totalUsers: number;
    pendingOrders: number;
  };
  recentOrders: Order[];
  ordersByStatus: { _id: string; count: number }[];
  topProducts: { _id: string; totalSold: number; revenue: number; name: string }[];
  salesByDay: { _id: string; orders: number; revenue: number }[];
}

export const SAUDI_REGIONS = [
  { value: 'riyadh', label: 'الرياض', labelEn: 'Riyadh' },
  { value: 'makkah', label: 'مكة المكرمة', labelEn: 'Makkah' },
  { value: 'madinah', label: 'المدينة المنورة', labelEn: 'Madinah' },
  { value: 'eastern', label: 'المنطقة الشرقية', labelEn: 'Eastern Province' },
  { value: 'asir', label: 'عسير', labelEn: 'Asir' },
  { value: 'tabuk', label: 'تبوك', labelEn: 'Tabuk' },
  { value: 'hail', label: 'حائل', labelEn: 'Hail' },
  { value: 'northern', label: 'الحدود الشمالية', labelEn: 'Northern Borders' },
  { value: 'jazan', label: 'جازان', labelEn: 'Jazan' },
  { value: 'najran', label: 'نجران', labelEn: 'Najran' },
  { value: 'baha', label: 'الباحة', labelEn: 'Al-Bahah' },
  { value: 'jawf', label: 'الجوف', labelEn: 'Al-Jouf' },
  { value: 'qassim', label: 'القصيم', labelEn: 'Qassim' },
];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  pending: 'قيد الانتظار',
  confirmed: 'مؤكد',
  processing: 'جاري التجهيز',
  shipped: 'تم الشحن',
  delivered: 'تم التوصيل',
  cancelled: 'ملغي',
};

export const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cod: 'الدفع عند الاستلام',
  card: 'بطاقة ائتمان',
  mada: 'مدى',
  stcpay: 'STC Pay',
  applepay: 'Apple Pay',
};

export const GENDER_LABELS: Record<string, string> = {
  men: 'رجال',
  women: 'نساء',
  kids: 'أطفال',
  unisex: 'للجميع',
};
