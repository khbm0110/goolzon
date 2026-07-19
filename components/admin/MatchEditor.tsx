'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Category, type Match } from '@/types';

interface MatchEditorProps {
  initialData: Match;
  onSave: (match: Match) => Promise<void>;
  onCancel: () => void;
}

export default function MatchEditor({ initialData, onSave, onCancel }: MatchEditorProps) {
  const [match, setMatch] = useState<Match>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => setMatch(initialData), [initialData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const { name, value } = e.target;
    if (name === 'scoreHome' || name === 'scoreAway') {
      setMatch((prev) => ({ ...prev, [name]: value === '' ? null : Number(value) }));
    } else {
      setMatch((prev) => ({ ...prev, [name]: value }));
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!match.homeTeam || !match.awayTeam) return;
    setSaving(true);
    await onSave(match);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_90%,transparent)] backdrop-blur-sm" onClick={onCancel} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-2xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--fg)]">بيانات المباراة</h2>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full text-[var(--fg-subtle)] hover:text-[var(--fg)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-4">
            <Field label="الفريق المضيف" name="homeTeam" value={match.homeTeam} onChange={handleChange} />
            <Field label="شعار المضيف (رابط)" name="homeLogo" value={match.homeLogo} onChange={handleChange} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="الفريق الضيف" name="awayTeam" value={match.awayTeam} onChange={handleChange} />
            <Field label="شعار الضيف (رابط)" name="awayLogo" value={match.awayLogo} onChange={handleChange} />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="هدف المضيف" name="scoreHome" value={match.scoreHome ?? ''} onChange={handleChange} type="number" />
            <Field label="هدف الضيف" name="scoreAway" value={match.scoreAway ?? ''} onChange={handleChange} type="number" />
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">الحالة</label>
              <select
                name="status"
                value={match.status}
                onChange={handleChange}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              >
                <option value="UPCOMING">لم تبدأ</option>
                <option value="LIVE">مباشر</option>
                <option value="FINISHED">انتهت</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="الوقت المعروض (مثال: 20:00 أو 45')" name="time" value={match.time} onChange={handleChange} />
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">الدوري / البطولة</label>
              <select
                name="country"
                value={match.country}
                onChange={handleChange}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              >
                {Object.entries(Category).map(([key, value]) => (
                  <option key={key} value={value}>{value}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="اسم الدوري (نص يظهر بالبطاقة)" name="league" value={match.league} onChange={handleChange} />
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">تاريخ ووقت المباراة</label>
              <input
                type="datetime-local"
                name="date"
                value={match.date ? match.date.slice(0, 16) : ''}
                onChange={handleChange}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Field label="الجولة (اختياري)" name="round" value={match.round ?? ''} onChange={handleChange} />
            <Field label="الملعب (اختياري)" name="venue" value={match.venue ?? ''} onChange={handleChange} />
          </div>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--fg-subtle)] hover:bg-[var(--bg-surface-2)]">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving || !match.homeTeam || !match.awayTeam}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-emerald-600 text-white disabled:opacity-50"
          >
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
  value: string | number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
}) {
  return (
    <div>
      <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">{label}</label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
      />
    </div>
  );
}
