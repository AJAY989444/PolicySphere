import { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { 
  HiSearch, 
  HiFilter, 
  HiSparkles, 
  HiClock, 
  HiShieldCheck, 
  HiScale, 
  HiCalculator, 
  HiArrowRight,
  HiLightBulb,
  HiCheckCircle,
  HiOutlineEmojiSad
} from 'react-icons/hi';
import api from '../services/api/axios';
import OmniSearchBar from '../components/search/OmniSearchBar';
import PolicyCompareModal from '../components/catalog/PolicyCompareModal';
import QuoteCalculatorModal from '../components/catalog/QuoteCalculatorModal';
import PaymentModal from '../components/payment/PaymentModal';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import './SearchResultsPage.css';

const CATEGORIES = [
  { key: 'ALL', label: 'All Categories' },
  { key: 'HEALTH', label: 'Health', icon: '🏥' },
  { key: 'LIFE', label: 'Life', icon: '🛡️' },
  { key: 'MOTOR', label: 'Motor', icon: '🚗' },
  { key: 'TRAVEL', label: 'Travel', icon: '✈️' },
  { key: 'HOME', label: 'Home', icon: '🏠' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Most Relevant (AI Ranked)' },
  { value: 'premium_asc', label: 'Premium: Low to High' },
  { value: 'premium_desc', label: 'Premium: High to Low' },
  { value: 'coverage_desc', label: 'Coverage: High to Low' },
];

export default function SearchResultsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const query = searchParams.get('q') || '';
  const categoryParam = searchParams.get('category') || 'ALL';
  const sortParam = searchParams.get('sort') || 'relevance';

  const [results, setResults] = useState([]);
  const [totalResults, setTotalResults] = useState(0);
  const [executionMs, setExecutionMs] = useState(0);
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  const [activeCategory, setActiveCategory] = useState(categoryParam);
  const [activeSort, setActiveSort] = useState(sortParam);
  const [maxPremiumFilter, setMaxPremiumFilter] = useState('');

  // Modals
  const [selectedComparePolicies, setSelectedComparePolicies] = useState([]);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isQuoteOpen, setIsQuoteOpen] = useState(false);
  const [selectedQuotePolicy, setSelectedQuotePolicy] = useState(null);
  const [isPaymentOpen, setIsPaymentOpen] = useState(false);
  const [checkoutPolicy, setCheckoutPolicy] = useState(null);

  // Sync state with URL params
  useEffect(() => {
    setActiveCategory(categoryParam);
    setActiveSort(sortParam);
  }, [categoryParam, sortParam]);

  // Execute search API call
  useEffect(() => {
    fetchSearchResults();
  }, [query, activeCategory, activeSort, maxPremiumFilter]);

  const fetchSearchResults = async () => {
    setLoading(true);
    try {
      const params = {
        q: query,
        category: activeCategory !== 'ALL' ? activeCategory : undefined,
        sortBy: activeSort,
        maxPremium: maxPremiumFilter ? Number(maxPremiumFilter) : undefined,
        limit: 30,
      };

      const res = await api.get('/search', { params });
      if (res.data?.success) {
        const payload = res.data.data || res.data || {};
        setResults(payload.results || []);
        setTotalResults(payload.total !== undefined ? payload.total : (payload.totalResults || payload.results?.length || 0));
        setExecutionMs(payload.executionTimeMs || 0);
        setMetadata(payload.metadata || null);
      }
    } catch (err) {
      console.error('Search request failed:', err);
      toast.error('Unable to fetch search results. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCategoryChange = (catKey) => {
    setActiveCategory(catKey);
    const newParams = new URLSearchParams(searchParams);
    if (catKey === 'ALL') {
      newParams.delete('category');
    } else {
      newParams.set('category', catKey);
    }
    setSearchParams(newParams);
  };

  const handleSortChange = (newSort) => {
    setActiveSort(newSort);
    const newParams = new URLSearchParams(searchParams);
    newParams.set('sort', newSort);
    setSearchParams(newParams);
  };

  const handleNewSearch = (newQuery) => {
    const newParams = new URLSearchParams(searchParams);
    newParams.set('q', newQuery);
    setSearchParams(newParams);
  };

  const toggleCompare = (policy) => {
    const exists = selectedComparePolicies.some((p) => String(p.id) === String(policy.id));
    if (exists) {
      setSelectedComparePolicies(selectedComparePolicies.filter((p) => String(p.id) !== String(policy.id)));
    } else {
      if (selectedComparePolicies.length > 0) {
        const firstCategory = selectedComparePolicies[0].category;
        if (policy.category !== firstCategory) {
          toast.error(`You can only compare policies within the same category (${firstCategory}). Clear selection first.`);
          return;
        }
      }
      if (selectedComparePolicies.length >= 4) {
        toast.error('You can compare up to 4 policies at a time.');
        return;
      }
      setSelectedComparePolicies([...selectedComparePolicies, policy]);
    }
  };

  const handleProceedFromQuote = ({ policy, customPremium }) => {
    setIsQuoteOpen(false);
    if (!user) {
      toast.error('Please sign in to proceed with this purchase');
      navigate('/login');
      return;
    }
    setCheckoutPolicy({
      ...policy,
      customPremium,
    });
    setIsPaymentOpen(true);
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="search-page-container">
      {/* Search Header Banner */}
      <section className="search-page-header">
        <div className="search-page-header-content">
          <div className="search-badge">
            <HiSparkles />
            <span>AI-Powered Insurance Search Engine</span>
          </div>
          <h1 className="search-page-title">
            Find the Perfect Policy
          </h1>
          <p className="search-page-subtitle">
            Search with domain terms, symptoms, budgets, or vehicle riders with sub-millisecond precision.
          </p>

          <div className="search-omni-container">
            <OmniSearchBar
              variant="hero"
              initialQuery={query}
              onSearchSubmit={handleNewSearch}
              placeholder='Try "mediclaim under 15000", "zero dep scooter", "1 crore life cover"...'
            />
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <div className="search-main-content">
        {/* Execution Metadata & Intelligent Banners */}
        <div className="search-metadata-strip">
          <div className="search-latency-badge" title="Performance SLA Section 28: Search latency < 500ms">
            <span className="latency-dot" />
            <span>
              Found <strong>{totalResults}</strong> {totalResults === 1 ? 'policy' : 'policies'} in{' '}
              <strong className="text-success">{executionMs}ms</strong>
            </span>
          </div>

          {/* Typo Correction Notification */}
          {metadata?.hasTypoCorrection && metadata?.didYouMean && (
            <div className="search-alert-banner typo-banner">
              <HiSparkles className="banner-icon text-amber-500" />
              <span>
                Showing results for <strong>{metadata.didYouMean}</strong>.{' '}
                {query.toLowerCase() !== metadata.didYouMean.toLowerCase() && (
                  <button 
                    type="button" 
                    className="banner-action-link"
                    onClick={() => handleNewSearch(query)}
                  >
                    Search instead for <em>"{query}"</em>
                  </button>
                )}
              </span>
            </div>
          )}

          {/* Synonym Expansion Notification */}
          {metadata?.appliedSynonyms && metadata.appliedSynonyms.length > 0 && (
            <div className="search-alert-banner synonym-banner">
              <HiLightBulb className="banner-icon text-indigo-500" />
              <span>
                Domain Synonyms Applied:{' '}
                {metadata.appliedSynonyms.map((s, idx) => (
                  <span key={idx} className="synonym-tag">
                    {s.from} → <strong>{s.to}</strong>
                  </span>
                ))}
              </span>
            </div>
          )}

          {/* AI Semantic Intent Badges */}
          {metadata?.semanticConstraints && (
            <div className="search-semantic-tags">
              {metadata.semanticConstraints.category && (
                <span className="semantic-pill category">
                  Category: <strong>{metadata.semanticConstraints.category}</strong>
                </span>
              )}
              {metadata.semanticConstraints.maxBudget && (
                <span className="semantic-pill budget">
                  Max Budget: <strong>₹{metadata.semanticConstraints.maxBudget.toLocaleString('en-IN')}/yr</strong>
                </span>
              )}
              {metadata.semanticConstraints.riders && metadata.semanticConstraints.riders.map((r, i) => (
                <span key={i} className="semantic-pill rider">
                  Rider: <strong>{r}</strong>
                </span>
              ))}
              {metadata.semanticConstraints.conditions && metadata.semanticConstraints.conditions.map((c, i) => (
                <span key={i} className="semantic-pill condition">
                  Cover for: <strong>{c}</strong>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Faceted Filter Toolbar */}
        <div className="search-toolbar">
          {/* Category Filter Pills */}
          <div className="search-category-pills">
            {CATEGORIES.map((cat) => {
              const count = cat.key === 'ALL' 
                ? totalResults 
                : (metadata?.categoryFacets?.[cat.key] || 0);
              const isActive = activeCategory === cat.key;

              return (
                <button
                  key={cat.key}
                  type="button"
                  className={`search-cat-pill ${isActive ? 'active' : ''}`}
                  onClick={() => handleCategoryChange(cat.key)}
                >
                  {cat.icon && <span className="cat-pill-icon">{cat.icon}</span>}
                  <span>{cat.label}</span>
                  {count > 0 && <span className="cat-pill-count">{count}</span>}
                </button>
              );
            })}
          </div>

          {/* Sort & Quick Filter Controls */}
          <div className="search-controls">
            <div className="search-control-group">
              <label htmlFor="search-sort-select">Sort by:</label>
              <select
                id="search-sort-select"
                value={activeSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="search-select"
              >
                {SORT_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Results Grid / List */}
        {loading ? (
          <div className="search-loading-state">
            <div className="search-spinner" />
            <p>Scanning index across coverage terms, features & riders...</p>
          </div>
        ) : results.length === 0 ? (
          <div className="search-empty-state">
            <div className="search-empty-icon">
              <HiOutlineEmojiSad />
            </div>
            <h3>No matching policies found</h3>
            <p>
              We couldn't find policies matching <strong>"{query}"</strong> with the selected filters.
            </p>
            <div className="search-empty-suggestions">
              <span>Try searching for:</span>
              <div className="empty-chips">
                <button type="button" onClick={() => handleNewSearch('mediclaim cashless')}>
                  mediclaim cashless
                </button>
                <button type="button" onClick={() => handleNewSearch('zero dep car')}>
                  zero dep car
                </button>
                <button type="button" onClick={() => handleNewSearch('term life 1 crore')}>
                  term life 1 crore
                </button>
                <button type="button" onClick={() => handleNewSearch('home theft fire')}>
                  home theft fire
                </button>
              </div>
            </div>
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => {
                setActiveCategory('ALL');
                handleNewSearch('');
              }}
            >
              Browse All Policies
            </button>
          </div>
        ) : (
          <div className="search-results-grid">
            {results.map((policy) => {
              const isCompared = selectedComparePolicies.some((p) => String(p.id) === String(policy.id));
              const matchScore = policy.relevanceScore || policy.semanticMatchScore || 85;

              return (
                <div key={policy.id} className="search-policy-card">
                  {/* Card Header */}
                  <div className="card-top-row">
                    <span className={`category-tag tag-${policy.category.toLowerCase()}`}>
                      {policy.category}
                    </span>
                    <div className="semantic-score-badge" title="AI Semantic Relevance Score">
                      <HiSparkles />
                      <span>{matchScore}% Match</span>
                    </div>
                  </div>

                  {/* Title & Provider with Highlighting */}
                  <h3 className="policy-card-title">
                    <Link 
                      to={`/catalog/${policy.id}`}
                      dangerouslySetInnerHTML={{ __html: policy.nameHighlighted || policy.name }}
                    />
                  </h3>
                  <div 
                    className="policy-card-provider"
                    dangerouslySetInnerHTML={{ 
                      __html: `by ${policy.providerHighlighted || policy.provider}` 
                    }}
                  />

                  {/* Description Snippet with Highlighting */}
                  <p 
                    className="policy-card-desc"
                    dangerouslySetInnerHTML={{ 
                      __html: policy.descriptionHighlighted || policy.description 
                    }}
                  />

                  {/* AI Match Reasons */}
                  {policy.matchReasons && policy.matchReasons.length > 0 && (
                    <div className="policy-match-reasons">
                      {policy.matchReasons.slice(0, 2).map((reason, idx) => (
                        <span key={idx} className="match-reason-pill">
                          <HiCheckCircle />
                          <span>{reason}</span>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Features List */}
                  {Array.isArray(policy.features) && policy.features.length > 0 && (
                    <div className="policy-features-row">
                      {policy.features.slice(0, 3).map((feat, i) => (
                        <span key={i} className="feature-chip">
                          ✓ {feat}
                        </span>
                      ))}
                      {policy.features.length > 3 && (
                        <span className="feature-more">+{policy.features.length - 3} more</span>
                      )}
                    </div>
                  )}

                  {/* Pricing & Coverage */}
                  <div className="card-financials-row">
                    <div className="financial-item">
                      <span className="financial-label">Coverage</span>
                      <span className="financial-value">
                        {formatCurrency(policy.coverageAmount)}
                      </span>
                    </div>
                    <div className="financial-item premium">
                      <span className="financial-label">Starting Premium</span>
                      <span className="financial-value">
                        {formatCurrency(policy.premium)}
                        <small>/yr</small>
                      </span>
                    </div>
                  </div>

                  {/* Card Actions */}
                  <div className="card-actions-row">
                    <button
                      type="button"
                      className={`btn-compare ${isCompared ? 'active' : ''}`}
                      onClick={() => toggleCompare(policy)}
                      title="Compare up to 4 policies side-by-side"
                    >
                      <HiScale />
                      <span>{isCompared ? 'Compared' : 'Compare'}</span>
                    </button>

                    <button
                      type="button"
                      className="btn-quote"
                      onClick={() => {
                        setSelectedQuotePolicy(policy);
                        setIsQuoteOpen(true);
                      }}
                    >
                      <HiCalculator />
                      <span>Quote</span>
                    </button>

                    <Link to={`/catalog/${policy.id}`} className="btn-details">
                      <span>Details</span>
                      <HiArrowRight />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Floating Compare Drawer Trigger if items selected */}
        {selectedComparePolicies.length > 0 && (
          <div className="compare-floating-bar">
            <div className="compare-bar-info">
              <HiScale className="text-primary text-xl" />
              <span>
                <strong>{selectedComparePolicies.length}</strong> policies selected for comparison
              </span>
            </div>
            <div className="compare-bar-actions">
              <button
                type="button"
                className="btn btn-ghost btn-sm"
                onClick={() => setSelectedComparePolicies([])}
              >
                Clear
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm"
                onClick={() => setIsCompareOpen(true)}
              >
                Compare Now ({selectedComparePolicies.length}/4)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <PolicyCompareModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        policies={selectedComparePolicies}
        onRemovePolicy={(id) => {
          setSelectedComparePolicies((prev) => prev.filter((p) => String(p.id) !== String(id)));
        }}
      />

      <QuoteCalculatorModal
        isOpen={isQuoteOpen}
        onClose={() => setIsQuoteOpen(false)}
        policy={selectedQuotePolicy}
        onProceedToBuy={handleProceedFromQuote}
      />

      {checkoutPolicy && (
        <PaymentModal
          isOpen={isPaymentOpen}
          onClose={() => {
            setIsPaymentOpen(false);
            setCheckoutPolicy(null);
          }}
          policyId={checkoutPolicy.id}
          policyName={checkoutPolicy.name}
          premium={checkoutPolicy.customPremium || checkoutPolicy.premium}
          onSuccess={() => {
            setIsPaymentOpen(false);
            setCheckoutPolicy(null);
            toast.success('Policy purchased successfully!');
            navigate('/dashboard');
          }}
        />
      )}
    </div>
  );
}
