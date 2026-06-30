'use client';
import { useState, useEffect } from 'react';
import { categoriesApi } from '@/lib/api';
import type { Category } from '@/types';
import { Plus, Edit, Trash2, X, Check } from 'lucide-react';

interface FormState {
  name: string;
  nameAr: string;
  description: string;
  parent: string;
  isActive: boolean;
}

const DEFAULT_FORM: FormState = { name: '', nameAr: '', description: '', parent: '', isActive: true };

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCategories = () => {
    setLoading(true);
    categoriesApi.getAll().then(r => setCategories(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCategories(); }, []);

  const handleSave = async () => {
    if (!form.nameAr && !form.name) { setError('الاسم مطلوب'); return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await categoriesApi.update(editId, form);
      } else {
        await categoriesApi.create(form);
      }
      fetchCategories();
      setForm(DEFAULT_FORM);
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setForm({
      name: cat.name,
      nameAr: cat.nameAr || '',
      description: cat.description || '',
      parent: typeof cat.parent === 'string' ? cat.parent : '',
      isActive: cat.isActive,
    });
    setEditId(cat._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    try {
      await categoriesApi.delete(id);
      fetchCategories();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الحذف');
    }
  };

  const parents = categories.filter(c => !c.parent);
  const children = categories.filter(c => c.parent);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">الفئات</h1>
        <button onClick={() => { setShowForm(true); setEditId(null); setForm(DEFAULT_FORM); }}
          className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> إضافة فئة
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">{editId ? 'تعديل الفئة' : 'إضافة فئة جديدة'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); setForm(DEFAULT_FORM); }}>
              <X size={18} className="text-gray-400" />
            </button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (عربي) *</label>
              <input value={form.nameAr} onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))}
                placeholder="ملابس رياضية" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (إنجليزي)</label>
              <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="Sportswear" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الفئة الأم (للفئات الفرعية)</label>
              <select value={form.parent} onChange={e => setForm(p => ({ ...p, parent: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white">
                <option value="">فئة رئيسية</option>
                {parents.map(p => <option key={p._id} value={p._id}>{p.nameAr || p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الوصف</label>
              <input value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                placeholder="وصف الفئة..." className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
            </div>
            <div>
              <label className="flex items-center gap-2 cursor-pointer mt-6">
                <input type="checkbox" checked={form.isActive} onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="accent-orange-500 w-4 h-4" />
                <span className="text-sm font-medium text-gray-700">فئة نشطة</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold transition-colors">
              <Check size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button onClick={() => { setShowForm(false); setForm(DEFAULT_FORM); setEditId(null); }}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50">
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Categories list */}
      {loading ? (
        <div className="text-center py-12 text-gray-400">جاري التحميل...</div>
      ) : (
        <div className="space-y-3">
          {parents.map(parent => (
            <div key={parent._id} className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
              {/* Parent */}
              <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-50">
                <div className="flex-1">
                  <span className="font-bold text-gray-900">{parent.nameAr || parent.name}</span>
                  {parent.name && parent.nameAr && <span className="text-gray-400 text-sm mr-2 ltr">({parent.name})</span>}
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full ${parent.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {parent.isActive ? 'نشط' : 'مخفي'}
                </span>
                <button onClick={() => handleEdit(parent)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                  <Edit size={14} />
                </button>
                <button onClick={() => handleDelete(parent._id, parent.nameAr || parent.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                  <Trash2 size={14} />
                </button>
              </div>

              {/* Children */}
              {children.filter(c => {
                const p = c.parent;
                return p === parent._id || (typeof p === 'object' && (p as unknown as { _id: string })?._id === parent._id);
              }).map(child => (
                <div key={child._id} className="flex items-center gap-3 px-5 py-3 bg-gray-50/50 border-b border-gray-50 last:border-0">
                  <span className="text-gray-300 ml-2">└</span>
                  <div className="flex-1">
                    <span className="text-sm font-medium text-gray-700">{child.nameAr || child.name}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${child.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {child.isActive ? 'نشط' : 'مخفي'}
                  </span>
                  <button onClick={() => handleEdit(child)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg">
                    <Edit size={14} />
                  </button>
                  <button onClick={() => handleDelete(child._id, child.nameAr || child.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg">
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
          ))}

          {/* Orphan categories (no parent match) */}
          {children.filter(c => !parents.find(p => {
            const par = c.parent;
            return p._id === par || (typeof par === 'object' && (par as unknown as { _id: string })?._id === p._id);
          })).map(cat => (
            <div key={cat._id} className="bg-white rounded-2xl border border-gray-100 px-5 py-4 flex items-center gap-3">
              <div className="flex-1">
                <span className="font-medium text-gray-900">{cat.nameAr || cat.name}</span>
              </div>
              <button onClick={() => handleEdit(cat)} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg"><Edit size={14} /></button>
              <button onClick={() => handleDelete(cat._id, cat.nameAr || cat.name)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
            </div>
          ))}

          {categories.length === 0 && (
            <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center text-gray-400">
              لا توجد فئات بعد
            </div>
          )}
        </div>
      )}
    </div>
  );
}
