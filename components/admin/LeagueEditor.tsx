'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import type { League } from '@/types';

export default function LeagueEditor({
  initialData,
  onSave,
  onCancel,
}: {
  initialData: League;
  onSave: (league: League) => Promise<void>;
  onCancel: () => void;
}) {
  const [league, setLeague] = useState<League>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => setLeague(initialData), [initialData]);

  function slugify(name: string): string {
    return name
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9\u0600-\u06FF-]/g, '');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!league.name.trim()) return;
    setSaving(true);
    await onSave(league);
    setSaving(false);
  }

  const isNew = !initialData.id;

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_90%,transparent)] backdrop-blur-sm" onClick={onCancel} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-md bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--fg)]">{isNew ? 'دوري جديد' : 'تعديل الدوري'}</h2>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full text-[var(--fg-subtle)] hover:text-[var(--fg)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">الاسم (عربي)</label>
            <input
              value={league.name}
              onChange={(e) => setLeague((prev) => ({ ...prev, name: e.target.value, id: isNew ? slugify(e.target.value) : prev.id }))}
              placeholder="مثال: الدوري الأردني"
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
            />
            {isNew && league.id && <p className="text-[10px] text-[var(--fg-faint)] mt-1" dir="ltr">slug: {league.id}</p>}
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">التصنيف</label>
            <select
              value={league.region}
              onChange={(e) => setLeague((prev) => ({ ...prev, region: e.target.value as League['region'] }))}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
            >
              <option value="arab">عربي</option>
              <option value="european">أوروبي</option>
              <option value="other">أخرى</option>
            </select>
            <p className="text-[10px] text-[var(--fg-faint)] mt-1">يُستخدم لتصنيف المباريات بمركز النتائج (عربي/أوروبي).</p>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">ترتيب الظهور (رقم أصغر = أول)</label>
            <input
              type="number"
              value={league.sortOrder}
              onChange={(e) => setLeague((prev) => ({ ...prev, sortOrder: Number(e.target.value) }))}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
            />
          </div>

          <label className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-lg cursor-pointer">
            <span className="text-sm font-bold text-[var(--fg-muted)]">مفعّل (يظهر بقوائم الاختيار)</span>
            <input
              type="checkbox"
              checked={league.active}
              onChange={(e) => setLeague((prev) => ({ ...prev, active: e.target.checked }))}
              className="w-4 h-4 accent-emerald-500"
            />
          </label>
        </div>

        <div className="p-4 border-t border-[var(--border)] flex justify-end gap-2">
          <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg text-sm font-bold text-[var(--fg-subtle)] hover:bg-[var(--bg-surface-2)]">
            إلغاء
          </button>
          <button
            type="submit"
            disabled={saving || !league.name.trim() || !league.id}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-emerald-600 text-white disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </div>
  );
}
