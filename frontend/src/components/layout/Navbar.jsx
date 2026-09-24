import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { HiOutlineMenu, HiOutlineX, HiUserCircle, HiSearch } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api/axios';

import NotificationCenter from '../common/NotificationCenter';

function Navbar({ onOpenSearch }) {
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
          <li>
            <NavLink
              to="/search"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span style={{ fontSize: '0.9rem' }}>🔍</span> Search
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/support"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>🎧</span> Support
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/developers"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>⚡</span> Developers
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/privacy-center"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>🛡️</span> Privacy & DPDP
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/hospitals"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>🏥</span> Hospitals
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/innovations"
              className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span>🚀</span> Innovations
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
              <li>
                <NavLink
                  to="/notifications"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  Notifications
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/reports"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>📊</span> Reports & Tax
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/corporate"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>🏢</span> Corporate
                </NavLink>
              </li>
              <li>
                <NavLink
                  to="/insurer"
                  className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                  onClick={() => setMobileOpen(false)}
                >
                  <span>🏛️</span> Insurers
                </NavLink>
              </li>
              {(user.role === 'ADVISOR' || user.role === 'ADMIN') && (
                <>
                  <li>
                    <NavLink
                      to="/admin/reconciliation"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>💳</span> Payments & Refunds
                    </NavLink>
                  </li>
                  <li>
                    <NavLink
                      to="/underwriting"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>⚖️</span> Underwriting
                    </NavLink>
                  </li>
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
                      to="/admin/support"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>🎧</span> Support Desk
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
                      to="/admin"
                      className={({ isActive }) => `navbar-link ${isActive ? 'active' : ''}`}
                      onClick={() => setMobileOpen(false)}
                    >
                      <span>🛡️</span> Admin Panel
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
            </>
          )}
        </ul>

        {/* Actions */}
        <div className="navbar-actions">
          <button
            type="button"
            className="navbar-search-btn"
            onClick={onOpenSearch}
            title="Search policies, riders, synonyms (Ctrl + K)"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              padding: '6px 12px',
              background: 'var(--color-bg)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-full)',
              color: 'var(--color-text-secondary)',
              cursor: 'pointer',
              fontSize: 'var(--font-size-sm)',
              transition: 'all 0.15s ease',
            }}
          >
            <HiSearch style={{ fontSize: '1rem', color: 'var(--color-primary)' }} />
            <span className="hidden-mobile" style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>Search</span>
            <kbd style={{
              background: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: '4px',
              padding: '1px 5px',
              fontSize: '0.68rem',
              fontWeight: 600,
              color: 'var(--color-text-muted)',
              boxShadow: 'var(--shadow-sm)'
            }}>Ctrl K</kbd>
          </button>

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
