/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F',
        surface: '#14141A',
        'surface-light': '#F6F7F9',
        paper: '#FFFFFF',
        ink: '#0B0B0F',
        muted: '#8A8F98',
        line: '#26262E',
        'line-light': '#E6E8EC',
        accent: { DEFAULT: '#E4002B', 600: '#B80022' },
        success: '#1FA971',
        warn: '#E6A100',
        info: '#2F6BFF',
      },
      borderRadius: { sm: '8px', md: '12px', lg: '20px', pill: '999px' },
      fontSize: {
        display: ['clamp(2.5rem, 5vw + 1rem, 5rem)', { lineHeight: '1.05' }],
        h1: ['2.5rem', { lineHeight: '1.1' }],
        h2: ['2rem', { lineHeight: '1.15' }],
        h3: ['1.5rem', { lineHeight: '1.25' }],
        lead: ['1.25rem', { lineHeight: '1.4' }],
        body: ['1rem', { lineHeight: '1.6' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      fontFamily: {
        display: ['var(--font-sora)', 'var(--font-noto-am)', 'sans-serif'],
        body: ['var(--font-inter)', 'var(--font-noto-am)', 'sans-serif'],
      },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16,1,0.3,1)' },
      maxWidth: { container: '1280px' },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,.12)',
      },
      transitionDuration: {
        micro: '150ms',
        standard: '300ms',
        entrance: '600ms',
      },
    },
  },
  plugins: [require('@tailwindcss/typography')],
};
