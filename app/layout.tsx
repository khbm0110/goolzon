```tsx
import type { Metadata, Viewport } from 'next';
import Script from 'next/script';
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

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
).replace(/\/$/, '');

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),

  title: {
    default: 'goolzon | الكرة الخليجية',
    template: '%s | goolzon',
  },

  description:
    'goolzon: منصة إخبارية رياضية عربية شاملة تغطي أخبار كرة القدم، نتائج المباريات لحظة بلحظة، جداول ترتيب الدوريات العربية والعالمية، تحليلات تكتيكية، وأخبار الأندية واللاعبين — بتحديث مستمر على مدار الساعة.',

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
    description:
      'goolzon: منصة إخبارية رياضية عربية شاملة تغطي أخبار كرة القدم، نتائج المباريات لحظة بلحظة، جداول ترتيب الدوريات العربية والعالمية، تحليلات تكتيكية، وأخبار الأندية واللاعبين — بتحديث مستمر على مدار الساعة.',
  },

  twitter: {
    card: 'summary_large_image',
    title: 'goolzon | الكرة الخليجية',
    description:
      'goolzon: منصة إخبارية رياضية عربية شاملة تغطي أخبار كرة القدم، نتائج المباريات لحظة بلحظة، جداول ترتيب الدوريات العربية والعالمية، تحليلات تكتيكية، وأخبار الأندية واللاعبين — بتحديث مستمر على مدار الساعة.',
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
  // Site-wide structured data (JSON-LD)
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
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body>
        {/* Google Analytics 4 */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
          strategy="afterInteractive"
        />

        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
          `}
        </Script>

        {/* Site-wide structured data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationLd),
          }}
        />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(websiteLd),
          }}
        />

        <AuthProvider>
          <ThemeProvider>
            <ServiceWorkerRegister />

            <Header />

            <main>{children}</main>

            <Footer />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
```
