import { api } from './client';
import type { CollateralItem, CollateralRequest } from '../types';

export const collateralApi = {
  list: (loanId: number) =>
    api<CollateralItem[]>(`/loans/${loanId}/collateral`),

  get: (loanId: number, itemId: number) =>
    api<CollateralItem>(`/loans/${loanId}/collateral/${itemId}`),

  create: (loanId: number, data: CollateralRequest) =>
    api<CollateralItem>(`/loans/${loanId}/collateral`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  update: (loanId: number, itemId: number, data: CollateralRequest) =>
    api<CollateralItem>(`/loans/${loanId}/collateral/${itemId}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  delete: (loanId: number, itemId: number) =>
    api<void>(`/loans/${loanId}/collateral/${itemId}`, { method: 'DELETE' }),
};
