'use client';
import { useState, useEffect } from 'react';
import { sportsApi } from '@/lib/api';
import type { Sport } from '@/types';
import { Plus, Edit, Trash2, X, Check, GripVertical } from 'lucide-react';

const DEFAULT_FORM = { name: '', nameAr: '', icon: '🏃', isActive: true, sortOrder: 0 };

const EMOJI_SUGGESTIONS = ['🥊', '🏊', '🥋', '🏋️', '⚽', '🏀', '🎾', '🏃', '🚴', '🤸', '🏈', '⚾', '🏐', '🏉', '🎱', '🏓', '🏸', '🥅', '🎿', '🏂', '🤺', '🏇', '🧗', '🤼', '🤾', '🏌️', '🏄', '🚣', '🧘', '🤽'];

export default function AdminSportsPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ ...DEFAULT_FORM });
  const [editId, setEditId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const fetchSports = () => {
    setLoading(true);
    sportsApi.getAll().then(r => setSports(r.data || [])).finally(() => setLoading(false));
  };

  useEffect(() => { fetchSports(); }, []);

  const handleSave = async () => {
    if (!form.name.trim() || !form.nameAr.trim()) { setError('الاسم العربي والإنجليزي مطلوبان'); return; }
    setSaving(true);
    setError('');
    try {
      if (editId) {
        await sportsApi.update(editId, form);
      } else {
        await sportsApi.create(form);
      }
      fetchSports();
      setForm({ ...DEFAULT_FORM });
      setEditId(null);
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في الحفظ');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (sport: Sport) => {
    setForm({
      name: sport.name,
      nameAr: sport.nameAr,
      icon: sport.icon,
      isActive: sport.isActive,
      sortOrder: sport.sortOrder,
    });
    setEditId(sport._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`حذف "${name}"؟`)) return;
    try {
      await sportsApi.delete(id);
      fetchSports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ في الحذف');
    }
  };

  const handleToggleActive = async (sport: Sport) => {
    try {
      await sportsApi.update(sport._id, { isActive: !sport.isActive });
      fetchSports();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'خطأ');
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-gray-900">الرياضات ({sports.length})</h1>
        <button
          onClick={() => { setShowForm(true); setEditId(null); setForm({ ...DEFAULT_FORM }); }}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors"
        >
          <Plus size={16} /> إضافة رياضة
        </button>
      </div>

      {showForm && (
        <div className="bg-white rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-gray-900">{editId ? 'تعديل الرياضة' : 'إضافة رياضة جديدة'}</h3>
            <button onClick={() => { setShowForm(false); setEditId(null); }}><X size={18} className="text-gray-400" /></button>
          </div>

          {error && <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl mb-4">{error}</div>}

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (عربي) *</label>
              <input
                value={form.nameAr}
                onChange={e => setForm(p => ({ ...p, nameAr: e.target.value }))}
                placeholder="ملاكمة"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم (إنجليزي) *</label>
              <input
                value={form.name}
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                placeholder="boxing"
                dir="ltr"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الأيقونة (إيموجي)</label>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-4xl w-12 h-12 flex items-center justify-center bg-gray-50 rounded-xl border border-gray-200">{form.icon}</span>
                <input
                  value={form.icon}
                  onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                  maxLength={4}
                  className="w-24 border border-gray-200 rounded-xl px-3 py-2.5 text-center text-xl focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {EMOJI_SUGGESTIONS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setForm(p => ({ ...p, icon: emoji }))}
                    className={`text-xl w-9 h-9 rounded-lg border transition-all hover:scale-110 ${form.icon === emoji ? 'border-amber-400 bg-amber-50' : 'border-gray-200 hover:border-amber-300'}`}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">الترتيب</label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={e => setForm(p => ({ ...p, sortOrder: Number(e.target.value) }))}
                  min={0}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
                <p className="text-xs text-gray-400 mt-1">الأصغر يظهر أولاً</p>
              </div>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={e => setForm(p => ({ ...p, isActive: e.target.checked }))}
                  className="accent-amber-500 w-4 h-4"
                />
                <span className="text-sm font-medium text-gray-700">نشطة (تظهر في الموقع)</span>
              </label>
            </div>
          </div>

          <div className="flex gap-3 mt-5">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-600 disabled:opacity-60 text-white px-6 py-2.5 rounded-xl text-sm font-semibold"
            >
              <Check size={16} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button
              onClick={() => { setShowForm(false); setEditId(null); }}
              className="px-6 py-2.5 border border-gray-200 rounded-xl text-sm hover:bg-gray-50"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <div key={i} className="bg-white rounded-2xl border border-gray-100 p-4 h-28 skeleton" />)}
        </div>
      ) : sports.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="text-5xl mb-3">🏃</div>
          <p className="text-gray-400 font-medium">لا توجد رياضات بعد</p>
          <p className="text-gray-400 text-sm mt-1">أضف أول رياضة الآن</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {sports.map(sport => (
            <div key={sport._id} className="bg-white rounded-2xl border border-gray-100 p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <span className="text-4xl">{sport.icon}</span>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${sport.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                    {sport.isActive ? 'نشطة' : 'مخفية'}
                  </span>
                  {sport.sortOrder > 0 && (
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <GripVertical size={10} /> {sport.sortOrder}
                    </span>
                  )}
                </div>
              </div>
              <p className="font-bold text-gray-900 mb-0.5">{sport.nameAr}</p>
              <p className="text-xs text-gray-400 ltr mb-3">{sport.name}</p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(sport)}
                  className="flex-1 flex items-center justify-center gap-1 py-2 border border-blue-200 text-blue-500 rounded-xl text-xs hover:bg-blue-50 transition-colors"
                >
                  <Edit size={12} /> تعديل
                </button>
                <button
                  onClick={() => handleToggleActive(sport)}
                  className={`flex items-center justify-center gap-1 px-3 py-2 border rounded-xl text-xs transition-colors ${
                    sport.isActive
                      ? 'border-gray-200 text-gray-400 hover:bg-gray-50'
                      : 'border-green-200 text-green-500 hover:bg-green-50'
                  }`}
                >
                  {sport.isActive ? '🙈' : '👁️'}
                </button>
                <button
                  onClick={() => handleDelete(sport._id, sport.nameAr)}
                  className="flex items-center justify-center gap-1 px-3 py-2 border border-red-200 text-red-400 rounded-xl text-xs hover:bg-red-50 transition-colors"
                >
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
