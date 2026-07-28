/**
 * Loan maths + campaign parameters for `LoanCalculator`.
 *
 * The rates live in config rather than in the component because the spec says
 * they are tuned per campaign — a promotion changes `DEFAULT_LOAN_CONFIG` (or
 * passes an override), not the calculator.
 */

export interface LoanConfig {
  termMonths: number;
  /** Անվանական տոկոսադրույք, % per year. */
  nominalRate: number;
  /** Փաստացի տոկոսադրույք — displayed as a range, used as the payment rate. */
  effectiveRateMin: number;
  effectiveRateMax: number;
  /** Down payment slider bounds, as a share of the car price. */
  minDownPaymentRatio: number;
  maxDownPaymentRatio: number;
  defaultDownPaymentRatio: number;
  /**
   * Catalogue prices are USD; the calculator is in drams.
   * TODO(client): confirm the rate to quote at, or wire a daily source.
   */
  usdToAmd: number;
}

export const DEFAULT_LOAN_CONFIG: LoanConfig = {
  termMonths: 60,
  nominalRate: 15.9,
  effectiveRateMin: 17.11,
  effectiveRateMax: 17.19,
  minDownPaymentRatio: 0.1,
  maxDownPaymentRatio: 0.7,
  defaultDownPaymentRatio: 0.2,
  usdToAmd: 390,
};

/**
 * Standard annuity payment. A 0% rate degenerates to a plain division, which the
 * formula below cannot express (it divides by the rate), so it is handled first.
 */
export function monthlyPayment(principal: number, annualRatePercent: number, months: number) {
  if (principal <= 0 || months <= 0) return 0;
  const monthlyRate = annualRatePercent / 100 / 12;
  if (monthlyRate === 0) return principal / months;
  return (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -months));
}

export function usdToAmd(amountUsd: number, config: LoanConfig = DEFAULT_LOAN_CONFIG) {
  return amountUsd * config.usdToAmd;
}

/** The one number the card is built around: monthly payment for a given down payment. */
export function calculateMonthly(
  priceAmd: number,
  downPaymentAmd: number,
  config: LoanConfig = DEFAULT_LOAN_CONFIG,
) {
  const principal = Math.max(0, priceAmd - downPaymentAmd);
  return monthlyPayment(principal, config.effectiveRateMin, config.termMonths);
}
