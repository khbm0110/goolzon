import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية الخاصة بمنصة goolzon: كيف نجمع بياناتك ونستخدمها ونحميها.',
};

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <h1 className="text-3xl md:text-4xl font-black text-[var(--fg)] mb-2">سياسة الخصوصية</h1>
      <p className="text-sm text-[var(--fg-subtle)] mb-8">آخر تحديث: {new Date().toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

      <div className="space-y-6 text-[var(--fg-subtle)] leading-relaxed">
        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">١. البيانات التي نجمعها</h2>
          <p>
            عند إنشاء حساب على goolzon، نجمع بريدك الإلكتروني واسمك. عند استخدامك للموقع، قد نجمع بيانات
            استخدام غير شخصية (مثل الصفحات التي تزورها) لتحسين تجربتك.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٢. كيف نستخدم بياناتك</h2>
          <p>
            نستخدم بياناتك لتشغيل حسابك (التعليقات، المفضّلة، التوقعات، لوحة الصدارة)، ولتحسين المحتوى
            والخدمة المقدَّمة لك. لا نبيع بياناتك الشخصية لأي طرف ثالث.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٣. ملفات تعريف الارتباط (Cookies)</h2>
          <p>
            يستخدم الموقع ملفات تعريف ارتباط أساسية لتشغيل تسجيل الدخول وتفضيلاتك، وقد يستخدم شركاء
            الإعلانات ملفات تعريف ارتباط خاصة بهم لعرض إعلانات مناسبة.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٤. حقوقك</h2>
          <p>
            يمكنك طلب حذف حسابك وبياناتك في أي وقت عبر التواصل معنا من{' '}
            <a href="/contact" className="text-primary hover:underline">صفحة التواصل</a>.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-[var(--fg)] mb-2">٥. التعديلات على هذه السياسة</h2>
          <p>
            قد نحدّث هذه السياسة من وقت لآخر. سيتم نشر أي تغييرات جوهرية على هذه الصفحة.
          </p>
        </section>
      </div>
    </div>
  );
}
