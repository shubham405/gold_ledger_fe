import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { PasswordInput } from '../components/PasswordInput';
import { useAuth } from '../context/AuthContext';
import {
  EMAIL_INVALID_MESSAGE,
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN_SOURCE,
  normalizeEmail,
  validateEmail,
} from '../lib/emailValidation';
import {
  clearRegisterDraft,
  getRegisterDraft,
  mergeRegisterDraft,
  type RegisterDraft,
} from '../lib/registerDraft';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN_SOURCE,
  PASSWORD_RULES_MESSAGE,
  validatePassword,
} from '../lib/passwordValidation';

export function RegisterAccount() {
  const draft = getRegisterDraft();
  if (!draft?.shopName?.trim() || !draft?.ownerName?.trim()) {
    return <Navigate to="/register" replace />;
  }
  return <RegisterAccountForm draft={draft} />;
}

function RegisterAccountForm({ draft }: { draft: RegisterDraft }) {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState(draft.email ?? '');
  const [password, setPassword] = useState(draft.password ?? '');
  const [confirmPassword, setConfirmPassword] = useState(draft.confirmPassword ?? '');

  useEffect(() => {
    mergeRegisterDraft({
      shopName: draft.shopName,
      ownerName: draft.ownerName,
      phone: draft.phone,
      email,
      password,
      confirmPassword,
    });
  }, [draft.shopName, draft.ownerName, draft.phone, email, password, confirmPassword]);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await register({
        email: normalizeEmail(email),
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
            maxLength={EMAIL_MAX_LENGTH}
            pattern={EMAIL_PATTERN_SOURCE}
            title={EMAIL_INVALID_MESSAGE}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <PasswordInput
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            pattern={PASSWORD_PATTERN_SOURCE}
            title={PASSWORD_RULES_MESSAGE}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <label>
          Confirm password
          <PasswordInput
            autoComplete="new-password"
            required
            minLength={PASSWORD_MIN_LENGTH}
            pattern={PASSWORD_PATTERN_SOURCE}
            title={PASSWORD_RULES_MESSAGE}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </label>
        <p className="auth-hint">{PASSWORD_RULES_MESSAGE}</p>
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
