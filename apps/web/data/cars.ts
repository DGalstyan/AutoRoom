import type { Car } from '@/types/car';

/**
 * STUB catalogue — enough shape variety to exercise every surface built in
 * Phase 1 (list cards, detail variants, auction countdowns, offers, compare,
 * quiz recommendations) without waiting on the real feed.
 *
 * TODO(P7.3): replace with the CMS/API source. Nothing outside this file should
 * need to change: pages read through the selectors at the bottom.
 */

const PLACEHOLDER = '/images/placeholder-car.svg';

/**
 * Auction ends and offer deadlines are relative so the stub never renders an
 * expired countdown. Real data ships absolute ISO timestamps from the source.
 */
function daysFromNow(days: number): string {
  return new Date(Date.now() + days * 86_400_000).toISOString();
}

export const CARS: Car[] = [
  {
    slug: 'zeekr-001',
    variant: 'china',
    make: 'Zeekr',
    model: '001',
    year: 2024,
    price: 32900,
    estimatedFinalPrice: 41200,
    condition: 'on-order',
    powertrain: 'ev',
    usage: ['travel', 'family'],
    financingAvailable: true,
    images: { exterior: [PLACEHOLDER], interior: [PLACEHOLDER], details: [PLACEHOLDER] },
    colors: ['white', 'black', 'gray', 'blue'],
    specs: {
      make: 'Zeekr',
      model: '001',
      year: 2024,
      trim: 'Long Range AWD',
      fuel: 'EV',
      range: '620 կմ',
      battery: '100 kWh',
      engine: '2 × էլեկտրաշարժիչ',
      drivetrain: 'AWD',
      seats: 5,
      warranty: '3 տարի',
    },
    priceJourney: [
      { id: 'car', amount: 32900 },
      { id: 'inland', amount: 900 },
      { id: 'freight', amount: 2600 },
      { id: 'customs', amount: 4800, approximate: true },
    ],
  },
  {
    slug: 'byd-song-plus',
    variant: 'china',
    make: 'BYD',
    model: 'Song Plus',
    year: 2024,
    price: 19800,
    estimatedFinalPrice: 26100,
    condition: 'on-order',
    powertrain: 'hybrid',
    usage: ['family', 'city'],
    financingAvailable: true,
    images: { exterior: [PLACEHOLDER], interior: [PLACEHOLDER] },
    colors: ['white', 'black', 'gray', 'red'],
    specs: {
      make: 'BYD',
      model: 'Song Plus',
      year: 2024,
      trim: 'DM-i Flagship',
      fuel: 'Hybrid',
      range: '1 200 կմ',
      battery: '18.3 kWh',
      engine: '1.5L + էլեկտրաշարժիչ',
      drivetrain: 'FWD',
      seats: 5,
      warranty: '3 տարի',
    },
    priceJourney: [
      { id: 'car', amount: 19800 },
      { id: 'inland', amount: 800 },
      { id: 'freight', amount: 2400 },
      { id: 'customs', amount: 3100, approximate: true },
    ],
  },
  {
    slug: 'li-auto-l7',
    variant: 'china',
    make: 'Li Auto',
    model: 'L7',
    year: 2023,
    price: 41500,
    estimatedFinalPrice: 52300,
    condition: 'in-stock',
    powertrain: 'hybrid',
    usage: ['family', 'travel'],
    financingAvailable: true,
    images: { exterior: [PLACEHOLDER], interior: [PLACEHOLDER], details: [PLACEHOLDER] },
    specs: {
      make: 'Li Auto',
      model: 'L7',
      year: 2023,
      trim: 'Max',
      fuel: 'Hybrid',
      range: '1 100 կմ',
      battery: '42.8 kWh',
      engine: '1.5T + 2 × էլեկտրաշարժիչ',
      drivetrain: 'AWD',
      seats: 5,
      warranty: '3 տարի',
    },
    priceJourney: [
      { id: 'car', amount: 41500 },
      { id: 'inland', amount: 1000 },
      { id: 'freight', amount: 2700 },
      { id: 'customs', amount: 7100, approximate: true },
    ],
  },
  {
    slug: 'chery-tiggo-4-pro',
    variant: 'china',
    make: 'Chery',
    model: 'Tiggo 4 Pro',
    year: 2023,
    price: 12900,
    estimatedFinalPrice: 17400,
    condition: 'in-stock',
    powertrain: 'benzin',
    usage: ['city', 'family'],
    financingAvailable: true,
    images: { exterior: [PLACEHOLDER] },
    offer: { oldPrice: 14500, endsAt: daysFromNow(9) },
    specs: {
      make: 'Chery',
      model: 'Tiggo 4 Pro',
      year: 2023,
      trim: 'Comfort',
      fuel: 'Բենզին',
      engine: '1.5L',
      drivetrain: 'FWD',
      seats: 5,
      warranty: '2 տարի',
    },
    priceJourney: [
      { id: 'car', amount: 12900 },
      { id: 'inland', amount: 700 },
      { id: 'freight', amount: 2300 },
      { id: 'customs', amount: 1500, approximate: true },
    ],
  },
  {
    slug: 'geely-monjaro',
    variant: 'china',
    make: 'Geely',
    model: 'Monjaro',
    year: 2024,
    price: 26400,
    estimatedFinalPrice: 34100,
    condition: 'on-order',
    powertrain: 'benzin',
    usage: ['travel', 'family'],
    financingAvailable: false,
    images: { exterior: [PLACEHOLDER], interior: [PLACEHOLDER] },
    colors: ['white', 'black', 'gray', 'blue', 'red'],
    specs: {
      make: 'Geely',
      model: 'Monjaro',
      year: 2024,
      trim: 'Flagship',
      fuel: 'Բենզին',
      engine: '2.0T',
      drivetrain: 'AWD',
      seats: 5,
      warranty: '3 տարի',
    },
    priceJourney: [
      { id: 'car', amount: 26400 },
      { id: 'inland', amount: 900 },
      { id: 'freight', amount: 2500 },
      { id: 'customs', amount: 4300, approximate: true },
    ],
  },

  {
    slug: 'toyota-camry-2021',
    variant: 'usa-auction',
    make: 'Toyota',
    model: 'Camry',
    year: 2021,
    price: 8900,
    estimatedFinalPrice: 16400,
    condition: 'auction',
    powertrain: 'benzin',
    usage: ['city', 'family'],
    images: { exterior: [PLACEHOLDER], details: [PLACEHOLDER] },
    auction: {
      platform: 'copart',
      lot: '58392014',
      endsAt: daysFromNow(3),
      currentBid: 8900,
      url: 'https://www.copart.com/lot/58392014',
    },
    specs: {
      make: 'Toyota',
      model: 'Camry',
      year: 2021,
      vin: '4T1G11AK6MU4xxxxx',
      mileage: '62 300 մղոն',
      engine: '2.5L',
      fuel: 'Բենզին',
      drivetrain: 'FWD',
      transmission: 'Ավտոմատ',
      damage: 'Front End',
      location: 'Newburgh, NY',
    },
  },
  {
    slug: 'tesla-model-3-2022',
    variant: 'usa-auction',
    make: 'Tesla',
    model: 'Model 3',
    year: 2022,
    price: 14200,
    estimatedFinalPrice: 23800,
    condition: 'auction',
    powertrain: 'ev',
    usage: ['city', 'travel'],
    images: { exterior: [PLACEHOLDER], interior: [PLACEHOLDER] },
    auction: {
      platform: 'iaai',
      lot: '41208877',
      endsAt: daysFromNow(5),
      currentBid: 14200,
      url: 'https://www.iaai.com/vehicledetail/41208877',
    },
    specs: {
      make: 'Tesla',
      model: 'Model 3',
      year: 2022,
      vin: '5YJ3E1EA7NF3xxxxx',
      mileage: '31 800 մղոն',
      engine: 'Էլեկտրաշարժիչ',
      fuel: 'EV',
      drivetrain: 'RWD',
      transmission: 'Ավտոմատ',
      damage: 'Rear End',
      location: 'Dallas, TX',
    },
  },
  {
    slug: 'ford-f-150-2020',
    variant: 'usa-auction',
    make: 'Ford',
    model: 'F-150',
    year: 2020,
    price: 21500,
    estimatedFinalPrice: 32900,
    condition: 'auction',
    powertrain: 'benzin',
    usage: ['travel'],
    images: { exterior: [PLACEHOLDER] },
    // Manheim: no direct auction link — the card must expose only "Կապ հաստատիր մեզ հետ".
    auction: { platform: 'manheim', lot: 'MNH-772140', endsAt: daysFromNow(4), currentBid: 21500 },
    specs: {
      make: 'Ford',
      model: 'F-150',
      year: 2020,
      vin: '1FTEW1E4XLKExxxxx',
      mileage: '48 100 մղոն',
      engine: '3.5L EcoBoost',
      fuel: 'Բենզին',
      drivetrain: '4WD',
      transmission: 'Ավտոմատ',
      damage: 'Normal Wear',
      location: 'Atlanta, GA',
    },
  },

  {
    slug: 'honda-cr-v-2022',
    variant: 'usa-available',
    make: 'Honda',
    model: 'CR-V',
    year: 2022,
    price: 24900,
    estimatedFinalPrice: 24900,
    condition: 'in-stock',
    powertrain: 'benzin',
    usage: ['family', 'city'],
    financingAvailable: true,
    images: { exterior: [PLACEHOLDER], interior: [PLACEHOLDER] },
    specs: {
      make: 'Honda',
      model: 'CR-V',
      year: 2022,
      vin: '7FARW2H84NE0xxxxx',
      mileage: '39 400 մղոն',
      engine: '1.5T',
      fuel: 'Բենզին',
      drivetrain: 'AWD',
      transmission: 'Ավտոմատ',
    },
  },
  {
    slug: 'hyundai-tucson-2021',
    variant: 'usa-available',
    make: 'Hyundai',
    model: 'Tucson',
    year: 2021,
    price: 19900,
    estimatedFinalPrice: 19900,
    condition: 'on-road',
    powertrain: 'benzin',
    usage: ['city', 'family'],
    financingAvailable: true,
    images: { exterior: [PLACEHOLDER] },
    onRoad: { etaDate: daysFromNow(18), status: 'ship' },
    specs: {
      make: 'Hyundai',
      model: 'Tucson',
      year: 2021,
      vin: '5NMJB3AE0MH1xxxxx',
      mileage: '54 700 մղոն',
      engine: '2.5L',
      fuel: 'Բենզին',
      drivetrain: 'FWD',
      transmission: 'Ավտոմատ',
    },
  },

  {
    slug: 'xcmg-xe215c',
    variant: 'machinery',
    make: 'XCMG',
    model: 'XE215C',
    year: 2024,
    price: 68000,
    condition: 'on-order',
    images: { exterior: [PLACEHOLDER], details: [PLACEHOLDER] },
    specs: {
      make: 'XCMG',
      model: 'XE215C',
      year: 2024,
      engine: 'Cummins B5.9',
      power: '164 ձ.ու.',
      weight: '21 500 կգ',
      operatingHours: '0 ժ',
      fuel: 'Դիզել',
      dimensions: '9 700 × 2 990 × 3 100 մմ',
      payload: '1.0 մ³ շերեփ',
    },
  },
  {
    slug: 'lonking-cdm6258',
    variant: 'machinery',
    make: 'Lonking',
    model: 'CDM6258',
    year: 2024,
    price: 54000,
    condition: 'on-order',
    images: { exterior: [PLACEHOLDER] },
    specs: {
      make: 'Lonking',
      model: 'CDM6258',
      year: 2024,
      engine: 'Yuchai YC6B',
      power: '148 ձ.ու.',
      weight: '17 800 կգ',
      operatingHours: '0 ժ',
      fuel: 'Դիզել',
      dimensions: '9 200 × 2 800 × 3 000 մմ',
      payload: '0.8 մ³ շերեփ',
    },
  },
];

