import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { exportApi } from '../api/export';
import { loansApi } from '../api/loans';
import { borrowersApi } from '../api/borrowers';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { DateInput } from '../components/DateInput';
import { NumericInput } from '../components/NumericInput';
import { SelectInput } from '../components/SelectInput';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import type {
  Borrower,
  InterestMethod,
  InterestPeriodRequest,
  Loan,
  LoanRequest,
  LoanStatus,
} from '../types';
import { getApiErrorMessage } from '../lib/apiError';
import { validatePledgeAmounts } from '../lib/amountValidation';
import { formatCurrency, formatDate, todayISO } from '../utils/format';

const STATUS_OPTIONS: { value: '' | LoanStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CLOSED', label: 'Closed' },
];

type InterestMode = 'simple' | 'compound' | 'schedule';

const defaultScheduleRow = (): InterestPeriodRequest => ({
  fromMonth: 1,
  toMonth: null,
  monthlyRatePercent: 2,
  interestMethod: 'SIMPLE',
});

export function Loans() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [borrowers, setBorrowers] = useState<Borrower[]>([]);
  const [statusFilter, setStatusFilter] = useState<'' | LoanStatus>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState({
    borrowerId: '',
    principalAmount: '',
    monthlyInterestRatePercent: '2',
    startDate: todayISO(),
    dueDate: '',
  });
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [interestMode, setInterestMode] = useState<InterestMode>('simple');
  const [schedulePeriods, setSchedulePeriods] = useState<InterestPeriodRequest[]>([
    defaultScheduleRow(),
  ]);

  const load = useCallback(() => {
    setLoading(true);
    const status = statusFilter || undefined;
    Promise.all([loansApi.list(status), borrowersApi.options()])
      .then(([l, b]) => {
        setLoans(l);
        setBorrowers(b);
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  function openCreateModal() {
    setError('');
    setForm({
      borrowerId: '',
      principalAmount: '',
      monthlyInterestRatePercent: '2',
      startDate: todayISO(),
      dueDate: '',
    });
    setInterestMode('simple');
    setSchedulePeriods([defaultScheduleRow()]);
    setModalOpen(true);
  }

  function buildInterestPayload(): Pick<LoanRequest, 'defaultInterestMethod' | 'interestPeriods'> {
    if (interestMode === 'simple') {
      return { defaultInterestMethod: 'SIMPLE' };
    }
    if (interestMode === 'compound') {
      return { defaultInterestMethod: 'COMPOUND' };
    }
    return {
      interestPeriods: schedulePeriods.map((p) => ({
        fromMonth: Number(p.fromMonth),
        toMonth: p.toMonth ? Number(p.toMonth) : null,
        monthlyRatePercent: Number(p.monthlyRatePercent),
        interestMethod: p.interestMethod,
      })),
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const rateForValidation =
      interestMode === 'schedule'
        ? String(schedulePeriods[0]?.monthlyRatePercent ?? '')
        : form.monthlyInterestRatePercent;
    const amountError = validatePledgeAmounts(
      form.principalAmount,
      rateForValidation,
      interestMode === 'schedule'
        ? schedulePeriods.map((p) => String(p.monthlyRatePercent))
        : undefined
    );
    if (amountError) {
      setError(amountError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      const loan = await loansApi.create({
        borrowerId: Number(form.borrowerId),
        principalAmount: Number(form.principalAmount),
        monthlyInterestRatePercent:
          interestMode === 'schedule'
            ? Number(schedulePeriods[0].monthlyRatePercent)
            : Number(form.monthlyInterestRatePercent),
        startDate: form.startDate,
        dueDate: form.dueDate,
        ...buildInterestPayload(),
      });
      setModalOpen(false);
      navigate(`/loans/${loan.id}`);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to create pledge'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Pledges"
        subtitle="Click a row or View to open pledge details"
        action={
          canWrite ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={openCreateModal}
            >
              + New pledge
            </button>
          ) : undefined
        }
      />

      {error && !modalOpen && (
        <ErrorAlert message={error} onDismiss={() => setError('')} />
      )}

      <div className="toolbar toolbar--split">
        <div className="filter-tabs">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.label}
              type="button"
              className={`filter-tab${statusFilter === opt.value ? ' filter-tab--active' : ''}`}
              onClick={() => setStatusFilter(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={exporting || loading}
          onClick={async () => {
            setExporting(true);
            setError('');
            try {
              await exportApi.allPledges(statusFilter || undefined);
            } catch (err) {
              setError(getApiErrorMessage(err, 'PDF download failed'));
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? 'Downloading…' : 'Download pledges PDF'}
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : loans.length === 0 ? (
        <p className="empty">No pledges match this filter.</p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Customer</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Collateral</th>
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
                  aria-label={`View pledge ${loan.id}${loan.borrower?.name ? ` for ${loan.borrower.name}` : ''}`}
                  onClick={() => navigate(`/loans/${loan.id}`)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      navigate(`/loans/${loan.id}`);
                    }
                  }}
                >
                  <td className="link--strong">{loan.id}</td>
                  <td>{loan.borrower?.name ?? '—'}</td>
                  <td>{formatCurrency(loan.principalAmount)}</td>
                  <td>{formatCurrency(loan.outstandingPrincipal)}</td>
                  <td>{formatCurrency(loan.totalCollateralValue)}</td>
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

      <Modal
        title="New pledge"
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        error={modalOpen ? error : undefined}
        onDismissError={() => setError('')}
        wide
      >
        <form className="form form--pledge form--grid" onSubmit={handleCreate}>
          <label className="span-2">
            Customer
            <SelectInput
              required
              searchable
              searchPlaceholder="Search by name or mobile…"
              value={form.borrowerId}
              placeholder="Select customer…"
              onChange={(borrowerId) => setForm({ ...form, borrowerId })}
              options={borrowers.map((b) => ({
                value: String(b.id),
                label: `${b.name} — ${b.mobileNumber}`,
              }))}
            />
          </label>

          <label className={interestMode === 'schedule' ? 'span-2' : undefined}>
            Loan amount (₹)
            <NumericInput
              required
              value={form.principalAmount}
              onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
            />
          </label>

          {interestMode !== 'schedule' && (
            <label>
              Monthly interest (%)
              <NumericInput
                required
                value={form.monthlyInterestRatePercent}
                onChange={(e) =>
                  setForm({ ...form, monthlyInterestRatePercent: e.target.value })
                }
              />
            </label>
          )}

          <fieldset className="form-section span-2">
            <legend className="form-section__legend">Interest calculation</legend>
            <p className="form-hint">
              Accrual-based: interest is calculated on remaining principal, day by day, and
              adjusts when principal is repaid.
            </p>
            <label>
              Type
              <SelectInput
                value={interestMode}
                onChange={(v) => setInterestMode(v as InterestMode)}
                options={[
                  { value: 'simple', label: 'Whole period — simple (SI)' },
                  { value: 'compound', label: 'Whole period — compound (CI)' },
                  { value: 'schedule', label: 'Custom schedule (phased SI / CI)' },
                ]}
              />
            </label>

            {interestMode === 'schedule' && (
              <div className="interest-schedule-periods">
                {schedulePeriods.map((row, idx) => (
                  <div key={idx} className="interest-schedule-row">
                    <label>
                      From month
                      <NumericInput
                        className="input"
                        integer
                        required
                        value={row.fromMonth}
                        onChange={(e) => {
                          const next = [...schedulePeriods];
                          next[idx] = { ...row, fromMonth: Number(e.target.value) };
                          setSchedulePeriods(next);
                        }}
                      />
                    </label>
                    <label>
                      To month
                      <NumericInput
                        className="input"
                        integer
                        placeholder="Open"
                        value={row.toMonth ?? ''}
                        onChange={(e) => {
                          const next = [...schedulePeriods];
                          next[idx] = {
                            ...row,
                            toMonth: e.target.value ? Number(e.target.value) : null,
                          };
                          setSchedulePeriods(next);
                        }}
                      />
                    </label>
                    <label>
                      Rate (%)
                      <NumericInput
                        className="input"
                        required
                        value={row.monthlyRatePercent}
                        onChange={(e) => {
                          const next = [...schedulePeriods];
                          next[idx] = { ...row, monthlyRatePercent: Number(e.target.value) };
                          setSchedulePeriods(next);
                        }}
                      />
                    </label>
                    <label>
                      Method
                      <SelectInput
                        value={row.interestMethod}
                        onChange={(interestMethod) => {
                          const next = [...schedulePeriods];
                          next[idx] = { ...row, interestMethod: interestMethod as InterestMethod };
                          setSchedulePeriods(next);
                        }}
                        options={[
                          { value: 'SIMPLE', label: 'Simple (SI)' },
                          { value: 'COMPOUND', label: 'Compound (CI)' },
                        ]}
                      />
                    </label>
                    {schedulePeriods.length > 1 && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() =>
                          setSchedulePeriods(schedulePeriods.filter((_, i) => i !== idx))
                        }
                      >
                        Remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => {
                    const last = schedulePeriods[schedulePeriods.length - 1];
                    const nextFrom = last.toMonth ? last.toMonth + 1 : last.fromMonth + 1;
                    setSchedulePeriods([
                      ...schedulePeriods.map((p, i) =>
                        i === schedulePeriods.length - 1 ? { ...p, toMonth: nextFrom - 1 } : p
                      ),
                      {
                        fromMonth: nextFrom,
                        toMonth: null,
                        monthlyRatePercent: last.monthlyRatePercent,
                        interestMethod: 'SIMPLE',
                      },
                    ]);
                  }}
                >
                  + Add period
                </button>
              </div>
            )}
          </fieldset>

          <label>
            Start date
            <DateInput
              required
              value={form.startDate}
              onChange={(startDate) => setForm({ ...form, startDate })}
            />
          </label>
          <label>
            Due date
            <DateInput
              required
              value={form.dueDate}
              min={form.startDate}
              onChange={(dueDate) => setForm({ ...form, dueDate })}
            />
          </label>

          <div className="form-actions span-2">
            <button type="button" className="btn btn--ghost" onClick={() => setModalOpen(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Creating…' : 'Create'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
