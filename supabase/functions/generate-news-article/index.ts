// Follow this tutorial to get started with Supabase Functions:
// https://supabase.com/docs/guides/functions

// FIX: Add Deno type declaration for non-Deno environments that lack Deno globals.
declare const Deno: any;

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// FIX: Using latest version of @google/genai from esm.sh
import { GoogleGenAI } from "https://esm.sh/@google/genai";

// List of potential topics for the AI to explore
const NEWS_TOPICS = [
  "تحليل مباراة الهلال والنصر الأخيرة",
  "آخر أخبار انتقالات اللاعبين في الدوري السعودي للمحترفين",
  "تقييم أداء كريستيانو رونالدو مع النصر هذا الموسم",
  "مستقبل نيمار مع الهلال بعد الإصابة",
  "أبرز المواهب الشابة في الدوريات الخليجية",
  "ملخص وأهداف مباريات دوري أبطال أوروبا اليوم",
  "توقعات مباراة الكلاسيكو بين ريال مدريد وبرشلونة",
  "أخبار نادي الاتحاد واستعداداته للموسم الجديد"
];

// Simplified image mapping for serverless
const getSmartImageUrl = (keyword: string) => {
    const lowerKeyword = keyword.toLowerCase();
    if (lowerKeyword.includes('الهلال')) return 'https://images.unsplash.com/photo-1522778119026-d647f0565c6a?auto=format&fit=crop&q=80&w=1200';
    if (lowerKeyword.includes('النصر') || lowerKeyword.includes('رونالدو')) return 'https://images.unsplash.com/photo-1510563800743-aed236490d94?auto=format&fit=crop&q=80&w=1200';
    if (lowerKeyword.includes('الاتحاد')) return 'https://images.unsplash.com/photo-1577223625816-7546f13df25d?auto=format&fit=crop&q=80&w=1000';
    if (lowerKeyword.includes('ريال مدريد')) return 'https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?auto=format&fit=crop&q=80&w=1200';
    return 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&q=80&w=1200';
};


serve(async (req) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  };
  
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // 1. --- Security Check ---
  const authHeader = req.headers.get('Authorization');
  const cronSecret = Deno.env.get('CRON_SECRET');
  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }

  // 2. --- Initialize Clients ---
  // FIX: Use API_KEY environment variable as per guidelines.
  const geminiApiKey = Deno.env.get('API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');

  if (!geminiApiKey || !supabaseUrl || !supabaseAnonKey) {
    return new Response(JSON.stringify({ error: 'Missing environment variables' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
  
  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  try {
    // 3. --- Generate Article Content ---
    const topic = NEWS_TOPICS[Math.floor(Math.random() * NEWS_TOPICS.length)];
    
    const prompt = `
      أنت محرر صحفي رياضي خبير في منصة "goolzon". مهمتك هي استخدام بحث جوجل للعثور على أحدث المعلومات حول الموضوع التالي: "${topic}".

      بناءً على نتائج البحث التي تجدها **فقط وحصراً**، قم بما يلي:
      1. اكتب مقالاً إخبارياً جديداً بالكامل باللغة العربية. يجب أن يكون المقال من 3-4 فقرات على الأقل.
      2. أعد صياغة الخبر بأسلوب goolzon الخاص (حماسي, موجه للشباب, ومباشر).
      3. ابتكر عنواناً جديداً وجذاباً للخبر.
      4. **الأهم: لا تذكر اسم المصدر الأصلي (مثل Goal.com أو غيره) في المقال النهائي.** يجب أن يبدو المقال وكأنه من كتابتنا الأصلية بالكامل.
      5. أعد النتيجة النهائية بصيغة JSON بالهيكلية التالية بالضبط: 
      { 
        "title": "string", 
        "summary": "string", 
        "content": "string (محتوى المقال بتنسيق HTML بسيط باستخدام <p> و <h3>)", 
        "category": "string (اختر القسم الأنسب من: السعودية, الإمارات, الدوري الإنجليزي, الدوري الإسباني, دوري أبطال أوروبا, تحليلات)",
        "isBreaking": boolean (true إذا كان الخبر عاجلاً جداً ومنتشراً الآن)
      }
    `;

    const aiResponse = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { 
            // FIX: Removed responseMimeType as it is not allowed with googleSearch tool.
            tools: [{ googleSearch: {} }]
        }
    });

    if (!aiResponse.text) {
      throw new Error(`AI returned an empty response for topic: ${topic}`);
    }

    // FIX: Safely extract and parse JSON from the response text.
    let jsonString = aiResponse.text.trim();
    if (jsonString.startsWith('```json')) {
      jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    } else if (jsonString.startsWith('```')) {
      jsonString = jsonString.substring(3, jsonString.length - 3).trim();
    }
    const jsonStartIndex = jsonString.indexOf('{');
    const jsonEndIndex = jsonString.lastIndexOf('}');
    if (jsonStartIndex !== -1 && jsonEndIndex !== -1) {
      jsonString = jsonString.substring(jsonStartIndex, jsonEndIndex + 1);
    }
    
    const articleData = JSON.parse(jsonString);

    if (!articleData.title || !articleData.content || !articleData.summary) {
      throw new Error(`AI returned incomplete JSON for topic: ${topic}`);
    }

    // 4. --- Prepare and Save to Supabase ---
    const newArticle = {
        title: articleData.title,
        summary: articleData.summary,
        content: articleData.content,
        category: articleData.category || 'السعودية',
        image_url: getSmartImageUrl(topic),
        is_breaking: articleData.isBreaking || false,
        author: 'Autopilot',
        views: Math.floor(Math.random() * 500) + 50, // Random initial views
        date: new Date().toISOString(),
    };

    const { error: insertError } = await supabase.from('articles').insert(newArticle);

    if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error(`Failed to save article to database: ${insertError.message}`);
    }

    // 5. --- Return Success Response ---
    return new Response(JSON.stringify({ message: `Article generated and saved successfully on topic: "${topic}"` }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Function error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
