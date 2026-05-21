import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getToken } from '../lib/authStorage';
import { Loading } from './Loading';

function isAuthenticated(user: ReturnType<typeof useAuth>['user']): boolean {
  return Boolean(user && getToken());
}

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading message="Checking session…" />;
  }

  if (!isAuthenticated(user)) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: location.pathname + location.search }}
      />
    );
  }

  return children;
}
