import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'من نحن',
  description: 'تعرّف على goolzon، منصتك الرياضية العربية للأخبار والمباريات والإحصائيات.',
};

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-black text-[var(--fg)] mb-6">من نحن</h1>

      <div className="space-y-4 text-[var(--fg-subtle)] leading-relaxed">
        <p>
          <strong className="text-[var(--fg)]">goolzon</strong> منصة رياضية عربية متكاملة، تجمع أخبار كرة القدم
          العربية والعالمية، نتائج المباريات لحظة بلحظة، الترتيب والإحصائيات، إلى جانب تحليلات وتغطيات
          مدعومة بالذكاء الاصطناعي.
        </p>
        <p>
          نهدف لنكون الوجهة الأولى لمتابعي الدوريات العربية والعالمية، بمحتوى محدَّث باستمرار ومصادر موثوقة.
        </p>
        <p>
          لأي استفسار أو اقتراح، يسعدنا تواصلك معنا عبر{' '}
          <a href="/contact" className="text-primary hover:underline">صفحة التواصل</a>.
        </p>
      </div>
    </div>
  );
}
