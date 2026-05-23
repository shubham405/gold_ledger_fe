import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { authApi } from '../api/auth';
import {
  PASSWORD_MIN_LENGTH,
  PASSWORD_PATTERN_SOURCE,
  PASSWORD_RULES_MESSAGE,
  validatePassword,
} from '../lib/passwordValidation';

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') ?? '';

  if (!token.trim()) {
    return (
      <div className="auth-form-wrap">
        <div className="auth-step-header">
          <h2>Invalid reset link</h2>
          <p className="auth-subtitle">
            This password reset link is missing or invalid. Please request a new one.
          </p>
        </div>
        <Link to="/forgot-password" className="btn btn--primary btn--block">
          Request a new link
        </Link>
      </div>
    );
  }

  return <ResetPasswordForm token={token} />;
}

function ResetPasswordForm({ token }: { token: string }) {
  const navigate = useNavigate();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (success) {
      const timer = setTimeout(() => navigate('/login', { replace: true }), 2000);
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
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
      await authApi.resetPassword(token, password);
      setSuccess(true);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to reset password. The link may have expired.',
      );
    } finally {
      setSaving(false);
    }
  }

  if (success) {
    return (
      <div className="auth-form-wrap">
        <div className="auth-step-header">
          <h2>Password updated</h2>
          <p className="auth-subtitle">
            Your password has been reset successfully. Redirecting you to sign in…
          </p>
        </div>
        <Link to="/login" className="link">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="auth-form-wrap">
      <div className="auth-step-header">
        <h2>Reset your password</h2>
        <p className="auth-subtitle">Enter a new password for your account.</p>
      </div>

      {error && <ErrorAlert message={error} onDismiss={() => setError('')} />}

      <form className="form auth-form auth-form--compact" onSubmit={handleSubmit}>
        <label>
          New password
          <input
            className="input"
            type="password"
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
          Confirm new password
          <input
            className="input"
            type="password"
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
        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {saving ? 'Updating…' : 'Set new password'}
        </button>
      </form>

      <p className="auth-footer-inline">
        <Link to="/forgot-password" className="link">
          Request a new link
        </Link>
      </p>
    </div>
  );
}
