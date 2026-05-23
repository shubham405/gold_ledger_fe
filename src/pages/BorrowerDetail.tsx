import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { borrowersApi } from '../api/borrowers';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { DateInput } from '../components/DateInput';
import { InterestRateField } from '../components/InterestRateField';
import { NumericInput } from '../components/NumericInput';
import { SelectInput } from '../components/SelectInput';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type { Borrower, BorrowerIdentity, InterestAccrualBasis, Loan } from '../types';
import { getApiErrorMessage } from '../lib/apiError';
import { rowSerialNumber } from '../lib/rowSerial';
import { validatePledgeAmounts } from '../lib/amountValidation';
import { useInterestRateBasis } from '../context/InterestRateBasisContext';
import { displayStoredMonthlyRate, parseRateInput, toMonthlyPercent } from '../lib/interestRate';
import { formatCurrency, formatDate, todayISO } from '../utils/format';

export function BorrowerDetail() {
  const { canWrite } = useAuth();
  const { basis } = useInterestRateBasis();
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
  const [interestAccrualBasis, setInterestAccrualBasis] =
    useState<InterestAccrualBasis>('DAILY_30');
  const [saving, setSaving] = useState(false);

  // Identity reveal state
  const [fullIdentity, setFullIdentity] = useState<BorrowerIdentity | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [revealing, setRevealing] = useState(false);
  const [revealCountdown, setRevealCountdown] = useState(0);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  async function toggleReveal() {
    if (revealed) {
      setRevealed(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      setRevealCountdown(0);
      return;
    }
    setRevealing(true);
    try {
      const identity = fullIdentity ?? await borrowersApi.identity(borrowerId);
      setFullIdentity(identity);
      setRevealed(true);
      const HIDE_AFTER = 30;
      setRevealCountdown(HIDE_AFTER);
      countdownRef.current = setInterval(() => {
        setRevealCountdown((c) => {
          if (c <= 1) {
            clearInterval(countdownRef.current!);
            return 0;
          }
          return c - 1;
        });
      }, 1000);
      hideTimerRef.current = setTimeout(() => {
        setRevealed(false);
        setRevealCountdown(0);
      }, HIDE_AFTER * 1000);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not reveal identity'));
    } finally {
      setRevealing(false);
    }
  }

  const hasIdentity = !!(borrower?.aadhaarNumber || borrower?.panNumber);

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
        monthlyInterestRatePercent: toMonthlyPercent(
          parseRateInput(pledgeForm.monthlyInterestRatePercent)!,
          basis,
        ),
        startDate: pledgeForm.startDate,
        dueDate: pledgeForm.dueDate,
        interestAccrualBasis,
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
  if (!borrower) {
    return (
      <ErrorAlert
        message={error || 'Customer not found'}
        placement="inline"
        onDismiss={() => navigate('/borrowers')}
      />
    );
  }

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
            <dd className="identity-field">
              <span className="identity-field__value">
                {revealed && fullIdentity?.aadhaarNumber
                  ? fullIdentity.aadhaarNumber
                  : (borrower.aadhaarNumber || '—')}
              </span>
            </dd>
            <dt>PAN</dt>
            <dd className="identity-field">
              <span className="identity-field__value">
                {revealed && fullIdentity?.panNumber
                  ? fullIdentity.panNumber
                  : (borrower.panNumber || '—')}
              </span>
            </dd>
            <dt>Total pledges</dt>
            <dd>{borrower.loanCount}</dd>
          </dl>
          {hasIdentity && (
            <div className="identity-reveal-row">
              <button
                type="button"
                className={`btn btn--ghost btn--sm identity-reveal-btn${revealed ? ' identity-reveal-btn--active' : ''}`}
                onClick={toggleReveal}
                disabled={revealing}
              >
                {revealing ? (
                  'Loading…'
                ) : revealed ? (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M1 1l12 12M5.5 5.6A2 2 0 009.4 9.5M3.3 3.4C2 4.3 1 5.5 1 7c0 0 2 4 6 4a6.3 6.3 0 003.7-1.3M6 2.1A6 6 0 0113 7c-.3.7-.8 1.4-1.3 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                    </svg>
                    Hide · {revealCountdown}s
                  </>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
                      <path d="M1 7s2-4 6-4 6 4 6 4-2 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
                      <circle cx="7" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
                    </svg>
                    Reveal identity
                  </>
                )}
              </button>
              {revealed && (
                <span className="identity-reveal-hint">Auto-hides in {revealCountdown}s</span>
              )}
            </div>
          )}
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
                {loans.map((loan, index) => (
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
                    <td>{formatCurrency(loan.principalAmount)}</td>
                    <td>{formatCurrency(loan.outstandingPrincipal)}</td>
                    <td>{displayStoredMonthlyRate(loan.monthlyInterestRatePercent, basis)}</td>
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
          <InterestRateField
            required
            value={pledgeForm.monthlyInterestRatePercent}
            onChange={(monthlyInterestRatePercent) =>
              setPledgeForm({ ...pledgeForm, monthlyInterestRatePercent })
            }
          />
          <label>
            Billing period
            <SelectInput
              value={interestAccrualBasis}
              onChange={(v) => setInterestAccrualBasis(v as InterestAccrualBasis)}
              options={[
                { value: 'DAILY_30', label: 'Daily (30-day month)' },
                { value: 'CALENDAR_MONTH', label: 'Month-to-month (same date)' },
              ]}
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
