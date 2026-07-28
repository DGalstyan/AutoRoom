import type { Config } from 'tailwindcss';
import typography from '@tailwindcss/typography';

/**
 * AutoRoom design system — single source of truth for the visual language.
 * Values mirror `.claude/skills/autoroom-website/references/design-tokens.md`.
 * If the brand hands over an official palette, swap the hex values HERE only —
 * never component-by-component.
 */
const config: Config = {
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
    './data/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F',
        surface: '#14141A',
        'surface-light': '#F6F7F9',
        paper: '#FFFFFF',
        ink: '#0B0B0F',
        muted: '#8A8F98',
        line: {
          DEFAULT: '#26262E', // hairline on dark
          light: '#E6E8EC', // hairline on light
        },
        accent: {
          DEFAULT: '#E4002B',
          600: '#B80022',
        },
        success: '#1FA971',
        warn: '#E6A100',
        info: '#2F6BFF',
      },
      fontFamily: {
        // Latin display/body first, Armenian face right behind it: Sora/Inter have
        // no Armenian glyphs, so Armenian text resolves to Noto Sans Armenian.
        display: ['var(--font-display)', 'var(--font-armenian)', 'sans-serif'],
        body: ['var(--font-body)', 'var(--font-armenian)', 'sans-serif'],
      },
      fontSize: {
        display: ['clamp(3.5rem, 6vw, 5rem)', { lineHeight: '1.02', letterSpacing: '-0.02em' }],
        h1: ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        h2: ['2rem', { lineHeight: '1.15', letterSpacing: '-0.01em' }],
        h3: ['1.5rem', { lineHeight: '1.25' }],
        lead: ['1.25rem', { lineHeight: '1.5' }],
        body: ['1rem', { lineHeight: '1.6' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
      },
      spacing: {
        section: '96px', // desktop section padding
        'section-sm': '56px', // mobile section padding
        gutter: '24px',
        'gutter-sm': '16px',
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        pill: '999px',
      },
      maxWidth: {
        container: '1280px',
      },
      boxShadow: {
        card: '0 8px 30px rgba(0,0,0,.12)',
        'card-hover': '0 16px 44px rgba(0,0,0,.18)',
        dialog: '0 24px 80px rgba(0,0,0,.45)',
      },
      transitionTimingFunction: {
        expo: 'cubic-bezier(0.16,1,0.3,1)',
      },
      transitionDuration: {
        micro: '150ms',
        standard: '250ms',
        entrance: '500ms',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'dialog-in': {
          from: { opacity: '0', transform: 'translateY(12px) scale(0.98)' },
          to: { opacity: '1', transform: 'translateY(0) scale(1)' },
        },
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--accordion-content-height)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 250ms cubic-bezier(0.16,1,0.3,1) both',
        'dialog-in': 'dialog-in 400ms cubic-bezier(0.16,1,0.3,1) both',
      },
    },
  },
  plugins: [typography],
};

export default config;
