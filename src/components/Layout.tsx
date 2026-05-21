import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/borrowers', label: 'Customers' },
  { to: '/loans', label: 'Pledges' },
];

export function Layout() {
  const { user, canWrite, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  function handleLogout() {
    logout();
    navigate('/login', { replace: true });
  }

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <div className="app-shell">
      <button
        type="button"
        className={`menu-toggle${menuOpen ? ' menu-toggle--open' : ''}`}
        aria-expanded={menuOpen}
        aria-controls="app-sidebar"
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
        onClick={() => setMenuOpen((open) => !open)}
      >
        <span className="menu-toggle__bar" />
        <span className="menu-toggle__bar" />
        <span className="menu-toggle__bar" />
      </button>

      {menuOpen && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      )}

      <aside
        id="app-sidebar"
        className={`sidebar${menuOpen ? ' sidebar--open' : ''}`}
      >
        <div className="brand">
          <span className="brand-icon" aria-hidden>
            ◆
          </span>
          <div>
            <h1>GoldLedger</h1>
            <p className="brand-shop">{user?.shopName ?? 'Jewelry pledge manager'}</p>
          </div>
        </div>
        <nav className="nav">
          {nav.map(({ to, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
              onClick={closeMenu}
            >
              {label}
            </NavLink>
          ))}
        </nav>
        <footer className="sidebar-footer">
          <p className="sidebar-user">{user?.ownerName}</p>
          <button type="button" className="btn btn--ghost btn--sm btn--block" onClick={handleLogout}>
            Sign out
          </button>
        </footer>
      </aside>
      <main className="main">
        {!canWrite && (
          <div className="account-banner" role="status">
            <p>
              <strong>Account pending activation</strong> — you can view data only. Contact support
              to enable creating pledges and recording payments.
            </p>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
