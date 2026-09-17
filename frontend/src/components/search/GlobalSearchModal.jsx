import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiOutlineSparkles, 
  HiOutlineScale, 
  HiOutlineClipboardCheck, 
  HiOutlineDocumentText,
  HiX 
} from 'react-icons/hi';
import OmniSearchBar from './OmniSearchBar';
import './GlobalSearchModal.css';

const QUICK_CATEGORIES = [
  { key: 'HEALTH', label: 'Health', icon: '🏥', desc: 'Cashless, Critical Illness, Mediclaim' },
  { key: 'LIFE', label: 'Life', icon: '🛡️', desc: 'Term Life, 1Cr Cover, Family Protection' },
  { key: 'MOTOR', label: 'Motor', icon: '🚗', desc: 'Zero Dep, Car & Bike, Roadside Assistance' },
  { key: 'TRAVEL', label: 'Travel', icon: '✈️', desc: 'Schengen, Overseas Medical, Flight Delay' },
  { key: 'HOME', label: 'Home', icon: '🏠', desc: 'Burglary, Fire, Tenant & Property' },
];

const QUICK_ACTIONS = [
  { title: 'Ask Smart Advisor', icon: <HiOutlineSparkles className="text-amber-500" />, path: '/smart-advisor', desc: 'AI-guided plan recommendations' },
  { title: 'Compare Policies', icon: <HiOutlineScale className="text-primary" />, path: '/compare', desc: 'Side-by-side coverage matrix' },
  { title: 'Submit a Claim', icon: <HiOutlineClipboardCheck className="text-emerald-500" />, path: '/claims/new', desc: 'Instant cashless claim filing' },
  { title: 'My Proposals', icon: <HiOutlineDocumentText className="text-blue-500" />, path: '/proposals', desc: 'View locked quotes & proposals' },
];

export default function GlobalSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const overlayRef = useRef(null);

  // Global Ctrl + K listener
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) {
          onClose();
        } else {
          // Open handled by caller or state
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSelectCategory = (catKey) => {
    onClose();
    navigate(`/search?category=${catKey}`);
  };

  const handleSelectAction = (path) => {
    onClose();
    navigate(path);
  };

  const handleSelectPolicy = (policy) => {
    onClose();
    navigate(`/catalog/${policy.id}`);
  };

  const handleSearchSubmit = (query, categoryFilter) => {
    onClose();
    let url = `/search?q=${encodeURIComponent(query || '')}`;
    if (categoryFilter) {
      url += `&category=${encodeURIComponent(categoryFilter)}`;
    }
    navigate(url);
  };

  return (
    <div 
      className="global-search-overlay" 
      ref={overlayRef}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      <div className="global-search-modal" role="dialog" aria-modal="true">
        {/* Search Header */}
        <div className="global-search-header">
          <OmniSearchBar 
            variant="modal"
            autoFocus={true}
            placeholder="Type a policy name, condition, or question (e.g., 'mediclaim under 15k')..."
            onSearchSubmit={handleSearchSubmit}
            onSelectPolicy={handleSelectPolicy}
            onClose={onClose}
          />
        </div>

        {/* Modal Body: Quick Shortcuts */}
        <div className="global-search-body">
          {/* Quick Categories */}
          <div className="global-search-section">
            <h4 className="global-section-title">Explore by Insurance Category</h4>
            <div className="global-cat-grid">
              {QUICK_CATEGORIES.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className="global-cat-card"
                  onClick={() => handleSelectCategory(cat.key)}
                >
                  <span className="global-cat-icon">{cat.icon}</span>
                  <div className="global-cat-info">
                    <span className="global-cat-name">{cat.label}</span>
                    <span className="global-cat-desc">{cat.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Quick Platform Actions */}
          <div className="global-search-section">
            <h4 className="global-section-title">Quick Actions & Tools</h4>
            <div className="global-actions-grid">
              {QUICK_ACTIONS.map((act, i) => (
                <button
                  key={i}
                  type="button"
                  className="global-action-card"
                  onClick={() => handleSelectAction(act.path)}
                >
                  <span className="global-action-icon">{act.icon}</span>
                  <div className="global-action-info">
                    <span className="global-action-title">{act.title}</span>
                    <span className="global-action-desc">{act.desc}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="global-search-footer">
          <div className="global-footer-tips">
            <span><kbd>Ctrl</kbd> + <kbd>K</kbd> to toggle</span>
            <span><kbd>ESC</kbd> to close</span>
            <span><kbd>↵</kbd> to execute</span>
          </div>
          <div className="global-footer-branding">
            PolicySphere OmniSearch Engine
          </div>
        </div>
      </div>
    </div>
  );
}
