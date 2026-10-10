/**
 * The CTA registry — one place that says what every call to action on the site is and what it
 * does (`SKILL.md` "The two lead entry points", `references/components.md`).
 *
 * Two parts:
 *  - `CTA_KINDS`: the handful of behaviours a CTA can have, each with its label key in the
 *    message files and how it must be wired. Labels and behaviour belong together — a button
 *    that dials must not say "visit", a link that scrolls must not say "call".
 *  - `LEAD_CTAS`: every `sourceCta` id that opens a lead widget, with which widget. The id is
 *    what is stored with each lead, so renaming one silently splits reporting; `cta.test.ts`
 *    fails when a call site uses an id that is not listed here, when a listed id has no call
 *    site, or when the quiz is opened from anywhere it is not allowed.
 */

export type LeadWidget = 'universal' | 'quiz' | 'usaAuction' | 'partnerBooking' | 'contactForm';

export const CTA_KINDS = {
  /** «Ստանալ առաջարկ» — the standard lead form (Universal Popup, or the per-car variant). */
  offer: {
    behavior: 'opens the Universal Popup',
    labelKey: 'common.nav.headerCta',
    widget: 'universal',
  },
  /** «Չե՞ս գտել քո մեքենան» — undecided buyer → the 60-second quiz. */
  quiz: { behavior: 'opens the Quiz Popup', labelKey: 'common.stickyCta.button', widget: 'quiz' },
  /** «Կապ հաստատիր մեզ հետ» on a USA auction car — the auction contact popup. */
  auctionContact: {
    behavior: 'opens the USA auction contact popup',
    labelKey: 'common.carDetail.auctionFollowAlong.contactCta',
    widget: 'usaAuction',
  },
  /** «Տեսնել մեքենան օնլայն» — Copart/IAAI View-Only link, new tab, `rel="noopener noreferrer"`. */
  viewOnline: {
    behavior: 'external link, new tab (Copart/IAAI; never Manheim)',
    labelKey: 'common.carDetail.auctionFollowAlong.viewOnlineCta',
    widget: null,
  },
  /** «Զանգահարել» — a `tel:` link. */
  call: { behavior: 'tel: link', labelKey: 'contact.branches.call', widget: null },
  /** «Քարտեզ» — the branch in Google Maps, new tab. */
  map: {
    behavior: 'external link, new tab (Google Maps)',
    labelKey: 'contact.branches.map',
    widget: null,
  },
  /** «Տեսնել մասնաճյուղերը» — an in-site jump to the branch list. */
  view: {
    behavior: 'in-site link / hash to the branch list',
    labelKey: 'common.branchMap.view',
    widget: null,
  },
} as const;

export type CtaKind = keyof typeof CTA_KINDS;

/** Every lead CTA by `sourceCta`, and the widget it opens. */
export const LEAD_CTAS = {
  // Global
  'header-cta': 'universal',
  'footer-cta': 'universal',
  'sticky-cta': 'quiz',
  // Home
  'home-start-band': 'quiz', // the sticky CTA's copy as an in-page band
  'home-s10-final-cta': 'quiz',
  // China
  'china-s7-final-cta': 'universal',
  'china-financing-details': 'universal',
  'china-detail-price-journey': 'universal',
  // Car detail
  'car-detail-per-car-offer': 'universal',
  'car-detail-reserve-before-arrival': 'universal',
  'car-detail-buy-with-loan-in-house': 'universal',
  // USA
  'usa-s9-final-cta': 'usaAuction',
  'usa-import-process': 'usaAuction',
  'usa-auction-detail-follow-along': 'usaAuction',
  'usa-customs-calculator': 'universal',
  // Other pages
  'offers-s3-final-cta': 'universal',
  'about-s1-hero-consultation': 'universal',
  'about-s5-final-cta': 'universal',
  'about-s5b-repeat-consultation': 'universal',
  'contact-s4-final-cta': 'universal',
  'compare-car-finder': 'universal',
  'contact-s1-form': 'contactForm', // the Contact page's own inline form, not a popup
  // Partners
  'partners-hero': 'partnerBooking',
} as const satisfies Record<string, LeadWidget>;

export type LeadCtaId = keyof typeof LEAD_CTAS;

/** The only places the Quiz may open (spec: the sticky CTA and Homepage S10, plus the band that carries the sticky copy). */
export const QUIZ_CTA_IDS: LeadCtaId[] = ['sticky-cta', 'home-start-band', 'home-s10-final-cta'];
