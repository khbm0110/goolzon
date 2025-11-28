
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

const getSupabase = () => {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createClient(url, key);
};

// Simplified image mapping for serverless
const getSmartImageUrl = (keyword: string) => {
    // Default fallback, ideally this logic matches the frontend service but simplified
    return 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200';
};

export default async function handler(request: any, response: any) {
  const authHeader = request.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
      return response.status(401).json({ error: 'Unauthorized' });
  }

  const supabase = getSupabase();
  const apiKey = process.env.GEMINI_API_KEY_DEFAULT || process.env.GEMINI_API_KEY_ARABIC_LEAGUES;

  if (!supabase || !apiKey) {
    return response.status(500).json({ error: "Supabase or Gemini Key missing." });
  }

  const ai = new GoogleGenAI({ apiKey });
  const topic = 'أخبار الدوري السعودي اليوم'; // Simplified topic selection
  
  const prompt = `
    أنت محرر رياضي. اكتب خبراً عاجلاً عن: "${topic}".
    التاريخ: ${new Date().toLocaleDateString('ar-SA')}.
    أعد النتيجة كـ JSON: { "title": "...", "summary": "...", "content": "...", "category": "السعودية", "hasNews": true }
  `;

  try {
      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });

      const articleData = JSON.parse(aiResponse.text || '{}');
      
      const newArticle = {
        id: `ai-cron-${Date.now()}`,
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        imageUrl: getSmartImageUrl(topic),
        category: articleData.category,
        date: new Date().toISOString(),
        author: 'AI Editor',
        views: 0,
        isBreaking: true,
      };

      await supabase.from('articles').insert([newArticle]);
      return response.status(200).json({ message: "Article generated." });

  } catch (error: any) {
      return response.status(500).json({ error: error.message });
  }
}
