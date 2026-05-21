import { api } from './client';
import { normalizePayment, normalizePaymentPage } from '../lib/paymentUtils';
import type { PageResponse, Payment, PaymentRequest } from '../types';

const PAYMENT_PAGE_SIZE = 10;

export const paymentsApi = {
  listPage: async (loanId: number, page = 1, size = PAYMENT_PAGE_SIZE) => {
    const data = await api<PageResponse<Payment>>(
      `/loans/${loanId}/payments?page=${page}&size=${size}`
    );
    return normalizePaymentPage(data);
  },

  get: async (loanId: number, paymentId: number) => {
    const data = await api<Payment>(`/loans/${loanId}/payments/${paymentId}`);
    return normalizePayment(data);
  },

  create: async (loanId: number, data: PaymentRequest, idempotencyKey: string) => {
    const payment = await api<Payment>(`/loans/${loanId}/payments`, {
      method: 'POST',
      body: JSON.stringify(data),
      headers: { 'Idempotency-Key': idempotencyKey },
    });
    return normalizePayment(payment);
  },

  update: async (loanId: number, paymentId: number, data: PaymentRequest) => {
    const payment = await api<Payment>(`/loans/${loanId}/payments/${paymentId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return normalizePayment(payment);
  },

  confirm: async (loanId: number, paymentId: number) => {
    const payment = await api<Payment>(`/loans/${loanId}/payments/${paymentId}/confirm`, {
      method: 'POST',
    });
    return normalizePayment(payment);
  },
};
