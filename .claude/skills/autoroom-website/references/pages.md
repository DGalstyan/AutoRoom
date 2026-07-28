# Pages — AutoRoom (section-by-section)

Eight top-level pages. Section headings keep the spec's Armenian titles. Shared
pieces reference `components.md`. Build order/priority is in the kit's `TASKS.md`.

---

## 1. Homepage `/`

- **S1 Hero.** H1 `Ներմուծում ենք ավտոմեքենաներ ԱՄՆ-ից, Չինաստանից, Եվրոպայից և
  այլ միջազգային շուկաներից`. Sub `10,000+ ներմուծված ավտոմեքենա • 10+ տարվա փորձ •
  Միջազգային գործընկերային ցանց`. Direction picker `Ընտրիր քո հաջորդ մեքենան` with
  two cards **ԱՄՆ** (`/usa`) and **Չինաստան** (`/china`).
- **Global sticky CTA** (all pages): `Չե՞ս գտել քո մեքենան...` → **QuizPopup**.
- **S2 Featured Cars.** `Շաբաթվա լավագույն առաջարկները` — `FeaturedCars` (4–5).
- **S3 `Մեքենայի անատոմիա`.** `CarAnatomy` exploded-view (see components).
- **S4 `Ինչպե՞ս է աշխատում`.** H `Մեքենայի ճանապարհը՝ ընտրությունից մինչև հանձնում`.
  A non-cliché 7-step flow (design as a journey, not plain 1-2-3): 1 Հարցում և
  խորհրդատվություն · 2 Պատվերի հաստատում · 3 Գնում և վճարում · 4 Տեղափոխում դեպի
  նավահանգիստ · 5 Միջազգային առաքում (Թուրքիա/Հունաստան/Վրաստան transit) · 6
  Հայաստան և մաքսազերծում (Գյումրի) · 7 Մեքենայի հանձնում. (Full sentences per step
  in the source spec — keep them.)
- **S5 AutoRoom Ecosystem.** H `Մեկ գործընկեր՝ ամբողջ գործընթացի համար`. Horizontal
  list: Ավտոմեքենաների ներմուծում · Աճուրդներ · Չինական մեքենաներ · Լոգիստիկա ·
  Մաքսազերծում · Ֆինանսավորում · B2B համագործակցություն · Միջազգային բեռնափոխադրումներ.
- **S6 Founder storytelling video** (≤1.5 min): how AutoRoom started, first car,
  why founded, values.
- **S7 `Customer Story Wall`** — `CustomerStoryWall` video wall.
- **S8 `Մեր մասնաճյուղերը`.** H `Միշտ քո կողքին` — `BranchMap`.
- **S9 FAQ** — `Faq`, **auto-filled from China + USA FAQ** (`references/faq.md`).
- **S10 Final CTA.** H `Չե՞ս գտել քո մեքենան`, text `Թող տվյալներդ, և մեր
  մասնագետը կօգնի գտնել լավագույն տարբերակը:` → **QuizPopup** (not Universal).
- **S11 Footer** — TBD (placeholder; wire nav + branches + socials).

---

## 2. China `/china`

- **S1 Search/filters.** Filters: `Մակնիշ` (70+), `Մոդել`, `Գինը սկսած`, `Գինը
  մինչև`, price range slider 1,000–500,000. CTA `Որոնել`.
- **S2 Available & on-order.** Three tabs: `Առկա մեքենաներ` / `Պատվերով մեքենաներ`
  (nav = filter). No tab selected ⇒ show all (random) unless a top filter is set.
  Porsche-style grid of `CarCard` (image, make, model, year, trim, EV/Hybrid/Benzin,
  range, price, condition Առկա/Պատվերով, financing available/not). CTA `Տեսնել
  մանրամասները` → `/china/[slug]`.
