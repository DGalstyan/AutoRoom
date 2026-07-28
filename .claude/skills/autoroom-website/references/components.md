# Shared components — AutoRoom

Contracts for every reusable component. Build each once under
`components/shared/` and reuse across pages. Props are illustrative TypeScript.

---

## `Header` / global nav

Nav items (Armenian, in order): **ԳԼԽԱՎՈՐ ԷՋ** (logo → `/`) · **Չինաստան**
(`/china`) · **ԱՄՆ** (`/usa`) · **Հատուկ առաջարկներ** (`/offers`) · **Դարձիր
գործընկեր** (`/partners`) · **Բլոգ** (`/blog`) · **Մուտք** (partner portal login
→ `/partners/portal`) · **Մեր մասին** (`/about`) · **Կապ մեզ հետ** (`/contact`).
Sticky, condenses on scroll. Mobile: hamburger drawer.

---

## `StickyCta` (global)

Persistent CTA on every page: **"Չե՞ս գտել քո մեքենան. միասին սկսենք ընտրությունը"**.
- Opens the **Quiz Popup** (NOT the Universal Popup) — see rule below.
- Position: bottom bar or bottom-right floating pill; hides while a popup is open.

---

## `UniversalPopup` ⭐ (the universal lead form)

One component that replaces almost all "հայտ" popups. Principle: **only 2 required
fields**, everything else optional and expressed as chips/dropdowns (minimize typing).

```ts
type LeadInterest = 'usa' | 'china' | 'in-stock' | 'machinery' | 'undecided';
type Budget = 'lt10k' | '10-20k' | '20-35k' | '35k+';
type Financing = 'need' | 'no' | 'unsure';
type Timing = 'now' | '1-3m' | 'browsing';
type Channel = 'call' | 'whatsapp' | 'viber' | 'telegram';

interface UniversalPopupProps {
  open: boolean;
  onClose: () => void;
  // Pre-selection depending on where it opened from:
  preselect?: Partial<{ interest: LeadInterest; budget: Budget }>;
  // If opened from a car page, lock this card at the top (read-only):
  car?: { name: string; vin?: string; price?: string; image?: string; url: string };
  sourcePage: string;   // auto
  sourceCta: string;    // auto
}
```

**Step 1 — required (no submission without these):**
- `Անուն` (name)
- `Հեռախոս` — auto `+374` format mask

**Step 2 — optional, one screen, chip/dropdown only:**
- `Ի՞նչ ես փնտրում` — chips: `Մեքենա ԱՄՆ-ից` / `Մեքենա Չինաստանից` / `Առկա մեքենա` / `Շինտեխնիկա` / `Դեռ չգիտեմ`
- `Բյուջե` — range chips: `մինչև 10.000$` / `10–20.000$` / `20–35.000$` / `35.000$+`
- `Ֆինանսավորում` — `Պետք է` / `Պետք չէ` / `Դեռ չգիտեմ`
- `Ե՞րբ ես պլանավորում գնել` — `Հիմա` / `1–3 ամսում` / `Ուղղակի ուսումնասիրում եմ`
- `Կապի նախընտրելի եղանակ` — `Զանգ` / `WhatsApp` / `Viber` / `Telegram`

**Step 3 — free field:** `Մեկնաբանություն / կոնկրետ մեքենայի հղում կամ Lot` (optional).

**Auto-attached (hidden, sent to team / CRM — user never fills):**
`sourcePage`, `car.name`/`car.vin` if on a car page, `sourceCta`, timestamp,
locale, device.

**UX:**
- Submit button label `Ուղարկել`, **enabled as soon as Step 1 is filled** (Step 2/3
  never block).
- Encouraging line above optional fields: `Այս 20 վայրկյանը կխնայի քո 2 զանգը 🙂`.
- Success: `Շնորհակալություն, [Անուն]։ Մեր մասնագետը կկապվի [ընտրած եղանակով]`.
- When opened from a page, pre-check the matching Step-2 chip (China page ⇒
  `Մեքենա Չինաստանից` already selected).
- Focus-trapped dialog, Esc closes, dark overlay, X top-right.

**Per-car variant** (China/USA car detail "Ստանալ անհատական առաջարկ [Make Model]"):
title `Popup — [Make Model]-ի հարցում`; show the car as a locked card
(image + name + price); add `Ցանկալի գույն` dropdown (only that car's colors,
**order-only cars**), `Բյուջե` (optional), `Ֆինանսավորում` need/no, comment.
Submit `Ուղարկել հայտը`. Success: `Շնորհակալություն, [Անուն]։ Մեր մասնագետը կկապվի
քեզ հետ [Make Model]-ի գնի, ժամկետի և ֆինանսավորման տարբերակների հետ միասին`.

---

