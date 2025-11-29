import { GoogleGenAI, Type } from "@google/genai";

// Simplified image mapping for serverless
const getSmartImageUrl = (keyword: string) => {
    if (keyword.includes('الهلال')) return 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200';
    if (keyword.includes('النصر')) return 'https://images.unsplash.com/photo-1510563800743-aed236490d94?auto=format&fit=crop&q=80&w=1200';
    return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200';
};

// List of potential topics for the AI to explore
const NEWS_TOPICS = [
    "آخر أخبار نادي الهلال السعودي",
    "أحدث صفقات وانتقالات نادي النصر",
    "نتائج مباريات الدوري الإنجليزي اليوم",
    "تصريحات مدرب ريال مدريد بعد المباراة الأخيرة",
    "إصابات اللاعبين المهمة في دوري أبطال أوروبا"
];

export default async function handler(request: any, response: any) {
  const authHeader = request.headers['authorization'];
  const expectedSecret = `Bearer ${process.env.CRON_SECRET}`;

  if (authHeader !== expectedSecret) {
      return response.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return response.status(500).json({ error: "Gemini Key missing." });
  }

  try {
      const ai = new GoogleGenAI({ apiKey });
      
      const topic = NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)];
      
      const prompt = `
        أنت محرر صحفي خبير في منصة goolzon. مهمتك هي استخدام بحث جوجل للعثور على أحدث المعلومات حول الموضوع التالي: "${topic}".

        بناءً على نتائج البحث التي تجدها **فقط وحصراً**، قم بما يلي:
        1. اكتب مقالاً إخبارياً جديداً بالكامل باللغة العربية.
        2. أعد صياغة الخبر بأسلوب goolzon الخاص (حماسي, موجه للشباب, ومباشر).
        3. ابتكر عنواناً جديداً وجذاباً للخبر.
        4. **الأهم: لا تذكر اسم المصدر الأصلي (مثل Goal.com أو غيره) في المقال النهائي.** يجب أن يبدو المقال وكأنه من كتابتنا الأصلية بالكامل.
        5. أعد النتيجة النهائية بصيغة JSON بالهيكلية التالية بالضبط: 
        { 
          "title": "string", 
          "summary": "string", 
          "content": "string (محتوى المقال بتنسيق HTML بسيط مثل <p> و <h3>)", 
          "category": "string (اختر القسم الأنسب من: السعودية, الإمارات, الدوري الإنجليزي, الدوري الإسباني, دوري أبطال أوروبا, تحليلات)",
          "isBreaking": boolean (true إذا كان الخبر عاجلاً جداً)
        }
      `;

      const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            responseMimeType: "application/json",
            tools: [{ googleSearch: {} }]
        }
      });
      
      if (!aiResponse.text) {
          console.log("AI returned an empty response for topic:", topic);
          return response.status(200).json({ message: "No article generated, AI returned no content." });
      }

      const articleData = JSON.parse(aiResponse.text);

      if (!articleData.title || !articleData.content) {
          console.log("AI returned incomplete JSON for topic:", topic, articleData);
          return response.status(200).json({ message: "No article generated, AI returned incomplete data." });
      }
      
      console.log(`Generated article on topic "${topic}". In a real scenario, this would be saved to the database.`);

      return response.status(200).json({ message: `Article generated successfully on topic: "${topic}"` });

  } catch (error: any) {
      console.error("Error in generate-news handler:", error);
      return response.status(500).json({ error: error.message });
  }
}