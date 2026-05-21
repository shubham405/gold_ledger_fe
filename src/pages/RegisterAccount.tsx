import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { useAuth } from '../context/AuthContext';
import {
  clearRegisterDraft,
  getRegisterDraft,
  type RegisterDraft,
} from '../lib/registerDraft';

export function RegisterAccount() {
  const draft = getRegisterDraft();
  if (!draft) {
    return <Navigate to="/register" replace />;
  }
  return <RegisterAccountForm draft={draft} />;
}

function RegisterAccountForm({ draft }: { draft: RegisterDraft }) {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await register({
        email,
        password,
        shopName: draft.shopName,
        ownerName: draft.ownerName,
        phone: draft.phone,
      });
      clearRegisterDraft();
      navigate('/', { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-step-header">
        <span className="auth-step-badge">Step 2 of 2</span>
        <h2>Your account</h2>
        <p className="auth-subtitle">
          Signing up as <strong>{draft.shopName}</strong>
        </p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <form className="form auth-form auth-form--compact" onSubmit={handleSubmit}>
        <label>
          Email
          <input
            className="input"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm password
          <input
            className="input"
            type="password"
            autoComplete="new-password"
            required
            minLength={8}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <div className="auth-form-actions">
          <Link to="/register" className="btn btn--ghost">
            Back
          </Link>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? 'Creating…' : 'Create account'}
          </button>
        </div>
      </form>
    </div>
  );
}
