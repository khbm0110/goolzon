import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getSmartImageUrl } from "./imageService";
import { MatchDetails } from "../types";

// Helper to get a singleton AI instance.
let ai: GoogleGenAI | null = null;
const getAI = () => {
  if (ai) return ai;
  // FIX: Per coding guidelines, the API key must be obtained from process.env.API_KEY.
  if (process.env.API_KEY) {
    ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    return ai;
  }
  console.warn("API_KEY is not configured in environment variables.");
  return null;
};

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  category: string;
  tags: string[];
  sources?: { title: string; uri: string }[];
  hasNews?: boolean;
  imageKeyword?: string;
  imageUrl: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchDailyHeadlines = async (): Promise<string[]> => {
  const ai = getAI();
  if (!ai) return ["فوز الهلال في الدوري", "تألق رونالدو مع النصر", "الدوري الإماراتي يشتعل"];

  const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `
    أنت محرر رياضي خبير.
    اليوم هو: ${today}.
    
    المهمة: ابحث في جوجل عن أهم 6 عناوين أخبار رياضية *حقيقية* حدثت اليوم في الخليج (السعودية، الإمارات، قطر، الكويت).
    
    الشروط:
    1. الأخبار يجب أن تكون من الـ 24 ساعة الماضية حصراً.
    2. التنويع ضروري: لا تجلب كل الأخبار عن الهلال والنصر فقط. ابحث عن (العين، السد، المنتخب، انتقالات، إصابات).
    3. أعد النتيجة كمصفوفة JSON نصوص فقط.
    
    Example Output Format:
    ["فوز الاتحاد على الوحدة", "إصابة سالم الدوسري", "تصريح مدرب العين قبل القمة"]
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text;
    if (!text) return [];
    
    // Clean up JSON
    let jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
    
    // Robust extraction
    const start = jsonStr.indexOf('[');
    const end = jsonStr.lastIndexOf(']');
    if (start !== -1 && end !== -1) {
        jsonStr = jsonStr.substring(start, end + 1);
    }
    
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Error fetching headlines:", e);
    return ["تعذر جلب العناوين المباشرة، تحقق من الاتصال"];
  }
};

export const generateArticleContent = async (topic: string, retries = 3, excludeTitles: string[] = []): Promise<GeneratedArticle | null> => {
  const ai = getAI();
  if (!ai) {
    console.error("Gemini API key is not configured. Cannot generate article.");
    return null;
  }

  const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    أنت رئيس تحرير موقع "goolzon" الرياضي.
    التاريخ اليوم: ${today}.
    
    المهمة: ابحث واكتب مقالاً رياضياً حصرياً حول: "${topic}".
    
    قواعد صارمة جداً (Strict Rules):
    1. **الوقت:** ابحث عن معلومات هذا الخبر التي حدثت في آخر 24 ساعة فقط. إذا كان الموضوع عاماً، ابحث عن أحدث تطوراته اليوم. تجاهل أي نتائج بحث قديمة.
    2. **المصداقية:** استخدم Google Search للتأكد من النتيجة وتفاصيل الحدث (مسجلي الأهداف، التصريحات).
    3. **التنوع:** لا تركز فقط على الهلال والنصر إلا إذا كان الموضوع عنهم. غطِ جميع الأندية الخليجية.
    4. **الأسلوب:** صحفي، احترافي، ومثير للحماس.
    5. **تنسيق المحتوى (Content Format):** حقل "content" يجب أن يكون نصاً واحداً (string) يحتوي على HTML. **لتجنب أخطاء تحليل JSON، استخدم دائماً علامات الاقتباس الفردية (') لخصائص HTML** (مثال: <p class='example'>).

    OUTPUT FORMAT (JSON ONLY):
    {
      "hasNews": true,
      "title": "عنوان جذاب جداً وشامل",
      "summary": "ملخص دقيق للخبر (سطرين)",
      "content": "<p class='important-news'>هذا هو محتوى المقال.</p><p>فقرة إضافية بالتفاصيل.</p>",
      "category": "الدولة (السعودية/الإمارات/قطر...)",
      "tags": ["تاج1", "تاج2"],
      "imageKeyword": "keyword for image search (e.g. Ittihad, Stadium, Trophy)"
    }
  `;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
          ]
        }
      });

      const text = response.text;
      if (!text) throw new Error("Empty response from AI");

      let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
      
      const firstBrace = jsonString.indexOf('{');
      const lastBrace = jsonString.lastIndexOf('}');
      
      if (firstBrace !== -1 && lastBrace !== -1) {
        jsonString = jsonString.substring(firstBrace, lastBrace + 1);
      }
      
      let articleData;
      try {
        articleData = JSON.parse(jsonString);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        if (attempt === retries) return null;
        continue;
      }

      const invalidTitles = ["لا توجد أخبار", "لا جديد", "لم يتم العثور", "No news"];
      if (invalidTitles.some(t => articleData.title.includes(t))) {
         return null;
      }

      const resolvedImageUrl = getSmartImageUrl(articleData.imageKeyword || topic);

      return {
        ...articleData,
        imageUrl: resolvedImageUrl,
        sources: [] 
      };

    } catch (error: any) {
      const errorMsg = error?.message || error?.toString() || JSON.stringify(error || {});
      const isQuotaError = errorMsg.includes('429') || errorMsg.includes('RESOURCE_EXHAUSTED');

      if (isQuotaError) {
        console.warn(`Gemini Quota Exceeded. Pausing.`);
        return null; 
      }
      
      if (attempt < retries) await sleep(attempt * 2000);
      else return null;
    }
  }

  return null;
};