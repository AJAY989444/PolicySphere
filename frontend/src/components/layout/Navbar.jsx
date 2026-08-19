import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { HiOutlineMenu, HiOutlineX, HiUserCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="navbar" id="main-navbar">
      <div className="navbar-inner">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="navbar-logo">P</span>
          PolicySphere
        </Link>

        {/* Nav Links */}
        <ul className={`navbar-nav ${mobileOpen ? 'open' : ''}`}>
          <li>
            <NavLink
              to="/"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Home
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/catalog"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              Catalog
            </NavLink>
          </li>
          {user && (
            <>
              <li>
                <NavLink
                  to="/dashboard"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Dashboard
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/claims"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Claims
                </NavLink>
              </li>
              {(user.role === 'ADVISOR' || user.role === 'ADMIN') && (
                <li>
                  <NavLink
                    to="/advisor"
                    className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    Advisor Portal
                  </NavLink>
                </li>
              )}
            </>
          )}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <Link to="/profile" style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text)', textDecoration: 'none' }}>
                <HiUserCircle size={24} className="text-primary" />
                <span style={{ fontSize: 'var(--font-size-sm)', fontWeight: 600, cursor: 'pointer' }}>{user.firstName}</span>
              </Link>
              <button onClick={handleLogout} className="btn btn-ghost btn-sm">Log out</button>
            </div>
          ) : (
            <>
              <Link to="/login" className="btn btn-ghost btn-sm">Log in</Link>
              <Link to="/signup" className="btn btn-primary btn-sm">Get Started</Link>
            </>
          )}
          
          <button
            className="navbar-toggle"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle navigation"
          >
            {mobileOpen ? <HiOutlineX /> : <HiOutlineMenu />}
          </button>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
