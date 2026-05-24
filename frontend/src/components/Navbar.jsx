import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navbar.css';

const NAV_LINKS = [
  { to: '/',          label: '🏠 Home' },
  { to: '/explore',   label: '🌌 Explore' },
  { to: '/habitable', label: '🌿 Life Zones' },
  { to: '/timeline',  label: '📅 Discoveries' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const [open, setOpen] = useState(false);

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-logo">
        <span className="logo-icon">✦</span>
        <span className="logo-text">EXOSky</span>
      </Link>

      <button className="navbar-burger" onClick={() => setOpen(o => !o)} aria-label="Menu">
        <span /><span /><span />
      </button>

      <ul className={`navbar-links ${open ? 'open' : ''}`}>
        {NAV_LINKS.map(({ to, label }) => (
          <li key={to}>
            <Link
              to={to}
              className={`navbar-link ${pathname === to ? 'active' : ''}`}
              onClick={() => setOpen(false)}
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
