import { Link, NavLink, Outlet } from 'react-router-dom';
import WalletButton from './WalletButton';

export default function Layout() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <Link to="/" className="brand">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none" aria-hidden="true">
            <path
              d="M13 2 L24 7.5 V13 C24 19 19.5 23.5 13 25 C6.5 23.5 2 19 2 13 V7.5 Z"
              stroke="var(--ink)"
              strokeWidth="1.6"
              fill="var(--amber-wash)"
            />
            <path d="M13 8.5 V14.5" stroke="var(--ink)" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="13" cy="18" r="1.15" fill="var(--ink)" />
          </svg>
          <span className="brand-word">RecallGuard</span>
        </Link>
        <nav className="app-nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            Registry
          </NavLink>
          <NavLink to="/new" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            File a claim
          </NavLink>
          <NavLink to="/docs" className={({ isActive }) => (isActive ? 'nav-active' : '')}>
            Docs
          </NavLink>
        </nav>
        <WalletButton />
      </header>
      <main className="app-main">
        <Outlet />
      </main>
      <footer className="app-footer">
        <span>Built on GenLayer · StudioNet</span>
        <span>Evidence sourced from CPSC's public recall registry</span>
      </footer>
    </div>
  );
}
