import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/authStorage';
import { Loading } from './Loading';

/** Unknown URLs: send guests to login, signed-in users to dashboard. */
export function RootRedirect() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Checking session…" />;
  }

  if (user && getToken()) {
    return <Navigate to="/" replace />;
  }

  return <Navigate to="/login" replace />;
}
