import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { HiSearch, HiFilter, HiArrowRight, HiShieldCheck } from 'react-icons/hi';
import api from '../services/api/axios';
import './CatalogPage.css';

const CATEGORIES = [
  { key: 'ALL', label: 'All Plans', icon: '🏛️' },
  { key: 'HEALTH', label: 'Health', icon: '🏥' },
  { key: 'LIFE', label: 'Life', icon: '🛡️' },
  { key: 'MOTOR', label: 'Motor', icon: '🚗' },
  { key: 'TRAVEL', label: 'Travel', icon: '✈️' },
  { key: 'HOME', label: 'Home', icon: '🏠' },
];

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'premium_asc', label: 'Premium: Low to High' },
  { value: 'premium_desc', label: 'Premium: High to Low' },
  { value: 'coverage_desc', label: 'Coverage: High to Low' },
];

function CatalogPage() {
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  useEffect(() => {
    fetchPolicies();
  }, [activeCategory, sortBy]);

  const fetchPolicies = async () => {
    setLoading(true);
    try {
      const params = {};
      if (activeCategory !== 'ALL') params.category = activeCategory;
      if (searchQuery) params.search = searchQuery;

      if (sortBy === 'premium_asc') {
        params.sortBy = 'premium';
        params.order = 'asc';
      } else if (sortBy === 'premium_desc') {
        params.sortBy = 'premium';
        params.order = 'desc';
      } else if (sortBy === 'coverage_desc') {
        params.sortBy = 'coverage';
        params.order = 'desc';
      }

      const res = await api.get('/policies', { params });
      setPolicies(res.data.policies);
    } catch (err) {
      console.error('Failed to load policies:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPolicies();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryColor = (category) => {
    const colors = {
      HEALTH: '#10b981',
      LIFE: '#6366f1',
      MOTOR: '#f59e0b',
      TRAVEL: '#06b6d4',
      HOME: '#ec4899',
    };
    return colors[category] || '#6366f1';
  };

  return (
    <div className="catalog-page">
      {/* Hero Banner */}
      <section className="catalog-hero">
        <div className="container">
          <div className="catalog-hero-content">
            <span className="catalog-hero-badge">
              <HiShieldCheck /> Insurance Marketplace
            </span>
            <h1>Find Your Perfect <span className="text-gradient">Insurance Plan</span></h1>
            <p>Browse through our curated collection of insurance policies from India's top providers. Compare coverage, premiums, and features to find the plan that fits you best.</p>
          </div>
        </div>
      </section>

      <div className="container">
        {/* Filters Bar */}
        <div className="catalog-filters animate-fade-in-up">
          {/* Category Tabs */}
          <div className="category-tabs">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.key}
                className={`category-tab ${activeCategory === cat.key ? 'active' : ''}`}
                onClick={() => setActiveCategory(cat.key)}
              >
                <span className="category-tab-icon">{cat.icon}</span>
                <span>{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Search & Sort */}
          <div className="catalog-controls">
            <form className="catalog-search" onSubmit={handleSearch}>
              <HiSearch className="search-icon" />
              <input
                type="text"
                className="form-input"
                placeholder="Search policies..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <div className="catalog-sort">
              <HiFilter className="sort-icon" />
              <select
                className="form-input"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="catalog-loading">
            <div className="spinner spinner-lg"></div>
            <p>Loading policies...</p>
          </div>
        ) : policies.length === 0 ? (
          <div className="catalog-empty">
            <span className="catalog-empty-icon">📋</span>
            <h3>No policies found</h3>
            <p>Try adjusting your filters or search query.</p>
          </div>
        ) : (
          <>
            <p className="catalog-count">{policies.length} plan{policies.length !== 1 ? 's' : ''} available</p>
            <div className="catalog-grid">
              {policies.map((policy, index) => (
                <div
                  key={policy.id}
                  className="policy-card animate-fade-in-up"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <div className="policy-card-header">
                    <span
                      className="policy-category-badge"
                      style={{ '--badge-color': getCategoryColor(policy.category) }}
                    >
                      {policy.category}
                    </span>
                    <span className="policy-provider">{policy.provider}</span>
                  </div>

                  <h3 className="policy-card-title">{policy.name}</h3>
                  <p className="policy-card-desc">{policy.description}</p>

                  <div className="policy-card-stats">
                    <div className="policy-stat">
                      <span className="policy-stat-label">Coverage</span>
                      <span className="policy-stat-value">{formatCurrency(policy.coverageAmount)}</span>
                    </div>
                    <div className="policy-stat">
                      <span className="policy-stat-label">Premium</span>
                      <span className="policy-stat-value premium">{formatCurrency(policy.premium)}<span className="policy-period">/{policy.duration >= 12 ? 'yr' : 'mo'}</span></span>
                    </div>
                  </div>

                  <div className="policy-card-features">
                    {(typeof policy.features === 'string' ? JSON.parse(policy.features) : policy.features)
                      .slice(0, 3)
                      .map((feature, i) => (
                        <span key={i} className="policy-feature">✓ {feature}</span>
                      ))}
                  </div>

                  <Link to={`/catalog/${policy.id}`} className="btn btn-primary policy-card-btn">
                    View Details <HiArrowRight />
                  </Link>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default CatalogPage;
