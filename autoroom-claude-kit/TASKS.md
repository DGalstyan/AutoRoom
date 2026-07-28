# AutoRoom — build task breakdown / Կառուցման առաջադրանքներ

Bilingual task plan for building the AutoRoom site in the repo
`github.com/DGalstyan/AutoRoom`. Each task names the **agent** that should own
it. Phases are ordered; within a phase, tasks can run in parallel unless a
dependency is noted. Copy these into your tracker (or feed them to Claude Code
task-by-task).

Legend: `[design-system]` `[frontend-builder]` `[forms-and-leads]`
`[content-armenian]` `[qa-reviewer]`. `[x]` = on `main`.

**Status:** Phases 0 and 1 are complete and pushed. `npm run typecheck`, `lint`,
`format:check` and `build` all pass. Phase 2 (Homepage) is next — every shared
component it needs already exists.

---

## Phase 0 — Foundation / Հիմք ✅

- [x] **P0.1** `[frontend-builder]` Scaffold Next.js (App Router) + TypeScript +
  Tailwind + ESLint/Prettier in the repo root. Add the routing skeleton from
  `SKILL.md` (empty pages that render their H1).
- [x] **P0.2** `[design-system]` Implement `tailwind.config` + tokens from
  `references/design-tokens.md`; load fonts with verified **Armenian** glyph
  coverage; global CSS + CSS variables.
- [x] **P0.3** `[design-system]` Build base primitives: `Button`, `Chip`, `Badge`,
  `Card`, `Dialog` shell (focus-trap/Esc/overlay), `Slider`, `Tabs`, `Accordion`,
  `Countdown`.
- [x] **P0.4** `[content-armenian]` Create `messages/hy.json` scaffolding (`common` +
  per-page namespaces) and seed shared labels/CTAs.
- [x] **P0.5** `[frontend-builder]` Global `Header` nav + `Footer` placeholder +
  global `StickyCta` (→ Quiz Popup).

Fixed while building Phase 1: `eslint.config.mjs` piped `eslint-config-next` 16
through `FlatCompat.extends()`, but v16 ships flat config arrays, so `npm run
lint` crashed on schema validation. `Header`, `Dialog` and `Countdown` also
tripped the new `react-hooks/set-state-in-effect` rule and were rewritten to
`useSyncExternalStore` / adjust-during-render.

## Phase 1 — Shared components / Ընդհանուր բաղադրիչներ (highest reuse) ✅

- [x] **P1.1** `[forms-and-leads]` `UniversalPopup` (3 steps on one screen, +374
  mask, hidden payload, pre-select, per-car variant with colour picker) +
  `LeadPayload` type + `submitLead` adapter + `POST /api/leads` stub.
- [x] **P1.2** `[forms-and-leads]` `QuizPopup` (5 chip questions → 3 cars → hands to
  UniversalPopup, which stays the single submission path).
- [x] **P1.3** `[frontend-builder]` `CarCard` (6 contexts) + `CarDetail`
  (variant-driven shell) + `SimilarOffers`. Adds `types/car.ts` (`Car`,
  `SPEC_ROWS`) and the `data/cars.ts` stub catalogue.
- [x] **P1.4a** `[forms-and-leads]` `LoanCalculator` (real-time, synced
  slider/input, no "Հաշվել" button; rates in `lib/loan.ts` config).
- [x] **P1.4b** `[frontend-builder]` `BuyWithLoan` bank grid (partner banks open
  externally; AutoRoom tile opens the in-house offer in place).
- [x] **P1.5** `[frontend-builder]` `PriceJourney` (scroll-fill + summing counter +
  tooltips + breakdown table + mobile vertical timeline + reduced-motion path).
- [x] **P1.6** `[frontend-builder]` `Faq` accordion (topic-keyed, Homepage
  auto-aggregates) + `BranchMap` (pins, panel, `Ուղղություն`) using
  `references/branches.md`.
- [x] **P1.7** `[frontend-builder]` `FeaturedCars`, `Countdown` usages (auction end,
  offer deadline, arrival ETA), `CompareTool` (v1: dock + table + diff highlight;
  matching logic still flagged TBD).

**Verified end-to-end in the browser:** sticky CTA → Quiz → 5 answers → 3
recommendations → UniversalPopup (quiz pre-selects carried through) → +374 mask →
submit → success, with the hidden context (source page, source CTA, interest,
device) arriving at the API. The other components are type- and build-verified
only — nothing mounts them until Phase 2+ wires the pages.

## Phase 2 — Homepage / Գլխավոր էջ

- **P2.1** `[frontend-builder]` S1 Hero + direction picker (ԱՄՆ/Չինաստան cards).
- **P2.2** `[frontend-builder]` S2 Featured, S5 Ecosystem, S8 Branches, S9 FAQ
  (auto-aggregate China+USA), S10 final CTA (→ Quiz Popup). *(All four use
  finished Phase 1 components — `FeaturedCars`, `Faq`, `BranchMap`.)*
- **P2.3** `[frontend-builder]` **S3 Car Anatomy** exploded-view (scroll-driven +
  hotspots + mobile chip list). *(Needs the AI hero-car video asset — stub with a
  placeholder + working scroll logic; reuse `lib/motion.ts`.)*
- **P2.4** `[frontend-builder]` S4 process journey, S6 founder video, S7 Customer
  Story Wall (video wall).

