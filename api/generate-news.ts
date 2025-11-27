
import { GoogleGenAI, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { getSupabase } from '../services/supabaseClient';
import { getGeminiApiKeyForTopic } from '../services/keyManager';
import { getSmartImageUrl } from '../services/imageService';
import { Category } from '../types';

export default async function handler(request: any, response: any) {
  // 1. Verify Vercel Cron Secret for security
  if (request.headers['x-vercel-cron-secret'] !== process.env.CRON_SECRET) {
      // Allow manual trigger for testing if needed, or fail
      // return response.status(401).json({ error: 'Unauthorized' });
      console.log("Manual trigger or unauthorized access attempt.");
  }

  const supabase = getSupabase();
  if (!supabase) {
    return response.status(500).json({ error: "Supabase not configured." });
  }

  // 2. Select a Topic
  const trendingTopics = [
     'الدوري السعودي', 'الهلال', 'النصر', 'كريستيانو رونالدو', 
     'الدوري الإماراتي', 'العين', 'السد القطري', 'المنتخب السعودي',
     'دوري أبطال آسيا', 'انتقالات اللاعبين الخليج', 'الاتحاد السعودي'
  ];
  const topic = trendingTopics[Math.floor(Math.random() * trendingTopics.length)];
  const apiKey = getGeminiApiKeyForTopic(topic);
  
  if (!apiKey) {
      return response.status(500).json({ error: "Gemini API Key missing." });
  }

  // 3. Generate Content (Using same logic as geminiService but adapted for serverless)
  const ai = new GoogleGenAI({ apiKey });
  const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  const prompt = `
    أنت رئيس تحرير موقع "goolzon" الرياضي.
    التاريخ اليوم: ${today}.
    المهمة: ابحث واكتب مقالاً رياضياً حصرياً حول: "${topic}".
    الشروط:
    1. ابحث عن أخبار آخر 24 ساعة فقط.
    2. استخدم Google Search للتأكد من المعلومات.
    3. الأسلوب صحفي احترافي.
    4. أعد النتيجة كـ JSON يحتوي على: title, summary, content (HTML), category, imageKeyword.
  `;

  try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: {
          tools: [{ googleSearch: {} }],
          responseMimeType: "application/json", // Use JSON mode for cleaner output
        }
      });

      const text = aiResponse.text;
      if (!text) throw new Error("Empty AI Response");
      
      const articleData = JSON.parse(text);

      // 4. Validate (Basic duplicate check via Title)
      const { data: existing } = await supabase
        .from('articles')
        .select('title')
        .ilike('title', `%${articleData.title.substring(0, 20)}%`)
        .limit(1);

      if (existing && existing.length > 0) {
          return response.status(200).json({ message: "Duplicate content detected, skipped." });
      }

      // 5. Save to Database
      const categoryValues = Object.values(Category) as string[];
      const safeCategory = categoryValues.includes(articleData.category)
        ? articleData.category
        : Category.SAUDI;
      
      // Since we don't have access to imageService logic fully here (browser-only sometimes), 
      // we might need to inline specific image logic or mock it. 
      // For now, we use a generic placeholder or the logic if imports work (Node support).
      const imageUrl = getSmartImageUrl(articleData.imageKeyword || topic); 

      const newArticle = {
        id: `ai-cron-${Date.now()}`,
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        imageUrl: imageUrl,
        category: safeCategory,
        date: new Date().toISOString(),
        author: 'هيئة التحرير', // Editorial Board
        views: 0,
        isBreaking: articleData.hasNews || false,
      };

      const { error } = await supabase.from('articles').insert([newArticle]);
      
      if (error) throw error;

      return response.status(200).json({ message: "Article generated and published.", article: newArticle.title });

  } catch (error: any) {
      console.error(error);
      return response.status(500).json({ error: error.message });
  }
}
