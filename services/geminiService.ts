
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getSmartImageUrl } from "./imageService";
import { MatchDetails } from "../types";
import { SQUAD_LISTS } from "../constants";

// Helper to get AI instance with dynamic key or fallback to env
const getAI = (apiKey?: string) => {
  const key = apiKey || process.env.API_KEY;
  if (!key) return null;
  return new GoogleGenAI({ apiKey: key });
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
  // FIX: The imageUrl property was optional, causing a type mismatch with the Article interface where it is required.
  // Making imageUrl required to ensure type compatibility.
  imageUrl: string;
}

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- HYBRID SYSTEM: LOCAL LOGIC ENGINE ---

const getRandomPlayers = (teamName: string): string[] => {
  if (SQUAD_LISTS[teamName]) return SQUAD_LISTS[teamName];
  return Array(11).fill(0).map((_, i) => `اللاعب ${i + 1}`);
};

const generateEvents = (homeTeam: string, awayTeam: string, scoreHome: number | null, scoreAway: number | null) => {
  const events = [];
  const sHome = scoreHome || 0;
  const sAway = scoreAway || 0;

  for (let i = 0; i < sHome; i++) {
    events.push({
      time: `${Math.floor(Math.random() * 85) + 5}'`,
      team: 'HOME' as const,
      type: 'GOAL' as const,
      player: getRandomPlayers(homeTeam)[Math.floor(Math.random() * 5) + 5]
    });
  }
  for (let i = 0; i < sAway; i++) {
    events.push({
      time: `${Math.floor(Math.random() * 85) + 5}'`,
      team: 'AWAY' as const,
      type: 'GOAL' as const,
      player: getRandomPlayers(awayTeam)[Math.floor(Math.random() * 5) + 5]
    });
  }

  if (Math.random() > 0.5) {
     events.push({ time: `${Math.floor(Math.random() * 80) + 10}'`, team: Math.random() > 0.5 ? 'HOME' : 'AWAY', type: 'YELLOW', player: 'مدافع' });
  }

  return events.sort((a, b) => parseInt(a.time) - parseInt(b.time));
};

export const getMatchDetails = async (homeTeam: string, awayTeam: string, scoreHome: number | null, scoreAway: number | null): Promise<MatchDetails | null> => {
  await sleep(600); 

  const isHomeWinner = (scoreHome || 0) > (scoreAway || 0);
  const totalGoals = (scoreHome || 0) + (scoreAway || 0);
  
  let possession = 50;
  if (homeTeam.includes('الهلال') || homeTeam.includes('السد')) possession += 10;
  if (awayTeam.includes('الهلال') || awayTeam.includes('السد')) possession -= 10;
  if (isHomeWinner) possession += 5;
  
  possession = Math.max(35, Math.min(65, possession));

  return {
    stats: {
      possession: possession,
      shotsHome: (scoreHome || 0) * 3 + Math.floor(Math.random() * 5) + 2,
      shotsAway: (scoreAway || 0) * 3 + Math.floor(Math.random() * 5) + 2,
      shotsOnTargetHome: (scoreHome || 0) + Math.floor(Math.random() * 3) + 1,
      shotsOnTargetAway: (scoreAway || 0) + Math.floor(Math.random() * 3) + 1,
      cornersHome: Math.floor(Math.random() * 8),
      cornersAway: Math.floor(Math.random() * 8),
    },
    lineups: {
      home: getRandomPlayers(homeTeam),
      away: getRandomPlayers(awayTeam)
    },
    events: generateEvents(homeTeam, awayTeam, scoreHome, scoreAway),
    summary: totalGoals > 3 ? "مباراة مثيرة مليئة بالأهداف والفرص الضائعة" : "مباراة تكتيكية مغلقة من الطرفين"
  };
};

export const fetchDailyHeadlines = async (apiKey?: string): Promise<string[]> => {
  const ai = getAI(apiKey);
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

export const generateArticleContent = async (topic: string, apiKey?: string, retries = 3, excludeTitles: string[] = []): Promise<GeneratedArticle | null> => {
  const ai = getAI(apiKey);
  if (!ai) {
    console.warn("API Key not found. Returning mock data.");
    return {
      title: `مقال تجريبي عن: ${topic}`,
      summary: `هذا ملخص تم إنشاؤه تلقائيًا. الموضوع: ${topic}`,
      content: `هذا محتوى تجريبي طويل للمقال. في بيئة الإنتاج، سيقوم Gemini بإنشاء مقال رياضي احترافي كامل حول ${topic} متوافق مع SEO.`,
      category: 'السعودية',
      tags: ['رياضة', 'الخليج'],
      sources: [],
      imageUrl: getSmartImageUrl('default')
    };
  }

  const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const model = 'gemini-2.5-flash';
  
  const prompt = `
    أنت رئيس تحرير موقع "Gulf Sports" الرياضي.
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
