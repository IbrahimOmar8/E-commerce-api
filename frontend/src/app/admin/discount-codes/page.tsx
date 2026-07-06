'use client';
import { useState, useEffect } from 'react';
import { discountApi } from '@/lib/api';
import { Plus, Trash2, Check, X } from 'lucide-react';

interface DiscountCode {
  _id: string;
  code: string;
  discount: number;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

export default function AdminDiscountCodesPage() {
  const [codes, setCodes] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ code: '', discount: '', expiresAt: '', isActive: true });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchCodes = () => {
    setLoading(true);
    discountApi.getAll().then(r => setCodes((r.data as DiscountCode[]) || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchCodes(); }, []);

  const handleSave = async () => {
    if (!form.code.trim() || !form.discount) { setError('الكود والخصم مطلوبان'); return; }
    setSaving(true);
    setError('');
    try {
      await discountApi.create({
        code: form.code.trim().toUpperCase(),
        discount: Number(form.discount),
        expiresAt: form.expiresAt || undefined,
        isActive: form.isActive,
      });
      fetchCodes();
      setForm({ code: '', discount: '', expiresAt: '', isActive: true });
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string, code: string) => {
    if (!confirm(`حذف كود "${code}"؟`)) return;
    try {
      await discountApi.delete(id);
      fetchCodes();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الحذف');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">كودات الخصم</h1>
        <button onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors">
          <Plus size={16} /> كود جديد
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-900">إضافة كود خصم</h3>
            <button onClick={() => setShowForm(false)}><X size={18} className="text-gray-400" /></button>
          </div>
          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}
          <div className="grid sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الكود *</label>
              <input value={form.code} onChange={e => setForm(p => ({ ...p, code: e.target.value.toUpperCase() }))}
                placeholder="SPORT20" dir="ltr" className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 uppercase" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">نسبة الخصم (%) *</label>
              <input type="number" value={form.discount} onChange={e => setForm(p => ({ ...p, discount: e.target.value }))}
                min="1" max="100" placeholder="20" dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">تاريخ الانتهاء</label>
              <input type="date" value={form.expiresAt} onChange={e => setForm(p => ({ ...p, expiresAt: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500" dir="ltr" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button onClick={handleSave} disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold">
              <Check size={16} /> {saving ? 'جاري الحفظ...' : 'إضافة'}
            </button>
            <button onClick={() => setShowForm(false)} className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm">إلغاء</button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-400">جاري التحميل...</div>
        ) : codes.length === 0 ? (
          <div className="p-12 text-center text-gray-400">لا توجد كودات خصم بعد</div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الكود</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الخصم</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الانتهاء</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">الحالة</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-5 py-3">إجراء</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {codes.map((code) => {
                const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
                return (
                  <tr key={code._id} className="hover:bg-gray-50">
                    <td className="px-5 py-3">
                      <span className="font-mono font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg ltr text-sm">{code.code}</span>
                    </td>
                    <td className="px-5 py-3">
                      <span className="font-bold text-green-600 text-lg">{code.discount}%</span>
                    </td>
                    <td className="px-5 py-3">
                      {code.expiresAt ? (
                        <span className={`text-sm ${isExpired ? 'text-red-500' : 'text-gray-600'}`}>
                          {new Date(code.expiresAt).toLocaleDateString('ar-SA')}
                          {isExpired && ' (منتهي)'}
                        </span>
                      ) : <span className="text-gray-400 text-sm">بلا انتهاء</span>}
                    </td>
                    <td className="px-5 py-3">
                      <span className={`text-xs px-2.5 py-1 rounded-full ${code.isActive && !isExpired ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {code.isActive && !isExpired ? 'نشط' : 'غير نشط'}
                      </span>
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(code._id, code.code)}
                        className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
