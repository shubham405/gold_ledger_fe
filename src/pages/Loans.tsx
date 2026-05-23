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
import { InterestRateField } from '../components/InterestRateField';
import { NumericInput } from '../components/NumericInput';
import { SelectInput } from '../components/SelectInput';
import { PageHeader } from '../components/PageHeader';
import { PledgeGuideLink } from '../components/PledgeGuideLink';
import { StatusBadge } from '../components/StatusBadge';
import type {
  Borrower,
  InterestAccrualBasis,
  InterestMethod,
  Loan,
  LoanRequest,
  LoanStatus,
} from '../types';
import { getApiErrorMessage } from '../lib/apiError';
import { rowSerialNumber } from '../lib/rowSerial';
import { validatePledgeAmounts } from '../lib/amountValidation';
import { useInterestRateBasis } from '../context/InterestRateBasisContext';
import { parseRateInput, toMonthlyPercent } from '../lib/interestRate';
import { formatCurrency, formatDate, todayISO } from '../utils/format';

const STATUS_OPTIONS: { value: '' | LoanStatus; label: string }[] = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'OVERDUE', label: 'Overdue' },
  { value: 'CLOSED', label: 'Closed' },
];

type InterestMode = 'simple' | 'compound' | 'schedule';

type ScheduleRow = {
  fromMonth: number;
  toMonth: number | null;
  ratePercent: string;
  interestMethod: InterestMethod;
};

const defaultScheduleRow = (): ScheduleRow => ({
  fromMonth: 1,
  toMonth: null,
  ratePercent: '2',
  interestMethod: 'SIMPLE',
});

export function Loans() {
  const navigate = useNavigate();
  const { canWrite } = useAuth();
  const { basis } = useInterestRateBasis();
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
  const [interestAccrualBasis, setInterestAccrualBasis] =
    useState<InterestAccrualBasis>('DAILY_30');
  const [schedulePeriods, setSchedulePeriods] = useState<ScheduleRow[]>([defaultScheduleRow()]);

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
    setInterestAccrualBasis('DAILY_30');
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
        monthlyRatePercent: toMonthlyPercent(parseRateInput(p.ratePercent)!, basis),
        interestMethod: p.interestMethod,
      })),
    };
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const rateForValidation =
      interestMode === 'schedule'
        ? String(schedulePeriods[0]?.ratePercent ?? '')
        : form.monthlyInterestRatePercent;
    const amountError = validatePledgeAmounts(
      form.principalAmount,
      rateForValidation,
      interestMode === 'schedule'
        ? schedulePeriods.map((p) => p.ratePercent)
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
            ? toMonthlyPercent(parseRateInput(schedulePeriods[0].ratePercent)!, basis)
            : toMonthlyPercent(parseRateInput(form.monthlyInterestRatePercent)!, basis),
        startDate: form.startDate,
        dueDate: form.dueDate,
        interestAccrualBasis,
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
        subtitle="Manage and track all your pledges in one place."
        action={
          canWrite ? (
            <button
              type="button"
              className="btn btn--primary"
              onClick={openCreateModal}
            >
              + New pledge
            </button>
          ) : (
            <PledgeGuideLink />
          )
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
        <div className="empty-state">
          <div className="empty-state__illustration" aria-hidden="true">
            <svg viewBox="0 0 160 140" width="140" height="120" fill="none" xmlns="http://www.w3.org/2000/svg">
              {/* Soft glow behind document */}
              <ellipse cx="66" cy="72" rx="42" ry="38" fill="var(--gold)" opacity="0.07" />
              {/* Document body */}
              <rect x="36" y="28" width="58" height="72" rx="6" fill="var(--bg-elevated)" stroke="var(--border)" strokeWidth="1.5" />
              {/* Document lines */}
              <line x1="48" y1="55" x2="82" y2="55" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="65" x2="82" y2="65" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="48" y1="75" x2="68" y2="75" stroke="var(--border)" strokeWidth="2.5" strokeLinecap="round" />
              {/* Bookmark ribbon */}
              <path d="M72 28 L72 52 L80 47 L88 52 L88 28 Z" fill="var(--gold)" opacity="0.75" />
              {/* Decorative circles */}
              <circle cx="20" cy="60" r="5" fill="var(--gold)" opacity="0.12" />
              <circle cx="128" cy="40" r="7" fill="var(--gold)" opacity="0.09" />
              <circle cx="22" cy="90" r="3" fill="var(--gold)" opacity="0.1" />
              {/* Plant pot */}
              <path d="M112 98 L128 98 L125 112 L115 112 Z" fill="var(--text-muted)" opacity="0.35" />
              <line x1="109" y1="98" x2="131" y2="98" stroke="var(--text-muted)" strokeOpacity="0.45" strokeWidth="2" strokeLinecap="round" />
              {/* Plant stem */}
              <line x1="120" y1="97" x2="120" y2="80" stroke="var(--success)" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              {/* Leaves */}
              <path d="M120 84 Q129 75 133 81 Q127 87 120 84Z" fill="var(--success)" opacity="0.45" />
              <path d="M120 90 Q111 81 107 87 Q113 93 120 90Z" fill="var(--success)" opacity="0.45" />
            </svg>
          </div>
          <h3 className="empty-state__title">No pledges found</h3>
          <p className="empty-state__body">
            {canWrite
              ? 'There are no pledges that match the selected filter. Learn how pledges work or create your first one.'
              : 'Your account is in view-only mode. Explore what pledges can do while you wait for activation.'}
          </p>
          <div className="empty-state__actions">
            <PledgeGuideLink className="btn btn--primary empty-state__cta" />
            {canWrite && (
              <button
                type="button"
                className="btn btn--ghost empty-state__cta"
                onClick={openCreateModal}
              >
                + New pledge
              </button>
            )}
          </div>
        </div>
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
              {loans.map((loan, index) => (
                <tr
                  key={loan.id}
                  className="table-row--clickable"
                  tabIndex={0}
                  role="link"
                  aria-label={`View pledge ${rowSerialNumber(index)}${loan.borrower?.name ? ` for ${loan.borrower.name}` : ''}`}
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
            <InterestRateField
              required
              value={form.monthlyInterestRatePercent}
              onChange={(monthlyInterestRatePercent) =>
                setForm({ ...form, monthlyInterestRatePercent })
              }
            />
          )}

          <fieldset className="form-section span-2">
            <legend className="form-section__legend">Interest calculation</legend>
            <label>
              Billing period
              <SelectInput
                value={interestAccrualBasis}
                onChange={(v) => setInterestAccrualBasis(v as InterestAccrualBasis)}
                options={[
                  { value: 'DAILY_30', label: 'Daily — pro-rata (30-day month)' },
                  {
                    value: 'CALENDAR_MONTH',
                    label: 'Month-to-month — same date each month',
                  },
                ]}
              />
            </label>
            <p className="form-hint">
              {interestAccrualBasis === 'CALENDAR_MONTH'
                ? 'Each full month from the start date charges one full monthly rate (28/30/31 days treated equally). Partial months are prorated. Principal payments start a new base from that date.'
                : 'Interest accrues daily on remaining principal (days ÷ 30) and adjusts when principal is repaid.'}
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
                    <InterestRateField
                      className="interest-schedule-rate"
                      compact
                      required
                      value={row.ratePercent}
                      onChange={(ratePercent) => {
                        const next = [...schedulePeriods];
                        next[idx] = { ...row, ratePercent };
                        setSchedulePeriods(next);
                      }}
                    />
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
                        ratePercent: last.ratePercent,
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
