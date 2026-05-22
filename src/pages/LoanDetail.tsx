import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { collateralApi } from '../api/collateral';
import { loansApi } from '../api/loans';
import { exportApi } from '../api/export';
import { paymentsApi } from '../api/payments';
import { ErrorAlert } from '../components/ErrorAlert';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { InterestBreakdownPanel, type BreakdownView } from '../components/InterestBreakdownPanel';
import { DateInput } from '../components/DateInput';
import { NumericInput } from '../components/NumericInput';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { StatusBadge } from '../components/StatusBadge';
import type {
  CollateralItem,
  CollateralRequest,
  InterestSummary,
  ItemType,
  Loan,
  PageResponse,
  Payment,
  WeightUnit,
} from '../types';
import { getApiErrorMessage } from '../lib/apiError';
import { requirePositiveAmount } from '../lib/amountValidation';
import { isPaymentConfirmed } from '../lib/paymentUtils';
import { newIdempotencyKey } from '../lib/idempotency';
import {
  formatCurrency,
  formatDate,
  ITEM_TYPE_LABELS,
  isAfterToday,
  todayISO,
  toDateInputValue,
  WEIGHT_UNIT_LABELS,
} from '../utils/format';

const ITEM_TYPES: ItemType[] = [
  'GOLD',
  'SILVER',
  'ELECTRONICS',
  'VEHICLE',
  'GRAINS',
  'PRODUCTS',
  'OTHER',
];

const WEIGHT_UNITS: WeightUnit[] = ['GRAM', 'KG', 'TOLA', 'OUNCE'];

const emptyCollateral: CollateralRequest = {
  itemType: 'GOLD',
  description: '',
  estimatedValue: 0,
  weight: undefined,
  weightUnit: 'GRAM',
  quantity: undefined,
};

