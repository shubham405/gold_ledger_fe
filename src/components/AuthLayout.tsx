import { Link, Outlet, useLocation } from 'react-router-dom';

export function AuthLayout() {
  const { pathname } = useLocation();
  const isLogin = pathname === '/login';
  const isRegister = pathname.startsWith('/register');

  return (
    <div className="auth-page auth-page--fixed">
      <div className="auth-panel">
        <div className="auth-brand auth-brand--compact">
          <span className="brand-icon" aria-hidden>
            ◆
          </span>
          <div>
            <h1>GoldLedger</h1>
            <p>Jewelry pledge manager</p>
          </div>
        </div>
        <div className="auth-body">
          <Outlet />
        </div>
        <p className="auth-footer">
          {isLogin ? (
            <>
              New to GoldLedger?{' '}
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
          ) : null}
        </p>
      </div>
    </div>
  );
}
