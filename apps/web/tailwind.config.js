/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Base scale kept from the original spec for pages not yet rebuilt
        // from Figma (China/USA/About/etc.).
        bg: '#0B0B0F',
        surface: '#14141A',
        'surface-light': '#F7F7F7', // Figma "Light" frame root background (node 9321:6135)
        paper: '#FFFFFF',
        ink: '#0D0D0D',
        muted: '#8A8F98',
        line: '#26262E',
        'line-light': '#E6E8EC',
        // Accent + semantics reconciled with Figma "Foundation" canvas
        // (node 1:5154, "Color"). The Foundation sheet's own text labels are
        // stale template copy (e.g. a swatch literally labelled "Main orange
        // #FF8100" whose real fill is gold) — values below are read from each
        // swatch's actual `fills[0].color`, cross-checked against real CTA
        // buttons in the Homepage frame (header/footer "BTN" instances all
        // resolve to #C8A24A).
        accent: { DEFAULT: '#C8A24A', 600: '#A9843A' },
        success: { DEFAULT: '#3A9D75', light: '#CFFFE0' },
        warn: { DEFAULT: '#FF9E6D', light: '#FFF0B3' },
        info: { DEFAULT: '#4B7BEC', light: '#BFE9FF' },
        error: { DEFAULT: '#B23A48', light: '#FFD1D1' },
        // Figma "Neutrals" scale (node 1:5154 > Neutrals).
        neutral: {
          900: '#0D0D0D',
          800: '#3D3D3D',
          700: '#666E73',
          600: '#999EA1',
          500: '#CCCFD0',
          100: '#E5E7E8',
          50: '#F5F5F6',
          25: '#FAFAFA',
        },
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
        lg: '20px',
        xl: '32px', // Figma card/section corner radius (Border Radius token sheet, node 201:3222 + measured on cards)
        pill: '999px',
      },
      fontSize: {
        display: ['clamp(2.5rem, 5vw + 1rem, 5rem)', { lineHeight: '1.05' }],
        h1: ['2.5rem', { lineHeight: '1.1' }],
        h2: ['2rem', { lineHeight: '1.15' }],
        h3: ['1.5rem', { lineHeight: '1.25' }],
        lead: ['1.25rem', { lineHeight: '1.4' }],
        body: ['1rem', { lineHeight: '1.6' }],
        small: ['0.875rem', { lineHeight: '1.5' }],
        caption: ['0.75rem', { lineHeight: '1.4' }],
        // Homepage-specific sizes measured directly off the Figma "Light"
        // frame (node 9321:6135) text nodes — kept separate from the generic
        // scale above so other not-yet-rebuilt pages are unaffected.
        'home-hero': ['36px', { lineHeight: '56px' }], // H1, weight 700
        'home-h2': ['44px', { lineHeight: '58px' }], // section headings, weight 300 (Figma's literal weight is 274)
        'home-stat': ['48px', { lineHeight: '56px' }], // hero stat numbers, weight 700
        'home-stat-sm': ['36px', { lineHeight: '56px' }], // anatomy stat numbers, weight 700
        'home-label': ['20px', { lineHeight: '32px' }],
        'home-card-title': ['24px', { lineHeight: '36px' }],
      },
      fontFamily: {
        display: ['var(--font-sora)', 'var(--font-noto-am)', 'sans-serif'],
        body: ['var(--font-inter)', 'var(--font-noto-am)', 'sans-serif'],
      },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16,1,0.3,1)' },
      maxWidth: {
        container: '1280px',
        // Header "pill" frame width measured directly off Figma node
        // `9321:6395` (Header, inside Homepage "Light" `9321:6135`):
        // absoluteBoundingBox.width = 1408 on a 1440-wide page frame, i.e. a
        // 16px gutter on each side — deliberately wider than the 1280px body
        // content column above.
        header: '1408px',
      },
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
