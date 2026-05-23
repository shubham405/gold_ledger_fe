import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { authApi } from '../api/auth';
import {
  EMAIL_INVALID_MESSAGE,
  EMAIL_MAX_LENGTH,
  EMAIL_PATTERN_SOURCE,
  normalizeEmail,
  validateEmail,
} from '../lib/emailValidation';

export function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
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
      await authApi.forgotPassword(normalizeEmail(email));
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (submitted) {
    return (
      <div className="auth-form-wrap">
        <div className="auth-step-header">
          <h2>Check your email</h2>
          <p className="auth-subtitle">
            If an account exists for <strong>{normalizeEmail(email)}</strong>, a password reset link
            has been sent. Check your inbox and follow the link to reset your password.
          </p>
        </div>
        <p className="auth-footer-inline">
          <Link to="/login" className="link">
            Back to sign in
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-step-header">
        <h2>Forgot password?</h2>
        <p className="auth-subtitle">
          Enter your account email and we'll send you a link to reset your password.
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
        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {saving ? 'Sending…' : 'Send reset link'}
        </button>
      </form>

      <p className="auth-footer-inline">
        <Link to="/login" className="link">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
