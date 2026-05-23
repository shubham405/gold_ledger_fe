import { useEffect, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { PledgeGuideLink } from './PledgeGuideLink';

function getInitials(name: string | undefined): string {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

const DashboardIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M2 6.5L8 2l6 4.5V14a.5.5 0 01-.5.5H9.75V10h-3.5v4.5H2.5A.5.5 0 012 14V6.5z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
  </svg>
);

const CustomersIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.35" />
    <path
      d="M2.5 13.5c0-2.485 2.462-4.5 5.5-4.5s5.5 2.015 5.5 4.5"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinecap="round"
    />
  </svg>
);

const PledgesIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path
      d="M4 2h8a1 1 0 011 1v11l-5-3-5 3V3a1 1 0 011-1z"
      stroke="currentColor"
      strokeWidth="1.35"
      strokeLinejoin="round"
    />
  </svg>
);

const nav = [
  { to: '/', label: 'Dashboard', end: true, Icon: DashboardIcon },
  { to: '/borrowers', label: 'Customers', Icon: CustomersIcon },
  { to: '/loans', label: 'Pledges', Icon: PledgesIcon },
];

export function Layout() {
  const { user, canWrite, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const isDark = theme === 'dark';

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

  const initials = getInitials(user?.ownerName);

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
        {/* Brand */}
        <div className="brand">
          <span className="brand-icon" aria-hidden>◆</span>
          <h1>MyLedger</h1>
        </div>

        {/* User section */}
        <div className="sidebar-user-section">
          <div className="user-avatar" aria-hidden>{initials}</div>
          <div className="sidebar-user-info">
            <p className="sidebar-user-name">{user?.ownerName ?? 'User'}</p>
            <span className="plan-badge">{user?.shopName ?? 'Free Plan'}</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="nav" aria-label="Main navigation">
          {nav.map(({ to, label, end, Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `nav-link${isActive ? ' nav-link--active' : ''}`
              }
              onClick={closeMenu}
            >
              <span className="nav-link__icon"><Icon /></span>
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Spacer */}
        <div className="sidebar-spacer" />

        {/* Upgrade card — shown when account is not activated */}
        {!canWrite && (
          <div className="upgrade-card">
            <div className="upgrade-card__icon" aria-hidden>👑</div>
            <p className="upgrade-card__title">Unlock all features</p>
            <p className="upgrade-card__body">
              Activate your account to create pledges, record payments and more.
            </p>
            <PledgeGuideLink className="btn btn--primary btn--sm btn--block upgrade-card__cta" />
            <a
              href="mailto:support@myledger.in"
              className="btn btn--ghost btn--sm btn--block upgrade-card__cta"
            >
              Contact Support
            </a>
          </div>
        )}

        {/* Sidebar footer */}
        <footer className="sidebar-footer">
          <div className="sidebar-theme-row">
            <span className="sidebar-theme-label">
              <span aria-hidden>{isDark ? '☾' : '☀'}</span>
              Dark mode
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isDark}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className={`toggle-switch${isDark ? ' toggle-switch--on' : ''}`}
              onClick={toggleTheme}
            >
              <span className="toggle-switch__thumb" />
            </button>
          </div>
          <div className="sidebar-bottom-row">
            <span className="sidebar-user-name-sm">{user?.ownerName}</span>
            <button
              type="button"
              className="signout-btn"
              onClick={handleLogout}
              title="Sign out"
            >
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
                <path d="M5.5 1.5H2.5a1 1 0 00-1 1v9a1 1 0 001 1h3m3-9.5l3.5 3.5-3.5 3.5m3.5-3.5H5.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Sign out
            </button>
          </div>
        </footer>
      </aside>

      <main className="main">
        {!canWrite && (
          <div className="account-banner" role="status">
            <div className="account-banner__left">
              <span className="account-banner__dot" aria-hidden>i</span>
              <div className="account-banner__text">
                <strong>Account pending activation</strong> — you can view data only.
                <span className="account-banner__sub">
                  Contact support to enable creating pledges and recording payments.
                </span>
              </div>
            </div>
            <div className="account-banner__actions">
              <PledgeGuideLink className="btn btn--primary btn--sm account-banner__btn" />
              <a
                href="mailto:support@myledger.in"
                className="btn btn--ghost btn--sm account-banner__btn"
              >
                Contact Support
              </a>
            </div>
          </div>
        )}
        <Outlet />
      </main>
    </div>
  );
}
