# Design tokens — AutoRoom

A premium, trust-forward automotive look (reference feel: porsche.com,
magnus-style dark hero sections). Dark, editorial, lots of whitespace, large
typographic headings, one accent color for CTAs.

> These are sensible defaults. If the brand hands over an official palette/logo,
> swap the hex values here and in `tailwind.config` — do not change them
> component-by-component.

## Color

| Token | Value | Use |
|---|---|---|
| `bg` | `#0B0B0F` | Primary dark background (hero, About, footers) |
| `surface` | `#14141A` | Cards on dark |
| `surface-light` | `#F6F7F9` | Light sections / calculator card ground |
| `ink` | `#0B0B0F` | Text on light |
| `paper` | `#FFFFFF` | Light background |
| `muted` | `#8A8F98` | Secondary text, disclaimers, disabled slots |
| `line` | `#26262E` | Hairline dividers on dark; `#E6E8EC` on light |
| `accent` | `#E4002B` | Primary CTA / active states / progress fills (AutoRoom red) |
| `accent-600` | `#B80022` | CTA hover |
| `success` | `#1FA971` | Timeline "done" checks, "Available" badges |
| `warn` | `#E6A100` | "On the road" / partial-payment badges |
| `info` | `#2F6BFF` | Financing / info accents |

Status badge colors: Available=`success`, On order/On the road=`warn`,
Auction=`accent`, Sold/past=`muted` (grayscale).

## Typography

- Display/headings: a strong grotesk (e.g. `Manrope`, `Sora`, or brand font),
  weights 600–800. Uppercase for hero H1s on dark sections.
- Body: same family or `Inter`, weight 400–500.
- **Armenian:** ensure the chosen family has full Armenian glyph coverage
  (`Mardoto`, `Noto Sans Armenian`, or `Arial AMU` fallback). Test every heading
  with real Armenian strings — many Latin display fonts lack Armenian.

Type scale (rem): `display` 3.5–5 / `h1` 2.5 / `h2` 2 / `h3` 1.5 / `lead` 1.25 /
`body` 1 / `small` 0.875 / `caption` 0.75. Fluid via `clamp()` on hero display.

## Spacing & radius

- Space scale (px): 4, 8, 12, 16, 24, 32, 48, 64, 96, 128. Section vertical
  padding: 96 desktop / 56 mobile.
- Radius: `sm` 8, `md` 12, `lg` 20 (cards), `pill` 999 (chips, phone format,
  slot buttons). Popups: `lg`.
- Container: max-width 1280, gutter 24 (16 mobile).
- Shadow: soft, low-opacity — `0 8px 30px rgba(0,0,0,.12)` on light cards;
  cards lift on hover (translateY(-4px) + stronger shadow).

## Motion

- Durations: micro 150ms, standard 250–300ms, entrance 400–600ms.
- Easing: `cubic-bezier(0.16, 1, 0.3, 1)` (ease-out-expo) for entrances.
- Scroll-driven: Car Anatomy exploded view, Price Journey fill, USA
  scrollytelling — driven by scroll progress, NOT autoplay, on desktop.
- **Always** provide a `prefers-reduced-motion: reduce` path: no parallax, no
  scroll-scrubbing; show the final composed state and let native controls play
  video only on user action.

## Breakpoints (Tailwind defaults)

`sm` 640 · `md` 768 · `lg` 1024 · `xl` 1280 · `2xl` 1536.
Desktop scroll interactions collapse to mobile patterns below `lg`.

## Tailwind config (drop-in starter)

```js
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg: '#0B0B0F', surface: '#14141A', 'surface-light': '#F6F7F9',
        paper: '#FFFFFF', ink: '#0B0B0F', muted: '#8A8F98', line: '#26262E',
        accent: { DEFAULT: '#E4002B', 600: '#B80022' },
        success: '#1FA971', warn: '#E6A100', info: '#2F6BFF',
      },
      borderRadius: { sm: '8px', md: '12px', lg: '20px', pill: '999px' },
      fontFamily: {
        display: ['Sora', 'Noto Sans Armenian', 'sans-serif'],
        body: ['Inter', 'Noto Sans Armenian', 'sans-serif'],
      },
      transitionTimingFunction: { expo: 'cubic-bezier(0.16,1,0.3,1)' },
      maxWidth: { container: '1280px' },
    },
  },
  plugins: [require('@tailwindcss/typography')],
}
```
