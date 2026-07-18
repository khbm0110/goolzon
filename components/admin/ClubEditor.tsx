'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Category, type ClubProfile } from '@/types';

interface ClubEditorProps {
  initialData: ClubProfile;
  onSave: (club: ClubProfile) => Promise<void>;
  onCancel: () => void;
}

export default function ClubEditor({ initialData, onSave, onCancel }: ClubEditorProps) {
  const [club, setClub] = useState<ClubProfile>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => setClub(initialData), [initialData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name.startsWith('colors.')) {
      const key = name.split('.')[1];
      setClub((prev) => ({ ...prev, colors: { ...prev.colors, [key]: value } }));
    } else {
      setClub((prev) => ({ ...prev, [name]: name === 'founded' || name === 'fanCount' ? Number(value) : value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!club.name) return;
    setSaving(true);
    await onSave(club);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_90%,transparent)] backdrop-blur-sm" onClick={onCancel} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--fg)]">بيانات النادي</h2>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full text-[var(--fg-subtle)] hover:text-[var(--fg)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="اسم النادي (عربي)" name="name" value={club.name} onChange={handleChange} />
            <Field label="الاسم بالإنجليزية" name="englishName" value={club.englishName} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="رابط الشعار" name="logo" value={club.logo} onChange={handleChange} />
            <Field label="رابط صورة الغلاف" name="coverImage" value={club.coverImage} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="سنة التأسيس" name="founded" value={String(club.founded)} onChange={handleChange} type="number" />
            <Field label="الملعب" name="stadium" value={club.stadium} onChange={handleChange} />
            <Field label="المدرب" name="coach" value={club.coach} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="اللقب" name="nickname" value={club.nickname} onChange={handleChange} />
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1">الدوري/الدولة</label>
              <select name="country" value={club.country} onChange={handleChange} className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]">
                {Object.values(Category).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Field label="اللون الأساسي" name="colors.primary" value={club.colors?.primary || ''} onChange={handleChange} type="color" />
            <Field label="اللون الثانوي" name="colors.secondary" value={club.colors?.secondary || ''} onChange={handleChange} type="color" />
            <Field label="عدد المشجعين" name="fanCount" value={String(club.fanCount || 0)} onChange={handleChange} type="number" />
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1">تاريخ النادي (نص حر)</label>
            <textarea
              name="history"
              value={club.history || ''}
              onChange={(e) => setClub((prev) => ({ ...prev, history: e.target.value }))}
              rows={6}
              placeholder="اكتب هنا قصة تأسيس النادي وأهم محطاته التاريخية..."
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]"
            />
          </div>

          <p className="text-[11px] text-amber-500/80 border-t border-[var(--border-subtle)] pt-3">
            ⚠️ تعديل قائمة اللاعبين والتشكيلة والبطولات سيُضاف في نسخة قادمة من محرر النادي.
          </p>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-3">
          <button type="button" onClick={onCancel} className="px-4 py-2 bg-[var(--bg-surface-2)] hover:bg-[var(--bg-surface-3)] text-[var(--fg-muted)] rounded-lg font-bold">إلغاء</button>
          <button type="submit" disabled={saving} className="px-4 py-2 bg-primary hover:bg-emerald-600 text-[var(--fg)] rounded-lg font-bold flex items-center gap-2 disabled:opacity-50">
            <Save size={16} /> {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </div>
  );
}

function Field({
  label,
  name,
  value,
  onChange,
  type = 'text',
}: {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[var(--fg-subtle)] mb-1">{label}</label>
      <input name={name} value={value} onChange={onChange} type={type} className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]" />
    </div>
  );
}