## `QuizPopup` — "Գտիր քո մեքենան 60 վայրկյանում"

5 chip-only questions (no typing):
1. `Բյուջե`
2. `Վառելիք` — `EV` / `Hybrid` / `Բենզին`
3. `Օգտագործում` — `քաղաք` / `ընտանիք` / `ճանապարհորդություն`
4. `Երկիր` — `ԱՄՆ` / `Չինաստան` / `միևնույն է`
5. `Ե՞րբ ես ուզում գնել` — `հիմա` / `1-3 ամիս` / `ուսումնասիրում եմ`

Result: **3 recommended car cards** + CTA `Ստանալ առաջարկ այս մեքենաների համար`
→ opens `UniversalPopup` with the quiz answers + recommended cars attached.

**Used INSTEAD of `UniversalPopup` in exactly two places:** the global `StickyCta`
and Homepage Section 10 final CTA. All other `Ստանալ առաջարկ` → `UniversalPopup`.

---

## `CarCard`

Grid card (Porsche-style layout). Props vary by context; superset:
`image, make, model, year, trim, powertrain('EV'|'Hybrid'|'Benzin'), range,
price, oldPrice?, condition('in-stock'|'on-order'|'on-road'|'auction'),
financingAvailable(bool), badges[], href, compareToggle?`.
- Homepage/Featured: minimal — model name + total price only.
- China list: full detail incl. condition + financing availability.
- Offer card: struck old price + new price + offer deadline.
- `⚖ Համեմատել` toggle to add to `CompareTool`.
- CTA `Տեսնել մանրամասները` → car detail (or auction site / popup per USA logic).

---

## `CarDetail` (variant-driven)

One component, `variant: 'china' | 'usa-auction' | 'usa-available' | 'machinery'`.
Common: big image, name, price, condition, delivery ETA; image tabs
`Exterior / Interior / Details / Video`; spec table; `SimilarOffers`;
`CompareCta`. Variant differences:
- **china:** color picker (order-only), two sticky CTAs (per-car UniversalPopup +
  `LoanCalculator`), `PriceJourney`, `BuyWithLoan` + `LoanCalculator` in right column.
- **usa-auction:** VIN/Lot, damage history, location, est. final price in Armenia,
  `View mașина online` guest login note; CTAs per auction platform logic.
- **usa-available:** VIN, mileage, "Առկա/Ճանապարհին" status, est. final price,
  same financing blocks as china.
- **machinery:** technical spec set (see machinery page), "պատվերով" badge,
  leasing/subsidy financing note (no calculator).

---

## `LoanCalculator` — "Վարկի պայմաններ"

Real-time card. Structure top→bottom:
- Title `Վարկի պայմաններ` (bold) + hairline.
- `Կանխավճար` (down payment): number input (formatted `1 049 000`) **synced** with
  a slider below it.
- Rows (label left / bold value right):
  `Ժամկետ (ամիս)` — 60 · `Անվանական տոկոսադրույք (ճշգրտվող հաստատուն)` — 15.9 % ·
  `Փաստացի տոկոսադրույք (ճշգրտվող հաստատուն)` — 17.11 - 17.19 %.
- Divider.
- Result: `Ամսական վճար` label left, big bold `֏` amount right (e.g. `144 000 ֏`) —
  most emphasized element.
- Small gray disclaimer (e.g. KASKO insurance included in rate).
- **Interaction:** changing down payment (slider or input) recomputes monthly in
  real time, no "Հաշվել" button. Slider and input stay in sync.
- Parameters (term, rates) come from config so they can be tuned per campaign.

---

## `BuyWithLoan` — bank grid

Right-column card on car detail. Header: bank icon + `Գնել Վարկով` (bold) /
`Օնլайն վարկ` (gray subline). Then a 2-col grid of bank logos, each in its own
white rounded card (button-like, equal size, hover-lift).
- **Public banks** (China/USA public financing block): `Ameriabank`, `Evoca`,
  `IDBank` open that bank's online auto-loan application in a **new tab**;
  `AutoRoom` (2×2 grid, accent border) does NOT leave — it opens our in-house
  offer: financing before the car reaches Armenia, up to 2 months, up to 70% of value.
- Desktop: may be `sticky` in the right column.

---

## `PriceJourney` — "Գնի ճանապարհը"

Turns price transparency into visual proof. Horizontal route
`Չինաստան → ճանապարհ → Հայաստան` (dashed). Stops carry price chips:
1. `Մեքենայի արժեք — XX,XXX $` (China)
2. `Ներքին տեղափոխում + արտահանման փաստաթղթեր — X,XXX $`
3. `Միջազգային առաքում + ապահովագրություն — X,XXX $`
4. `Մաքսազերծում (մոտավոր) — X,XXX $` (Armenia)
- Scroll fills the line; chips reveal in sequence with a **summing counter**;
  end chip at Armenia: big bold `Վերջնական արժեք Հայաստանում — XX,XXX $`.
