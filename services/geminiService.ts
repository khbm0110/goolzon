


import { GoogleGenAI } from "@google/genai";
import { getSmartImageUrl } from "./imageService";
import { Match, ExtractedMatchFacts } from "../types";
import { getGeminiApiKeyForTopic, getGeminiApiKeyForHeadlines } from './keyManager';

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

// Step 2 of the Triple-Check system: Extracts facts from generated text.
const extractFactsFromArticleContent = async (apiKey: string, content: string): Promise<ExtractedMatchFacts | null> => {
    const ai = new GoogleGenAI({ apiKey });
    const prompt = `
        You are a data extraction robot. Analyze the following sports article text.
        Your only job is to extract the match result if it exists.

        RULES:
        1. If the article is clearly about a specific match with a final score, extract the home team, away team, home score, and away score.
        2. If the article is NOT about a specific match result (e.g., it's a transfer rumor, analysis, or general news), you MUST return null for home_score and away_score.
        3. The team names should be the Arabic names mentioned in the text.
        4. Return ONLY a single JSON object. Do not add any other text.

        Article Text:
        """
        ${content}
        """

        JSON Output format:
        {
          "home_team": "...",
          "away_team": "...",
          "home_score": ...,
          "away_score": ...
        }
    `;
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });
        // FIX: Add null check for response.text before calling trim()
        const text = response.text;
        if (!text) return null;

        let jsonString = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const firstBrace = jsonString.indexOf('{');
        const lastBrace = jsonString.lastIndexOf('}');
        if (firstBrace !== -1 && lastBrace !== -1) {
            jsonString = jsonString.substring(firstBrace, lastBrace + 1);
            return JSON.parse(jsonString);
        }
        return null;
    } catch (e) {
        console.error("Error extracting facts:", e);
        return null;
    }
};

export const fetchDailyHeadlines = async (): Promise<string[]> => {
  const apiKey = getGeminiApiKeyForHeadlines();
  if (!apiKey) {
    console.warn("No Gemini API key configured for headlines. Cannot fetch.");
    return ["فوز الهلال في الدوري", "تألق رونالدو مع النصر", "الدوري الإماراتي يشتعل"];
  }

  const ai = new GoogleGenAI({ apiKey });

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

export const generateArticleContent = async (topic: string, allMatches: Match[], retries = 3): Promise<GeneratedArticle | null> => {
  const apiKey = getGeminiApiKeyForTopic(topic);
  if (!apiKey) {
    console.error("Gemini API key is not configured. Cannot generate article.");
    throw new Error("API Key for Gemini is not configured.");
  }

  const ai = new GoogleGenAI({ apiKey });

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
      // Step 1: Generate the article
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
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
      
      let articleData: GeneratedArticle;
      try {
        articleData = JSON.parse(jsonString);
      } catch (e) {
        console.error("JSON Parse Error:", e);
        if (attempt === retries) throw new Error("Failed to parse AI response as JSON after multiple retries.");
        continue;
      }
      
      // --- Step 2 & 3: Extract & Validate ---
      console.log("Validation Step: Extracting facts from generated content...");
      const extractedFacts = await extractFactsFromArticleContent(apiKey, articleData.content);

      // If it's a non-match report (rumor, analysis), skip validation. This is key.
      if (!extractedFacts || extractedFacts.home_score === null || extractedFacts.away_score === null) {
          console.log("Validation Step: Article is not a match result. Skipping score validation.");
      } else {
          console.log("Validation Step: Match result detected. Comparing with source of truth.", extractedFacts);
          const sourceOfTruth = allMatches.find(m => 
              m.status === 'FINISHED' &&
              (topic.includes(m.homeTeam) || extractedFacts.home_team?.includes(m.homeTeam)) &&
              (topic.includes(m.awayTeam) || extractedFacts.away_team?.includes(m.awayTeam))
          );
          
          if (sourceOfTruth) {
              if (sourceOfTruth.scoreHome !== extractedFacts.home_score || sourceOfTruth.scoreAway !== extractedFacts.away_score) {
                  const errorMsg = `فشل التحقق: النتيجة في المقال (${extractedFacts.home_score}-${extractedFacts.away_score}) لا تطابق النتيجة الصحيحة (${sourceOfTruth.scoreHome}-${sourceOfTruth.scoreAway}).`;
                  console.error(errorMsg);
                  throw new Error(errorMsg);
              }
              console.log("Validation Step: Success! Scores are consistent.");
          } else {
              console.warn("Validation Step: Could not find a matching finished game in data to verify against.");
          }
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
        throw new Error("Gemini quota exceeded.");
      }
      
      if (attempt < retries) {
        await sleep(attempt * 2000);
      } else {
        throw error; // Rethrow the last error to be caught by the UI
      }
    }
  }

  return null;
};