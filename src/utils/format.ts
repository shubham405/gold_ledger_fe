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
