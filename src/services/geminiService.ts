import { getSmartImageUrl } from "./imageService";
import { Match } from "../types";

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
  return [
      "رونالدو يقود النصر لفوز ثمين",
      "الهلال يقترب من حسم الدوري",
      "مانشستر سيتي يتعثر أمام ليفربول",
      "مفاجأة في تشكيلة المنتخب السعودي",
      "الاتحاد يوقع مع صفقة عالمية"
  ];
};

// محاكاة خدمة الذكاء الاصطناعي محلياً بدون استدعاء خارجي
export const generateArticleContent = async (topic: string, allMatches: Match[], retries = 3): Promise<GeneratedArticle | null> => {
  // محاكاة وقت التفكير
  await sleep(1000);

  const imageUrl = getSmartImageUrl(topic);

  // قوالب نصوص جاهزة
  const templates = [
      `شهدت الساحة الرياضية اليوم تطورات مثيرة بخصوص ${topic}. الجماهير تترقب بشغف ما ستؤول إليه الأمور في الأيام القادمة.`,
      `في خطوة مفاجئة، أصبح ${topic} حديث الشارع الرياضي. المحللون يؤكدون أن هذا الحدث سيغير موازين القوى.`,
      `تغطية خاصة وحصرية حول ${topic}. التفاصيل تشير إلى استعدادات مكثفة وتغييرات تكتيكية ملحوظة.`
  ];

  const randomContent = templates[Math.floor(Math.random() * templates.length)];

  return {
    title: `تقرير خاص: كل ما تريد معرفته عن ${topic}`,
    summary: `تفاصيل حصرية وتحليلات معمقة حول ${topic} وتأثيره على المنافسة.`,
    content: `
      <p class="lead">في تغطية خاصة وحصرية لمنصة <strong>goolzon</strong>، نسلط الضوء اليوم على موضوع <strong>${topic}</strong> الذي شغل الأوساط الرياضية.</p>
      
      <h3>التفاصيل</h3>
      <p>${randomContent}</p>
      
      <p>وقد صرح مصدر مسؤول قائلاً: "نحن نسعى دائماً للأفضل، وما يحدث الآن هو نتاج عمل شاق ومستمر". الجدير بالذكر أن الجماهير عبرت عن تفاؤلها الكبير بهذه المستجدات.</p>
      
      <h3>نظرة فنية</h3>
      <p>من الناحية الفنية، يبدو أن الأمور تسير في الاتجاه الصحيح. الأرقام والإحصائيات تدعم هذا التوجه، مما يبشر بمستقبل واعد.</p>
      
      <div class="alert alert-info">تابعونا لمعرفة المزيد من المستجدات فور حدوثها.</div>
    `,
    category: "السعودية", // تصنيف افتراضي
    tags: ["كرة قدم", "أخبار", "حصري"],
    hasNews: true,
    imageUrl: imageUrl,
    sources: []
  };
};