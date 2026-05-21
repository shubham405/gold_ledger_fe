import { api } from './client';
import type {
  InterestSummary,
  Loan,
  LoanRequest,
  LoanStatus,
  LoanUpdateRequest,
} from '../types';

export const loansApi = {
  list: (status?: LoanStatus) => {
    const q = status ? `?status=${status}` : '';
    return api<Loan[]>(`/loans${q}`);
  },

  get: (id: number) => api<Loan>(`/loans/${id}`),

  create: (data: LoanRequest) =>
    api<Loan>('/loans', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: LoanUpdateRequest) =>
    api<Loan>(`/loans/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  close: (id: number) =>
    api<Loan>(`/loans/${id}/close`, { method: 'PATCH' }),

  interest: (id: number, asOf?: string) => {
    const q = asOf ? `?asOf=${asOf}` : '';
    return api<InterestSummary>(`/loans/${id}/interest${q}`);
  },
};
