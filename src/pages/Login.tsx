import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ErrorAlert } from '../components/ErrorAlert';
import { getApiErrorMessage } from '../lib/apiError';
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
    setSaving(true);
    setError('');
    try {
      await login({ email, password });
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
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <label>
          Password
          <input
            className="input"
            type="password"
            autoComplete="current-password"
            required
            minLength={8}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </label>
        <button type="submit" className="btn btn--primary btn--block" disabled={saving}>
          {saving ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
