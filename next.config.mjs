/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Prevents the site from being embedded in an iframe on another domain (clickjacking protection)
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  // Stops the browser from guessing MIME types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Limits how much referrer info is leaked to other sites
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Disables powerful browser features we don't use
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
  // Forces HTTPS for a full year, including subdomains
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com",
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
      "font-src 'self' https://fonts.gstatic.com",
      "img-src 'self' data: https: blob:",
      "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://v3.football.api-sports.io",
      "frame-ancestors 'self'",
    ].join('; '),
  },
];

const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // hides "X-Powered-By: Next.js" from responses
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'media.api-sports.io' },
      { protocol: 'https', hostname: 'api.dicebear.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