export function LoanDetail() {
  const { canWrite } = useAuth();
  const { id } = useParams<{ id: string }>();
  const loanId = Number(id);

  const [loan, setLoan] = useState<Loan | null>(null);
  const [collateral, setCollateral] = useState<CollateralItem[]>([]);
  const [paymentsPage, setPaymentsPage] = useState<PageResponse<Payment> | null>(null);
  const [paymentListPage, setPaymentListPage] = useState(1);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [interest, setInterest] = useState<InterestSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [collateralModal, setCollateralModal] = useState(false);
  const [editingItem, setEditingItem] = useState<CollateralItem | null>(null);
  const [collateralForm, setCollateralForm] = useState<CollateralRequest>(emptyCollateral);

  const [paymentModal, setPaymentModal] = useState(false);
  const paymentIdempotencyKey = useRef<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    paymentDate: todayISO(),
    totalAmount: '',
    notes: '',
  });

  const [editPaymentModal, setEditPaymentModal] = useState(false);
  const [editingPayment, setEditingPayment] = useState<Payment | null>(null);
  const [editPaymentForm, setEditPaymentForm] = useState({
    paymentDate: todayISO(),
    totalAmount: '',
    notes: '',
  });

  const [editModal, setEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    monthlyInterestRatePercent: '',
    dueDate: '',
  });

  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<'pledge' | 'payments' | null>(null);
  const [interestAsOf, setInterestAsOf] = useState(todayISO());
  const [breakdownView, setBreakdownView] = useState<BreakdownView>('summary');

  const loadPayments = useCallback(() => {
    if (!loanId) return;
    setPaymentsLoading(true);
    paymentsApi
      .listPage(loanId, paymentListPage)
      .then(setPaymentsPage)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setPaymentsLoading(false));
  }, [loanId, paymentListPage]);

  const load = useCallback(() => {
    if (!loanId) return;
    setLoading(true);
    loansApi
      .get(loanId)
      .then(async (l) => {
        const c = await collateralApi.list(loanId);
        const i = l.status === 'CLOSED' ? null : await loansApi.interest(loanId);
        setLoan(l);
        setCollateral(c);
        setInterest(i);
        setEditForm({
          monthlyInterestRatePercent: String(l.monthlyInterestRatePercent),
          dueDate: toDateInputValue(l.dueDate),
        });
      })
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [loanId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  async function refreshInterest(asOf?: string) {
    if (loan?.status === 'CLOSED') return;
    try {
      const i = await loansApi.interest(loanId, asOf);
      setInterest(i);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to load interest'));
    }
  }

  function openAddCollateral() {
    setEditingItem(null);
    setCollateralForm({ ...emptyCollateral, itemType: 'GOLD' });
    setCollateralModal(true);
  }

  function openEditCollateral(item: CollateralItem) {
    setEditingItem(item);
    setCollateralForm({
      itemType: item.itemType,
      description: item.description,
      estimatedValue: item.estimatedValue,
      weight: item.weight,
      weightUnit: item.weightUnit ?? 'GRAM',
      quantity: item.quantity,
    });
    setCollateralModal(true);
  }

  async function saveCollateral(e: React.FormEvent) {
    e.preventDefault();
    const valueError = requirePositiveAmount(
      String(collateralForm.estimatedValue || ''),
      'Estimated value'
    );
    if (valueError) {
      setError(valueError);
      return;
    }
    setSaving(true);
    try {
      const payload: CollateralRequest = {
        ...collateralForm,
        estimatedValue: Number(collateralForm.estimatedValue),
        weight: collateralForm.weight ? Number(collateralForm.weight) : undefined,
        quantity: collateralForm.quantity ? Number(collateralForm.quantity) : undefined,
      };
      if (editingItem) {
        await collateralApi.update(loanId, editingItem.id, payload);
      } else {
        await collateralApi.create(loanId, payload);
      }
      setCollateralModal(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Failed to save item'));
    } finally {
      setSaving(false);
    }
  }

  async function deleteCollateral(itemId: number) {
    if (!confirm('Remove this pledged item from the record?')) return;
    try {
      await collateralApi.delete(loanId, itemId);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Delete failed'));
    }
  }

  function splitPayment(totalAmount: number, interestDue: number) {
    const interestPaid = Math.min(totalAmount, Math.max(0, interestDue));
    const principalPaid = Math.max(0, totalAmount - interestPaid);
    return { interestPaid, principalPaid };
  }

  function openPaymentModal() {
    paymentIdempotencyKey.current = null;
    setPaymentForm({ paymentDate: todayISO(), totalAmount: '', notes: '' });
    setPaymentModal(true);
  }

  function closePaymentModal() {
    if (saving) return;
    paymentIdempotencyKey.current = null;
    setPaymentModal(false);
  }

  function openEditPayment(p: Payment) {
    setError('');
    setEditingPayment(p);
    setEditPaymentForm({
      paymentDate: toDateInputValue(p.paymentDate),
      totalAmount: String(p.totalPaid),
      notes: p.notes ?? '',
    });
    setEditPaymentModal(true);
  }

  function closeEditPaymentModal() {
    if (saving) return;
    setEditPaymentModal(false);
    setEditingPayment(null);
  }

  async function saveEditPayment(e: React.FormEvent) {
    e.preventDefault();
    if (saving || !editingPayment || loan?.status === 'CLOSED') return;
    if (isAfterToday(editPaymentForm.paymentDate)) {
      setError('Payment date cannot be in the future');
      return;
    }
    const total = Number(editPaymentForm.totalAmount) || 0;
    if (total <= 0) {
      setError('Amount paid must be greater than zero');
      return;
    }
    const { interestPaid, principalPaid } = splitPayment(total, interest?.interestDue ?? 0);
    setSaving(true);
    try {
      await paymentsApi.update(loanId, editingPayment.id, {
        paymentDate: editPaymentForm.paymentDate,
        principalPaid,
        interestPaid,
        notes: editPaymentForm.notes || undefined,
      });
      closeEditPaymentModal();
      setPaymentListPage(1);
      load();
      paymentsApi.listPage(loanId, 1).then(setPaymentsPage);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Edit failed'));
    } finally {
      setSaving(false);
    }
  }

  async function handleConfirmPayment(p: Payment) {
    if (loan?.status === 'CLOSED') return;
    if (!confirm(`Confirm this payment of ${formatCurrency(p.totalPaid)}? It cannot be edited after confirmation.`)) return;
    setError('');
    try {
      await paymentsApi.confirm(loanId, p.id);
      load();
      paymentsApi.listPage(loanId, paymentListPage).then(setPaymentsPage);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Confirm failed'));
    }
  }

  async function recordPayment(e: React.FormEvent) {
    e.preventDefault();
    if (saving || loan?.status === 'CLOSED') return;
    if (isAfterToday(paymentForm.paymentDate)) {
      setError('Payment date cannot be in the future');
      return;
    }
    const total = Number(paymentForm.totalAmount) || 0;
    if (total <= 0) {
      setError('Amount paid must be greater than zero');
      return;
    }
    const { interestPaid, principalPaid } = splitPayment(total, interest?.interestDue ?? 0);
    const idempotencyKey = paymentIdempotencyKey.current ?? newIdempotencyKey();
    paymentIdempotencyKey.current = idempotencyKey;
    setSaving(true);
    try {
      await paymentsApi.create(
        loanId,
        {
          paymentDate: paymentForm.paymentDate,
          principalPaid,
          interestPaid,
          notes: paymentForm.notes || undefined,
        },
        idempotencyKey
      );
      paymentIdempotencyKey.current = null;
      setPaymentModal(false);
      setPaymentForm({ paymentDate: todayISO(), totalAmount: '', notes: '' });
      setPaymentListPage(1);
      load();
      paymentsApi.listPage(loanId, 1).then(setPaymentsPage);
    } catch (err) {
      setError(getApiErrorMessage(err, 'Payment failed'));
    } finally {
      setSaving(false);
    }
  }

  async function updateLoan(e: React.FormEvent) {
    e.preventDefault();
    const rateError = requirePositiveAmount(
      editForm.monthlyInterestRatePercent,
      'Monthly interest rate'
    );
    if (rateError) {
      setError(rateError);
      return;
    }
    setSaving(true);
    try {
      await loansApi.update(loanId, {
        monthlyInterestRatePercent: Number(editForm.monthlyInterestRatePercent),
        dueDate: editForm.dueDate,
      });
      setEditModal(false);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Update failed'));
    } finally {
      setSaving(false);
    }
  }

  async function downloadPdf(type: 'pledge' | 'payments') {
    setDownloading(type);
    setError('');
    try {
      if (type === 'pledge') {
        await exportApi.pledge(loanId);
      } else {
        await exportApi.pledgePayments(loanId);
      }
    } catch (err) {
      setError(getApiErrorMessage(err, 'PDF download failed'));
    } finally {
      setDownloading(null);
    }
  }

  async function closeLoan() {
    if (!confirm('Close this pledge? Customer must have settled dues and collected ornaments.')) return;
    try {
      await loansApi.close(loanId);
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Could not close pledge'));
    }
  }

  if (loading) return <Loading message="Loading pledge details…" />;
  if (!loan) {
    return (
      <ErrorAlert
        message={error || 'Pledge not found'}
        placement="inline"
        onDismiss={() => navigate('/loans')}
      />
    );
  }

  const isActive = loan.status === 'ACTIVE' || loan.status === 'OVERDUE';
  const isClosed = loan.status === 'CLOSED';
  const principalCleared = loan.outstandingPrincipal <= 0;
  const principalPaid =
    interest?.totalPrincipalPaid ??
    Math.max(0, loan.principalAmount - loan.outstandingPrincipal);

  return (
    <div className="page">
      <PageHeader
        title={loan.borrower?.name ? `Pledge — ${loan.borrower.name}` : 'Pledge'}
        subtitle={`${loan.borrower?.name} · ${loan.borrower?.mobileNumber}`}
        backTo="/loans"
        backLabel="Pledges"
        action={
          <div className="btn-group">
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!!downloading}
              onClick={() => downloadPdf('pledge')}
            >
              {downloading === 'pledge' ? 'Downloading…' : 'Pledge PDF'}
            </button>
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              disabled={!!downloading}
              onClick={() => downloadPdf('payments')}
            >
              {downloading === 'payments' ? 'Downloading…' : 'Payments PDF'}
            </button>
            {isActive && canWrite && (
              <>
                <button type="button" className="btn btn--ghost" onClick={() => setEditModal(true)}>
                  Edit terms
                </button>
                <button type="button" className="btn btn--primary" onClick={openPaymentModal}>
                  Record payment
                </button>
                {!principalCleared && (
                  <button type="button" className="btn btn--danger" onClick={closeLoan}>
                    Close pledge
                  </button>
                )}
              </>
            )}
          </div>
        }
      />

      {error && !collateralModal && !paymentModal && !editPaymentModal && !editModal && (
        <ErrorAlert message={error} onDismiss={() => setError('')} />
      )}

      <div className="detail-grid detail-grid--3">
        <section className="card">
          <h2>Loan summary</h2>
          <dl className="detail-list">
            <dt>Status</dt>
            <dd>
              <StatusBadge status={loan.status} />
            </dd>
            <dt>Principal</dt>
            <dd>{formatCurrency(loan.principalAmount)}</dd>
            <dt>Outstanding</dt>
            <dd className="text-accent">
              {formatCurrency(loan.outstandingPrincipal)}
              {principalCleared && !isClosed && (
                <span className="detail-note detail-note--inline">
                  {' '}
                  — principal cleared; record final payment or refresh to update status
                </span>
              )}
            </dd>
            <dt>Monthly rate</dt>
            <dd>{loan.monthlyInterestRatePercent}%</dd>
            <dt>Start</dt>
            <dd>{formatDate(loan.startDate)}</dd>
            <dt>Due</dt>
            <dd>{formatDate(loan.dueDate)}</dd>
            <dt>Collateral value</dt>
            <dd>{formatCurrency(loan.totalCollateralValue)}</dd>
          </dl>
          {loan.borrower && (
            <p className="mt">
              <Link to={`/borrowers/${loan.borrower.id}`} className="link">
                View customer profile →
              </Link>
            </p>
          )}
        </section>

        <section className="card card--accent">
          <h2>Interest &amp; dues</h2>
          {isClosed ? (
            <p className="detail-note">This pledge is closed. Interest and payable amounts are no longer shown.</p>
          ) : interest ? (
            <>
              <dl className="detail-list">
                <dt>As of</dt>
                <dd>{formatDate(interest.asOfDate)}</dd>
                <dt>Days elapsed</dt>
                <dd>{interest.daysElapsed}</dd>
                <dt>Accrued interest</dt>
                <dd>{formatCurrency(interest.accruedInterest)}</dd>
                {(interest.siAccruedInterest ?? 0) > 0 && (interest.ciAccruedInterest ?? 0) > 0 && (
                  <>
                    <dt className="detail-list__sub">↳ SI portion</dt>
                    <dd className="detail-list__sub">{formatCurrency(interest.siAccruedInterest)}</dd>
                    <dt className="detail-list__sub">↳ CI portion</dt>
                    <dd className="detail-list__sub">{formatCurrency(interest.ciAccruedInterest)}</dd>
                  </>
                )}
                <dt>Interest paid</dt>
                <dd>{formatCurrency(interest.totalInterestPaid)}</dd>
                <dt>Interest due</dt>
                <dd className="text-warn">{formatCurrency(interest.interestDue)}</dd>
                <dt>Total payable</dt>
                <dd className="text-accent text-lg">{formatCurrency(interest.totalPayable)}</dd>
              </dl>
              {(interest.principalSegmentCount ?? 1) > 1 && (
                <p className="detail-note">
                  Interest calculated across {interest.principalSegmentCount} segments —
                  principal was reduced {(interest.principalSegmentCount ?? 1) - 1}× during this loan.
                </p>
              )}
              <div className="inline-form mt">
                <DateInput
                  className="input input--sm"
                  value={interestAsOf}
                  onChange={setInterestAsOf}
                />
                <button
                  type="button"
                  className="btn btn--ghost btn--sm"
                  onClick={() => refreshInterest(interestAsOf)}
                >
                  Recalculate
                </button>
              </div>
            </>
          ) : (
            <p>—</p>
          )}
        </section>

        <section className="card">
          <h2>Quick totals</h2>
          <dl className="detail-list">
            <dt>Principal paid</dt>
            <dd>{formatCurrency(principalPaid)}</dd>
            <dt>Payments recorded</dt>
            <dd>{paymentsPage?.totalElements ?? 0}</dd>
            <dt>Pledged items</dt>
            <dd>{collateral.length}</dd>
          </dl>
        </section>
      </div>

      {interest && !isClosed && (
        <section className="card card--wide">
          <div className="card-header">
            <h2>Interest calculation breakdown</h2>
            <div className="breakdown-view-toggle">
              <button
                type="button"
                className={`filter-tab${breakdownView === 'summary' ? ' filter-tab--active' : ''}`}
                onClick={() => setBreakdownView('summary')}
              >
                Full breakdown
              </button>
              <button
                type="button"
                className={`filter-tab${breakdownView === 'table' ? ' filter-tab--active' : ''}`}
                onClick={() => setBreakdownView('table')}
              >
                Table list
              </button>
            </div>
          </div>
          <InterestBreakdownPanel interest={interest} view={breakdownView} />
        </section>
      )}

      <section className="card">
        <div className="card-header">
          <h2>Pledged ornaments &amp; items</h2>
          {isActive && canWrite && (
            <button type="button" className="btn btn--primary btn--sm" onClick={openAddCollateral}>
              + Add item
            </button>
          )}
        </div>
        {collateral.length === 0 ? (
          <p className="empty">
            No collateral recorded. Add gold chains, bangles, rings, silver items, etc.
          </p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Description</th>
                  <th>Weight</th>
                  <th>Qty</th>
                  <th>Value</th>
                  {isActive && canWrite && <th></th>}
                </tr>
              </thead>
              <tbody>
                {collateral.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <span className={`item-type item-type--${item.itemType.toLowerCase()}`}>
                        {ITEM_TYPE_LABELS[item.itemType]}
                      </span>
                    </td>
                    <td>{item.description}</td>
                    <td>
                      {item.weight != null
                        ? `${item.weight} ${item.weightUnit ? WEIGHT_UNIT_LABELS[item.weightUnit] : ''}`
                        : '—'}
                    </td>
                    <td>{item.quantity ?? '—'}</td>
                    <td>{formatCurrency(item.estimatedValue)}</td>
                    {isActive && canWrite && (
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="btn btn--ghost btn--sm"
                          onClick={() => openEditCollateral(item)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="btn btn--danger btn--sm"
                          onClick={() => deleteCollateral(item.id)}
                        >
                          Remove
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="card">
        <div className="card-header">
          <h2>Payment history</h2>
          {isActive && canWrite && (
            <button type="button" className="btn btn--primary btn--sm" onClick={openPaymentModal}>
              + Payment
            </button>
          )}
        </div>
        {paymentsLoading && !paymentsPage ? (
          <p className="empty">Loading payments…</p>
        ) : !paymentsPage || paymentsPage.totalElements === 0 ? (
          <p className="empty">No payments recorded yet.</p>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Principal</th>
                  <th>Interest</th>
                  <th>Total</th>
                  <th>Outstanding after</th>
                  <th>Notes</th>
                  <th>Status</th>
                  {isActive && canWrite && <th>Actions</th>}
                </tr>
              </thead>
              <tbody>
                {paymentsPage.content.map((p) => {
                  const confirmed = isPaymentConfirmed(p);
                  return (
                  <tr key={p.id}>
                    <td>{formatDate(p.paymentDate)}</td>
                    <td>{formatCurrency(p.principalPaid)}</td>
                    <td>{formatCurrency(p.interestPaid)}</td>
                    <td>{formatCurrency(p.totalPaid)}</td>
                    <td>{formatCurrency(p.outstandingPrincipalAfter)}</td>
                    <td>{p.notes || '—'}</td>
                    <td>
                      {confirmed ? (
                        <span className="payment-status payment-status--confirmed" title={p.confirmedAt ? `Confirmed on ${formatDate(p.confirmedAt)}` : 'Confirmed'}>
                          ✓ Confirmed
                        </span>
                      ) : (
                        <span className="payment-status payment-status--draft">
                          Draft
                        </span>
                      )}
                    </td>
                    {isActive && canWrite && (
                      <td className="cell-actions">
                        {confirmed ? (
                          <span className="text-muted">—</span>
                        ) : (
                          <>
                            <button
                              type="button"
                              className="btn btn--ghost btn--sm"
                              onClick={() => openEditPayment(p)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="btn btn--primary btn--sm"
                              onClick={() => handleConfirmPayment(p)}
                            >
                              Confirm
                            </button>
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                  );
                })}
              </tbody>
            </table>
            <Pagination
              page={paymentsPage.page}
              totalPages={paymentsPage.totalPages}
              totalElements={paymentsPage.totalElements}
              pageSize={paymentsPage.size}
              loading={paymentsLoading}
              onPageChange={setPaymentListPage}
            />
          </div>
        )}
      </section>

      <Modal
        title={editingItem ? 'Edit pledged item' : 'Add pledged item'}
        open={collateralModal}
        onClose={() => setCollateralModal(false)}
        wide
        error={collateralModal ? error : undefined}
        onDismissError={() => setError('')}
      >
        <form className="form form--grid" onSubmit={saveCollateral}>
          <label>
            Item type
            <select
              className="input"
              value={collateralForm.itemType}
              onChange={(e) =>
                setCollateralForm({ ...collateralForm, itemType: e.target.value as ItemType })
              }
            >
              {ITEM_TYPES.map((t) => (
                <option key={t} value={t}>
                  {ITEM_TYPE_LABELS[t]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Estimated value (₹)
            <NumericInput
              required
              value={collateralForm.estimatedValue || ''}
              onChange={(e) =>
                setCollateralForm({ ...collateralForm, estimatedValue: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="span-2">
            Description (e.g. 22K gold chain, 4 bangles)
            <input
              className="input"
              required
              value={collateralForm.description}
              onChange={(e) => setCollateralForm({ ...collateralForm, description: e.target.value })}
            />
          </label>
          <label>
            Weight
            <NumericInput
              value={collateralForm.weight ?? ''}
              onChange={(e) =>
                setCollateralForm({
                  ...collateralForm,
                  weight: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </label>
          <label>
            Unit
            <select
              className="input"
              value={collateralForm.weightUnit ?? 'GRAM'}
              onChange={(e) =>
                setCollateralForm({
                  ...collateralForm,
                  weightUnit: e.target.value as WeightUnit,
                })
              }
            >
              {WEIGHT_UNITS.map((u) => (
                <option key={u} value={u}>
                  {WEIGHT_UNIT_LABELS[u]}
                </option>
              ))}
            </select>
          </label>
          <label>
            Quantity (pieces)
            <NumericInput
              integer
              value={collateralForm.quantity ?? ''}
              onChange={(e) =>
                setCollateralForm({
                  ...collateralForm,
                  quantity: e.target.value ? Number(e.target.value) : undefined,
                })
              }
            />
          </label>
          <div className="form-actions span-2">
            <button type="button" className="btn btn--ghost" onClick={() => setCollateralModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save item'}
            </button>
          </div>
        </form>
      </Modal>

      <Modal
        title="Record payment"
        open={paymentModal}
        onClose={closePaymentModal}
        error={paymentModal ? error : undefined}
        onDismissError={() => setError('')}
      >
        {(() => {
          const total = Number(paymentForm.totalAmount) || 0;
          const interestDue = interest?.interestDue ?? 0;
          const { interestPaid, principalPaid } = splitPayment(total, interestDue);
          const hasAmount = total > 0;
          return (
            <form className="form" onSubmit={recordPayment}>
              <p className="form-hint">
                When outstanding principal reaches zero, this pledge closes automatically.
              </p>
              <fieldset disabled={saving} className="form-fieldset">
                <label>
                  Payment date
                  <DateInput
                    value={paymentForm.paymentDate}
                    max={todayISO()}
                    onChange={(paymentDate) => setPaymentForm({ ...paymentForm, paymentDate })}
                  />
                </label>
                <label>
                  Amount paid (₹)
                  <NumericInput
                    required
                    value={paymentForm.totalAmount}
                    onChange={(e) => setPaymentForm({ ...paymentForm, totalAmount: e.target.value })}
                  />
                </label>

                {hasAmount && (
                  <div className="payment-split">
                    <p className="payment-split__heading">How this amount is applied</p>
                    <div className="payment-split__row">
                      <span className="payment-split__label">Interest cleared</span>
                      <span className="payment-split__value payment-split__value--interest">
                        {formatCurrency(interestPaid)}
                      </span>
                    </div>
                    <div className="payment-split__row">
                      <span className="payment-split__label">Principal reduced</span>
                      <span className="payment-split__value payment-split__value--principal">
                        {formatCurrency(principalPaid)}
                      </span>
                    </div>
                    <div className="payment-split__row payment-split__row--total">
                      <span className="payment-split__label">Total</span>
                      <span className="payment-split__value">{formatCurrency(total)}</span>
                    </div>
                    {interestDue > 0 && total > 0 && interestPaid < interestDue && (
                      <p className="payment-split__note">
                        ₹{formatCurrency(interestDue - interestPaid)} interest still outstanding after this payment.
                      </p>
                    )}
                    {interestDue > 0 && interestPaid >= interestDue && (
                      <p className="payment-split__note payment-split__note--ok">
                        All outstanding interest cleared.
                      </p>
                    )}
                  </div>
                )}

                <label>
                  Notes
                  <input
                    className="input"
                    value={paymentForm.notes}
                    onChange={(e) => setPaymentForm({ ...paymentForm, notes: e.target.value })}
                  />
                </label>
              </fieldset>
              <div className="form-actions">
                <button type="button" className="btn btn--ghost" onClick={closePaymentModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving} aria-busy={saving}>
                  {saving ? 'Recording…' : 'Record'}
                </button>
              </div>
            </form>
          );
        })()}
      </Modal>

      <Modal
        title="Edit payment"
        open={editPaymentModal}
        onClose={closeEditPaymentModal}
        error={editPaymentModal ? error : undefined}
        onDismissError={() => setError('')}
      >
        {(() => {
          const total = Number(editPaymentForm.totalAmount) || 0;
          const interestDue = interest?.interestDue ?? 0;
          const { interestPaid, principalPaid } = splitPayment(total, interestDue);
          const hasAmount = total > 0;
          return (
            <form className="form" onSubmit={saveEditPayment}>
              <fieldset disabled={saving} className="form-fieldset">
                <label>
                  Payment date
                  <DateInput
                    value={editPaymentForm.paymentDate}
                    max={todayISO()}
                    onChange={(paymentDate) => setEditPaymentForm({ ...editPaymentForm, paymentDate })}
                  />
                </label>
                <label>
                  Amount paid (₹)
                  <NumericInput
                    required
                    value={editPaymentForm.totalAmount}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, totalAmount: e.target.value })}
                  />
                </label>

                {hasAmount && (
                  <div className="payment-split">
                    <p className="payment-split__heading">How this amount is applied</p>
                    <div className="payment-split__row">
                      <span className="payment-split__label">Interest cleared</span>
                      <span className="payment-split__value payment-split__value--interest">
                        {formatCurrency(interestPaid)}
                      </span>
                    </div>
                    <div className="payment-split__row">
                      <span className="payment-split__label">Principal reduced</span>
                      <span className="payment-split__value payment-split__value--principal">
                        {formatCurrency(principalPaid)}
                      </span>
                    </div>
                    <div className="payment-split__row payment-split__row--total">
                      <span className="payment-split__label">Total</span>
                      <span className="payment-split__value">{formatCurrency(total)}</span>
                    </div>
                  </div>
                )}

                <label>
                  Notes
                  <input
                    className="input"
                    value={editPaymentForm.notes}
                    onChange={(e) => setEditPaymentForm({ ...editPaymentForm, notes: e.target.value })}
                  />
                </label>
              </fieldset>
              <div className="form-actions">
                <button type="button" className="btn btn--ghost" onClick={closeEditPaymentModal} disabled={saving}>
                  Cancel
                </button>
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          );
        })()}
      </Modal>

      <Modal
        title="Edit pledge terms"
        open={editModal}
        onClose={() => setEditModal(false)}
        error={editModal ? error : undefined}
        onDismissError={() => setError('')}
      >
        <form className="form" onSubmit={updateLoan}>
          <label>
            Monthly interest (%)
            <NumericInput
              required
              value={editForm.monthlyInterestRatePercent}
              onChange={(e) =>
                setEditForm({ ...editForm, monthlyInterestRatePercent: e.target.value })
              }
            />
          </label>
          <label>
            Due date
            <DateInput
              required
              value={editForm.dueDate}
              onChange={(dueDate) => setEditForm({ ...editForm, dueDate })}
            />
          </label>
          <div className="form-actions">
            <button type="button" className="btn btn--ghost" onClick={() => setEditModal(false)}>
              Cancel
            </button>
            <button type="submit" className="btn btn--primary" disabled={saving}>
              {saving ? 'Saving…' : 'Update'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
