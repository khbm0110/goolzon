import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام الخاصة باستخدام منصة goolzon.',
};

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-black text-[var(--fg)] mb-2">الشروط والأحكام</h1>
      <p className="text-sm text-[var(--fg-subtle)] mb-8">آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-[var(--fg-subtle)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">١. قبول الشروط</h2>
          <p>باستخدامك لموقع goolzon، فإنك توافق على هذه الشروط والأحكام بالكامل.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٢. استخدام الحساب</h2>
          <p>
            أنت مسؤول عن الحفاظ على سرية بيانات حسابك، وعن أي نشاط يتم من خلاله. يُمنع إنشاء حسابات وهمية
            أو انتحال شخصيات أخرى.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٣. سلوك المستخدمين</h2>
          <p>
            يُمنع نشر أي تعليق يحتوي على إساءة، تحريض، خطاب كراهية، أو محتوى مخالف للقوانين. نحتفظ بحق حذف
            أي تعليق أو تعليق حساب أي مستخدم يخالف هذه الشروط دون إشعار مسبق.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٤. المحتوى والملكية الفكرية</h2>
          <p>
            جميع المحتويات المنشورة على الموقع (نصوص، صور، شعارات) محمية بحقوق الملكية الفكرية. يُمنع نسخ
            أو إعادة نشر المحتوى دون إذن.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٥. إخلاء المسؤولية</h2>
          <p>
            نبذل جهدنا لتوفير معلومات دقيقة (نتائج، إحصائيات، تحليلات)، لكننا لا نضمن خلوّها التام من
            الأخطاء، ولا نتحمل مسؤولية أي قرار يُتخذ بناءً عليها.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٦. التعديلات</h2>
          <p>نحتفظ بحق تعديل هذه الشروط في أي وقت، وسيتم نشر أي تحديث على هذه الصفحة.</p>
        </section>
      </div>
    </div>
  );
}
