export interface CustomerStory {
  id: string;
  customerName: string;
  car: string;
  origin: 'Չինաստան' | 'ԱՄՆ';
  whyChosen: string;
  /** Portrait thumbnail — real Unsplash/Pexels stock exported from Figma
   * (node `9321:6185`) pending the client's real 60–90s customer footage. */
  image: string;
}

/**
 * PLACEHOLDER DATA — real 60–90s customer-story videos + captions are
 * pending from the content team; only the grid/lightbox mechanics are real.
 */
export const MOCK_STORIES: readonly CustomerStory[] = [
  {
    id: 's1',
    customerName: 'Արմեն Ա.',
    car: 'BYD Seal',
    origin: 'Չինաստան',
    whyChosen: 'Գնի թափանցիկություն',
    image: '/images/home/story-1.jpg',
  },
  {
    id: 's2',
    customerName: 'Նարե Հ.',
    car: 'Tesla Model 3',
    origin: 'ԱՄՆ',
    whyChosen: 'Արագ առաքում',
    image: '/images/home/story-2.jpg',
  },
  {
    id: 's3',
    customerName: 'Դավիթ Մ.',
    car: 'BYD Song Plus',
    origin: 'Չինաստան',
    whyChosen: 'Ֆինանսավորման պայմաններ',
    image: '/images/home/story-3.jpg',
  },
  {
    id: 's4',
    customerName: 'Անի Կ.',
    car: 'Ford F-150',
    origin: 'ԱՄՆ',
    whyChosen: 'Աճուրդից մինչև Հայաստան',
    image: '/images/home/story-4.jpg',
  },
  {
    id: 's5',
    customerName: 'Գագիկ Ս.',
    car: 'Zeekr 001',
    origin: 'Չինաստան',
    whyChosen: 'Անհատական սպասարկում',
    image: '/images/home/story-5.jpg',
  },
  {
    id: 's6',
    customerName: 'Մարիամ Տ.',
    car: 'Tesla Model Y',
    origin: 'ԱՄՆ',
    whyChosen: 'Ամբողջական աջակցություն',
    image: '/images/home/story-6.jpg',
  },
  {
    id: 's7',
    customerName: 'Հայկ Պ.',
    car: 'BYD Seal',
    origin: 'Չինաստան',
    whyChosen: 'Հստակ ժամկետներ',
    image: '/images/home/story-1.jpg',
  },
  {
    id: 's8',
    customerName: 'Լիլիթ Ս.',
    car: 'Ford F-150',
    origin: 'ԱՄՆ',
    whyChosen: 'Աճուրդի ուղեկցում',
    image: '/images/home/story-7.jpg',
  },
];
