import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'system-ui', 'sans-serif'],
        playfair: ['var(--font-playfair)', 'Georgia', 'serif'],
      },
      colors: {
        brand: {
          DEFAULT: '#e63329',
          dark: '#c02218',
          light: '#fde8e7',
        },
      },
      maxWidth: {
        '8xl': '1280px',
      },
    },
  },
  plugins: [],
};

export default config;
