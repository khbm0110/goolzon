
export default async function handler(request: any, response: any) {
  // This function is disabled/mocked to remove external dependencies.
  
  const mockArticle = {
      title: "خبر عاجل: موسم رياضي استثنائي في الخليج",
      summary: "تشهد الملاعب الخليجية تنافساً غير مسبوق هذا الموسم.",
      content: "<p>في تغطية خاصة، نتابع معكم الأحداث المثيرة...</p>",
      category: "السعودية",
      isBreaking: false
  };

  return response.status(200).json({ 
      message: "Article generated successfully (Mock Mode).",
      data: mockArticle
  });
}
