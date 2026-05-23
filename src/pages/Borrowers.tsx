import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { borrowersApi } from '../api/borrowers';
import { exportApi } from '../api/export';
import { useAuth } from '../context/AuthContext';
import { ErrorAlert } from '../components/ErrorAlert';
import { Loading } from '../components/Loading';
import { Modal } from '../components/Modal';
import { PageHeader } from '../components/PageHeader';
import { Pagination } from '../components/Pagination';
import { getApiErrorMessage } from '../lib/apiError';
import { rowSerialNumber } from '../lib/rowSerial';
import {
  AADHAAR_DIGITS,
  formatAadhaarInput,
  formatPanInput,
  normalizeAadhaar,
  normalizePan,
  PAN_LENGTH,
  validateBorrowerIdentity,
} from '../lib/identityValidation';
import type { Borrower, BorrowerRequest, PageResponse } from '../types';

const PAGE_SIZE = 20;

const emptyForm: BorrowerRequest = {
  name: '',
  fathersName: '',
  address: '',
  mobileNumber: '',
  aadhaarNumber: '',
  panNumber: '',
};

export function Borrowers() {
  const { canWrite } = useAuth();
  const [pageData, setPageData] = useState<PageResponse<Borrower> | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [page, setPage] = useState(1);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Borrower | null>(null);
  const [form, setForm] = useState<BorrowerRequest>(emptyForm);
  const [formStep, setFormStep] = useState(1);
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const timer = window.setTimeout(() => setSearchDebounced(search), 300);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    setPage(1);
  }, [searchDebounced]);

  const load = useCallback(() => {
    setLoading(true);
    const isSearching = searchDebounced.trim().length > 0;
    borrowersApi
      .listPage({
        page,
        size: isSearching ? 1000 : PAGE_SIZE,
        search: searchDebounced,
        withLoansOnly: false,
      })
      .then(setPageData)
      .catch((e) => setError(getApiErrorMessage(e)))
      .finally(() => setLoading(false));
  }, [page, searchDebounced]);

  useEffect(() => {
    load();
  }, [load]);

  const borrowers = pageData?.content ?? [];

  function closeModal() {
    if (saving) return;
    setModalOpen(false);
    setFormStep(1);
  }

  function openCreate() {
    setEditing(null);
    setForm(emptyForm);
    setError('');
    setFormStep(1);
    setModalOpen(true);
  }

  function openEdit(b: Borrower) {
    setError('');
    setEditing(b);
    setForm({
      name: b.name,
      fathersName: b.fathersName,
      address: b.address,
      mobileNumber: b.mobileNumber,
      aadhaarNumber: b.aadhaarNumber ?? '',
      panNumber: b.panNumber ?? '',
    });
    setFormStep(1);
    setModalOpen(true);
  }

  function advanceFormStep() {
    const formEl = formRef.current;
    if (!formEl) return;
    const inputs = formEl.querySelectorAll<HTMLInputElement | HTMLTextAreaElement>(
      '[data-form-step="1"]'
    );
    for (const input of inputs) {
      if (!input.checkValidity()) {
        input.reportValidity();
        return;
      }
    }
    setError('');
    setFormStep(2);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (formStep !== 2) return;
    const identityError = validateBorrowerIdentity(form.aadhaarNumber, form.panNumber);
    if (identityError) {
      setError(identityError);
      return;
    }
    setSaving(true);
    setError('');
    const payload: BorrowerRequest = {
      ...form,
      aadhaarNumber: normalizeAadhaar(form.aadhaarNumber) || undefined,
      panNumber: normalizePan(form.panNumber) || undefined,
    };
    try {
      if (editing) {
        await borrowersApi.update(editing.id, payload);
      } else {
        await borrowersApi.create(payload);
        setPage(1);
      }
      closeModal();
      load();
    } catch (err) {
      setError(getApiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <PageHeader
        title="Customers"
        subtitle="People who pledge gold, silver, and ornaments"
        action={
          canWrite ? (
            <button type="button" className="btn btn--primary" onClick={openCreate}>
              + New customer
            </button>
          ) : undefined
        }
      />

      {error && !modalOpen && (
        <ErrorAlert message={error} onDismiss={() => setError('')} />
      )}

      <div className="toolbar toolbar--split">
        <input
          type="search"
          className="input input--search"
          placeholder="Search by name, father’s name, or mobile…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button
          type="button"
          className="btn btn--ghost btn--sm"
          disabled={exporting || loading}
          onClick={async () => {
            setExporting(true);
            setError('');
            try {
              await exportApi.allCustomers();
            } catch (err) {
              setError(getApiErrorMessage(err, 'PDF download failed'));
            } finally {
              setExporting(false);
            }
          }}
        >
          {exporting ? 'Downloading…' : 'Download customers PDF'}
        </button>
      </div>

      {loading ? (
        <Loading />
      ) : borrowers.length === 0 ? (
        <p className="empty">
          {searchDebounced.trim() ? `No customers match "${searchDebounced.trim()}".` : 'No customers found.'}
        </p>
      ) : (
        <div className="table-wrap card">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Father’s name</th>
                <th>Mobile</th>
                <th>Address</th>
                <th>Pledges</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {borrowers.map((b, index) => (
                <tr key={b.id}>
                  <td className="cell-serial">
                    {rowSerialNumber(index, { page, pageSize: PAGE_SIZE })}
                  </td>
                  <td>
                    <Link to={`/borrowers/${b.id}`} className="link link--strong">
                      {b.name}
                    </Link>
                  </td>
                  <td>{b.fathersName}</td>
                  <td>{b.mobileNumber}</td>
                  <td className="cell-truncate">{b.address}</td>
                  <td>{b.loanCount}</td>
                  <td className="cell-actions">
                    {canWrite && (
                      <button
                        type="button"
                        className="btn btn--ghost btn--sm"
                        onClick={() => openEdit(b)}
                      >
                        Edit
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {pageData && !searchDebounced.trim() && (
            <Pagination
              page={pageData.page}
              totalPages={pageData.totalPages}
              totalElements={pageData.totalElements}
              pageSize={pageData.size}
              loading={loading}
              onPageChange={setPage}
            />
          )}
        </div>
      )}

      <Modal
        title={editing ? 'Edit customer' : 'New customer'}
        open={modalOpen}
        onClose={closeModal}
        error={modalOpen ? error : undefined}
        onDismissError={() => setError('')}
      >
        <form ref={formRef} className="form form--borrower" onSubmit={handleSubmit}>
          <nav className="form-steps" aria-label="Form progress">
            <span
              className={`form-steps__item${formStep === 1 ? ' form-steps__item--active' : ' form-steps__item--done'}`}
            >
              1. Personal
            </span>
            <span className="form-steps__divider" aria-hidden />
            <span
              className={`form-steps__item${formStep === 2 ? ' form-steps__item--active' : ''}`}
            >
              2. Address &amp; ID
            </span>
          </nav>

          <fieldset
            disabled={saving}
            className={`form-section${formStep !== 1 ? ' form-step-panel--hidden' : ''}`}
            aria-hidden={formStep !== 1}
          >
              <legend className="form-section__legend">Personal details</legend>
              <label>
                Full name
                <input
                  className="input"
                  required
                  data-form-step="1"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                />
              </label>
              <label>
                Father’s / husband’s name
                <input
                  className="input"
                  required
                  data-form-step="1"
                  value={form.fathersName}
                  onChange={(e) => setForm({ ...form, fathersName: e.target.value })}
                />
              </label>
              <label>
                Mobile (10 digits)
                <input
                  className="input"
                  required
                  data-form-step="1"
                  pattern="[0-9]{10}"
                  maxLength={10}
                  inputMode="numeric"
                  value={form.mobileNumber}
                  onChange={(e) => setForm({ ...form, mobileNumber: e.target.value })}
                />
              </label>
            </fieldset>

            <fieldset
              disabled={saving}
              className={`form-section${formStep !== 2 ? ' form-step-panel--hidden' : ''}`}
              aria-hidden={formStep !== 2}
            >
              <legend className="form-section__legend">Address &amp; ID proof</legend>
              <p className="form-hint">Provide at least one of Aadhaar or PAN (both optional individually).</p>
              <label>
                Address
                <textarea
                  className="input"
                  required
                  data-form-step="2"
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </label>
              <div className="form__id-row">
                <label>
                  Aadhaar number
                  <input
                    className="input"
                    data-form-step="2"
                    inputMode="numeric"
                    autoComplete="off"
                    minLength={AADHAAR_DIGITS}
                    maxLength={AADHAAR_DIGITS}
                    pattern="[0-9]{12}"
                    title="Exactly 12 digits"
                    placeholder="12 digits"
                    value={form.aadhaarNumber ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, aadhaarNumber: formatAadhaarInput(e.target.value) })
                    }
                  />
                </label>
                <label>
                  PAN
                  <input
                    className="input"
                    data-form-step="2"
                    autoComplete="off"
                    minLength={PAN_LENGTH}
                    maxLength={PAN_LENGTH}
                    pattern="[A-Za-z]{5}[0-9]{4}[A-Za-z]"
                    title="Exactly 10 characters (e.g. ABCDE1234F)"
                    placeholder="ABCDE1234F"
                    value={form.panNumber ?? ''}
                    onChange={(e) =>
                      setForm({ ...form, panNumber: formatPanInput(e.target.value) })
                    }
                  />
                </label>
              </div>
            </fieldset>

          <div className={`form-actions${formStep === 2 ? ' form-actions--split' : ''}`}>
            {formStep === 2 && (
              <button
                type="button"
                className="btn btn--ghost"
                onClick={() => {
                  setFormStep(1);
                  setError('');
                }}
                disabled={saving}
              >
                Back
              </button>
            )}
            <div className="form-actions__trailing">
              <button type="button" className="btn btn--ghost" onClick={closeModal} disabled={saving}>
                Cancel
              </button>
              {formStep === 1 ? (
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={advanceFormStep}
                  disabled={saving}
                >
                  Next
                </button>
              ) : (
                <button type="submit" className="btn btn--primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Update' : 'Create'}
                </button>
              )}
            </div>
          </div>
        </form>
      </Modal>
    </div>
  );
}
