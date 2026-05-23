/**
 * Password must be ≥8 chars with at least one letter, one digit,
 * and one special character from the allowed set.
 */
export const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&^_\-]).{8,}$/;

export const PASSWORD_PATTERN_SOURCE = PASSWORD_PATTERN.source;

export const PASSWORD_MIN_LENGTH = 8;

export const PASSWORD_RULES_MESSAGE =
  'Password must be at least 8 characters and include a letter, a number, and a special character (@$!%*#?&^_-)';

export function validatePassword(value: string | undefined): string | null {
  const raw = value ?? '';
  if (!raw) {
    return 'Password is required';
  }
  if (raw.length < PASSWORD_MIN_LENGTH) {
    return `Password must be at least ${PASSWORD_MIN_LENGTH} characters`;
  }
  if (!PASSWORD_PATTERN.test(raw)) {
    return PASSWORD_RULES_MESSAGE;
  }
  return null;
}
