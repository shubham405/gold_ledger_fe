import { Link, Outlet, useLocation } from 'react-router-dom';
import { ThemeToggle } from './ThemeToggle';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';
  const isRegister = pathname.startsWith('/register');
  const isForgotOrReset =
    pathname === '/forgot-password' || pathname === '/reset-password';

  return (
    <div className="auth-page auth-page--fixed">
      <div className="auth-page-toolbar">
        <ThemeToggle className="theme-toggle--auth-page" />
      </div>
      <div className="auth-panel">
        <div className="auth-brand auth-brand--compact">
          <span className="brand-icon" aria-hidden>
            ◆
          </span>
          <div>
            <h1>MyLedger</h1>
            <p>Jewelry pledge manager</p>
          </div>
        </div>
        <div className="auth-divider" aria-hidden />
        <div className="auth-body">
          <Outlet />
        </div>
        <p className="auth-footer">
          {isLogin ? (
            <>
              New to MyLedger?{' '}
              <Link to="/register" className="link">
                Register your shop
              </Link>
            </>
          ) : isRegister ? (
            <>
              Already registered?{' '}
              <Link to="/login" className="link">
                Sign in
              </Link>
            </>
          ) : isForgotOrReset ? (
            <>
              Remember your password?{' '}
              <Link to="/login" className="link">
                Sign in
              </Link>
            </>
          ) : null}
        </p>
      </div>
    </div>
  );
}
