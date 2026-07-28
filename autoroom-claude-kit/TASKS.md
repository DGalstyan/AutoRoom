# AutoRoom — build task breakdown / Կառուցման առաջադրանքներ

Bilingual task plan for building the AutoRoom site into the (currently empty)
repo `github.com/DGalstyan/AutoRoom`. Each task names the **agent** that should own
it. Phases are ordered; within a phase, tasks can run in parallel unless a
dependency is noted. Copy these into your tracker (or feed them to Claude Code
task-by-task).

Legend: `[design-system]` `[frontend-builder]` `[forms-and-leads]`
`[content-armenian]` `[qa-reviewer]`.

---

## Phase 0 — Foundation / Հիմք

- **P0.1** `[frontend-builder]` Scaffold Next.js (App Router) + TypeScript +
  Tailwind + ESLint/Prettier in the repo root. Add the routing skeleton from
  `SKILL.md` (empty pages that render their H1). *(Repo is empty today — this is
  the first commit of real code.)*
  <br>ЕՆ: Ստեղծել Next.js նախագիծը և էջերի կմախքը։
- **P0.2** `[design-system]` Implement `tailwind.config` + tokens from
  `references/design-tokens.md`; load fonts with verified **Armenian** glyph
  coverage; global CSS + CSS variables.
- **P0.3** `[design-system]` Build base primitives: `Button`, `Chip`, `Badge`,
  `Card`, `Dialog` shell (focus-trap/Esc/overlay), `Slider`, `Tabs`, `Accordion`,
  `Countdown`. *(Blocks most feature work.)*
- **P0.4** `[content-armenian]` Create `messages/hy.json` scaffolding (`common` +
  per-page namespaces) and seed shared labels/CTAs.
- **P0.5** `[frontend-builder]` Global `Header` nav + `Footer` placeholder +
  global `StickyCta` (→ Quiz Popup).

## Phase 1 — Shared components / Ընդհանուր բաղադրիչներ (highest reuse)

- **P1.1** `[forms-and-leads]` `UniversalPopup` (3-step, +374 mask, hidden
  payload, pre-select, per-car variant) + `LeadPayload` type + submission adapter
  (API route stub). *(Depends P0.3.)*
- **P1.2** `[forms-and-leads]` `QuizPopup` (5 chip questions → 3 cars → hands to
  UniversalPopup).
- **P1.3** `[frontend-builder]` `CarCard` (all contexts) + `CarDetail`
  (variant-driven shell) + `SimilarOffers`.
- **P1.4** `[forms-and-leads]` `LoanCalculator` (real-time, synced slider/input)
  + `[frontend-builder]` `BuyWithLoan` bank grid.
- **P1.5** `[frontend-builder]` `PriceJourney` (scroll-fill + summing counter +
  mobile vertical timeline).
- **P1.6** `[frontend-builder]` `Faq` accordion (topic-keyed) + `BranchMap`
  (Armenia map, pins, panel) using `references/branches.md`.
- **P1.7** `[frontend-builder]` `FeaturedCars`, `Countdown` usages, `CompareTool`
  (v1: table + diff highlight; logic TBD flagged).

## Phase 2 — Homepage / Գլխավոր էջ

- **P2.1** `[frontend-builder]` S1 Hero + direction picker (ԱՄՆ/Չինաստան cards).
- **P2.2** `[frontend-builder]` S2 Featured, S5 Ecosystem, S8 Branches, S9 FAQ
  (auto-aggregate China+USA), S10 final CTA (→ Quiz Popup).
- **P2.3** `[frontend-builder]` **S3 Car Anatomy** exploded-view (scroll-driven +
  hotspots + mobile chip list). *(Needs the AI hero-car video asset — stub with a
  placeholder + working scroll logic.)*
- **P2.4** `[frontend-builder]` S4 process journey, S6 founder video, S7 Customer
  Story Wall (video wall).

## Phase 3 — China / Չինաստան