## Phase 3 — China / Չինաստան

- **P3.1** `[frontend-builder]` `/china` list: filters + price slider + 3-tab
  (Առկա/Պատվերով) grid + financing block + "why order via AutoRoom" + FAQ + CTA.
- **P3.2** `[frontend-builder]` `/china/[slug]` car detail — mount `CarDetail`
  with `variant="china"` and wire `getCar`/`getSimilarCars`.
- **P3.3** `[frontend-builder]` `/machinery` list + `/machinery/[slug]` detail
  (`variant="machinery"`; tech specs + leasing note; all cards `պատվերով`).

## Phase 4 — USA / ԱՄՆ

- **P4.1** `[frontend-builder]` `/usa` top + Best Auctions list with per-platform
  CTA logic (Copart/IAAI View-Only + Contact; Manheim Contact-only). *(The CTA
  logic is already implemented in `CarCard`/`CarDetail`.)*
- **P4.2** `[frontend-builder]` Auction car detail + "Հետևել աճուրդին օնլայն"
  (View-Only guest login explainer — the full 5-step copy is still needed) +
  customs calculator.
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
  + format; CRM Partner Lead; mobile stepper). *(Reuse `LeadPayload`/`submitLead`.)*
- **P5.3** `[frontend-builder]` `/partners/portal` auth + Dashboard (summary
  cards, search/filters). *(Auth provider TBD — stub with mock session.)*
- **P5.4** `[frontend-builder]` Portal "My cars" list + car detail with **Timeline**,
  delivery data, documents (download), photo albums, payments table, action notices.

## Phase 6 — Remaining pages / Մնացած էջեր

- **P6.1** `[frontend-builder]` `/about` (dark hero, word-burn "Who We Are", team
  cards + collage, final CTA + gradient banner, socials).
- **P6.2** `[frontend-builder]` `/offers` (Featured + Ակցիաներ tabs Ընթացիկ|Անցած
  + promo detail → UniversalPopup). *(`CarCard context="offer"` is ready.)*
- **P6.3** `[frontend-builder]` `/contact` (contacts + static form + BranchMap +
  quick FAQ). *(`Faq limit={3}` and `BranchPanel` are ready.)*

## Phase 7 — Content, QA, polish / Բովանդակություն, QA, հղկում

- **P7.1** `[content-armenian]` Sweep every page: move stray literals into
  `hy.json`, verify all copy against `references/`, finalize/flag USA FAQ + footer
  + 2nd Armavir branch. **Also review the ~25 strings authored during Phase 1**
  that the references do not cover — see "Strings pending review" below.
- **P7.2** `[qa-reviewer]` Full pass per the QA agent checklist (lead-widget
  wiring, a11y, responsive, reduced-motion, external links, `next build`).
- **P7.3** `[frontend-builder]` Fix QA findings; replace `data/cars.ts` stubs with
  the real data source (CMS/API) — the `Car` shape and the selectors at the
  bottom of that file are the only contract; switch `CarImage` to `next/image`;
  integrate real video assets when delivered.
- **P7.4** `[design-system]` Final visual polish + light/dark consistency pass.

---

## Cross-cutting reminders

- Lead widget: **Quiz** only on sticky CTA + Homepage S10; everything else **Universal**.
  Pages never render popups — they call `openUniversal()` / `openQuiz()` on
  `LeadWidgetProvider`, which attaches the hidden context in one place.
- All Armenian copy from `references/`; keep it in `messages/hy.json`.
- Every scroll/auto animation needs a reduced-motion fallback (`lib/motion.ts`).
- Known asset dependencies (order early from the client): AI exploded-view hero
  video (Car Anatomy), 60–90s AI import-flow video (USA scrollytelling), founder
  video, customer-story videos, branch photos, team photos, bank/auction logos.

### Open decisions to confirm with the client

- 2nd Armavir branch data; branch lat/lng (`BranchMap` pins fall back to the
  branch list until these land) and branch photos.
- China FAQ answers (10 questions are in `data/faq.ts`, answers empty and not
  rendered) and the whole USA FAQ list.
- CompareTool matching logic for mixed-variant comparisons.
- Auth provider for the partner portal; CRM endpoint + calendar sync.
- **USD→AMD rate** quoted by `LoanCalculator` (`DEFAULT_LOAN_CONFIG.usdToAmd`,
  currently 390) — fix it or wire a daily source.
- **Bank auto-loan deep links** — `data/banks.ts` points at the banks' home
  domains, not verified application URLs.

### Strings pending review (`[content-armenian]`)

Authored during Phase 1 because `references/` does not cover them: form
validation errors, the sending/success lines, the contact-channel instrumental
forms (`զանգով`, `WhatsApp-ով`, …), car spec labels (`Վազքի պաշար`, `Քարշակ`,
`Փոխանցումատուփ`, …), the KASKO disclaimer and the AutoRoom in-house financing
text. All live in `messages/hy.json`; none are inline.

### Corrections applied to `references/components.md`

Three source strings look corrupted; the implementation uses corrected Armenian.
Fix them at the source so the two stop disagreeing:

- `Օնլайн վարկ` → `Օնլայն վարկ` (the middle of the word is Cyrillic).
- `View mașина online` → the existing `Տեսնել մեքենան օնլայն`.
- `Տեսնել մանրամասն breakdown` → `Տեսնել մանրամասն հաշվարկը`.
