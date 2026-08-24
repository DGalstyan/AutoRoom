export interface CustomerStory {
  id: string;
  customerName: string;
  car: string;
  origin: 'Չինաստան' | 'ԱՄՆ';
  whyChosen: string;
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
  },
  {
    id: 's2',
    customerName: 'Նարե Հ.',
    car: 'Tesla Model 3',
    origin: 'ԱՄՆ',
    whyChosen: 'Արագ առաքում',
  },
  {
    id: 's3',
    customerName: 'Դավիթ Մ.',
    car: 'BYD Song Plus',
    origin: 'Չինաստան',
    whyChosen: 'Ֆինանսավորման պայմաններ',
  },
  {
    id: 's4',
    customerName: 'Անի Կ.',
    car: 'Ford F-150',
    origin: 'ԱՄՆ',
    whyChosen: 'Աճուրդից մինչև Հայաստան',
  },
  {
    id: 's5',
    customerName: 'Գագիկ Ս.',
    car: 'Zeekr 001',
    origin: 'Չինաստան',
    whyChosen: 'Անհատական սպասարկում',
  },
  {
    id: 's6',
    customerName: 'Մարիամ Տ.',
    car: 'Tesla Model Y',
    origin: 'ԱՄՆ',
    whyChosen: 'Ամբողջական աջակցություն',
  },
];
