/**
 * FAQ content — verbatim strings from
 * `.claude/skills/autoroom-website/references/faq.md`. Never machine-translate.
 *
 * The Homepage's own FAQ set used to be hardcoded here as `HOMEPAGE_FAQ`; it's
 * now admin-managed (see `lib/faq.ts`'s `getHomepageFaq`, `GET /public/faq`)
 * and was seeded into the database with these exact strings. China's own
 * 10-question list and the USA list below are still hardcoded — they're
 * page-specific FAQs for pages that don't exist yet.
 */

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * China FAQ question list — the questions are fixed by the spec; answers are
 * still pending from the content team (see `references/faq.md`). Kept here so
 * the `/china` page (future work) has a typed source to fill in, and so the
 * shape (`{ q, a }[]`) is already the one `Faq` and Homepage aggregation expect.
 */
export const CHINA_FAQ_QUESTIONS: readonly string[] = [
  'Կարո՞ղ եմ պատվիրել կոնկրետ գույնով',
  'Լիցքավորիչը ներառվա՞ծ է մեքենայի հետ',
  'Գինը վերջնական է, թե կարող է փոխվել',
  'Կարո՞ղ եմ մեքենան գնել ապառիկով',
  'Որքա՞ն է տևում Չինաստանից ներմուծումը',
  'Երաշխիք կա՞',
  'Ինչ փաստաթղթեր են տրամադրվում',
  'Կարո՞ղ եմ պատվիրել կոնկրետ կոմպլեկտացիա',
  'Ինչպե՞ս է կազմակերպվում մաքսազերծումը',
  'Ի՞նչ է լինում, եթե ճանապարհին ուշացում է լինում',
] as const;

// TODO(content-armenian): USA FAQ list is still open per the spec — populate
// once finalized (mirror the China structure: import duration, auction
// access, View-Only follow, customs, payment stages, warranty, documents,
// delays).
export const USA_FAQ: readonly FaqItem[] = [];
