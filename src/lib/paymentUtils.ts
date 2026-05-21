import type { PageResponse, Payment } from '../types';

/** API may send `confirmed` or legacy `isConfirmed` from Jackson. */
export function isPaymentConfirmed(p: Payment): boolean {
  const raw = p as Payment & { isConfirmed?: boolean };
  return raw.confirmed === true || raw.isConfirmed === true;
}

export function normalizePayment(p: Payment): Payment {
  return {
    ...p,
    confirmed: isPaymentConfirmed(p),
  };
}

export function normalizePaymentPage(page: PageResponse<Payment>): PageResponse<Payment> {
  return {
    ...page,
    content: page.content.map(normalizePayment),
  };
}
