/** Practical email format: local@domain.tld (aligned with backend). */
export const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

export const EMAIL_PATTERN_SOURCE = EMAIL_PATTERN.source;

export const EMAIL_MAX_LENGTH = 254;

export const EMAIL_INVALID_MESSAGE = 'Enter a valid email address';

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function validateEmail(value: string | undefined): string | null {
  const raw = (value ?? '').trim();
  if (!raw) {
    return 'Email is required';
  }
  if (/\s/.test(raw)) {
    return 'Email cannot contain spaces';
  }
  if (raw.length > EMAIL_MAX_LENGTH) {
    return `Email must be at most ${EMAIL_MAX_LENGTH} characters`;
  }
  const normalized = normalizeEmail(raw);
  if (!EMAIL_PATTERN.test(normalized)) {
    return EMAIL_INVALID_MESSAGE;
  }
  return null;
}
