export type InterestRateBasis = 'MONTHLY' | 'YEARLY';

const BASIS_KEY = 'myledger_interest_rate_basis';

export function getStoredInterestRateBasis(): InterestRateBasis {
  try {
    const v = localStorage.getItem(BASIS_KEY);
    return v === 'YEARLY' ? 'YEARLY' : 'MONTHLY';
  } catch {
    return 'MONTHLY';
  }
}

export function setStoredInterestRateBasis(basis: InterestRateBasis): void {
  try {
    localStorage.setItem(BASIS_KEY, basis);
  } catch {
    /* private mode */
  }
}

export function parseRateInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n <= 0) return null;
  return n;
}

export function roundRate(n: number, decimals = 4): number {
  const factor = 10 ** decimals;
  return Math.round(n * factor) / factor;
}

/** Convert user-entered rate (monthly or yearly) to monthly % stored by the API. */
export function toMonthlyPercent(value: number, basis: InterestRateBasis): number {
  if (basis === 'YEARLY') {
    return roundRate(value / 12);
  }
  return roundRate(value);
}

/** Convert API monthly % to display value for the selected basis. */
export function fromMonthlyPercent(monthly: number, basis: InterestRateBasis): number {
  if (basis === 'YEARLY') {
    return roundRate(monthly * 12);
  }
  return roundRate(monthly);
}

export function formatRatePercent(value: number, maxDecimals = 4): string {
  const fixed = value.toFixed(maxDecimals);
  return fixed.replace(/\.?0+$/, '') || '0';
}

export function rateBasisShortLabel(basis: InterestRateBasis): string {
  return basis === 'YEARLY' ? '% p.a.' : '% p.m.';
}

export function rateFieldLabel(basis: InterestRateBasis): string {
  return basis === 'YEARLY' ? 'Yearly interest (%)' : 'Monthly interest (%)';
}

export function displayStoredMonthlyRate(
  monthlyPercent: number,
  basis: InterestRateBasis = getStoredInterestRateBasis(),
): string {
  const shown = fromMonthlyPercent(monthlyPercent, basis);
  return `${formatRatePercent(shown)} ${rateBasisShortLabel(basis)}`;
}

export function validateInterestRateInput(value: string, label = 'Interest rate'): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  if (!/^\d+(\.\d{1,4})?$/.test(trimmed)) {
    return `${label} must be a positive number with up to 4 decimal places`;
  }
  const n = Number(trimmed);
  if (n <= 0) {
    return `${label} must be greater than zero`;
  }
  return null;
}