/* ------------------------------ selectors ------------------------------ */

export function getCar(slug: string): Car | undefined {
  return CARS.find((car) => car.slug === slug);
}

export function getCarsByVariant(variant: Car['variant']): Car[] {
  return CARS.filter((car) => car.variant === variant);
}

/** Homepage + Offers "Շաբաթվա լավագույն առաջարկները". */
export function getFeaturedCars(limit = 4): Car[] {
  return CARS.filter((car) => car.variant !== 'machinery').slice(0, limit);
}

export function getOfferCars(): Car[] {
  return CARS.filter((car) => car.offer);
}

/**
 * `SimilarOffers` — same variant, closest final price, excluding the car itself.
 * Fuel class is preferred but not required, so a rare powertrain still fills the row.
 */
export function getSimilarCars(car: Car, limit = 4): Car[] {
  const reference = car.estimatedFinalPrice ?? car.price;
  return CARS.filter((other) => other.slug !== car.slug && other.variant === car.variant)
    .sort((a, b) => {
      const fuelScore =
        Number(b.powertrain === car.powertrain) - Number(a.powertrain === car.powertrain);
      if (fuelScore !== 0) return fuelScore;
      const priceA = Math.abs((a.estimatedFinalPrice ?? a.price) - reference);
      const priceB = Math.abs((b.estimatedFinalPrice ?? b.price) - reference);
      return priceA - priceB;
    })
    .slice(0, limit);
}
