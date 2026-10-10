import { describe, expect, it } from 'vitest';
import {
  ageBandForYear,
  computeCustoms,
  validateCustomsInput,
  type CustomsInput,
  type CustomsRates,
} from '@/lib/customs';

// Round, obviously-test numbers — the real rates live in admin, never in code.
const RATES: CustomsRates = {
  usdToAmd: 400,
  rateSource: 'test',
  rateDate: '2026-10-01',
  dutyPercent: 10,
  vatPercent: 20,
  exciseAmdPerCm3: { under3: 0, between3And5: 100, between5And10: 200, over10: 300 },
  evExempt: false,
};
const NO_RATES: CustomsRates = {
  usdToAmd: null,
  rateSource: null,
  rateDate: null,
  dutyPercent: null,
  vatPercent: null,
  exciseAmdPerCm3: { under3: null, between3And5: null, between5And10: null, over10: null },
  evExempt: false,
};
const CAR: CustomsInput = {
  carValueUsd: 10_000,
  transportUsd: 1_000,
  powertrain: 'BENZIN',
  age: 'between3And5',
  productionYear: 2022,
  engineVolumeCm3: 2000,
};

describe('computeCustoms — the formula', () => {
  it('value × rate, then duty, excise, VAT on (value + duty + excise)', () => {
    const r = computeCustoms(CAR, RATES);
    expect(r.status).toBe('ok');
    if (r.status !== 'ok') return;
    const b = r.breakdown;
    expect(b.customsValueUsd).toBe(11_000); //            10,000 + 1,000
    expect(b.customsValueAmd).toBe(4_400_000); //         × 400
    expect(b.dutyAmd).toBe(440_000); //                   10 %
    expect(b.exciseAmd).toBe(200_000); //                 2,000 cm³ × 100
    expect(b.vatBaseAmd).toBe(5_040_000); //              4,400,000 + 440,000 + 200,000
    expect(b.vatAmd).toBe(1_008_000); //                  20 %
    expect(b.totalAmd).toBe(440_000 + 200_000 + 1_008_000);
  });
  it('the total is always duty + excise + VAT', () => {
    const r = computeCustoms({ ...CAR, age: 'over10', productionYear: 2010 }, RATES);
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.breakdown.totalAmd).toBe(
      r.breakdown.dutyAmd + r.breakdown.exciseAmd + r.breakdown.vatAmd,
    );
  });
  it('uses the age band excise rate', () => {
    const rate = (age: CustomsInput['age']) => {
      const r = computeCustoms({ ...CAR, age }, RATES);
      return r.status === 'ok' ? r.breakdown.exciseAmd : -1;
    };
    expect([rate('under3'), rate('between3And5'), rate('between5And10'), rate('over10')]).toEqual([
      0, 200_000, 400_000, 600_000,
    ]);
  });
  it('treats transport as optional', () => {
    const r = computeCustoms({ ...CAR, transportUsd: null }, RATES);
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.breakdown.customsValueUsd).toBe(10_000);
  });
  it('falls back to the loan calculator rate when no customs rate is set', () => {
    const r = computeCustoms(CAR, { ...RATES, usdToAmd: null }, 390);
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.breakdown.usdToAmd).toBe(390);
  });
});

describe('computeCustoms — electric cars', () => {
  const EV: CustomsInput = { ...CAR, powertrain: 'EV', engineVolumeCm3: null };
  it('pay no excise (no displacement) but duty and VAT still apply', () => {
    const r = computeCustoms(EV, RATES);
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.breakdown.exciseAmd).toBe(0);
    expect(r.breakdown.dutyAmd).toBe(440_000);
    expect(r.breakdown.vatAmd).toBe(Math.round(((4_400_000 + 440_000) * 20) / 100));
  });
  it('are exempt from duty and excise when the setting says so; VAT remains', () => {
    const r = computeCustoms(EV, { ...RATES, evExempt: true });
    if (r.status !== 'ok') throw new Error('expected ok');
    expect(r.breakdown).toMatchObject({ exempt: true, dutyAmd: 0, exciseAmd: 0, vatAmd: 880_000 });
  });
  it('do not need an excise rate to be set', () => {
    const r = computeCustoms(EV, {
      ...RATES,
      exciseAmdPerCm3: { under3: null, between3And5: null, between5And10: null, over10: null },
    });
    expect(r.status).toBe('ok');
  });
});

