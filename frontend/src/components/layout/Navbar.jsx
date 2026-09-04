import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HiOutlineMenu, HiOutlineX, HiUserCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api/axios';

import NotificationCenter from '../common/NotificationCenter';

function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [kycDue, setKycDue] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role !== 'ADMIN' && user.role !== 'ADVISOR') {
      api.get('/documents/my-kyc')
        .then((res) => {
          if (!res.data.isSubmitted || res.data.kyc?.status === 'NOT_SUBMITTED' || res.data.kyc?.status === 'REJECTED') {
            setKycDue(true);
          } else {
            setKycDue(false);
          }
        })
        .catch(() => setKycDue(false));
    } else {
      setKycDue(false);
    }
  }, [user]);

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
          <li>
            <NavLink
              to="/smart-advisor"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>⚡</span> Smart Advisor
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
              <li>
                <NavLink
                  to="/proposals"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Proposals
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/billing"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Billing
                </NavLink>
              </li>
              {(user.role === 'ADVISOR' || user.role === 'ADMIN') && (
                <>
                  <li>
                    <NavLink
                      to="/advisor/crm"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>💼</span> Sales CRM
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/advisor"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      Advisor Portal
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/admin/analytics"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      Analytics
                    </NavLink>
                  </li>
                </>
              )}


              {user.role === 'ADMIN' && (
                <li>
                  <NavLink
                    to="/admin"
                    className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                    onClick={() => setMobileOpen(false)}
                  >
                    Admin Panel
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
              <NotificationCenter />
              <Link 
                to="/profile" 
                title={kycDue ? "KYC Verification Due! Click to complete." : "View Profile"}
                style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)', color: 'var(--color-text)', textDecoration: 'none', position: 'relative' }}
              >
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <HiUserCircle size={26} className="text-primary" />
                  {kycDue && (
                    <span 
                      style={{
                        position: 'absolute',
                        top: '-2px',
                        right: '-2px',
                        width: '10px',
                        height: '10px',
                        backgroundColor: '#f59e0b',
                        borderRadius: '50%',
                        border: '2px solid var(--color-bg)',
                        boxShadow: '0 0 6px rgba(245, 158, 11, 0.8)'
                      }}
                    />
                  )}
                </div>
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
