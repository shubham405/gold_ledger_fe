import { useEffect, useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loansApi } from '../api/loans';
import { borrowersApi } from '../api/borrowers';
import { ErrorAlert } from '../components/ErrorAlert';
import { getApiErrorMessage } from '../lib/apiError';
import { rowSerialNumber } from '../lib/rowSerial';
import { Loading } from '../components/Loading';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { Loan } from '../types';
import { formatCurrency, formatCurrencyStat, formatDate, sumNumbers } from '../utils/format';

export function Dashboard() {
  const navigate = useNavigate();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [customerCount, setCustomerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    Promise.all([loansApi.list(), borrowersApi.listPage({ page: 1, size: 1 })])
      .then(([loanList, customers]) => {
        setLoans(loanList);
        setCustomerCount(customers.totalElements);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loading message="Loading shop overview…" />;
  if (error) {
    return (
      <ErrorAlert
        message={error}
        placement="inline"
        onDismiss={() => setError('')}
      />
    );
  }

  const active = loans.filter((l) => l.status === 'ACTIVE');
  const overdue = loans.filter((l) => l.status === 'OVERDUE');
  const totalOutstanding = sumNumbers(
    active.map((l) => l.outstandingPrincipal)
  );
  const totalCollateral = sumNumbers(
    active.map((l) => l.totalCollateralValue)
  );

  const recent = [...loans]
    .sort((a, b) => b.id - a.id)
    .slice(0, 8);

  return (
    <div className="page">
      <PageHeader
        title="Shop overview"
        subtitle="Today’s pledge and recovery snapshot"
      />

      <div className="stat-grid">
        <StatCard tone="active" label="Active pledges" value={String(active.length)} />
        <StatCard
          tone="overdue"
          label="Overdue"
          value={String(overdue.length)}
          highlight={overdue.length > 0}
        />
        <StatCard tone="customers" label="Customers" value={String(customerCount)} />
        <StatCard
          tone="principal"
          label="Outstanding"
          value={formatCurrencyStat(totalOutstanding)}
          title={formatCurrency(totalOutstanding)}
        />
        <StatCard
          tone="collateral"
          label="Collateral"
          value={formatCurrencyStat(totalCollateral)}
          title={formatCurrency(totalCollateral)}
        />
      </div>

      {overdue.length > 0 && (
        <section className="card card--warn">
          <h2>Attention — overdue pledges</h2>
          <ul className="simple-list">
            {overdue.map((loan, index) => (
              <li key={loan.id}>
                <Link to={`/loans/${loan.id}`}>
                  {rowSerialNumber(index)}. {loan.borrower?.name} · Due {formatDate(loan.dueDate)}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2>Recent pledges</h2>
          <Link to="/loans" className="btn btn--ghost btn--sm">
            View all
          </Link>
        </div>
        {recent.length === 0 ? (
          <p className="empty">No pledges yet. Register a customer and create a pledge.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Customer</th>
                  <th>Principal</th>
                  <th>Outstanding</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {recent.map((loan, index) => (
                  <tr
                    key={loan.id}
                    className="table-row--clickable"
                    tabIndex={0}
                    role="link"
                    onClick={() => navigate(`/loans/${loan.id}`)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        navigate(`/loans/${loan.id}`);
                      }
                    }}
                  >
                    <td className="cell-serial">{rowSerialNumber(index)}</td>
                    <td>{loan.borrower?.name ?? '—'}</td>
                    <td>{formatCurrency(loan.principalAmount)}</td>
                    <td>{formatCurrency(loan.outstandingPrincipal)}</td>
                    <td>{formatDate(loan.dueDate)}</td>
                    <td>
                      <StatusBadge status={loan.status} />
                    </td>
                    <td className="cell-actions">
                      <Link
                        to={`/loans/${loan.id}`}
                        className="btn btn--ghost btn--sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}

type StatTone = 'active' | 'overdue' | 'customers' | 'principal' | 'collateral';

function StatCard({
  tone,
  label,
  value,
  highlight,
  title,
}: {
  tone: StatTone;
  label: string;
  value: string;
  highlight?: boolean;
  title?: string;
}) {
  const isCurrency = tone === 'principal' || tone === 'collateral';
  return (
    <article
      className={`stat-card stat-card--${tone}${highlight ? ' stat-card--highlight' : ''}${isCurrency ? ' stat-card--currency' : ''}`}
    >
      <StatIcon tone={tone} />
      <div className="stat-card__content">
        <span className="stat-label">{label}</span>
        <span className="stat-value" title={title}>
          {value}
        </span>
      </div>
    </article>
  );
}

function StatIcon({ tone }: { tone: StatTone }) {
  const icons: Record<StatTone, ReactNode> = {
    active: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M4 7h16M4 12h16M4 17h10" strokeLinecap="round" />
      </svg>
    ),
    overdue: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="12" r="9" />
        <path d="M12 8v5M12 16h.01" strokeLinecap="round" />
      </svg>
    ),
    customers: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <circle cx="12" cy="8" r="3.5" />
        <path d="M5 20c0-3.5 3.1-6 7-6s7 2.5 7 6" strokeLinecap="round" />
      </svg>
    ),
    principal: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3v18M8 7c0-2 1.8-3 4-3s4 1 4 3M8 17c0 2 1.8 3 4 3s4-1 4-3" strokeLinecap="round" />
      </svg>
    ),
    collateral: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
        <path d="M12 3l7 4v10l-7 4-7-4V7l7-4z" strokeLinejoin="round" />
      </svg>
    ),
  };

  return <span className={`stat-icon stat-icon--${tone}`}>{icons[tone]}</span>;
}
