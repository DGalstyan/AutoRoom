/**
 * Pure math and validation for the USA customs calculator.
 *
 * The formula, in the order customs applies it:
 *   customs value (USD) = car price + transport to the port of entry
 *   customs value (AMD) = customs value (USD) × exchange rate
 *   duty   = customs value (AMD) × duty %
 *   excise = engine volume (cm³) × AMD per cm³ for the car's age band     (not for exempt EVs)
 *   VAT    = (customs value (AMD) + duty + excise) × VAT %
 *   total  = duty + excise + VAT
 *
 * No duty figure is built in. Every rate comes from the admin `finance.customs` setting, and a
 * blank one yields `rates-missing` rather than a guess — these are legally binding amounts.
 */

export type Powertrain = 'EV' | 'HYBRID' | 'BENZIN';
export type Age = 'under3' | 'between3And5' | 'between5And10' | 'over10';

export interface CustomsRates {
  usdToAmd: number | null;
  rateSource: string | null;
  /** `YYYY-MM-DD`. */
  rateDate: string | null;
  dutyPercent: number | null;
  vatPercent: number | null;
  exciseAmdPerCm3: Record<Age, number | null>;
  evExempt: boolean;
}

export interface CustomsInput {
  carValueUsd: number | null;
  transportUsd: number | null;
  powertrain: Powertrain | '';
  age: Age | '';
  productionYear: number | null;
  engineVolumeCm3: number | null;
}

export type CustomsField =
  'carValue' | 'transport' | 'engineType' | 'age' | 'productionYear' | 'engineVolume';

export type CustomsErrorKey =
  | 'carValueRequired'
  | 'carValueRange'
  | 'transportRange'
  | 'engineTypeRequired'
  | 'ageRequired'
  | 'productionYearRequired'
  | 'productionYearRange'
  | 'ageYearMismatch'
  | 'engineVolumeRequired'
  | 'engineVolumeRange';

export const LIMITS = {
  carValueMaxUsd: 1_000_000,
  transportMaxUsd: 100_000,
  engineVolumeMaxCm3: 10_000,
  maxVehicleAgeYears: 30,
} as const;

/** The age band a production year falls in, counting whole calendar years; 5 belongs to "3–5". */
export function ageBandForYear(productionYear: number, currentYear: number): Age {
  const years = currentYear - productionYear;
  if (years < 3) return 'under3';
  if (years <= 5) return 'between3And5';
  if (years <= 10) return 'between5And10';
  return 'over10';
}

export function validateCustomsInput(
  input: CustomsInput,
  currentYear: number = new Date().getFullYear(),
): Partial<Record<CustomsField, CustomsErrorKey>> {
  const errors: Partial<Record<CustomsField, CustomsErrorKey>> = {};

  if (input.carValueUsd === null) errors.carValue = 'carValueRequired';
  else if (!(input.carValueUsd > 0) || input.carValueUsd > LIMITS.carValueMaxUsd) {
    errors.carValue = 'carValueRange';
  }

  if (
    input.transportUsd !== null &&
    (!(input.transportUsd >= 0) || input.transportUsd > LIMITS.transportMaxUsd)
  ) {
    errors.transport = 'transportRange';
  }

  if (!input.powertrain) errors.engineType = 'engineTypeRequired';
  if (!input.age) errors.age = 'ageRequired';

  if (input.productionYear === null) errors.productionYear = 'productionYearRequired';
  else if (
    !Number.isInteger(input.productionYear) ||
    input.productionYear > currentYear ||
    input.productionYear < currentYear - LIMITS.maxVehicleAgeYears
  ) {
    errors.productionYear = 'productionYearRange';
  } else if (input.age && ageBandForYear(input.productionYear, currentYear) !== input.age) {
    errors.productionYear = 'ageYearMismatch';
  }

  // An electric motor has no displacement, so the volume is only asked of the others.
  if (input.powertrain && input.powertrain !== 'EV') {
    if (input.engineVolumeCm3 === null) errors.engineVolume = 'engineVolumeRequired';
    else if (
      !Number.isInteger(input.engineVolumeCm3) ||
      input.engineVolumeCm3 < 1 ||
      input.engineVolumeCm3 > LIMITS.engineVolumeMaxCm3
    ) {
      errors.engineVolume = 'engineVolumeRange';
    }
  }

  return errors;
}

export type MissingRate = 'usdToAmd' | 'dutyPercent' | 'vatPercent' | 'excise';

export interface CustomsBreakdown {
  customsValueUsd: number;
  usdToAmd: number;
  customsValueAmd: number;
  dutyPercent: number;
  dutyAmd: number;
  exciseAmdPerCm3: number;
  engineVolumeCm3: number;
  exciseAmd: number;
  vatPercent: number;
  vatBaseAmd: number;
  vatAmd: number;
  totalAmd: number;
  /** Duty and excise are waived for this car (an exempt EV). */
  exempt: boolean;
}

export type CustomsResult =
  | { status: 'ok'; breakdown: CustomsBreakdown }
  | { status: 'rates-missing'; missing: MissingRate[]; customsValueUsd: number };

/** Assumes `input` already passed `validateCustomsInput`. */
export function computeCustoms(
  input: CustomsInput,
  rates: CustomsRates,
  fallbackUsdToAmd: number | null = null,
): CustomsResult {
  const customsValueUsd = (input.carValueUsd ?? 0) + (input.transportUsd ?? 0);
  const usdToAmd = rates.usdToAmd ?? fallbackUsdToAmd;
  const exempt = input.powertrain === 'EV' && rates.evExempt;
  const volume = input.powertrain === 'EV' ? 0 : (input.engineVolumeCm3 ?? 0);
  const exciseRate = input.age ? rates.exciseAmdPerCm3[input.age] : null;

  const missing: MissingRate[] = [];
  if (usdToAmd === null) missing.push('usdToAmd');
  if (rates.vatPercent === null) missing.push('vatPercent');
  if (!exempt) {
    if (rates.dutyPercent === null) missing.push('dutyPercent');
    // An EV has no displacement, so excise cannot apply and its rate need not be set.
    if (input.powertrain !== 'EV' && exciseRate === null) missing.push('excise');
  }
  if (missing.length > 0 || usdToAmd === null || rates.vatPercent === null) {
    return { status: 'rates-missing', missing, customsValueUsd };
  }

  const customsValueAmd = Math.round(customsValueUsd * usdToAmd);
  const dutyPercent = exempt ? 0 : (rates.dutyPercent ?? 0);
  const dutyAmd = Math.round((customsValueAmd * dutyPercent) / 100);
  const exciseAmd =
    exempt || input.powertrain === 'EV' ? 0 : Math.round(volume * (exciseRate ?? 0));
  const vatBaseAmd = customsValueAmd + dutyAmd + exciseAmd;
  const vatAmd = Math.round((vatBaseAmd * rates.vatPercent) / 100);

  return {
    status: 'ok',
    breakdown: {
      customsValueUsd,
      usdToAmd,
      customsValueAmd,
      dutyPercent,
      dutyAmd,
      exciseAmdPerCm3: exempt ? 0 : (exciseRate ?? 0),
      engineVolumeCm3: volume,
      exciseAmd,
      vatPercent: rates.vatPercent,
      vatBaseAmd,
      vatAmd,
      totalAmd: dutyAmd + exciseAmd + vatAmd,
      exempt,
    },
  };
}
