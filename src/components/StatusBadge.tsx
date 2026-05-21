import type { LoanStatus } from '../types';
import { LOAN_STATUS_LABELS } from '../utils/format';

const statusClass: Record<LoanStatus, string> = {
  ACTIVE: 'badge--active',
  CLOSED: 'badge--closed',
  OVERDUE: 'badge--overdue',
};

export function StatusBadge({ status }: { status: LoanStatus }) {
  return (
    <span className={`badge ${statusClass[status]}`}>
      {LOAN_STATUS_LABELS[status] ?? status}
    </span>
  );
}
