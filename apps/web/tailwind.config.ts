import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#0D0B1E',
        surface: '#13102A',
        'surface-raised': '#1D1942',
        border: '#2D2860',
        'border-bright': '#483E8E',
        'text-primary': '#FBFFFF',
        'text-secondary': '#AB91E8',
        'text-muted': '#6B5C99',
        brand: {
          lavender: '#E7A4E7',
          blue: '#1957A4',
          purple: '#483E8E',
          soft: '#AB91E8',
          white: '#FBFFFF',
          // aliases so existing classes don't break
          azure: '#AB91E8',
          magenta: '#E7A4E7',
          salmon: '#E7A4E7',
          pink: '#E7A4E7',
          cyan: '#AB91E8',
        },
      },
      fontFamily: {
        montserrat: ['var(--font-montserrat)', 'sans-serif'],
        oswald: ['var(--font-oswald)', 'sans-serif'],
        'open-sans': ['var(--font-open-sans)', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
