import { BRANCHES } from '@/data/branches';

/**
 * FAQ content — verbatim from `references/faq.md`. Never paraphrase these:
 * they are brand/legally reviewed strings.
 *
 * Structure mirrors the spec's topics so each page pulls its own set and the
 * Homepage auto-aggregates them.
 */

export type FaqTopic = 'general' | 'china' | 'usa';

export interface FaqEntry {
  id: string;
  question: string;
  /** Undefined = the spec fixes the question but the answer is still pending. */
  answer?: string;
}

/** The branch answer is generated so an address is never typed twice. */
const branchesAnswer = `AutoRoom-ը ունի գրասենյակներ հետևյալ հասցեներում՝ ${BRANCHES.map(
  (branch) => `${branch.city}, ${branch.address}`,
).join('; ')}:`;

/**
 * The six entries the spec answers verbatim. They describe how AutoRoom works
 * overall, so they lead every FAQ surface on the site.
 */
const GENERAL: FaqEntry[] = [
  {
    id: 'payment-stages',
    question: 'Ինչպե՞ս է կատարվում վճարումը։',
    answer:
      'Վճարումը սովորաբար կատարվում է փուլերով՝ ըստ ծառայության ընթացքի և պայմանավորված կարգի։ Մեքենայի ներմուծման վճարման փուլերն են՝\nՓՈՒԼ 1 - Նախնական՝ ձեռքբերման գումար (արժեքի մոտ 60%-ի չափով)\nՓՈՒԼ 2 - Տեղափոխման վճար + ընկերության ծառայության գումար\nՓՈՒԼ 3 - Մաքսազերծման վճար',
  },
  {
    id: 'contract',
    question: 'Ինչպե՞ս է կնքվում պայմանագիրը՝ ֆիրմայի և անհատի դեպքում։',
    answer:
      'Պայմանագիրը կարող է կնքվել թե՛ իրավաբանական անձի, թե՛ անհատի հետ՝ համապատասխան տվյալների և փաստաթղթերի հիման վրա։ Պայմանագրի ձևաչափը ընտրվում է հաճախորդի իրավական կարգավիճակից ելնելով:',
  },
  {
    id: 'pricing',
    question: 'Ինչպե՞ս է ձևավորվում գինը։',
    answer:
      'Գինը հաշվարկվում է՝ կախված մեքենայի մոդելից, ձեռքբերման երկրից, տեղափոխման եղանակից և լրացուցիչ ծառայություններից։ Մոտավոր վերջնական արժեքը կարող ես նախապես հաշվարկել կայքի մաքսազերծման հաշվիչի միջոցով, իսկ ճշգրիտ առաջարկը մեր մասնագետը կտրամադրի անհատապես՝ բոլոր ծախսերը ներառելով:',
  },
  {
    id: 'branches',
    question: 'Որտե՞ղ են գտնվում ձեր մասնաճյուղերը։',
    answer: branchesAnswer,
  },
  {
    id: 'repair-included',
    question: 'Արդյո՞ք մեքենայի վերանորոգումը ներառված է գնի մեջ։',
    answer:
      'Վերանորոգումը սովորաբար չի ներառվում հիմնական արժեքի մեջ, եթե դա առանձին չի համաձայնեցվել։ AutoRoom-ը կարող է առաջարկել վերանորոգման կամ նախապատրաստման ծառայություններ՝ ըստ անհրաժեշտության:',
  },
];

const CHINA: FaqEntry[] = [
  {
    id: 'china-duration',
    question: 'Որքա՞ն ժամանակում կժամանի մեքենան, եթե պատվիրեմ Չինաստանից։',
    answer:
      'Մեքենայի ժամկետը կախված է տեղափոխման եղանակից․ ավտոկուզով տեղափոխման դեպքում ժամկետը սովորաբար ավելի արագ է լինում, իսկ էվակուատորով՝ ըստ երթուղու և կազմակերպման պայմանների։ Վերջնական ժամկետը հաստատվում է պատվերի և տեղափոխման տարբերակի ընտրությունից հետո: Սովորաբար տևում է մոտ 1 ամիս:',
  },
  // TODO(P7.1 / content team): the spec fixes these ten questions and leaves the
  // answers to be drafted. They are kept here — questions verbatim — so the copy
  // pass only has to fill `answer`. Unanswered entries are not rendered.
  { id: 'china-color', question: 'Կարո՞ղ եմ պատվիրել կոնկրետ գույնով' },
  { id: 'china-charger', question: 'Լիցքավորիչը ներառվա՞ծ է մեքենայի հետ' },
  { id: 'china-price-final', question: 'Գինը վերջնական է, թե կարող է փոխվել' },
  { id: 'china-installment', question: 'Կարո՞ղ եմ մեքենան գնել ապառիկով' },
  { id: 'china-import-duration', question: 'Որքա՞ն է տևում Չինաստանից ներմուծումը' },
  { id: 'china-warranty', question: 'Երաշխիք կա՞' },
  { id: 'china-documents', question: 'Ինչ փաստաթղթեր են տրամադրվում' },
  { id: 'china-trim', question: 'Կարո՞ղ եմ պատվիրել կոնկրետ կոմպլեկտացիա' },
  { id: 'china-customs', question: 'Ինչպե՞ս է կազմակերպվում մաքսազերծումը' },
  { id: 'china-delay', question: 'Ի՞նչ է լինում, եթե ճանապարհին ուշացում է լինում' },
];

/**
 * TODO(P7.1 / client): the USA list is left open by the spec. Mirror the China
 * structure — import duration, auction access, View-Only follow, customs,
 * payment stages, warranty, documents, delays — then the Homepage aggregation
 * picks them up with no further wiring.
 */
const USA: FaqEntry[] = [];

export const FAQ: Record<FaqTopic, FaqEntry[]> = {
  general: GENERAL,
  china: CHINA,
  usa: USA,
};

/**
 * Entries for a set of topics, deduplicated and answer-only.
 *
 * Questions without an answer are dropped rather than rendered as empty rows —
 * an accordion that opens onto nothing reads as a bug, not as pending content.
 */
export function getFaqEntries(topics: FaqTopic[]): FaqEntry[] {
  const seen = new Set<string>();
  return topics
    .flatMap((topic) => FAQ[topic])
    .filter((entry) => {
      if (!entry.answer || seen.has(entry.id)) return false;
      seen.add(entry.id);
      return true;
    });
}

/** Homepage FAQ — auto-aggregates China + USA on top of the general set. */
export function getAggregatedFaq(): FaqEntry[] {
  return getFaqEntries(['general', 'china', 'usa']);
}
