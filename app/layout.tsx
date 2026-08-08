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
const SITE\_URL = (process.env.NEXT\_PUBLIC\_SITE\_URL || '[http://localhost:3000](http://localhost:3000)').replace(/\\/$/, '');
export const metadata: Metadata = {
// Required so relative OG image paths resolve to absolute URLs when a
// page doesn't set its own (see generateMetadata() on article/match/
// club/country pages for per-page overrides).
metadataBase: new URL(SITE\_URL),
title: {
default: 'goolzon | الكرة الخليجية',
template: '%s | goolzon',
},
description: 'goolzon: منصة إخبارية رياضية عربية شاملة تغطي أخبار كرة القدم، نتائج المباريات لحظة بلحظة، جداول ترتيب الدوريات العربية والعالمية، تحليلات تكتيكية، وأخبار الأندية واللاعبين — بتحديث مستمر على مدار الساعة.',
manifest: '/manifest.json',
icons: {
icon: '/icons/icon-192.png',
apple: '/icons/icon-192.png',
},
openGraph: {
type: 'website',
locale: 'ar\_AR',
siteName: 'goolzon',
title: 'goolzon | الكرة الخليجية',
description: 'goolzon: منصة إخبارية رياضية عربية شاملة تغطي أخبار كرة القدم، نتائج المباريات لحظة بلحظة، جداول ترتيب الدوريات العربية والعالمية، تحليلات تكتيكية، وأخبار الأندية واللاعبين — بتحديث مستمر على مدار الساعة.',
},
twitter: {
card: 'summary\_large\_image',
title: 'goolzon | الكرة الخليجية',
description: 'goolzon: منصة إخبارية رياضية عربية شاملة تغطي أخبار كرة القدم، نتائج المباريات لحظة بلحظة، جداول ترتيب الدوريات العربية والعالمية، تحليلات تكتيكية، وأخبار الأندية واللاعبين — بتحديث مستمر على مدار الساعة.',
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
'@context': '[https://schema.org](https://schema.org)',
'@type': 'NewsMediaOrganization',
name: 'Goolzon',
url: SITE\_URL,
logo: `${SITE_URL}/icons/icon-192.png`,
};
const websiteLd = {
'@context': '[https://schema.org](https://schema.org)',
'@type': 'WebSite',
name: 'Goolzon',
url: SITE\_URL,
};
return (


\<script type="application/ld+json" dangerouslySetInnerHTML={{ \_\_html: JSON.stringify(organizationLd) }} />
\<script type="application/ld+json" dangerouslySetInnerHTML={{ \_\_html: JSON.stringify(websiteLd) }} />



{children}






);
}
