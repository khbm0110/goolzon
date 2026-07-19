// Shared instructions every provider gets — the `persona` is the one
// thing that changes between agents (see supabase/schema.sql →
// ai_agents.persona), so each agent actually sounds different instead
// of every rewritten article reading the same regardless of who wrote it.
export function buildRewritePrompt(sourceTitle: string, sourceText: string, persona: string): string {
  return `${persona}

أعد صياغة الخبر التالي بأسلوبك الخاص بالكامل (ممنوع نسخ أي جملة حرفيًا من النص الأصلي) مع الحفاظ على كل الحقائق والأرقام والأسماء كما هي بالضبط.

العنوان الأصلي: ${sourceTitle}
النص الأصلي:
"""
${sourceText}
"""

أجب بصيغة JSON فقط، بدون أي نص إضافي قبله أو بعده، وبدون علامات كود markdown، بهذا الشكل بالضبط:
{"title": "عنوان جديد مُعاد صياغته", "summary": "ملخص من سطر إلى سطرين", "content": "نص الخبر كامل مُعاد صياغته بعدة فقرات"}`;
}

// For the analysis agent's match_analysis flow — there's no "original
// article" to rewrite, just structured match data to turn into prose.
export function buildAnalysisPrompt(persona: string, matchSummary: string): string {
  return `${persona}

اكتب تحليلًا تكتيكيًا لهذه المباراة بناءً على البيانات التالية فقط (لا تخترع إحصائيات أو أحداث غير مذكورة):
"""
${matchSummary}
"""

أجب بصيغة JSON فقط، بدون أي نص إضافي قبله أو بعده، وبدون علامات كود markdown، بهذا الشكل بالضبط:
{"title": "عنوان تحليلي جذاب", "summary": "ملخص من سطر إلى سطرين", "content": "التحليل الكامل بعدة فقرات"}`;
}

// Providers occasionally wrap JSON in ```json fences or add stray text
// despite instructions — this strips that defensively before parsing.
export function parseRewriteResponse(raw: string): { title: string; summary: string; content: string } {
  const cleaned = raw
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/, '')
    .replace(/```\s*$/, '')
    .trim();
  const parsed = JSON.parse(cleaned);
  if (!parsed.title || !parsed.content) {
    throw new Error('AI response is missing title/content');
  }
  return {
    title: String(parsed.title),
    summary: String(parsed.summary ?? ''),
    content: String(parsed.content),
  };
}
