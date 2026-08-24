/**
 * FAQ content — verbatim strings from
 * `.claude/skills/autoroom-website/references/faq.md`. Never machine-translate.
 */

export interface FaqItem {
  q: string;
  a: string;
}

/**
 * The Homepage FAQ is explicitly given, pre-answered, in the skill reference
 * as "the Homepage aggregated set" — use verbatim. (China's own 10-question
 * list and the USA list are separate, page-specific FAQs for later pages.)
 */
export const HOMEPAGE_FAQ: readonly FaqItem[] = [
  {
    q: 'Որքա՞ն ժամանակում կժամանի մեքենան, եթե պատվիրեմ Չինաստանից։',
    a: 'Մեքենայի ժամկետը կախված է տեղափոխման եղանակից․ ավտոկուզով տեղափոխման դեպքում ժամկետը սովորաբար ավելի արագ է լինում, իսկ էվակուատորով՝ ըստ երթուղու և կազմակերպման պայմանների։ Վերջնական ժամկետը հաստատվում է պատվերի և տեղափոխման տարբերակի ընտրությունից հետո: Սովորաբար տևում է մոտ 1 ամիս:',
  },
  {
    q: 'Ինչպե՞ս է կատարվում վճարումը։',
    a: 'Վճարումը սովորաբար կատարվում է փուլերով՝ ըստ ծառայության ընթացքի և պայմանավորված կարգի։ Մեքենայի ներմուծման վճարման փուլերն են՝\nՓՈՒԼ 1 - Նախնական՝ ձեռքբերման գումար (արժեքի մոտ 60%-ի չափով)\nՓՈՒԼ 2 - Տեղափոխման վճար + ընկերության ծառայության գումար\nՓՈՒԼ 3 - Մաքսազերծման վճար',
  },
  {
    q: 'Ինչպե՞ս է կնքվում պայմանագիրը՝ ֆիրմայի և անհատի դեպքում։',
    a: 'Պայմանագիրը կարող է կնքվել թե՛ իրավաբանական անձի, թե՛ անհատի հետ՝ համապատասխան տվյալների և փաստաթղթերի հիման վրա։ Պայմանագրի ձևաչափը ընտրվում է հաճախորդի իրավական կարգավիճակից ելնելով:',
  },
  {
    q: 'Ինչպե՞ս է ձևավորվում գինը։',
    a: 'Գինը հաշվարկվում է՝ կախված մեքենայի մոդելից, ձեռքբերման երկրից, տեղափոխման եղանակից և լրացուցիչ ծառայություններից։ Մոտավոր վերջնական արժեքը կարող ես նախապես հաշվարկել կայքի մաքսազերծման հաշվիչի միջոցով, իսկ ճշգրիտ առաջարկը մեր մասնագետը կտրամադրի անհատապես՝ բոլոր ծախսերը ներառելով:',
  },
  {
    q: 'Որտե՞ղ են գտնվում ձեր մասնաճյուղերը։',
    a: 'AutoRoom-ը ունի գրասենյակներ հետևյալ հասցեներում՝ Երևան (Սայաթ-Նովա 20), Արմավիր (Հանրապետության 37/31), Էջմիածին (Վազգեն Առաջին 5/53)։',
  },
  {
    q: 'Արդյո՞ք մեքենայի վերանորոգումը ներառված է գնի մեջ։',
    a: 'Վերանորոգումը սովորաբար չի ներառվում հիմնական արժեքի մեջ, եթե դա առանձին չի համաձայնեցվել։ AutoRoom-ը կարող է առաջարկել վերանորոգման կամ նախապատրաստման ծառայություններ՝ ըստ անհրաժեշտության:',
  },
] as const;

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