describe('computeCustoms — missing rates are never guessed', () => {
  it('reports every blank rate and computes nothing', () => {
    const r = computeCustoms(CAR, NO_RATES);
    expect(r).toEqual({
      status: 'rates-missing',
      missing: ['usdToAmd', 'vatPercent', 'dutyPercent', 'excise'],
      customsValueUsd: 11_000,
    });
  });
  it('a blank excise for just this age band is reported', () => {
    const r = computeCustoms(CAR, {
      ...RATES,
      exciseAmdPerCm3: { ...RATES.exciseAmdPerCm3, between3And5: null },
    });
    expect(r).toMatchObject({ status: 'rates-missing', missing: ['excise'] });
  });
});

describe('validateCustomsInput', () => {
  const now = 2026;
  it('accepts a complete, consistent car', () => {
    expect(validateCustomsInput(CAR, now)).toEqual({});
  });
  it('requires the value, engine type, age and year', () => {
    const errors = validateCustomsInput(
      {
        carValueUsd: null,
        transportUsd: null,
        powertrain: '',
        age: '',
        productionYear: null,
        engineVolumeCm3: null,
      },
      now,
    );
    expect(errors).toEqual({
      carValue: 'carValueRequired',
      engineType: 'engineTypeRequired',
      age: 'ageRequired',
      productionYear: 'productionYearRequired',
    });
  });
  it('bounds the money fields', () => {
    expect(validateCustomsInput({ ...CAR, carValueUsd: 0 }, now).carValue).toBe('carValueRange');
    expect(validateCustomsInput({ ...CAR, carValueUsd: 2_000_000 }, now).carValue).toBe(
      'carValueRange',
    );
    expect(validateCustomsInput({ ...CAR, transportUsd: -5 }, now).transport).toBe(
      'transportRange',
    );
  });
  it('asks for the engine volume of non-electric cars only, within bounds', () => {
    expect(validateCustomsInput({ ...CAR, engineVolumeCm3: null }, now).engineVolume).toBe(
      'engineVolumeRequired',
    );
    expect(validateCustomsInput({ ...CAR, engineVolumeCm3: 99_999 }, now).engineVolume).toBe(
      'engineVolumeRange',
    );
    expect(validateCustomsInput({ ...CAR, engineVolumeCm3: 1.5 }, now).engineVolume).toBe(
      'engineVolumeRange',
    );
    expect(validateCustomsInput({ ...CAR, powertrain: 'EV', engineVolumeCm3: null }, now)).toEqual(
      {},
    );
  });
  it('rejects a production year in the future or older than 30 years', () => {
    expect(validateCustomsInput({ ...CAR, productionYear: 2027 }, now).productionYear).toBe(
      'productionYearRange',
    );
    expect(validateCustomsInput({ ...CAR, productionYear: 1990 }, now).productionYear).toBe(
      'productionYearRange',
    );
  });
  it('rejects an age band that contradicts the production year', () => {
    expect(
      validateCustomsInput({ ...CAR, age: 'under3', productionYear: 2015 }, now).productionYear,
    ).toBe('ageYearMismatch');
  });
});

describe('ageBandForYear', () => {
  it('maps whole years to the bands, with 5 years inside "3–5"', () => {
    expect([2026, 2024, 2023, 2021, 2020, 2016, 2015].map((y) => ageBandForYear(y, 2026))).toEqual([
      'under3',
      'under3',
      'between3And5',
      'between3And5',
      'between5And10',
      'between5And10',
      'over10',
    ]);
  });
});