- Each chip hover/tap tooltip: what it includes + "մոտավոր" tag when not exact.
- Below: `Առանց թաքնված վճարների` note + `Ստանալ ճշգրիտ հաշվարկ` CTA (→ UniversalPopup);
  toggle `Տեսնել մանրամասն breakdown` → accordion table.
- Mobile: vertical timeline, same chips. One universal component, no per-car art.

---

## `CarAnatomy` — exploded-view hero (Homepage Section 3)

Scroll-driven exploded-view video ("why choose AutoRoom" as interactive experience).
Car sits, scroll lifts it and separates parts (doors, hood, wheels, engine float
apart). Each part becomes an advantage **hotspot** with a connector line + label,
revealed in sequence:
- Շարժիչ — 10+ տարվա փորձ
- Թափք — 10,000+ ներմուծված ավտոմեքենա
- Անիվներ — 98% հաջող առաքումներ
- Դռներ — Թափանցիկ գործընթաց․ բաց գնագոյացում, հասկանալի ծախսեր
- Ղեկ — 100% բանալին ձեռքին սպասարկում
- Լուսարձակներ — Արագ արձագանք, մշտական կապ
- Փաստաթղթապանակ — Միջազգային ցանց՝ ԱՄՆ • Չինաստան • Եվրոպա • Կորեա • Ճապոնիա
- Բանալի — 3 մասնաճյուղ Հայաստանում

Hover/tap each hotspot → tooltip with one-sentence explanation. Final scroll step:
car reassembles and lands; hotspots replaced by one big bold line
`Ամեն դետալ իր տեղում է. այդպես ենք աշխատում`, then CTA `Սկսել ընտրությունը` → UniversalPopup.
- Mobile: video plays on entering viewport (not scroll-scrubbed); hotspots become a
  vertical chip list under the video.
- Production note: ONE universal hero-car asset (AI-generated exploded effect +
  edit), reused for all — no per-model 3D.

---

## `Scrollytelling` (USA import flow, 12 chapters)

Apple-product-page pattern. Desktop: sticky visual column (one 60–90s AI-generated
video, 12 chapters ~4–6s each) + text steps on the other side; scrolling advances
text steps and scrubs the video to the matching chapter; top progress bar (1–12).
Mobile: vertical cards, each with its own video segment (autoplay/muted/loop).
Steps + approx durations are in `references/pages.md` (USA Section 8). Steps 7 and
11 are the most emotional — longest chapters. Final CTA `Սկսիր քո մեքենայի ճանապարհը`
→ UniversalPopup.

---

## `Faq` (accordion)

Question rows, click a `+` to expand the answer. Homepage FAQ **auto-aggregates**
the China + USA FAQ entries. Exact strings in `references/faq.md`. Each row is a
button with `aria-expanded`.

---

## `BranchMap` — "Մեր մասնաճյուղերը / Միշտ քո կողքին"

Interactive Armenia map with location pins: Երևան, Արմավիր, Արմավիր (2nd), Էջմիածին.
CTA `Այցելիր մոտակա մասնաճյուղ`. Clicking a pin opens a panel: branch photo,
address, phone, working hours. On Contact page, card CTA `Ուղղություն` → Google Maps.
Data in `references/branches.md`.

---

## `CompareTool` (China + USA shared)

2–3 cars side by side: specs, final price in Armenia, monthly payment.
Entry points: `⚖ Համեմատել` on `CarCard`; `Համեմատիր այս մեքենան` on `CarDetail`
(user picks 1–2 others via search or from similar). Auto-builds a row-by-row table;
**highlight differences with color**. (Detailed matching logic TBD.)

---

## `CustomerStoryWall` (Homepage Section 7)

Not standard reviews — a **video wall** of 60–90s real stories (multi-screen grid,
each video clickable). Per story: customer, car, origin, why chosen, experience.

---

## `FeaturedCars` (Homepage + Offers)

"Շաբաթվա լավագույն առաջարկները" — 4–5 hero cars. Card shows model name + total
price; click → car detail (USA or China). On Offers page, also show struck old
price + new price + offer deadline.

---

## `Countdown`

Reusable countdown for auction end times, offer deadlines, "Կհասնի ~X օրից".
`aria-live="polite"`, updates without layout shift.

---

## `PartnerPortal` (auth area)

See `references/pages.md` → Partners. Dashboard summary cards, car list, car detail
with a **Timeline** (not a table) of order → payment → purchased → warehouse →
loading → on the road → arrived → handed over, each with a date; delivery data,
docs (download), photo albums (auction/receipt auto; Gyumri handover uploaded by
staff), payments table, action notices at top of car page.
