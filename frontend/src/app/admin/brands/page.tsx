'use client';
import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { brandsApi } from '@/lib/api';
import type { Brand } from '@/types';
import { Plus, Edit, Trash2, X, Check, Upload } from 'lucide-react';

const DEFAULT_FORM = { name: '', nameAr: '', description: '', descriptionAr: '', isActive: true };

export default function AdminBrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(typeof DEFAULT_FORM === 'object' ? { ...DEFAULT_FORM } : DEFAULT_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const fetchBrands = () => {
    setLoading(true);
    brandsApi.getAll().then(r => setBrands(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchBrands(); }, []);

  const handleSave = async () => {
    if (!form.nameAr && !form.name) { setError('الاسم مطلوب'); return; }
    setSaving(true);
    setError('');
    try {
      let res: Brand;
      if (editId) {
        const r = await brandsApi.update(editId, form) as { data: Brand };
        res = r.data;
      } else {
        const r = await brandsApi.create(form) as { data: Brand };
        res = r.data;
      }

      // Upload logo if selected
      if (logoFile && res._id) {
        const fd = new FormData();
        fd.append('logo', logoFile);
        const token = localStorage.getItem('token');
        await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/brands/${res._id}/logo`, {
          method: 'POST',
          headers: token ? { Authorization: `Bearer ${token}` } : {},
          body: fd,
        });
      }

      fetchBrands();
      setForm({ ...DEFAULT_FORM });
      setLogoFile(null);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (brand: Brand) => {
    setForm({
      name: brand.name,
      nameAr: brand.nameAr || '',
      description: brand.description || '',
      descriptionAr: brand.descriptionAr || '',
      isActive: brand.isActive,
    });
    setEditId(brand._id);
    setLogoFile(null);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    try {
      await brandsApi.delete(id);
      fetchBrands();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الحذف');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">الماركات ({brands.length})</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm({ ...DEFAULT_FORM }); setLogoFile(null); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> إضافة ماركة
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">{editId ? 'تعديل الماركة' : 'إضافة ماركة جديدة'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} className="text-gray-400" /></button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (عربي)</label>
              <input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))}
                placeholder="نايكي" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (إنجليزي) *</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Nike" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف (عربي)</label>
              <input value={form.descriptionAr} onChange={e => setForm(p => ({ ...p, descriptionAr: e.target.value }))}
                placeholder="الماركة الرياضية الأشهر عالمياً..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="accent-orange-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">ماركة نشطة</span>
              </label>
            </div>

            {/* Logo upload */}
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1.5">شعار الماركة</label>
              <div onClick={() => fileRef.current?.click()}
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center cursor-pointer hover:border-orange-300 hover:bg-orange-50 transition-all flex items-center gap-4">
                {logoFile ? (
                  <Image src={URL.createObjectURL(logoFile)} alt="" width={64} height={64} className="rounded-xl object-contain" />
                ) : (
                  <Upload size={28} className="text-gray-300" />
                )}
                <div className="text-sm">
                  <p className="font-medium text-gray-600">{logoFile ? logoFile.name : 'اضغط لرفع الشعار'}</p>
                  <p className="text-xs text-gray-400">PNG, JPG حتى 2MB</p>
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => setLogoFile(e.target.files?.[0] || null)} />
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              <Check size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">إلغاء</button>
          </div>
        </div>
      )}

      {/* Brands grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-32 skeleton" />)}
        </div>
      ) : brands.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">لا توجد ماركات بعد</div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {brands.map(brand => (
            <div key={brand._id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="w-14 h-14 bg-gray-50 rounded-xl flex items-center justify-center">
                  {brand.logo ? (
                    <Image src={brand.logo} alt={brand.name} width={48} height={48} className="object-contain" />
                  ) : (
                    <span className="text-2xl">🏆</span>
                  )}
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${brand.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {brand.isActive ? 'نشط' : 'مخفي'}
                </span>
              </div>
              <p className="font-bold text-gray-900 mb-0.5">{brand.nameAr || brand.name}</p>
              {brand.nameAr && brand.name && <p className="text-xs text-gray-400 ltr mb-3">{brand.name}</p>}
              <div className="flex gap-2 mt-auto">
                <button onClick={() => handleEdit(brand)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 border border-blue-200 text-blue-500 rounded-xl text-xs hover:bg-blue-50 transition-colors">
                  <Edit size={12} /> تعديل
                </button>
                <button onClick={() => handleDelete(brand._id, brand.nameAr || brand.name)}
                  className="flex items-center justify-center gap-1 px-3 py-2 border border-red-200 text-red-400 rounded-xl text-xs hover:bg-red-50 transition-colors">
                  <Trash2 size={12} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
