import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/authStorage';
import { Loading } from './Loading';

export function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading message="Loading…" />;
  }

  if (user && getToken()) {
    return <Navigate to="/" replace />;
  }

  return children;
}
