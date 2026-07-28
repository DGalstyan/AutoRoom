---
name: autoroom-website
description: >-
  Build and edit pages for the AutoRoom car-import website (Next.js + React +
  Tailwind). Use whenever the task involves any AutoRoom page or component:
  Homepage, China (Չինաստան), USA (ԱՄՆ), Construction machinery (Շինտեխնիկա),
  Partners/Dealers portal (Գործընկերներ), About (Մեր մասին), Special offers
  (Հատուկ առաջարկներ), Contact (Կապ մեզ հետ), or any shared component such as
  the Universal Popup, Quiz Popup, Price Journey, loan calculator, Car Anatomy
  exploded view, or the USA scrollytelling import flow. Encodes the design
  system, component contracts, page specs, and Armenian UI copy.
---

# AutoRoom Website Skill

AutoRoom (ԱվտոՌում) imports cars from the USA, China, Europe and other markets
into Armenia, and also imports construction machinery from China. This skill is
the single source of truth for building the marketing + portal website.

Everything user-facing on the site is in **Armenian**. Code, comments, component
names, and props are in **English**. Never machine-translate the Armenian copy —
use the exact strings in `references/` (they are legally/brand reviewed).

## How to use this skill

1. **Identify the surface.** Which page or shared component is the task about?
   Map it to a file in `references/pages.md` (pages) or `references/components.md`
   (shared, reusable components).
2. **Read the relevant reference file(s) fully before writing code.** The specs
   contain interaction detail (scroll-driven playback, real-time recalculation,
   conditional CTAs) that is easy to miss.
3. **Reuse shared components — do not re-implement.** The same `UniversalPopup`,
   `LoanCalculator`, `CarCard`, `PriceJourney`, `Faq`, `BranchMap`, and
   `StickyCta` appear on many pages. Build them once in `components/shared/`.
4. **Pull copy from the reference files, not from memory.** FAQ answers, branch
   addresses/phones, and CTA labels are fixed strings — see `references/faq.md`
   and `references/branches.md`.
5. **Apply the design tokens** in `references/design-tokens.md` via Tailwind
   theme config — never hardcode hex values in components.

## Reference map

- `references/design-tokens.md` — colors, type scale, spacing, motion, breakpoints, Tailwind config.
- `references/components.md` — contracts (props, states, behavior) for every shared component.
- `references/pages.md` — page-by-page section specs for all 8 top-level pages.
- `references/faq.md` — exact FAQ question/answer strings (Homepage auto-aggregates China + USA).
- `references/branches.md` — the 3 branch records (name, address, phone, hours) used everywhere.

## Tech stack & conventions

- **Next.js (App Router) + React + TypeScript + Tailwind CSS.** Server Components
  by default; add `"use client"` only for interactive pieces (popups, calculators,
  sliders, scrollytelling, tabs, carousels).
- **Routing** (mirror `references/pages.md`):
  `/` (Homepage) · `/china` · `/china/[slug]` (car detail) · `/china/machinery` ·
  `/china/machinery/[slug]` · `/usa` · `/usa/auctions/[slug]` · `/usa/available/[slug]` ·
  `/machinery` · `/partners` · `/partners/portal` (auth) · `/about` · `/offers` ·
  `/contact`. A single `CarDetail` component renders China / USA / available variants
  via a `variant` prop.
- **Animation:** Framer Motion for entrance/hover; a scroll library (Lenis +
  a scroll-progress hook, or GSAP ScrollTrigger) for the Car Anatomy exploded
  view, Price Journey, and USA scrollytelling. Respect `prefers-reduced-motion`.
- **Video:** heavy hero/scrolly videos are lazy-loaded, `muted`, `playsInline`.
  Scroll-driven playback on desktop; on mobile, play on entering viewport
  (autoplay/muted/loop) and convert hotspots to a chip list.
- **Forms/leads:** every lead submission auto-attaches hidden context (source
  page, source CTA, car name/VIN if on a car page, timestamp, locale, device).
  See `UniversalPopup` and `LeadPayload` in `references/components.md`.
- **i18n scaffolding:** keep all Armenian strings in a per-page/`common` messages
  object (e.g. `messages/hy.json`) so a second locale can be added later; render
  from the message keys, not inline literals.
- **Accessibility:** every popup is a focus-trapped dialog (Esc closes, restores
  focus, `aria-modal`). Sliders, tabs, and accordions use proper ARIA roles.
  Countdown timers and live regions announce politely.

## The two lead entry points (critical logic)

There are two conversion widgets. Choosing the wrong one is a common mistake:

- **Universal Popup** — the standard lead form. Step 1 required (name + phone,
  auto `+374`), Step 2 optional easy chips (what/budget/financing/timing/contact
  channel) all on one screen, Step 3 free comment. When opened from a specific
  page, pre-select the Step-2 chips (e.g. opened from China ⇒ "Մեքենա Չինաստանից"
  pre-checked). Used by most "Ստանալ առաջարկ" CTAs.
- **Quiz Popup** — "Գտիր քո մեքենան 60 վայրկյանում", 5 chip-only questions →
  3 recommended cars → Universal Popup with results attached. Used *instead of*
  the Universal Popup in exactly two spots: the sticky "Չե՞ս գտել քո մեքենան" CTA
  and Homepage Section 10 final CTA. Everywhere else, "Ստանալ առաջարկ" → Universal Popup.

Rule of thumb: undecided buyer → Quiz; concrete request → Universal Popup.

## Car-detail CTA & financing (critical logic)

- **China car detail** has two sticky CTAs: (1) "Ստանալ անհատական առաջարկ
  [Make Model]-ի համար" → a prefilled per-car Universal Popup variant, and
  (2) "Տես վարկի պայմանները" → the `LoanCalculator` (real-time monthly recompute
  on down-payment slider/input, no "Calculate" button).
- **Financing blocks** appear on China + USA available car details: a "Գնել
  Վարկով" bank-logo grid (Ameriabank, Evoca, IDBank open external tabs; AutoRoom
  opens our own in-house financing offer — up to 2 months, up to 70%) plus the
  `LoanCalculator` card. Same component set on both.
- **Auction (USA) logic:** Copart/IAAI cards → "Տեսնել մեքենան օնլайն" (View-Only
  guest login) + "Կապ հաստատիր մեզ հետ" (Universal Popup). Manheim cards → only
  "Կապ հաստատիր մեզ հետ" (no direct auction link). If a car is in-stock in
  Armenia, open the AutoRoom car detail instead of the auction site.

## Verification checklist (run before calling a page done)

- Correct lead widget wired to each CTA (Universal vs Quiz vs per-car prefilled).
- Armenian copy matches `references/` exactly; no stray English in UI.
- Responsive: desktop scroll-driven interactions degrade to the mobile pattern
  described per component (vertical timeline / chip list / stacked cards).
- Reduced-motion path exists for every scroll/auto-play animation.
- Popups are focus-trapped, Esc-closable, and restore focus.
- Hidden lead context (source page, CTA, car/VIN, timestamp, locale, device) is
  attached on submit.
- Bank/auction external links open in a new tab with `rel="noopener"`.
