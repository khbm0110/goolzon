import Link from 'next/link';
import AdSlot from './AdSlot';

const LINKS = [
  { href: '/about', label: 'من نحن' },
  { href: '/contact', label: 'تواصل معنا' },
  { href: '/privacy', label: 'سياسة الخصوصية' },
  { href: '/terms', label: 'الشروط والأحكام' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-12 border-t border-[var(--border-subtle)]">
      <AdSlot placement="BEFORE_FOOTER" page="all" />

      <div className="container mx-auto px-4 py-8">
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 mb-6 text-sm text-[var(--fg-subtle)]">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="hover:text-primary transition-colors">
              {link.label}
            </Link>
          ))}
        </nav>
        <p className="text-center text-xs text-[var(--fg-subtle)]">
          © {year} goolzon. جميع الحقوق محفوظة.
        </p>
      </div>
    </footer>
  );
}
