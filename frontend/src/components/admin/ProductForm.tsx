'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { categoriesApi, brandsApi, productsApi } from '@/lib/api';
import type { Category, Brand, Product } from '@/types';
import { Plus, Trash2, Upload, X } from 'lucide-react';

interface Props {
  product?: Product;
  mode: 'create' | 'edit';
}

const SPORTS = ['كرة القدم', 'الجري', 'الصالة الرياضية', 'السباحة', 'التنس', 'كرة السلة', 'كرة الطائرة', 'الهوكي', 'العاب قوى', 'غير محدد'];
const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];

export default function ProductForm({ product, mode }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: product?.name || '',
    nameAr: product?.nameAr || '',
    description: product?.description || '',
    descriptionAr: product?.descriptionAr || '',
    price: product?.price?.toString() || '',
    discount: product?.discount?.toString() || '0',
    subcategory: typeof product?.subcategory === 'object' ? product.subcategory._id : product?.subcategory || '',
    brand: typeof product?.brand === 'object' && product?.brand ? product.brand._id : (product?.brand as string) || '',
    stock: product?.stock?.toString() || '0',
    sport: product?.sport || '',
    gender: product?.gender || 'unisex',
    material: product?.material || '',
    sku: product?.sku || '',
    isActive: product?.isActive ?? true,
    featured: product?.featured ?? false,
    bestSeller: product?.bestSeller ?? false,
    specialOffer: product?.specialOffer ?? false,
    hasSizes: product?.hasSizes ?? false,
  });

  const [sizes, setSizes] = useState<{ size: string; stock: number }[]>(
    product?.sizes?.length ? product.sizes : []
  );
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [sizeType, setSizeType] = useState<'clothing' | 'shoes' | 'custom'>('clothing');
  const [customSize, setCustomSize] = useState('');

  useEffect(() => {
    categoriesApi.getAll({ isActive: 'true' }).then(r => setCategories(r.data || []));
    brandsApi.getAll().then(r => setBrands(r.data || []));
  }, []);

  const update = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const addSize = (size: string) => {
    if (sizes.find(s => s.size === size)) return;
    setSizes(prev => [...prev, { size, stock: 0 }]);
  };

  const removeSize = (size: string) => setSizes(prev => prev.filter(s => s.size !== size));
  const updateSizeStock = (size: string, stock: number) =>
    setSizes(prev => prev.map(s => s.size === size ? { ...s, stock } : s));

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    setNewFiles(prev => [...prev, ...Array.from(files)]);
  };

  const handleSubmit = async () => {
    if (!form.name && !form.nameAr) { setError('اسم المنتج مطلوب'); return; }
    if (!form.price || Number(form.price) <= 0) { setError('السعر مطلوب'); return; }
    if (!form.subcategory) { setError('التصنيف مطلوب'); return; }

    setLoading(true);
    setError('');

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, String(v)));

      if (form.hasSizes && sizes.length > 0) {
        formData.append('sizes', JSON.stringify(sizes));
      }

      // Calculate priceAfterDiscount
      const price = Number(form.price);
      const disc = Number(form.discount);
      if (disc > 0) {
        formData.append('priceAfterDiscount', String(price - (price * disc / 100)));
      } else {
        formData.append('priceAfterDiscount', '0');
      }

      // Remove stock if using sizes
      if (form.hasSizes) {
        formData.set('stock', '0');
      }

      newFiles.forEach(f => formData.append('images', f));

      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      let res;
      if (mode === 'create') {
        res = await productsApi.create(formData);
      } else {
        res = await productsApi.update(product!._id, formData);
      }

      if (!res.success) throw new Error(res.message || 'Error saving product');
      router.push('/admin/products');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setLoading(false);
    }
  };

  const parentCategories = categories.filter(c => !c.parent);
  const subcategories = categories.filter(c => c.parent);

  return (
    <div className="max-w-4xl space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 rounded-xl px-4 py-3 text-sm">{error}</div>
      )}

      {/* Basic info */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5">المعلومات الأساسية</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المنتج (عربي)</label>
            <input value={form.nameAr} onChange={e => update('nameAr', e.target.value)}
              placeholder="حذاء نايكي للجري" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المنتج (إنجليزي)</label>
            <input value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Nike Running Shoes" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف (عربي)</label>
            <textarea value={form.descriptionAr} onChange={e => update('descriptionAr', e.target.value)}
              rows={3} placeholder="وصف المنتج بالعربية..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف (إنجليزي)</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              rows={3} placeholder="Product description in English..." dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5">السعر والمخزون</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">السعر الأصلي (ر.س) *</label>
            <input type="number" value={form.price} onChange={e => update('price', e.target.value)}
              min="0" step="0.01" placeholder="0.00" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">نسبة الخصم (%)</label>
            <input type="number" value={form.discount} onChange={e => update('discount', e.target.value)}
              min="0" max="100" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">السعر بعد الخصم</label>
            <div className="border border-gray-100 bg-gray-50 rounded-xl px-4 py-2.5 text-sm text-gray-700">
              {form.price && Number(form.discount) > 0
                ? (Number(form.price) * (1 - Number(form.discount) / 100)).toFixed(2)
                : form.price || '0'} ر.س
            </div>
          </div>
          {!form.hasSizes && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الكمية في المخزون</label>
              <input type="number" value={form.stock} onChange={e => update('stock', e.target.value)}
                min="0" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز SKU (اختياري)</label>
            <input value={form.sku} onChange={e => update('sku', e.target.value)}
              placeholder="NIKE-RUN-001" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>
      </div>

      {/* Sizes */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">المقاسات</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.hasSizes} onChange={e => update('hasSizes', e.target.checked)}
              className="w-4 h-4 accent-orange-500" />
            <span className="text-sm font-medium text-gray-700">المنتج له مقاسات</span>
          </label>
        </div>

        {form.hasSizes && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select value={sizeType} onChange={e => setSizeType(e.target.value as 'clothing' | 'shoes' | 'custom')}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                <option value="clothing">ملابس (XS-XXXL)</option>
                <option value="shoes">أحذية (36-48)</option>
                <option value="custom">مخصص</option>
              </select>
            </div>

            {sizeType === 'clothing' && (
              <div className="flex flex-wrap gap-2">
                {CLOTHING_SIZES.map(s => (
                  <button key={s} onClick={() => sizes.find(sz => sz.size === s) ? removeSize(s) : addSize(s)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      sizes.find(sz => sz.size === s) ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-orange-200'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {sizeType === 'shoes' && (
              <div className="flex flex-wrap gap-2">
                {SHOE_SIZES.map(s => (
                  <button key={s} onClick={() => sizes.find(sz => sz.size === s) ? removeSize(s) : addSize(s)}
                    className={`px-3 py-2 rounded-xl text-sm font-medium border-2 transition-all ${
                      sizes.find(sz => sz.size === s) ? 'border-orange-500 bg-orange-50 text-orange-700' : 'border-gray-200 hover:border-orange-200'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {sizeType === 'custom' && (
              <div className="flex gap-2">
                <input value={customSize} onChange={e => setCustomSize(e.target.value)}
                  placeholder="أدخل المقاس..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
                <button onClick={() => { if (customSize.trim()) { addSize(customSize.trim()); setCustomSize(''); } }}
                  className="bg-orange-500 text-white px-4 py-2 rounded-xl text-sm">
                  إضافة
                </button>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">المخزون لكل مقاس</h4>
                <div className="grid sm:grid-cols-3 gap-3">
                  {sizes.map(s => (
                    <div key={s.size} className="flex items-center gap-2 bg-gray-50 rounded-xl p-3">
                      <span className="font-bold text-sm w-12">{s.size}</span>
                      <input type="number" value={s.stock} min="0"
                        onChange={e => updateSizeStock(s.size, Number(e.target.value))}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500" dir="ltr" />
                      <button onClick={() => removeSize(s.size)} className="text-red-400 hover:text-red-600">
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Classification */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5">التصنيف</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الفئة / التصنيف *</label>
            <select value={form.subcategory} onChange={e => update('subcategory', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">اختر التصنيف</option>
              {parentCategories.map(cat => (
                <optgroup key={cat._id} label={cat.nameAr || cat.name}>
                  <option value={cat._id}>{cat.nameAr || cat.name} (رئيسية)</option>
                  {subcategories.filter(s => s.parent === cat._id || (typeof s.parent === 'object' && (s.parent as unknown as { _id: string })?._id === cat._id)).map(sub => (
                    <option key={sub._id} value={sub._id}>— {sub.nameAr || sub.name}</option>
                  ))}
                </optgroup>
              ))}
              {subcategories.filter(s => !s.parent).map(s => (
                <option key={s._id} value={s._id}>{s.nameAr || s.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الماركة</label>
            <select value={form.brand} onChange={e => update('brand', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">بدون ماركة</option>
              {brands.map(b => <option key={b._id} value={b._id}>{b.nameAr || b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الرياضة</label>
            <select value={form.sport} onChange={e => update('sport', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="">اختر الرياضة</option>
              {SPORTS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الجنس</label>
            <select value={form.gender} onChange={e => update('gender', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
              <option value="unisex">للجميع</option>
              <option value="men">رجال</option>
              <option value="women">نساء</option>
              <option value="kids">أطفال</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">المادة</label>
            <input value={form.material} onChange={e => update('material', e.target.value)}
              placeholder="بوليستر، قطن، إلخ..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
          </div>
        </div>

        {/* Product type flags */}
        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { key: 'isActive', label: 'نشط', color: 'green' },
            { key: 'featured', label: 'مميز', color: 'purple' },
            { key: 'bestSeller', label: 'الأكثر مبيعاً', color: 'orange' },
            { key: 'specialOffer', label: 'عرض خاص', color: 'red' },
          ].map(({ key, label, color }) => (
            <label key={key} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-all ${
              form[key as keyof typeof form]
                ? `border-${color}-400 bg-${color}-50`
                : 'border-gray-200 hover:border-gray-300'
            }`}>
              <input type="checkbox" checked={Boolean(form[key as keyof typeof form])}
                onChange={e => update(key, e.target.checked)}
                className="accent-orange-500 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5">الصور</h3>

        {/* Existing images */}
        {existingImages.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {existingImages.map((img, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group">
                <Image src={img} alt="" fill className="object-cover" />
                <button onClick={() => setExistingImages(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* New files preview */}
        {newFiles.length > 0 && (
          <div className="flex flex-wrap gap-3 mb-4">
            {newFiles.map((file, i) => (
              <div key={i} className="relative w-24 h-24 rounded-xl overflow-hidden group bg-gray-100">
                <Image src={URL.createObjectURL(file)} alt="" fill className="object-cover" />
                <button onClick={() => setNewFiles(prev => prev.filter((_, j) => j !== i))}
                  className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all"
        >
          <Upload size={32} className="mx-auto mb-3 text-gray-300" />
          <p className="text-sm font-medium text-gray-600">اضغط لرفع الصور</p>
          <p className="text-xs text-gray-400 mt-1">PNG, JPG حتى 5MB لكل صورة</p>
        </div>
        <input ref={fileRef} type="file" multiple accept="image/*" className="hidden"
          onChange={e => handleFiles(e.target.files)} />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button onClick={handleSubmit} disabled={loading}
          className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2">
          {loading ? 'جاري الحفظ...' : mode === 'create' ? <><Plus size={18} /> إضافة المنتج</> : 'حفظ التعديلات'}
        </button>
        <button onClick={() => router.push('/admin/products')}
          className="px-8 border border-gray-200 text-gray-700 font-medium py-4 rounded-2xl hover:bg-gray-50 transition-colors">
          إلغاء
        </button>
      </div>
    </div>
  );
}
