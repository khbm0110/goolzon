import type { Metadata } from 'next';
import ContactForm from '@/components/ContactForm';

export const metadata: Metadata = {
  title: 'تواصل معنا',
  description: 'تواصل مع فريق goolzon لأي استفسار، اقتراح، أو مشكلة تقنية.',
};

export default function ContactPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-lg">
      <h1 className="text-3xl md:text-4xl font-black text-[var(--fg)] mb-2">تواصل معنا</h1>
      <p className="text-[var(--fg-subtle)] mb-8">
        نسعد باستفساراتك واقتراحاتك، وسنرد عليك في أقرب وقت ممكن.
      </p>
      <ContactForm />
    </div>
  );
}
