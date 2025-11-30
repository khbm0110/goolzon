
import { getSmartImageUrl } from "./imageService";
import { Match, Category } from "../types";

export interface GeneratedArticle {
  title: string;
  summary: string;
  content: string;
  category: Category;
  tags: string[];
  sources?: { title: string; uri: string }[];
  hasNews?: boolean;
  imageUrl: string;
}

// محاكاة تأخير الشبكة
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const fetchDailyHeadlines = async (): Promise<string[]> => {
  await sleep(1000); // محاكاة وقت التحميل
  return [
      "عاجل: الهلال يقترب من حسم صفقة عالمية جديدة",
      "كريستيانو رونالدو يوجه رسالة هامة لجماهير النصر قبل الديربي",
      "مانشستر سيتي يكتسح المنافسين ويتصدر الدوري الإنجليزي",
      "الأهلي المصري يستعد لموقعة أفريقية حاسمة",
      "محمد صلاح يثير الجدل حول مستقبله مع ليفربول بتصريح غامض",
      "برشلونة يعلن تشخيص إصابة نجمه الشاب ومدة الغياب",
      "دوري أبطال آسيا: العين الإماراتي في مواجهة مصيرية"
  ];
};

export const generateArticleContent = async (topic: string, allMatches: Match[]): Promise<GeneratedArticle | null> => {
  await sleep(2000); // محاكاة وقت التفكير والكتابة

  const imageUrl = getSmartImageUrl(topic);
  
  // تحديد تصنيف تقريبي بناءً على الكلمات المفتاحية
  let category = Category.SAUDI;
  if (topic.includes('ليفربول') || topic.includes('سيتي') || topic.includes('إنجليزي')) category = Category.ENGLAND;
  else if (topic.includes('برشلونة') || topic.includes('ريال') || topic.includes('إسباني')) category = Category.SPAIN;
  else if (topic.includes('العين') || topic.includes('إماراتي')) category = Category.UAE;

  return {
    title: `تقرير حصري: ${topic}`,
    summary: `تغطية خاصة ومفصلة من goolzon حول ${topic} وتأثيره الكبير على المشهد الرياضي الحالي.`,
    content: `
      <p>في تطورات مثيرة للأحداث الرياضية المتسارعة، أصبح موضوع <strong>${topic}</strong> حديث الساعة في الأوساط الكروية والجماهيرية.</p>
      
      <h3>التفاصيل الكاملة</h3>
      <p>تشير المصادر المقربة والموثوقة إلى أن الأمور تسير في اتجاه غير متوقع، حيث أظهرت المؤشرات الأخيرة تغييرات جذرية في الخطط الموضوعة سابقاً من قبل الإدارة الفنية.</p>
      
      <p>وقد عبرت الجماهير عن تفاعلها الكبير مع هذا الحدث عبر وسائل التواصل الاجتماعي، مطالبين بمزيد من الشفافية والوضوح حول الخطوات القادمة للفريق.</p>
      
      <h3>تحليل فني</h3>
      <p>من الناحية الفنية، يبدو أن هذا الأمر سيؤثر بشكل مباشر على استراتيجية الفريق في المباريات القادمة. الخبراء يؤكدون أن التعامل الذكي مع هذا الموقف سيكون مفتاح النجاح في المرحلة المقبلة.</p>
      
      <ul>
        <li>تأثير مباشر متوقع على التشكيلة الأساسية في المباراة القادمة.</li>
        <li>تغييرات محتملة في استراتيجية سوق الانتقالات القادم.</li>
        <li>ردود فعل متباينة من المنافسين المباشرين في الدوري.</li>
      </ul>
      
      <div class="bg-slate-800 p-4 rounded-lg border-r-4 border-primary mt-4">
        <strong>رأي المحلل:</strong> "هذه الخطوة قد تكون نقطة تحول في مسار الموسم إذا تم استغلالها بالشكل الصحيح."
      </div>

      <p>سنوافيكم بمزيد من التفاصيل والتحليلات فور ورود أي مستجدات رسمية.</p>
    `,
    category: category,
    tags: ['أخبار', 'كرة قدم', 'حصري', category],
    hasNews: true,
    imageUrl: imageUrl,
    sources: [
        { title: "الموقع الرسمي", uri: "#" }, 
        { title: "صحيفة رياضية عالمية", uri: "#" }
    ]
  };
};
