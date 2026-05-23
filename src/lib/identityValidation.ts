/** Indian Aadhaar: exactly 12 digits. */
export const AADHAAR_DIGITS = 12;

/** Indian PAN: exactly 10 characters (ABCDE1234F). */
export const PAN_LENGTH = 10;

const AADHAAR_PATTERN = /^[0-9]{12}$/;
const PAN_PATTERN = /^[A-Z]{5}[0-9]{4}[A-Z]$/;

export function normalizeAadhaar(value: string | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function normalizePan(value: string | undefined): string {
  return (value ?? '').replace(/[^A-Za-z0-9]/g, '').toUpperCase();
}

/** Keep only digits, max 12. */
export function formatAadhaarInput(value: string): string {
  return normalizeAadhaar(value).slice(0, AADHAAR_DIGITS);
}

/** Keep only PAN characters, uppercase, max 10. */
export function formatPanInput(value: string): string {
  return normalizePan(value).slice(0, PAN_LENGTH);
}

export function validateBorrowerIdentity(
  aadhaarRaw: string | undefined,
  panRaw: string | undefined
): string | null {
  const aadhaar = normalizeAadhaar(aadhaarRaw);
  const pan = normalizePan(panRaw);

  if (aadhaar && !AADHAAR_PATTERN.test(aadhaar)) {
    return 'Aadhaar must be exactly 12 digits';
  }
  if (pan && !PAN_PATTERN.test(pan)) {
    return 'PAN must be exactly 10 characters (e.g. ABCDE1234F)';
  }
  return null;
}
