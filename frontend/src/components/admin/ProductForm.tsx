'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { categoriesApi, brandsApi, productsApi, sportsApi } from '@/lib/api';
import type { Category, Brand, Product, Sport } from '@/types';
import { Plus, Trash2, Upload, X } from 'lucide-react';

interface Props {
  product?: Product;
  mode: 'create' | 'edit';
}

const CLOTHING_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];
const SHOE_SIZES = ['36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46', '47', '48'];

const PRESET_COLORS = [
  { hex: '#000000', label: 'أسود' },
  { hex: '#FFFFFF', label: 'أبيض' },
  { hex: '#EF4444', label: 'أحمر' },
  { hex: '#3B82F6', label: 'أزرق' },
  { hex: '#22C55E', label: 'أخضر' },
  { hex: '#F59E0B', label: 'ذهبي' },
  { hex: '#8B5CF6', label: 'بنفسجي' },
  { hex: '#EC4899', label: 'وردي' },
  { hex: '#F97316', label: 'برتقالي' },
  { hex: '#6B7280', label: 'رمادي' },
  { hex: '#92400E', label: 'بني' },
  { hex: '#0EA5E9', label: 'سماوي' },
];

export default function ProductForm({ product, mode }: Props) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [categories, setCategories] = useState<Category[]>([]);
  const [brands, setBrands] = useState<Brand[]>([]);
  const [sports, setSports] = useState<Sport[]>([]);
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

  const [sizes, setSizes] = useState<{ size: string; stock: number; price?: number }[]>(
    product?.sizes?.length ? product.sizes : []
  );
  const [colors, setColors] = useState<string[]>(product?.colors || []);
  const [existingImages, setExistingImages] = useState<string[]>(product?.images || []);
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [sizeType, setSizeType] = useState<'clothing' | 'shoes' | 'custom'>('clothing');
  const [customSize, setCustomSize] = useState('');
  const [customColor, setCustomColor] = useState('#000000');

  useEffect(() => {
    categoriesApi.getAll({ isActive: 'true' }).then(r => setCategories(r.data || []));
    brandsApi.getAll().then(r => setBrands(r.data || []));
    sportsApi.getAll({ isActive: 'true' }).then(r => setSports(r.data || []));
  }, []);

  const update = (k: string, v: string | boolean) => setForm(p => ({ ...p, [k]: v }));

  const addSize = (size: string) => {
    if (sizes.find(s => s.size === size)) return;
    setSizes(prev => [...prev, { size, stock: 0, price: undefined }]);
  };
  const removeSize = (size: string) => setSizes(prev => prev.filter(s => s.size !== size));
  const updateSizeStock = (size: string, stock: number) =>
    setSizes(prev => prev.map(s => s.size === size ? { ...s, stock } : s));
  const updateSizePrice = (size: string, price: number | undefined) =>
    setSizes(prev => prev.map(s => s.size === size ? { ...s, price: price || undefined } : s));

  const toggleColor = (hex: string) => {
    setColors(prev => prev.includes(hex) ? prev.filter(c => c !== hex) : [...prev, hex]);
  };
  const addCustomColor = () => {
    if (!colors.includes(customColor)) setColors(prev => [...prev, customColor]);
  };

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
      Object.entries(form).forEach(([k, v]) => {
        const key = k === 'subcategory' ? 'subcategoryId' : k === 'brand' ? 'brandId' : k;
        formData.append(key, String(v));
      });

      if (form.hasSizes && sizes.length > 0) {
        formData.append('sizes', JSON.stringify(sizes));
      } else {
        formData.append('sizes', JSON.stringify([]));
      }

      formData.append('colors', JSON.stringify(colors));

      const price = Number(form.price);
      const disc = Number(form.discount);
      formData.append('priceAfterDiscount', disc > 0 ? String(price - (price * disc / 100)) : '0');

      if (form.hasSizes) formData.set('stock', '0');

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
              placeholder="حذاء نايكي للجري" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المنتج (إنجليزي)</label>
            <input value={form.name} onChange={e => update('name', e.target.value)}
              placeholder="Nike Running Shoes" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف (عربي)</label>
            <textarea value={form.descriptionAr} onChange={e => update('descriptionAr', e.target.value)}
              rows={3} placeholder="وصف المنتج بالعربية..."
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف (إنجليزي)</label>
            <textarea value={form.description} onChange={e => update('description', e.target.value)}
              rows={3} placeholder="Product description in English..." dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none" />
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">نسبة الخصم (%)</label>
            <input type="number" value={form.discount} onChange={e => update('discount', e.target.value)}
              min="0" max="100" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
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
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">رمز SKU (اختياري)</label>
            <input value={form.sku} onChange={e => update('sku', e.target.value)}
              placeholder="NIKE-RUN-001" dir="ltr"
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
          </div>
        </div>
      </div>

      {/* Sizes with price */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-5">
          <h3 className="font-bold text-gray-900">المقاسات</h3>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.hasSizes} onChange={e => update('hasSizes', e.target.checked)}
              className="w-4 h-4 accent-amber-500" />
            <span className="text-sm font-medium text-gray-700">المنتج له مقاسات</span>
          </label>
        </div>

        {form.hasSizes && (
          <div className="space-y-4">
            <div className="flex gap-2">
              <select value={sizeType} onChange={e => setSizeType(e.target.value as 'clothing' | 'shoes' | 'custom')}
                className="border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
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
                      sizes.find(sz => sz.size === s) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-amber-200'
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
                      sizes.find(sz => sz.size === s) ? 'border-amber-500 bg-amber-50 text-amber-700' : 'border-gray-200 hover:border-amber-200'
                    }`}>
                    {s}
                  </button>
                ))}
              </div>
            )}

            {sizeType === 'custom' && (
              <div className="flex gap-2">
                <input value={customSize} onChange={e => setCustomSize(e.target.value)}
                  placeholder="أدخل المقاس..." className="border border-gray-200 rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
                <button onClick={() => { if (customSize.trim()) { addSize(customSize.trim()); setCustomSize(''); } }}
                  className="bg-amber-500 text-white px-4 py-2 rounded-xl text-sm">
                  إضافة
                </button>
              </div>
            )}

            {sizes.length > 0 && (
              <div className="mt-4 space-y-2">
                <h4 className="text-sm font-semibold text-gray-700">الكمية والسعر لكل مقاس</h4>
                <div className="text-xs text-gray-400 mb-2">اتركي حقل السعر فارغاً لاستخدام السعر الأصلي للمنتج</div>
                <div className="space-y-2">
                  {sizes.map(s => (
                    <div key={s.size} className="flex items-center gap-3 bg-gray-50 rounded-xl p-3">
                      <span className="font-bold text-sm w-14 text-center">{s.size}</span>
                      <div className="flex-1 grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">الكمية</label>
                          <input type="number" value={s.stock} min="0"
                            onChange={e => updateSizeStock(s.size, Number(e.target.value))}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" dir="ltr" />
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 mb-1 block">السعر (ر.س) — اختياري</label>
                          <input type="number" value={s.price ?? ''} min="0" step="0.01"
                            placeholder={form.price || '—'}
                            onChange={e => updateSizePrice(s.size, e.target.value ? Number(e.target.value) : undefined)}
                            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-amber-500" dir="ltr" />
                        </div>
                      </div>
                      <button onClick={() => removeSize(s.size)} className="text-red-400 hover:text-red-600 flex-shrink-0">
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

      {/* Colors */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-4">الألوان المتاحة (اختياري)</h3>
        <div className="flex flex-wrap gap-2 mb-4">
          {PRESET_COLORS.map(c => (
            <button key={c.hex} onClick={() => toggleColor(c.hex)} title={c.label}
              className={`w-9 h-9 rounded-full border-4 transition-all hover:scale-110 ${
                colors.includes(c.hex) ? 'border-amber-500 scale-110' : 'border-white shadow-md'
              }`}
              style={{ backgroundColor: c.hex }}>
              {c.hex === '#FFFFFF' && <span className="block w-full h-full rounded-full border border-gray-200" />}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <input type="color" value={customColor} onChange={e => setCustomColor(e.target.value)}
            className="w-10 h-10 rounded-xl border border-gray-200 cursor-pointer p-0.5" />
          <button onClick={addCustomColor}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-xl transition-colors">
            إضافة لون مخصص
          </button>
        </div>
        {colors.length > 0 && (
          <div className="mt-4">
            <p className="text-xs text-gray-500 mb-2">الألوان المختارة:</p>
            <div className="flex flex-wrap gap-2">
              {colors.map(hex => (
                <div key={hex} className="flex items-center gap-1.5 bg-gray-50 border border-gray-200 rounded-full px-3 py-1.5">
                  <span className="w-4 h-4 rounded-full border border-gray-300 flex-shrink-0" style={{ backgroundColor: hex }} />
                  <span className="text-xs text-gray-600 ltr">{hex}</span>
                  <button onClick={() => setColors(prev => prev.filter(c => c !== hex))}
                    className="text-gray-400 hover:text-red-500 ml-1">
                    <X size={12} />
                  </button>
                </div>
              ))}
            </div>
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">بدون ماركة</option>
              {brands.map(b => <option key={b._id} value={b._id}>{b.nameAr || b.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الرياضة</label>
            <select value={form.sport} onChange={e => update('sport', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
              <option value="">اختر الرياضة</option>
              {sports.map(s => (
                <option key={s._id} value={s.name}>{s.nameAr}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">الجنس</label>
            <select value={form.gender} onChange={e => update('gender', e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white">
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
              className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
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
                className="accent-amber-500 w-4 h-4" />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Images */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <h3 className="font-bold text-gray-900 mb-5">الصور</h3>

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
          className="border-2 border-dashed border-gray-200 rounded-2xl p-8 text-center cursor-pointer hover:border-amber-300 hover:bg-amber-50 transition-all"
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
          className="flex-1 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white font-bold py-4 rounded-2xl transition-colors flex items-center justify-center gap-2">
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
