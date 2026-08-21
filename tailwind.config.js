/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: '#000000',
        foreground: '#FFFFFF',
        primary: {
          DEFAULT: '#FFFFFF',
          foreground: '#000000',
        },
        secondary: {
          DEFAULT: 'rgba(255, 255, 255, 0.08)',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: 'rgba(255, 255, 255, 0.05)',
          foreground: 'rgba(255, 255, 255, 0.6)',
        },
        border: 'rgba(255, 255, 255, 0.1)',
        brand: {
          emerald: '#10B981',
          emeraldLight: '#34D399',
          emeraldDark: '#059669',
          amber: '#F59E0B',
          cyan: '#06B6D4',
          slate: '#64748B',
        },
      },
      fontFamily: {
        sans: ['Helvetica Now Text', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        pulseGlow: {
          '0%, 100%': { opacity: '1', transform: 'scale(1)' },
          '50%': { opacity: '0.6', transform: 'scale(1.05)' },
        },
        scanline: {
          '0%': { transform: 'translateY(-100%)' },
          '100%': { transform: 'translateY(100%)' },
        },
      },
      animation: {
        'pulse-glow': 'pulseGlow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'scanline': 'scanline 4s linear infinite',
      },
    },
  },
  plugins: [],
};
