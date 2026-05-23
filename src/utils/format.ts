/** Coerce API values (sometimes strings) to a finite number for math. */
export function coerceNumber(value: unknown): number {
  if (value == null || value === '') return 0;
  if (typeof value === 'number') return Number.isFinite(value) ? value : 0;
  const n = Number(String(value).replace(/,/g, '').trim());
  return Number.isFinite(n) ? n : 0;
}

export function sumNumbers(values: unknown[]): number {
  return values.reduce<number>((sum, v) => sum + coerceNumber(v), 0);
}

export function formatCurrency(amount: number | undefined | null): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2,
  }).format(coerceNumber(amount));
}

/** Shorter currency for dashboard stat cards (drops .00 when whole rupees). */
export function formatCurrencyCompact(amount: number | undefined | null): string {
  if (amount == null) return '—';
  const n = coerceNumber(amount);
  const whole = Math.round(n * 100) % 100 === 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(n);
}

/**
 * Currency for stat tiles: compact notation for large amounts, always fits better in UI.
 * Hover title should use formatCurrency() for the full value.
 */
export function formatCurrencyStat(amount: unknown): string {
  if (amount == null) return '—';
  const n = coerceNumber(amount);
  const abs = Math.abs(n);
  if (abs >= 100000) {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      notation: 'compact',
      maximumFractionDigits: abs >= 10000000 ? 1 : 2,
    }).format(n);
  }
  return formatCurrencyCompact(n);
}

/** Normalize API/local date strings to YYYY-MM-DD for date inputs. */
export function toDateInputValue(date: string | undefined | null): string {
  if (!date) return '';
  const match = String(date).match(/^(\d{4}-\d{2}-\d{2})/);
  return match ? match[1] : '';
}

export function formatDate(date: string | undefined | null): string {
  if (!date) return '—';
  const input = toDateInputValue(date);
  if (!input) return '—';
  const [y, m, d] = input.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/** Today's date in local timezone as YYYY-MM-DD. */
export function todayISO(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function isAfterToday(date: string): boolean {
  const normalized = toDateInputValue(date);
  return normalized !== '' && normalized > todayISO();
}

/**
 * Returns the next anniversary date on or after today for a loan that started on `startDate`.
 * E.g. startDate=2025-01-15, today=2025-04-10 → "2025-04-15"
 * If today is exactly an anniversary, returns the *next* one (i.e. one month later).
 */
export function nextAnniversaryISO(startDate: string): string {
  const sd = Number(toDateInputValue(startDate).split('-')[2]);
  const today = new Date();
  const ty = today.getFullYear();
  const tm = today.getMonth() + 1;
  const td = today.getDate();

  // Try the anniversary in the current month; if already past, advance to next month
  let y = ty;
  let m = tm;
  if (td >= sd) {
    // Today is on or after the anniversary day this month — use next month's date
    m += 1;
    if (m > 12) { m = 1; y += 1; }
  }

  // Handle months shorter than start day (e.g. start on 31st → Feb → end of Feb)
  const lastDay = new Date(y, m, 0).getDate();
  const day = Math.min(sd, lastDay);

  // Sanity: avoid going backwards from start date
  const result = `${y}-${String(m).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  if (result <= startDate) {
    // If start date is in the future, just use today
    return todayISO();
  }
  return result;
}

export const ITEM_TYPE_LABELS: Record<string, string> = {
  GOLD: 'Gold',
  SILVER: 'Silver',
  ELECTRONICS: 'Electronics',
  VEHICLE: 'Vehicle',
  GRAINS: 'Grains',
  PRODUCTS: 'Products',
  OTHER: 'Other',
};

export const WEIGHT_UNIT_LABELS: Record<string, string> = {
  GRAM: 'g',
  KG: 'kg',
  TOLA: 'tola',
  OUNCE: 'oz',
};

export const LOAN_STATUS_LABELS: Record<string, string> = {
  ACTIVE: 'Active',
  CLOSED: 'Closed',
  OVERDUE: 'Overdue',
};

/** Format a stored monthly % for display (trims trailing zeros). */
export function formatPercent(value: number, maxDecimals = 4): string {
  const fixed = value.toFixed(maxDecimals);
  return fixed.replace(/\.?0+$/, '') || '0';
}

export const INTEREST_ACCRUAL_BASIS_LABELS: Record<string, string> = {
  DAILY_30: 'Daily (30-day month)',
  CALENDAR_MONTH: 'Month-to-month (same date each month)',
};
