import { api } from './client';
import type { Borrower, BorrowerRequest, Loan, PageResponse } from '../types';

const CUSTOMER_PAGE_SIZE = 20;

export const borrowersApi = {
  listPage: (params?: {
    page?: number;
    size?: number;
    search?: string;
    withLoansOnly?: boolean;
  }) => {
    const q = new URLSearchParams();
    q.set('page', String(params?.page ?? 1));
    q.set('size', String(params?.size ?? CUSTOMER_PAGE_SIZE));
    if (params?.search?.trim()) q.set('search', params.search.trim());
    q.set('withLoansOnly', String(params?.withLoansOnly ?? false));
    return api<PageResponse<Borrower>>(`/borrowers?${q}`);
  },

  options: () => api<Borrower[]>('/borrowers/options'),

  get: (id: number) => api<Borrower>(`/borrowers/${id}`),

  create: (data: BorrowerRequest) =>
    api<Borrower>('/borrowers', { method: 'POST', body: JSON.stringify(data) }),

  update: (id: number, data: BorrowerRequest) =>
    api<Borrower>(`/borrowers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (id: number) =>
    api<void>(`/borrowers/${id}`, { method: 'DELETE' }),

  loans: (id: number) => api<Loan[]>(`/borrowers/${id}/loans`),

  createLoan: (id: number, data: Omit<import('../types').LoanRequest, 'borrowerId'>) =>
    api<Loan>(`/borrowers/${id}/loans`, {
      method: 'POST',
      body: JSON.stringify({ ...data, borrowerId: id }),
    }),
};
