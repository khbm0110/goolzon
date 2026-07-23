'use client';

import { useState } from 'react';
import { X, Edit, Save } from 'lucide-react';

interface Agent {
  id: string;
  name: string;
  persona: string;
  provider_id: string;
  source_type: 'rss' | 'match_analysis' | 'google_trends';
  rss_sources: { name: string; url: string }[];
  keywords: string[];
  min_words: number;
  byline: string;
  enabled: boolean;
}

const SOURCE_TYPE_LABEL: Record<Agent['source_type'], string> = {
  rss: 'مصادر RSS',
  match_analysis: 'بيانات مبارياتنا تلقائيًا بعد كل مباراة',
  google_trends: 'مواضيع كرة القدم المتصدّرة بـ Google Trends',
};

export default function AgentCard({
  agent,
  providers,
  onToggle,
  onChangeProvider,
  onSavePersona,
  onAddRss,
  onRemoveRss,
  onAddKeyword,
  onRemoveKeyword,
  onSaveByline,
  onSaveMinWords,
}: {
  agent: Agent;
  providers: { id: string; name: string; configured: boolean }[];
  onToggle: () => void;
  onChangeProvider: (providerId: string) => void;
  onSavePersona: (persona: string) => void;
  onAddRss: (name: string, url: string) => void;
  onRemoveRss: (url: string) => void;
  onAddKeyword: (keyword: string) => void;
  onRemoveKeyword: (keyword: string) => void;
  onSaveByline: (byline: string) => void;
  onSaveMinWords: (minWords: number) => void;
}) {
  const [editingPersona, setEditingPersona] = useState(false);
  const [personaDraft, setPersonaDraft] = useState(agent.persona);
  const [newRssName, setNewRssName] = useState('');
  const [newRssUrl, setNewRssUrl] = useState('');
  const [newKeyword, setNewKeyword] = useState('');
  const [bylineDraft, setBylineDraft] = useState(agent.byline);

  const currentProvider = providers.find((p) => p.id === agent.provider_id);

  return (
    <div className="bg-[var(--bg-surface)] border border-[var(--border-subtle)] rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="font-bold text-[var(--fg)]">{agent.name}</p>
          <p className="text-xs text-[var(--fg-faint)]">المصدر: {SOURCE_TYPE_LABEL[agent.source_type]}</p>
        </div>
        <button
          onClick={onToggle}
          className={`px-3 py-1.5 rounded-lg text-xs font-bold flex-shrink-0 ${agent.enabled ? 'bg-emerald-500/10 text-emerald-400' : 'bg-[var(--bg-surface-2)] text-[var(--fg-faint)]'}`}
        >
          {agent.enabled ? 'مفعّل' : 'موقوف'}
        </button>
      </div>

      <div className="mb-3">
        <label className="block text-xs text-[var(--fg-subtle)] mb-1">النموذج</label>
        <select
          value={agent.provider_id}
          onChange={(e) => onChangeProvider(e.target.value)}
          className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-sm text-[var(--fg)]"
        >
          {providers.map((p) => (
            <option key={p.id} value={p.id}>{p.name} {p.configured ? '' : '— بدون مفتاح API'}</option>
          ))}
        </select>
        {currentProvider && !currentProvider.configured && (
          <p className="text-xs text-amber-500 mt-1">⚠️ ما فيه مفتاح API مضبوط لهذا النموذج — هذا الوكيل بيفشل لين تضيفه.</p>
        )}
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <label className="block text-xs text-[var(--fg-subtle)]">الشخصية (System Prompt)</label>
          {!editingPersona && (
            <button onClick={() => { setPersonaDraft(agent.persona); setEditingPersona(true); }} className="text-[var(--fg-faint)] hover:text-primary">
              <Edit size={12} />
            </button>
          )}
        </div>
        {editingPersona ? (
          <div className="space-y-2">
            <textarea
              value={personaDraft}
              onChange={(e) => setPersonaDraft(e.target.value)}
              rows={4}
              className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-3 py-2 text-xs text-[var(--fg)]"
            />
            <div className="flex gap-2">
              <button
                onClick={() => { onSavePersona(personaDraft); setEditingPersona(false); }}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-primary/10 text-primary"
              >
                <Save size={12} /> حفظ
              </button>
              <button onClick={() => setEditingPersona(false)} className="px-2.5 py-1 rounded-lg text-xs font-bold text-[var(--fg-faint)]">إلغاء</button>
            </div>
          </div>
        ) : (
          <p className="text-xs text-[var(--fg-faint)] bg-[var(--bg-base)] rounded-lg p-2.5 line-clamp-2">{agent.persona}</p>
        )}
      </div>

      {agent.source_type === 'rss' && (
        <div className="mb-3">
          <label className="block text-xs text-[var(--fg-subtle)] mb-1.5">
            كلمات مفتاحية لتحديد النطاق (دوري/نادٍ) — فاضية = يعالج كل الأخبار بدون فلترة
          </label>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {(agent.keywords ?? []).length === 0 && <p className="text-xs text-[var(--fg-faint)]">بدون فلترة حاليًا.</p>}
            {(agent.keywords ?? []).map((kw) => (
              <span key={kw} className="flex items-center gap-1 bg-[var(--bg-base)] text-[var(--fg-muted)] text-xs px-2 py-1 rounded-full">
                {kw}
                <button onClick={() => onRemoveKeyword(kw)} className="hover:text-red-500">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
          <div className="flex gap-1.5">
            <input
              value={newKeyword}
              onChange={(e) => setNewKeyword(e.target.value)}
              placeholder="مثال: الدوري الإنجليزي، مانشستر سيتي"
              className="flex-1 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--fg)]"
            />
            <button
              onClick={() => {
                if (!newKeyword.trim()) return;
                onAddKeyword(newKeyword.trim());
                setNewKeyword('');
              }}
              className="px-3 py-1.5 bg-primary hover:bg-emerald-600 text-white rounded-lg text-xs font-bold whitespace-nowrap"
            >
              إضافة
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 mb-3">
        <div>
          <label className="block text-xs text-[var(--fg-subtle)] mb-1.5">التوقيع (Byline)</label>
          <input
            value={bylineDraft}
            onChange={(e) => setBylineDraft(e.target.value)}
            onBlur={() => bylineDraft !== agent.byline && onSaveByline(bylineDraft)}
            className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--fg)]"
          />
        </div>
        <div>
          <label className="block text-xs text-[var(--fg-subtle)] mb-1.5">الحد الأدنى لعدد الكلمات</label>
          <input
            type="number"
            min={50}
            value={agent.min_words}
            onChange={(e) => onSaveMinWords(Number(e.target.value))}
            className="w-full bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--fg)]"
          />
        </div>
      </div>

      {agent.source_type === 'rss' && (
        <div>
          <label className="block text-xs text-[var(--fg-subtle)] mb-1.5">مصادر RSS الخاصة بهذا الوكيل</label>
          <div className="space-y-1.5 mb-2">
            {(agent.rss_sources ?? []).length === 0 && <p className="text-xs text-[var(--fg-faint)]">ما فيه مصادر مضافة بعد.</p>}
            {(agent.rss_sources ?? []).map((s) => (
              <div key={s.url} className="flex items-center justify-between gap-2 bg-[var(--bg-base)] rounded-lg p-2">
                <div className="min-w-0">
                  <p className="text-xs font-bold text-[var(--fg)] truncate">{s.name}</p>
                  <p className="text-[10px] text-[var(--fg-faint)] truncate" dir="ltr">{s.url}</p>
                </div>
                <button onClick={() => onRemoveRss(s.url)} className="flex-shrink-0 p-1 rounded text-[var(--fg-faint)] hover:bg-red-500/10 hover:text-red-500">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <div className="flex flex-col sm:flex-row gap-1.5">
            <input value={newRssName} onChange={(e) => setNewRssName(e.target.value)} placeholder="اسم المصدر" className="flex-1 bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--fg)]" />
            <input value={newRssUrl} onChange={(e) => setNewRssUrl(e.target.value)} placeholder="https://example.com/feed" dir="ltr" className="flex-[2] bg-[var(--bg-surface-2)] border border-[var(--border)] rounded-lg px-2.5 py-1.5 text-xs text-[var(--fg)]" />
            <button
              onClick={() => {
                if (!newRssName.trim() || !newRssUrl.trim()) return;
                onAddRss(newRssName.trim(), newRssUrl.trim());
                setNewRssName('');
                setNewRssUrl('');
              }}
              className="px-3 py-1.5 bg-primary hover:bg-emerald-600 text-white rounded-lg text-xs font-bold whitespace-nowrap"
            >
              إضافة
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
