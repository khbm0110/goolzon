// Shared instructions every provider gets — the `persona` is the one
// thing that changes between agents (see supabase/schema.sql →
// ai_agents.persona), so each agent actually sounds different instead
// of every rewritten article reading the same regardless of who wrote it.
//
// NOTE: we deliberately do NOT ask the model for JSON. Free-tier /
// smaller models (Groq's Llama, etc.) reliably break JSON the moment a
// source title contains an apostrophe or quote (e.g. "Cruel Pancake'"),
// producing invalid JSON that crashes parsing. A plain delimiter format
// has no escaping rules to get wrong, so it's dramatically more robust.
function buildOutputFormatInstructions(allowedCategories?: string[]): string {
  const categoryLine = allowedCategories?.length
    ? `تصنيف: <اختر تصنيفًا واحدًا فقط من هذه القائمة بالضبط كما هو مكتوب: ${allowedCategories.join(' | ')}>\n`
    : '';
  return `أجب بالضبط بهذا الشكل النصي، بدون أي شيء قبله أو بعده، وبدون Markdown:

عنوان: <العنوان الجديد هنا في سطر واحد>
ملخص: <ملخص من سطر إلى سطرين>
${categoryLine}محتوى:
<نص الخبر الكامل من هنا حتى نهاية الرد>`;
}

const LANGUAGE_AND_LENGTH_RULES = `شروط إلزامية غير قابلة للتفاوض:
- اكتب حصراً باللغة العربية الفصحى الحديثة (الصحافية). ممنوع منعًا باتًا أي كلمة أو جملة بالإنجليزية إلا أسماء الأعلام التي لا تُترجم (أسماء لاعبين/أندية أجنبية تُكتب بحروف عربية إن أمكن).
- طول المحتوى (حقل "محتوى:") يجب ألا يقل عن {MIN_WORDS} كلمة، موزّعة على عدة فقرات حقيقية، وليس فقرة واحدة قصيرة.
- ممنوع نسخ أي جملة حرفيًا من النص الأصلي — إعادة صياغة كاملة بأسلوبك.
- حافظ على كل الحقائق والأرقام والأسماء كما هي بالضبط دون اختراع تفاصيل غير موجودة في المصدر.`;

export function buildRewritePrompt(
  sourceTitle: string,
  sourceText: string,
  persona: string,
  minWords: number = 250,
  allowedCategories?: string[],
): string {
  return `${persona}

${LANGUAGE_AND_LENGTH_RULES.replace('{MIN_WORDS}', String(minWords))}

أعد صياغة الخبر التالي بأسلوبك الخاص بالكامل:

العنوان الأصلي: ${sourceTitle}
النص الأصلي:
"""
${sourceText}
"""

${buildOutputFormatInstructions(allowedCategories)}`;
}

// For the analysis agent's match_analysis flow — there's no "original
// article" to rewrite, just structured match data to turn into prose.
export function buildAnalysisPrompt(persona: string, matchSummary: string, minWords: number = 250): string {
  return `${persona}

${LANGUAGE_AND_LENGTH_RULES.replace('{MIN_WORDS}', String(minWords))}

اكتب تحليلًا تكتيكيًا لهذه المباراة بناءً على البيانات التالية فقط (لا تخترع إحصائيات أو أحداث غير مذكورة):
"""
${matchSummary}
"""

${buildOutputFormatInstructions()}`;
}

// Parses the delimiter format above. Falls back to a legacy JSON parse
// for safety in case any caller still hits an old-style response.
export function parseRewriteResponse(raw: string): { title: string; summary: string; content: string; category?: string } {
  const cleaned = raw
    .trim()
    .replace(/^```[a-z]*\s*/i, '')
    .replace(/```\s*$/, '')
    .trim();

  const titleMatch = cleaned.match(/عنوان:\s*(.+)/);
  const summaryMatch = cleaned.match(/ملخص:\s*(.+)/);
  const categoryMatch = cleaned.match(/تصنيف:\s*(.+)/);
  const contentMatch = cleaned.match(/محتوى:\s*([\s\S]+)/);

  if (titleMatch && contentMatch) {
    return {
      title: titleMatch[1].trim(),
      summary: summaryMatch ? summaryMatch[1].trim() : '',
      content: contentMatch[1].trim(),
      category: categoryMatch ? categoryMatch[1].trim() : undefined,
    };
  }

  // Legacy/defensive fallback: some providers may still wrap a JSON object.
  try {
    const jsonLike = cleaned.replace(/^```json\s*/i, '').replace(/```\s*$/, '');
    const start = jsonLike.indexOf('{');
    const end = jsonLike.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      const parsed = JSON.parse(jsonLike.slice(start, end + 1));
      if (parsed.title && parsed.content) {
        return {
          title: String(parsed.title),
          summary: String(parsed.summary ?? ''),
          content: String(parsed.content),
        };
      }
    }
  } catch {
    // fall through to the error below
  }

  throw new Error('AI response is missing title/content (unrecognized format)');
}
