import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { borrowersApi } from '../api/borrowers';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { DateInput } from '../components/DateInput';
import { NumericInput } from '../components/NumericInput';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { Borrower, Loan } from '../types';
import { getApiErrorMessage } from '../lib/apiError';
import { validatePledgeAmounts } from '../lib/amountValidation';
import { formatCurrency, formatDate, todayISO } from '../utils/format';

export function BorrowerDetail() {
  const { canWrite } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const borrowerId = Number(id);

  const [borrower, setBorrower] = useState<Borrower | null>(null);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pledgeOpen, setPledgeOpen] = useState(false);
  const [pledgeForm, setPledgeForm] = useState({
    principalAmount: '',
    monthlyInterestRatePercent: '2',
    startDate: todayISO(),
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);

  const load = useCallback(() => {
    if (!borrowerId) return;
    setLoading(true);
    Promise.all([borrowersApi.get(borrowerId), borrowersApi.loans(borrowerId)])
      .then(([b, l]) => {
        setBorrower(b);
        setLoans(l);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [borrowerId]);

  useEffect(() => {
    load();
  }, [load]);

  async function createPledge(e: React.FormEvent) {
    e.preventDefault();
    const amountError = validatePledgeAmounts(
      pledgeForm.principalAmount,
      pledgeForm.monthlyInterestRatePercent
    );
    if (amountError) {
      setError(amountError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const loan = await borrowersApi.createLoan(borrowerId, {
        principalAmount: Number(pledgeForm.principalAmount),
        monthlyInterestRatePercent: Number(pledgeForm.monthlyInterestRatePercent),
        startDate: pledgeForm.startDate,
        dueDate: pledgeForm.dueDate,
      });
      setPledgeOpen(false);
      navigate(`/loans/${loan.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create pledge'));
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <Loading />;
  if (!borrower) return <ErrorAlert message={error || 'Customer not found'} placement="inline" />;

  return (
    <div className="page">
      <PageHeader
        title={borrower.name}
        subtitle={`${borrower.fathersName} · ${borrower.mobileNumber}`}
        backTo="/borrowers"
        backLabel="Customers"
        action={
          canWrite ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={() => {
                setError('');
                setPledgeOpen(true);
              }}
            >
              + New pledge
            </button>
          ) : undefined
        }
      />

      {error && !pledgeOpen && (
        <ErrorAlert message={error} onDismiss={() => setError('')} />
      )}

      <div className="detail-grid">
        <section className="card">
          <h2>Contact details</h2>
          <dl className="detail-list">
            <dt>Address</dt>
            <dd>{borrower.address}</dd>
            <dt>Aadhaar</dt>
            <dd>{borrower.aadhaarNumber || '—'}</dd>
            <dt>PAN</dt>
            <dd>{borrower.panNumber || '—'}</dd>
            <dt>Total pledges</dt>
            <dd>{borrower.loanCount}</dd>
          </dl>
        </section>
      </div>

      <section className="card">
        <h2>Pledge history</h2>
        {loans.length === 0 ? (
          <p className="empty">No pledges for this customer yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Principal</th>
                  <th>Outstanding</th>
                  <th>Rate / month</th>
                  <th>Due</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {loans.map((loan) => (
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
                    <td className="link--strong">{loan.id}</td>
                    <td>{formatCurrency(loan.principalAmount)}</td>
                    <td>{formatCurrency(loan.outstandingPrincipal)}</td>
                    <td>{loan.monthlyInterestRatePercent}%</td>
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

      <Modal
        title="New pledge"
        open={pledgeOpen}
        onClose={() => setPledgeOpen(false)}
        error={pledgeOpen ? error : undefined}
        onDismissError={() => setError('')}
      >
        <form className="form" onSubmit={createPledge}>
          <label>
            Loan amount (₹)
            <NumericInput
              required
              value={pledgeForm.principalAmount}
              onChange={(e) => setPledgeForm({ ...pledgeForm, principalAmount: e.target.value })}
            />
          </label>
          <label>
            Monthly interest (%)
            <NumericInput
              required
              value={pledgeForm.monthlyInterestRatePercent}
              onChange={(e) =>
                setPledgeForm({ ...pledgeForm, monthlyInterestRatePercent: e.target.value })
              }
            />
          </label>
          <label>
            Start date
            <DateInput
              required
              value={pledgeForm.startDate}
              onChange={(startDate) => setPledgeForm({ ...pledgeForm, startDate })}
            />
          </label>
          <label>
            Due date
            <DateInput
              required
              value={pledgeForm.dueDate}
              onChange={(dueDate) => setPledgeForm({ ...pledgeForm, dueDate })}
            />
          </label>
          <p className="form-hint">
            After creating the pledge, add pledged ornaments (gold/silver) on the pledge detail page.
          </p>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setPledgeOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create pledge'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
