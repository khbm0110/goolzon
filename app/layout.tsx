import type { Metadata, Viewport } from 'next';
import { Cairo } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/contexts/AuthContext';
import { ThemeProvider } from '@/contexts/ThemeContext';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import ServiceWorkerRegister from '@/components/ServiceWorkerRegister';

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['200', '300', '400', '600', '700', '800', '900'],
  variable: '--font-cairo',
});

const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');

export const metadata: Metadata = {
  // Required so relative OG image paths resolve to absolute URLs when a
  // page doesn't set its own (see generateMetadata() on article/match/
  // club/country pages for per-page overrides).
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'goolzon | الكرة الخليجية',
    template: '%s | goolzon',
  },
  description: 'منصة رياضية عربية متكاملة: أخبار، مباريات، إحصائيات وذكاء اصطناعي.',
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    type: 'website',
    locale: 'ar_AR',
    siteName: 'goolzon',
    title: 'goolzon | الكرة الخليجية',
    description: 'منصة رياضية عربية متكاملة: أخبار، مباريات، إحصائيات وذكاء اصطناعي.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'goolzon | الكرة الخليجية',
    description: 'منصة رياضية عربية متكاملة: أخبار، مباريات، إحصائيات وذكاء اصطناعي.',
  },
};

export const viewport: Viewport = {
  themeColor: '#10b981',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Site-wide structured data (JSON-LD): helps Google understand the
  // site as a real publisher entity (name, logo, official social/RSS
  // links) — this is what search/News surfaces actually check, not
  // "does this look AI-written". Per-article NewsArticle markup (see
  // app/article/[id]/page.tsx) is the other half of this.
  const organizationLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsMediaOrganization',
    name: 'Goolzon',
    url: SITE_URL,
    logo: `${SITE_URL}/icons/icon-192.png`,
  };
  const websiteLd = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Goolzon',
    url: SITE_URL,
  };

  return (
    <html lang="ar" dir="rtl" className={cairo.variable} suppressHydrationWarning>
      <body className="font-sans">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteLd) }} />
        <ThemeProvider>
          <AuthProvider>
            <Header />
            <main>{children}</main>
            <Footer />
            <ServiceWorkerRegister />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
