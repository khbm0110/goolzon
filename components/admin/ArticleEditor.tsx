'use client';

import { useEffect, useState } from 'react';
import { Save, X } from 'lucide-react';
import { Article, Category } from '@/types';

interface ArticleEditorProps {
  initialData: Partial<Article>;
  onSave: (article: Article) => Promise<void>;
  onCancel: () => void;
  mode: 'NEW' | 'EDIT';
}

export default function ArticleEditor({ initialData, onSave, onCancel, mode }: ArticleEditorProps) {
  const [article, setArticle] = useState<Partial<Article>>(initialData);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setArticle(initialData);
  }, [initialData]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) {
    const { name, value, type } = e.target as HTMLInputElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setArticle((prev) => ({ ...prev, [name]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!article.title || !article.content) return;
    setSaving(true);
    await onSave(article as Article);
    setSaving(false);
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-10 px-4 pb-10 overflow-y-auto">
      <div className="absolute inset-0 bg-[color-mix(in_srgb,var(--bg-base)_90%,transparent)] backdrop-blur-sm" onClick={onCancel} />
      <form onSubmit={handleSubmit} className="relative w-full max-w-3xl bg-[var(--bg-surface)] border border-[var(--border)] rounded-2xl shadow-2xl">
        <div className="p-4 border-b border-[var(--border)] flex items-center justify-between">
          <h2 className="text-lg font-bold text-[var(--fg)]">{mode === 'NEW' ? 'مقال جديد' : 'تعديل المقال'}</h2>
          <button type="button" onClick={onCancel} className="p-2 hover:bg-[var(--bg-surface-2)] rounded-full text-[var(--fg-subtle)] hover:text-[var(--fg)]">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1">العنوان</label>
            <input name="title" value={article.title || ''} onChange={handleChange} required className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-[var(--fg-subtle)] mb-1">التصنيف</label>
              <select name="category" value={article.category} onChange={handleChange} className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]">
                {Object.values(Category).map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <label className="flex items-center gap-2 text-sm text-[var(--fg-muted)]">
                <input type="checkbox" name="isBreaking" checked={!!article.isBreaking} onChange={handleChange} className="w-4 h-4" />
                خبر عاجل
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1">رابط الصورة</label>
            <input name="imageUrl" value={article.imageUrl || ''} onChange={handleChange} className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1">الملخص</label>
            <textarea name="summary" value={article.summary || ''} onChange={handleChange} rows={2} className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]" />
          </div>

          <div>
            <label className="block text-sm text-[var(--fg-subtle)] mb-1">المحتوى</label>
            <textarea name="content" value={article.content || ''} onChange={handleChange} required rows={8} className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--fg)]" />
          </div>

          <p className="text-[11px] text-amber-500/80 border-t border-[var(--border-subtle)] pt-3">
            ⚠️ إعادة الكتابة بالذكاء الاصطناعي (Gemini) والاستيراد التلقائي عبر RSS سيُضافان في مرحلة لاحقة.
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
