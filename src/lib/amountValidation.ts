export function requirePositiveAmount(value: string, label: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return `${label} is required`;
  }
  const n = Number(trimmed);
  if (Number.isNaN(n) || n <= 0) {
    return `${label} must be greater than zero`;
  }
  return null;
}

export function validatePledgeAmounts(
  principal: string,
  monthlyInterestRatePercent: string,
  scheduleRates?: string[]
): string | null {
  const principalError = requirePositiveAmount(principal, 'Principal amount');
  if (principalError) return principalError;

  const rateError = requirePositiveAmount(monthlyInterestRatePercent, 'Interest rate');
  if (rateError) return rateError;

  if (scheduleRates) {
    for (let i = 0; i < scheduleRates.length; i++) {
      const periodError = requirePositiveAmount(scheduleRates[i], `Period ${i + 1} interest rate`);
      if (periodError) return periodError;
    }
  }
  return null;
}

export function validatePaymentAmounts(principal: string, interest: string): string | null {
  const p = Number(principal) || 0;
  const i = Number(interest) || 0;
  if (p < 0 || i < 0) {
    return 'Payment amounts cannot be negative';
  }
  if (p <= 0 && i <= 0) {
    return 'At least one of principal or interest payment must be greater than zero';
  }
  return null;
}
