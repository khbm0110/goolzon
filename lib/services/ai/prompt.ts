// Shared instructions every provider gets — keeps the rewriting style
// consistent no matter which model is doing it, and asks for strict
// JSON back so the caller doesn't have to guess the shape.
export function buildRewritePrompt(sourceTitle: string, sourceText: string): string {
  return `أنت محرر رياضي محترف يكتب بالعربية الفصحى الإخبارية.
أعد صياغة الخبر التالي بأسلوبك الخاص بالكامل (ممنوع نسخ أي جملة حرفيًا من النص الأصلي) مع الحفاظ على كل الحقائق والأرقام والأسماء كما هي بالضبط.

العنوان الأصلي: ${sourceTitle}
النص الأصلي:
"""
${sourceText}
"""

أجب بصيغة JSON فقط، بدون أي نص إضافي قبله أو بعده، وبدون علامات كود markdown، بهذا الشكل بالضبط:
{"title": "عنوان جديد مُعاد صياغته", "summary": "ملخص من سطر إلى سطرين", "content": "نص الخبر كامل مُعاد صياغته بعدة فقرات"}`;
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
