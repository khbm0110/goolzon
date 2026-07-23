'use client';

import { useEffect, useState } from 'react';
import { Save, X, Info } from 'lucide-react';
import { AD_PLACEMENT_LABELS, type AdSlot, type AdPlacement } from '@/types';

interface AdSlotEditorProps {
  initialData: AdSlot;
  onSave: (slot: AdSlot) => Promise<void>;
  onCancel: () => void;
}

const PAGE_OPTIONS = [
  { key: 'all', label: 'كل الصفحات' },
  { key: 'home', label: 'الرئيسية' },
  { key: 'article', label: 'المقال' },
  { key: 'match', label: 'المباراة' },
  { key: 'club', label: 'النادي' },
  { key: 'player', label: 'اللاعب' },
  { key: 'standings', label: 'الترتيب' },
];

export default function AdSlotEditor({ initialData, onSave, onCancel }: AdSlotEditorProps) {
  const [slot, setSlot] = useState<AdSlot>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => setSlot(initialData), [initialData]);

  function togglePage(key: string) {
    if (key === 'all') {
      setSlot((prev) => ({ ...prev, pages: ['all'] }));
      return;
    }
    setSlot((prev) => {
      const withoutAll = prev.pages.filter((p) => p !== 'all');
      const has = withoutAll.includes(key);
      const next = has ? withoutAll.filter((p) => p !== key) : [...withoutAll, key];
      return { ...prev, pages: next.length === 0 ? ['all'] : next };
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot.label.trim()) return;
    setSaving(true);
    await onSave(slot);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_90%,transparent)] backdrop-blur-sm" onClick={onCancel} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--fg)]">فتحة إعلانية</h2>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full text-[var(--fg-subtle)] hover:text-[var(--fg)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">اسم توضيحي</label>
            <input
              value={slot.label}
              onChange={(e) => setSlot({ ...slot, label: e.target.value })}
              placeholder="مثال: AdSense - بانر الرئيسية"
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">موضع الظهور</label>
              <select
                value={slot.placement}
                onChange={(e) => setSlot({ ...slot, placement: e.target.value as AdPlacement })}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              >
                {(Object.keys(AD_PLACEMENT_LABELS) as AdPlacement[]).map((key) => (
                  <option key={key} value={key}>{AD_PLACEMENT_LABELS[key]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">الشبكة</label>
              <select
                value={slot.network}
                onChange={(e) => setSlot({ ...slot, network: e.target.value as AdSlot['network'] })}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              >
                <option value="adsense">Google AdSense</option>
                <option value="direct">راعٍ مباشر</option>
                <option value="other">أخرى</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">كود الإعلان (HTML/JS)</label>
            <textarea
              value={slot.code}
              onChange={(e) => setSlot({ ...slot, code: e.target.value })}
              rows={5}
              dir="ltr"
              placeholder='<ins class="adsbygoogle" ...></ins><script>...</script>'
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] font-mono text-xs"
            />
            <p className="flex items-center gap-1 text-[10px] text-[var(--fg-faint)] mt-1.5">
              <Info size={12} /> الصق كود الوحدة الإعلانية كما هو من AdSense أو الراعي.
            </p>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-2">تظهر في</label>
            <div className="flex flex-wrap gap-2">
              {PAGE_OPTIONS.map((p) => (
                <button
                  key={p.key}
                  type="button"
                  onClick={() => togglePage(p.key)}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-colors ${
                    slot.pages.includes(p.key)
                      ? 'bg-primary/10 text-primary border-primary/40'
                      : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)] border-transparent hover:text-[var(--fg)]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">تاريخ البداية (اختياري)</label>
              <input
                type="date"
                value={slot.startDate || ''}
                onChange={(e) => setSlot({ ...slot, startDate: e.target.value || null })}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1.5">تاريخ النهاية (اختياري)</label>
              <input
                type="date"
                value={slot.endDate || ''}
                onChange={(e) => setSlot({ ...slot, endDate: e.target.value || null })}
                className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)] text-sm"
              />
            </div>
          </div>

          <label className="flex items-center justify-between p-3 bg-[var(--bg-base)] rounded-lg cursor-pointer">
            <span className="text-sm font-bold text-[var(--fg-muted)]">تفعيل الفتحة فورًا</span>
            <input
              type="checkbox"
              checked={slot.enabled}
              onChange={(e) => setSlot({ ...slot, enabled: e.target.checked })}
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
            disabled={saving || !slot.label.trim()}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold bg-primary hover:bg-emerald-600 text-white disabled:opacity-50"
          >
            <Save size={16} /> {saving ? 'جارٍ الحفظ...' : 'حفظ'}
          </button>
        </div>
      </form>
    </div>
  );
}
