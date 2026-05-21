import { downloadFile } from './download';
import type { LoanStatus } from '../types';

export const exportApi = {
  pledge: (loanId: number) =>
    downloadFile(`/export/pledges/${loanId}`, `pledge-${loanId}.pdf`),

  pledgePayments: (loanId: number) =>
    downloadFile(`/export/pledges/${loanId}/payments`, `pledge-${loanId}-payments.pdf`),

  allPledges: (status?: LoanStatus) => {
    const q = status ? `?status=${status}` : '';
    const suffix = status ? `-${status.toLowerCase()}` : '-all';
    return downloadFile(`/export/pledges${q}`, `pledges${suffix}.pdf`);
  },

  allCustomers: () => downloadFile('/export/customers', 'customers.pdf'),
};
