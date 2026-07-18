import type { Config } from 'tailwindcss';

// Same design tokens as the original goolzon project (Cairo font, dark theme,
// emerald primary / slate secondary / amber accent) so the migration keeps
// the exact same look and feel.
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Cairo', 'sans-serif'],
      },
      colors: {
        primary: '#10b981',
        secondary: '#0f172a',
        accent: '#fbbf24',
      },
    },
  },
  plugins: [],
};

export default config;
