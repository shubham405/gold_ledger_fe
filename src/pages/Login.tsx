import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { PasswordInput } from '../components/PasswordInput';
import { getApiErrorMessage } from '../lib/apiError';
import {
  EMAIL_INVALID_MESSAGE,
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN_SOURCE,
  normalizeEmail,
  validateEmail,
} from '../lib/emailValidation';
import { useAuth } from '../context/AuthContext';
import { isPublicPath } from '../lib/authStorage';

export function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const requested = (location.state as { from?: string } | null)?.from;
  const from =
    requested && requested.startsWith('/') && !isPublicPath(requested) ? requested : '/';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }
    setSaving(true);
    setError('');
    try {
      await login({ email: normalizeEmail(email), password });
      navigate(from, { replace: true });
    } catch (err) {
      setError(getApiErrorMessage(err, 'Sign in failed'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-step-header">
        <h2>Sign in</h2>
        <p className="auth-subtitle">Access your shop’s pledges and customers</p>
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
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <div className="auth-forgot-row">
          <Link to="/forgot-password" className="link auth-forgot-link">
            Forgot password?
          </Link>
        </div>
        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {saving ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
