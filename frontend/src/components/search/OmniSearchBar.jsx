import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  HiSearch, 
  HiX, 
  HiMicrophone, 
  HiSparkles, 
  HiClock, 
  HiArrowRight, 
  HiTrendingUp,
  HiShieldCheck 
} from 'react-icons/hi';
import api from '../../services/api/axios';
import toast from 'react-hot-toast';
import './OmniSearchBar.css';

const RECENT_SEARCHES_KEY = 'ps_recent_searches';

export default function OmniSearchBar({
  placeholder = 'Search policies, "cashless mediclaim", "zero dep car", "term life"...',
  initialQuery = '',
  onSearchSubmit = null,
  onSelectPolicy = null,
  onClose = null,
  autoFocus = false,
  variant = 'default', // 'default', 'compact', 'hero', 'modal'
  showTrending = true,
}) {
  const [query, setQuery] = useState(initialQuery);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [topPolicies, setTopPolicies] = useState([]);
  const [didYouMean, setDidYouMean] = useState(null);
  const [trendingList, setTrendingList] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [isListening, setIsListening] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);

  const containerRef = useRef(null);
  const inputRef = useRef(null);
  const recognitionRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const navigate = useNavigate();

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (saved) {
        setRecentSearches(JSON.parse(saved).slice(0, 5));
      }
    } catch (e) {
      // Ignore localStorage errors
    }
  }, []);

  // Fetch trending searches on mount
  useEffect(() => {
    if (showTrending) {
      api.get('/search/trending')
        .then(res => {
          const payload = res.data?.data || res.data || {};
          if (payload.trending) {
            setTrendingList(payload.trending.slice(0, 5));
          }
        })
        .catch(() => {
          // Fallback trending terms if logs are fresh
          setTrendingList([
            { query: 'family floater' },
            { query: 'mediclaim cashless' },
            { query: 'zero dep car insurance' },
            { query: 'term life 1 crore' },
          ]);
        });
    }
  }, [showTrending]);

  // Sync initial query prop
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Web Speech API STT voice search initialization
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-IN';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setQuery(transcript);
          saveRecentSearch(transcript);
          setIsListening(false);
          setIsOpen(false);
          if (onSearchSubmit) {
            onSearchSubmit(transcript);
          } else {
            navigate(`/search?q=${encodeURIComponent(transcript)}`);
          }
        }
      };

      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error !== 'no-speech') {
          toast.error(`Voice recognition notice: ${event.error}`);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, [navigate, onSearchSubmit]);

  // Toggle voice recognition
  const toggleVoiceSearch = (e) => {
    e.stopPropagation();
    if (!recognitionRef.current) {
      toast.error('Voice search is not supported in this browser. Please try Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
      } catch (err) {
        recognitionRef.current.stop();
        setIsListening(false);
      }
    }
  };

  // Save query to localStorage history
  const saveRecentSearch = (text) => {
    const clean = text.trim();
    if (!clean) return;
    try {
      const updated = [clean, ...recentSearches.filter(s => s.toLowerCase() !== clean.toLowerCase())].slice(0, 6);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
    } catch (e) {
      // Ignore
    }
  };

  // Debounced autocomplete fetch
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setSuggestions([]);
      setCategories([]);
      setTopPolicies([]);
      setDidYouMean(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceTimerRef.current = setTimeout(async () => {
      try {
        const res = await api.get('/search/autocomplete', {
          params: { q: trimmed, limit: 6 }
        });
        if (res.data) {
          const payload = res.data.data || res.data || {};
          const sugg = payload.suggestions || [];
          const cats = payload.categories || [];
          const top = payload.topPolicies || [];
          const dym = payload.didYouMean || null;
          setSuggestions(sugg);
          setCategories(cats);
          setTopPolicies(top);
          setDidYouMean(dym);
          setIsOpen(true);
        }
      } catch (err) {
        console.error('Autocomplete fetch error:', err);
      } finally {
        setLoading(false);
      }
    }, 150);

    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, [query]);

  // Calculate flattenable navigation items
  const allNavItems = [
    ...(didYouMean ? [{ type: 'DID_YOU_MEAN', query: didYouMean }] : []),
    ...categories.map(c => ({ type: 'CATEGORY', ...c })),
    ...suggestions.map(s => ({ type: 'SUGGESTION', ...s })),
  ];

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (!isOpen) {
      if (e.key === 'ArrowDown') {
        setIsOpen(true);
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < allNavItems.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : allNavItems.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < allNavItems.length) {
        handleItemClick(allNavItems[selectedIndex]);
      } else {
        triggerSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  const triggerSearch = (searchQuery, categoryFilter = null) => {
    const finalQuery = (searchQuery || '').trim();
    if (!finalQuery && !categoryFilter) return;

    saveRecentSearch(finalQuery || categoryFilter);
    setIsOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(finalQuery, categoryFilter);
    } else {
      let target = `/search?q=${encodeURIComponent(finalQuery)}`;
      if (categoryFilter) {
        target += `&category=${encodeURIComponent(categoryFilter)}`;
      }
      navigate(target);
    }
  };

  const handleItemClick = (item) => {
    if (item.type === 'DID_YOU_MEAN') {
      setQuery(item.query);
      triggerSearch(item.query);
    } else if (item.type === 'CATEGORY') {
      triggerSearch(query, item.value);
    } else if (item.type === 'PROVIDER') {
      triggerSearch(item.value);
    } else if (item.type === 'POLICY') {
      saveRecentSearch(item.title);
      setIsOpen(false);
      if (onSelectPolicy) {
        onSelectPolicy(item);
      } else {
        navigate(`/catalog/${item.id}`);
      }
    } else if (item.title) {
      triggerSearch(item.title);
    }
  };

  const handleClear = () => {
    setQuery('');
    setSuggestions([]);
    setCategories([]);
    setTopPolicies([]);
    setDidYouMean(null);
    inputRef.current?.focus();
  };

  const hasDropdownContent = 
    (query.trim().length > 0 && (categories.length > 0 || suggestions.length > 0 || didYouMean || topPolicies.length > 0)) ||
    (query.trim().length === 0 && (recentSearches.length > 0 || trendingList.length > 0));

  return (
    <div 
      className={`omni-search-wrapper omni-variant-${variant}`}
      ref={containerRef}
    >
      <form 
        className={`omni-search-bar ${isOpen ? 'is-focused' : ''} ${isListening ? 'is-listening' : ''}`}
        onSubmit={(e) => {
          e.preventDefault();
          triggerSearch(query);
        }}
      >
        <span className="omni-search-icon" aria-hidden="true">
          <HiSearch />
        </span>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="omni-search-input"
          autoComplete="off"
          spellCheck="false"
        />

        {/* Clear Button */}
        {query && (
          <button
            type="button"
            className="omni-action-btn omni-clear-btn"
            onClick={handleClear}
            title="Clear search"
          >
            <HiX />
          </button>
        )}

        {/* Voice Search Button */}
        <button
          type="button"
          className={`omni-action-btn omni-mic-btn ${isListening ? 'active' : ''}`}
          onClick={toggleVoiceSearch}
          title={isListening ? 'Stop listening' : 'Search with your voice'}
        >
          <HiMicrophone />
          {isListening && <span className="pulse-ring" />}
        </button>

        {/* Submit Action (if variant hero) */}
        {variant === 'hero' && (
          <button type="submit" className="omni-submit-hero-btn">
            <span>Search</span>
            <HiArrowRight />
          </button>
        )}

        {/* Modal Close Action */}
        {variant === 'modal' && onClose && (
          <button 
            type="button" 
            className="omni-action-btn omni-modal-close-btn"
            onClick={onClose}
            title="Close modal (Esc)"
          >
            <HiX />
          </button>
        )}
      </form>

      {/* Voice Listening Wave Indicator */}
      {isListening && (
        <div className="omni-voice-indicator">
          <div className="soundwave">
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
          <span className="omni-voice-text">Listening for insurance query... Speak now</span>
        </div>
      )}

      {/* Auto-Complete & Predictive Suggestion Dropdown */}
      {isOpen && hasDropdownContent && !isListening && (
        <div className="omni-dropdown">
          {/* Typo Correction Banner */}
          {didYouMean && (
            <div 
              className={`omni-did-you-mean ${selectedIndex === 0 ? 'selected' : ''}`}
              onClick={() => handleItemClick({ type: 'DID_YOU_MEAN', query: didYouMean })}
            >
              <HiSparkles className="text-amber-500" />
              <span>Did you mean: <strong className="text-primary">{didYouMean}</strong>?</span>
            </div>
          )}

          {/* Matched Categories */}
          {categories.length > 0 && (
            <div className="omni-section">
              <div className="omni-section-title">Categories</div>
              <div className="omni-categories-grid">
                {categories.map((cat, i) => (
                  <button
                    key={cat.value || i}
                    type="button"
                    className="omni-category-chip"
                    onClick={() => handleItemClick(cat)}
                  >
                    <HiShieldCheck />
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Suggestions List */}
          {suggestions.length > 0 && (
            <div className="omni-section">
              <div className="omni-section-title">Suggestions</div>
              <ul className="omni-suggestions-list">
                {suggestions.map((item, idx) => {
                  const globalIdx = (didYouMean ? 1 : 0) + categories.length + idx;
                  const isSelected = selectedIndex === globalIdx;

                  return (
                    <li
                      key={item.id || item.value || idx}
                      className={`omni-suggestion-item ${isSelected ? 'selected' : ''}`}
                      onClick={() => handleItemClick(item)}
                    >
                      <div className="omni-sugg-content">
                        <span className="omni-sugg-icon">
                          {item.type === 'PROVIDER' ? '🏢' : '📄'}
                        </span>
                        <div className="omni-sugg-texts">
                          <span className="omni-sugg-title">{item.title}</span>
                          {item.provider && (
                            <span className="omni-sugg-meta">
                              {item.category} • by {item.provider}
                            </span>
                          )}
                        </div>
                      </div>
                      {item.premium && (
                        <span className="omni-sugg-price">
                          ₹{item.premium.toLocaleString('en-IN')}/yr
                        </span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* Top Policy Quick Previews */}
          {topPolicies.length > 0 && (
            <div className="omni-section omni-top-policies">
              <div className="omni-section-title">Instant Matches</div>
              <div className="omni-top-cards">
                {topPolicies.map(p => (
                  <div
                    key={p.id}
                    className="omni-top-card"
                    onClick={() => {
                      saveRecentSearch(p.name);
                      setIsOpen(false);
                      if (onSelectPolicy) onSelectPolicy(p);
                      else navigate(`/catalog/${p.id}`);
                    }}
                  >
                    <div className="omni-top-badge">{p.category}</div>
                    <h5 className="omni-top-title">{p.name}</h5>
                    <div className="omni-top-footer">
                      <span className="omni-top-coverage">₹{(p.coverageAmount / 100000).toFixed(0)}L Cover</span>
                      <span className="omni-top-premium">₹{p.premium.toLocaleString('en-IN')}/yr</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty Query: Recent Searches & Trending Searches */}
          {query.trim().length === 0 && (
            <>
              {recentSearches.length > 0 && (
                <div className="omni-section">
                  <div className="omni-section-title">
                    <span><HiClock /> Recent Searches</span>
                    <button
                      type="button"
                      className="omni-clear-history-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        setRecentSearches([]);
                        localStorage.removeItem(RECENT_SEARCHES_KEY);
                      }}
                    >
                      Clear
                    </button>
                  </div>
                  <div className="omni-chips-wrap">
                    {recentSearches.map((term, i) => (
                      <button
                        key={i}
                        type="button"
                        className="omni-chip omni-recent-chip"
                        onClick={() => {
                          setQuery(term);
                          triggerSearch(term);
                        }}
                      >
                        <HiClock className="text-muted" />
                        <span>{term}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {showTrending && trendingList.length > 0 && (
                <div className="omni-section">
                  <div className="omni-section-title">
                    <HiTrendingUp className="text-primary" /> Popular & Trending
                  </div>
                  <div className="omni-chips-wrap">
                    {trendingList.map((t, i) => (
                      <button
                        key={i}
                        type="button"
                        className="omni-chip omni-trending-chip"
                        onClick={() => {
                          setQuery(t.query);
                          triggerSearch(t.query);
                        }}
                      >
                        🔥 <span>{t.query}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Quick Footer */}
          <div className="omni-dropdown-footer">
            <span>Press <kbd>↵</kbd> to search</span>
            <span>Use <kbd>↑</kbd> <kbd>↓</kbd> to navigate</span>
            <span><kbd>ESC</kbd> to dismiss</span>
          </div>
        </div>
      )}
    </div>
  );
}