- **P3.1** `[frontend-builder]` `/china` list: filters + price slider + 3-tab
  (Առկա/Պատվերով) grid + financing block + "why order via AutoRoom" + FAQ + CTA.
- **P3.2** `[frontend-builder]` `/china/[slug]` car detail (all 3.1–3.6b blocks:
  color picker, PriceJourney, BuyWithLoan + LoanCalculator, two sticky CTAs).
- **P3.3** `[frontend-builder]` `/machinery` list + `/machinery/[slug]` detail
  (tech specs + leasing note; all cards `պատվերով`).

## Phase 4 — USA / ԱՄՆ

- **P4.1** `[frontend-builder]` `/usa` top + Best Auctions list with per-platform
  CTA logic (Copart/IAAI View-Only + Contact; Manheim Contact-only).
- **P4.2** `[frontend-builder]` Auction car detail + "Հետևել աճուրդին օնլայն"
  (View-Only guest login explainer) + customs calculator.
- **P4.3** `[frontend-builder]` S3 Available cars list + `/usa/available/[slug]`
  detail (+ financing same as China).
- **P4.4** `[frontend-builder]` S4 On-the-road cars (countdown + status badges +
  prefilled popup); S5 US-times-by-state (map/carousel).
- **P4.5** `[frontend-builder]` **S8 Scrollytelling** import flow (12 chapters,
  sticky video + progress bar; mobile vertical cards). *(Needs the 60–90s AI
  video; stub asset, ship the scroll mechanics.)* + Useful guides (Reels) + USA FAQ + CTA.

## Phase 5 — Partners / Գործընկերներ (B2B)

- **P5.1** `[frontend-builder]` `/partners` marketing page (Hero, Why, Who, Portal
  login entry).
- **P5.2** `[forms-and-leads]` Partner **meeting-booking** popup (calendar + slots
  + format; CRM Partner Lead; mobile stepper).
- **P5.3** `[frontend-builder]` `/partners/portal` auth + Dashboard (summary
  cards, search/filters). *(Auth provider TBD — stub with mock session.)*
- **P5.4** `[frontend-builder]` Portal "My cars" list + car detail with **Timeline**,
  delivery data, documents (download), photo albums, payments table, action notices.

## Phase 6 — Remaining pages / Մնացած էջեր

- **P6.1** `[frontend-builder]` `/about` (dark hero, word-burn "Who We Are", team
  cards + collage, final CTA + gradient banner, socials).
- **P6.2** `[frontend-builder]` `/offers` (Featured + Ակցիաներ tabs Ընթացիկ|Անցած
  + promo detail → UniversalPopup).
- **P6.3** `[frontend-builder]` `/contact` (contacts + static form + BranchMap +
  quick FAQ).

## Phase 7 — Content, QA, polish / Բովանդակություն, QA, հղկում

- **P7.1** `[content-armenian]` Sweep every page: move stray literals into
  `hy.json`, verify all copy against `references/`, finalize/flag USA FAQ + footer
  + 2nd Armavir branch.
- **P7.2** `[qa-reviewer]` Full pass per the QA agent checklist (lead-widget
  wiring, a11y, responsive, reduced-motion, external links, `next build`).
- **P7.3** `[frontend-builder]` Fix QA findings; wire real data source for cars
  (CMS/API) replacing stubs; integrate real video assets when delivered.
- **P7.4** `[design-system]` Final visual polish + light/dark consistency pass.

---

## Cross-cutting reminders

- Lead widget: **Quiz** only on sticky CTA + Homepage S10; everything else **Universal**.
- All Armenian copy from `references/`; keep it in `messages/hy.json`.
- Every scroll/auto animation needs a reduced-motion fallback.
- Known asset dependencies (order early from the client): AI exploded-view hero
  video (Car Anatomy), 60–90s AI import-flow video (USA scrollytelling), founder
  video, customer-story videos, branch photos, team photos, bank/auction logos.
- Known open decisions to confirm with client: 2nd Armavir branch data, USA FAQ
  answers, CompareTool matching logic, auth provider for the partner portal, CRM
  endpoint + calendar sync.