- **S4 Financing block.** H `Ֆինանսավորման և ապառիկի հնարավորություններ`. Partner
  banks: `Ameriabank`, `Evoca`, `IDBank` (logo → bank's auto-loan page, new tab),
  `AutoRoom` (logo → in-house offer text: financing before car reaches Armenia,
  up to 2 months, up to 70%). CTA `Մանրամասների համար կապ հաստատիր մեզ հետ` → UniversalPopup.
- **S4b `Ինչո՞ւ Չինաստանից պատվիրել AutoRoom-ի միջոցով`.** Advantage list:
  Մատակարարների ստուգում · Կոմպլեկտացիայի հաստատում · Գնի բաց հաշվարկ · Լոգիստիկայի
  կազմակերպում · Փաստաթղթերի վերահսկում · Ամբողջական ուղեկցում մինչև հանձնում.
- **S5 FAQ** — China questions (see `references/faq.md`).
- **S7 Final CTA.** H `Քո հաջորդ մեքենան արդեն Չինաստանում է. մնում է սկսենք`,
  CTA `Ստանալ առաջարկ` → UniversalPopup.

### China car detail `/china/[slug]`
- 3.1 Hero: big image, name, price, condition, delivery ETA. Two sticky CTAs:
  (1) `Ստանալ անհատական առաջարկ [Make Model]-ի համար` → per-car UniversalPopup;
  (2) `Տես վարկի պայմանները այս մեքենայի համար` → `LoanCalculator`.
- 3.2 Images tabs: Exterior / Interior / Details / Video.
- 3.3 Color picker (order-only): Սպիտակ/Սև/Մոխրագույն/Կապույտ/Կարմիր — image
  swaps with selected color.
- 3.4 Specs: Make, Model, Year, Trim, Fuel, Range, Battery, Engine, Drivetrain,
  Seats, Warranty.
- 3.5 `PriceJourney`.
- 3.6 `SimilarOffers` (3–4 same class/budget/fuel).
- 3.6b Financing: `BuyWithLoan` bank grid + `LoanCalculator` (right column, sticky).

---

## 3. Construction machinery `/machinery` (lives under China)

- **S1 List.** Cards: Excavator, Wheel Loader, Bulldozer, Forklift, Crane, Road
  Roller, Grader, Backhoe Loader. All marked `պատվերով`. CTA `Տեսնել մանրամասները`
  → `/machinery/[slug]`.
- **S2 Detail.** Big image, name, price, delivery ETA, condition. Images:
  Exterior/Cabin/Details. Tech specs: Արտադրող, Մոդել, Տարեթիվ, Շարժիչ, Հզորություն,
  Քաշ, Աշխատաժամեր, Վառելիք, Չափեր, Բեռնատարողություն. Financing note:
  `ՀՀ-ում հասանելի են լիզինգի և սուբսիդավորման ծրագրեր։ Խորհրդակցիր բանկերի հետ, իսկ
  AutoRoom-ը կլինի քո վստահելի մատակարարը։`

---

## 4. USA `/usa`

- **S1 Top.** H `Ավտոմեքենաներ ԱՄՆ-ից՝ աճուրդներից պատվերով և առկա առաջարկներով`.
  Sub (keep spec sentence). Two options `Տեսնել լավագույն աճուրդները` /
  `Դիտել առկա մեքենաները`; short form: `Աճուրդ / Ճանապարհին / Առկա`.
- **S2 Best auctions.** Logic: if in-stock in Armenia → AutoRoom car detail; if
  auction → depends on platform. **Copart/IAAI** cards: two CTAs `Տեսնել մեքենան
  օնլայն` (AutoRoom-provided View-Only access; user cannot bid/pay) + `Կապ հաստատիր
  մեզ հետ` (popup: Անուն, Հեռախոս, Մեքենայի հղում/լոտ, Բյուջե, Ֆինանսավորում, Մեկնաբանություն).
  **Manheim** cards: single CTA `Կապ հաստատիր մեզ հետ` (no direct auction access).
  - 2.1 List `Շաբաթվա լավագույն առաջարկները ԱՄՆ աճուրդներից`: Copart/IAAI/Manheim
    deal cards with image, make/model, year, damage type, mileage, current auction
    price, est. final price in Armenia, auction end time, countdown, savings vs market.
  - 2.2 Auction car detail: big image, name, year, price, est. final price;
    images Exterior/Interior/Details/Video; specs Make, Model, Year, VIN, mileage,
    engine, fuel, drivetrain, transmission, damage history, location.
  - 2.3 `Հետևել աճուրդին օնլայն`: View-Only (Guest Login) live follow of Copart/IAAI
    — see the full explanatory copy + 5-step "how it works" in the source spec.
    CTAs `Տեսնել մեքենան օնլայն` + `Կապ հաստատիր մեզ հետ` (UniversalPopup).
  - 2.4 Customs calculator (reference: usamotors.am/am/calculator).
- **S3 Available cars.** H `Առկա մեքենաներ Հայաստանում`. If in-stock → AutoRoom
  detail; if auction → redirect to Copart/IAAI (Manheim → popup). Card: image,
  make, model, year, mileage, price, status (Առկա Հայաստանում / Վերանորոգված /
  Պատրաստ վաճառքի), financing. CTA `Տեսնել մեքենան` → `/usa/available/[slug]`.
  - 3.2.1 Available detail: big image, name, year, price, est. final price, status
    (Առկա/Ճանապարհին); images tabs; specs (same as auction detail).
  - 3.2.2 Financing: same as China car detail.
- **S4 On-the-road cars.** H `Հենց հիմա ճանապարհին են` — cards for bought cars en
  route: image, make/model/year, price (usually better than in-stock), `Կհասնի ~X
  օրից` countdown, status badge Նավում/Փոթի/Մաքսազերծում. CTA `Ամրագրիր մինչև հասնելը`
  → UniversalPopup (car prefilled).
- **S5 USA times by state.** H `Տեղական ժամը ԱՄՆ նահանգներում`. Visual: US map or
  iPhone-World-Clock-style carousel; per state: name, local time, diff vs Armenia.
- **S8 Import process** (Scrollytelling + AI video) — `Scrollytelling`, 12 chapters:
  1 Պատվերի մշակում (~) · 2 Մեքենայի որոնում · 3 Ընտրություն (VIN/damage/history ✓) ·
  4 Աճուրդից գնում (WON) · 5 Վճարում · 6 Փիքափ աճուրդից · 7 **Ընդունում և ստուգում**
  (split-screen auction vs real car, 360° — most trust-building, longest) ·
  8 AutoRoom հրապարակում · 9 Բեռնում կոնտեյներ · 10 Կոնտեյները նավի վրա ·
  11 **Բեռնաթափում և ֆուռ** (container doors open — most-awaited, longest) ·
  12 Գյումրի — ժամանում (ends on handover, links to Story Wall). Show approx
  duration per step (~3–5 օր). Final CTA `Սկսիր քո մեքենայի ճանապարհը` → UniversalPopup.
- **S8b Useful guides.** H `Սովորիր մեքենաների ներմուծման մասին մեր փորձից` — Reels/
  video cards.
- **S8c FAQ** — USA questions.
- **S9 Final CTA.** H `Գտե՞լ ես հետաքրքիր մեքենա ԱՄՆ-ից`, CTA `Ստանալ առաջարկ` → UniversalPopup.

---

## 5. Partners / Dealers `/partners` (B2B)

- **S1 Hero.** H `Դարձիր AutoRoom-ի գործընկեր`. CTA `Դառնալ գործընկեր` → scrolls to
  final CTA booking popup; `Խոսել մեր մասնագետի հետ` → click-to-call AutoRoom.
- **S2 Why partner.** 24/7 աջակցություն, Հատուկ գնային առաջարկներ, Արագ հաշվարկներ,
  Անձնական մենեջեր, Գործընկերային պայմաններ, Առաջնահերթ սպասարկում, Տեխնիկական
  աջակցություն, Մշտական կապ AutoRoom թիմի հետ.
- **S3 Who can join.** Ավտոսրահներ, Ավտովաճառք ընկերություններ, Ավտոդիլերներ,
  Լիզինգային կազմ., Ավտոպարկեր, Կորպորատիվ հաճախորդներ, Շինարարական կազմ., Անհատ ներմուծողներ.
- **S4 Portal login.** H `Կառավարիր քո պատվերները մեկ հարթակից` + `Մուտք գործել` → `/partners/portal`.
- **S5 Final CTA `Դառնալ գործընկեր`** — a **meeting-booking** popup (not a plain
  form). 2 columns (desktop): left = contact (Անուն*, Հեռախոս* +374, Email,
  Ընկերության անվանում, Գործունեության ոլորտ dropdown [Ավտոսրահ/Դիլեր/Լիզինգ/
  Ավտոպարկ/Շինարարական/Այլ], Մեկնաբանություն); right = booking (interactive
  Calendar date-picker, past days disabled; time-slot chips 10:00/11:00/12:30/
  14:00/15:30/17:00, taken=disabled; meeting format radio-cards 💻 Օնլայն / 🏢
  AutoRoom գրասենյակում / 📍 Այլ հասցե). Full-width CTA `Ամրագրել հանդիպումը`,
  enabled only when name+phone+day+time set. Summary line before CTA
  `📅 Չորեքշաբթի, 15 հուլիսի, 14:00 • Օնլայն`. Mobile: sequential steps 1 Տվյալներ →
  2 Օր/ժամ → 3 Հաստատում with progress bar. Records as **Partner Lead** in CRM
  tied to chosen slot; slots generated from team availability; future Google/Outlook sync.

### Partner portal (`/partners/portal`, authed)
- **Page 1 Dashboard.** `Բարև, [Անուն]`. Summary cards: Ակտիվ մեքենաներ (5 ակտիվ /
  1 բեռնման / 2 ճանապարհին / 1 հասել Հայաստան / 1 հանձնված); Վճարումների ամփոփում
  (3 վճարման ենթակա / 2 մասամբ / 1 ամբողջությամբ); Ըստ երկրի (🇨🇳 4 / 🇺🇸 2). Search
  (VIN / order # / make-model) + filters (country, status, date, branch).
- **Page 2 My cars.** Cards or table: image, make/model, year, VIN, order #,
  country, current status badge, container # (if any). CTA `Տեսնել մանրամասները`.
- **Page 3 Car detail.** Header (image, make/model, year, VIN, order #, country,
  branch). **Timeline** (not table): ✅ Պատվեր ստեղծված → ✅ Վճարում հաստատված → ✅
  Մեքենան գնված → ✅ Ստացվել պահեստում → 🟢 Բեռնման փուլում (current) → ⚪ Ճանապարհին
  → ⚪ Հայաստան հասած → ⚪ Հանձնված, date under each. Delivery data (current
  location, container #, ship name, tracking link). Specs (make, model, year,
  color, interior color, VIN, lot # if USA, engine, fuel). Documents (Invoice,
  Contract, other — each with download). Photo albums: Auction photos (auto,
  if USA), Receipt photos (auto), Delivery/handover Gyumri (uploaded by AutoRoom
  staff when container opens) + `Ներբեռնել բոլոր նկարները`. Payments: summary
  cards (Ընդհանուր արժեք / Վճարված / Մնացորդ) + history table (date, description,
  amount). Action notices at top (Սպասվում է վճարում / Պահանջվում է փաստաթուղթ /
  Մեքենան հասել է Փոթի / Մեքենան պատրաստ է հանձնելու).

---

## 6. About `/about`

- **S1 Hero** (dark, 2-col). Left big uppercase H (3 lines) `Աշխարհի լավագույն
  մեքենաները՝ հասանելի քեզ համար`. Right intro paragraph (keep spec text, 2012,
  10,000+, 3 branches). CTAs `Ստանալ անվճար խորհրդատվություն` (accent) + `Կապվել
  մեզ հետ` (outline).
- **S2 Who We Are.** Full-screen centered large text that "burns in" word-by-word
  on scroll (keep spec paragraph verbatim).
- **S3 Why choose us** — reuse Homepage advantages.
- **S4 Team.** Magnus-style cards (photo + brand graphic bg; name + role + social
  icon; hover animates). Then a photo collage grid (one full-width + two medium)
  mixing photos + short video clips.
- **S5 Final CTA.** H `Պատրա՞ստ ես ներմուծել քո երազանքի մեքենան`, text `Ստացիր
  անվճար խորհրդատվություն այսօր`, CTA `Ստանալ խորհրդատվություն` → popup. Above it a
  thin gradient banner-CTA `Հարցեր ունե՞ս․ խոսիր մասնագետի հետ → Հիմա`.
- **S6 Stay in touch.** Socials (Facebook, Instagram, TikTok, LinkedIn).

---

## 7. Special offers `/offers`

Accessible from header + as a static homepage section. Two parts.
- **S1 Featured Cars.** `Շաբաթվա լավագույն առաջարկները` — same `FeaturedCars`;
  cards show struck old price + new price + offer deadline. Click → car detail.
- **S2 Ակցիաներ.** H `Ընթացիկ ակցիաներ`. Tab/toggle `Ընթացիկ | Անցած`. Card:
  banner/image, name, 1–2 line description, deadline + `Մնացել է X օր` countdown,
  status badge Ընթացիկ, CTA `Մանրամասն` → promo detail/popup (full terms,
  participating cars/directions, CTA `Ստանալ առաջարկ` → UniversalPopup). **Անցած**
  tab: finished promos as grayscale cards, `Ավարտված` badge, no CTA.
- **S3 Final CTA.** H `Չե՞ս գտել քեզ հարմար առաջարկ`, CTA `Թող տվյալներդ` → UniversalPopup.

---

## 8. Contact `/contact`

- **S1 Contacts + form** (2-col). Left: phone(s) click-to-call, email, working
  hours, socials, messenger buttons WhatsApp/Viber/Telegram (direct chat links).
  Right: static form (not popup) — Անուն, Հեռախոս, Email (optional), Թեմա dropdown
  (Մեքենա ԱՄՆ-ից / Մեքենա Չինաստանից / Շինտեխնիկա / Ֆինանսավորում / Գործընկերություն /
  Այլ), Մեկնաբանություն, CTA `Ուղարկել`. Success `Շնորհակալություն, [Անուն]։ Կկապվենք
  քեզ հետ շուտով`.
- **S2 Branches** — `BranchMap` + 3 branch cards, CTA `Ուղղություն` → Google Maps.
- **S3 Quick answers** — 3–4 top FAQ (accordion) + link `Տես բոլոր հարցերը` → FAQ.
