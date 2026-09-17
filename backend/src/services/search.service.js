const prisma = require('../config/db');

// ─── Domain-Specific Insurance Synonyms Dictionary ───────────────
const INSURANCE_SYNONYMS = {
  HEALTH: [
    'mediclaim', 'medical', 'hospital', 'hospitalization', 'doctor', 'surgery',
    'cashless', 'critical illness', 'cancer', 'heart', 'organ', 'maternity',
    'opd', 'pre-existing', 'ped', 'room rent', 'icu', 'ayush', 'wellness',
    'day care', 'health insurance', 'health plan', 'family floater', 'senior citizen health'
  ],
  LIFE: [
    'term', 'term life', 'pure term', 'death benefit', 'sum assured', 'nominee',
    'family protection', 'whole life', 'endowment', 'ulip', 'mortality',
    'life cover', 'financial security', 'pension', 'annuity', 'retirement',
    'life insurance', 'term plan'
  ],
  MOTOR: [
    'car', 'auto', 'automobile', 'bike', 'two wheeler', 'four wheeler', 'scooter',
    'motorcycle', 'vehicle', 'zero dep', 'bumper to bumper', 'comprehensive motor',
    'third party', 'tp', 'od', 'own damage', 'roadside assistance', 'rsa',
    'engine protect', 'ncb', 'no claim bonus', 'car insurance', 'bike insurance'
  ],
  TRAVEL: [
    'trip', 'flight', 'overseas', 'international', 'abroad', 'schengen',
    'passport', 'baggage', 'luggage loss', 'trip cancellation', 'medical evacuation',
    'delayed flight', 'holiday', 'visa', 'travel insurance', 'student travel'
  ],
  HOME: [
    'house', 'apartment', 'flat', 'property', 'building', 'structure',
    'contents', 'burglary', 'theft', 'fire', 'earthquake', 'flood',
    'tenant', 'landlord', 'homeowner', 'home insurance', 'property insurance'
  ]
};

// General term mapping
const GENERAL_SYNONYMS = {
  'cheap': ['affordable', 'budget', 'low premium', 'economical', 'low cost'],
  'affordable': ['cheap', 'budget', 'low premium', 'economical'],
  'best': ['top rated', 'highest rated', 'comprehensive', 'maximum coverage'],
  'family': ['family floater', 'dependents', 'children', 'spouse', 'parents'],
  'cashless': ['network hospital', 'direct settlement', 'empaneled'],
  'ncb': ['no claim bonus', 'discount', 'safe driver'],
  'zero dep': ['zero depreciation', 'bumper to bumper', 'nil depreciation'],
};

// Stop words removed during full-text tokenization
const STOP_WORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were',
  'in', 'on', 'at', 'to', 'for', 'with', 'by', 'of', 'from', 'up',
  'about', 'into', 'over', 'after', 'i', 'me', 'my', 'we', 'our',
  'you', 'your', 'he', 'she', 'it', 'they', 'them', 'what', 'which',
  'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'been',
  'having', 'do', 'does', 'did', 'want', 'need', 'looking', 'please',
  'give', 'show', 'find', 'get'
]);

// Curated insurance lexicon for typo correction
const INSURANCE_LEXICON = [
  'health', 'mediclaim', 'medical', 'hospital', 'cashless', 'maternity', 'critical', 'illness',
  'doctor', 'surgery', 'wellness', 'floater', 'senior', 'citizen', 'ped', 'care', 'cancer',
  'disease', 'accident', 'dentistry', 'ayush', 'opd', 'family', 'child', 'parents',
  'life', 'term', 'nominee', 'death', 'benefit', 'endowment', 'ulip', 'pension', 'retirement',
  'motor', 'vehicle', 'car', 'bike', 'scooter', 'automobile', 'bumper', 'depreciation', 'roadside',
  'assistance', 'damage', 'third', 'party', 'comprehensive', 'motorcycle',
  'travel', 'international', 'flight', 'overseas', 'schengen', 'baggage', 'passport', 'trip',
  'home', 'property', 'burglary', 'fire', 'earthquake', 'flood', 'tenant', 'house', 'structure',
  'premium', 'coverage', 'policy', 'insurance', 'claim', 'deductible', 'copay', 'rider', 'budget',
  'affordable', 'cheap', 'best', 'compare', 'hospitals', 'network', 'instant', 'bonus'
];

// In-memory active policy cache to guarantee <30ms autocomplete and <500ms search SLA
let policyCache = null;
let policyCacheExpiry = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

async function getCachedActivePolicies() {
  const now = Date.now();
  if (policyCache && now < policyCacheExpiry) {
    return policyCache;
  }
  const policies = await prisma.insurancePolicy.findMany({
    where: { isActive: true }
  });
  policyCache = policies;
  policyCacheExpiry = now + CACHE_TTL_MS;
  return policies;
}

class SearchService {
  /**
   * Manually invalidate policy cache when policies are updated
   */
  static invalidateCache() {
    policyCache = null;
    policyCacheExpiry = 0;
  }
  /**
   * Calculate Damerau-Levenshtein edit distance for typo tolerance
   */
  static levenshteinDistance(a, b) {
    if (!a || !b) return (a || b || '').length;
    const m = a.length;
    const n = b.length;
    const dp = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

    for (let i = 0; i <= m; i++) dp[i][0] = i;
    for (let j = 0; j <= n; j++) dp[0][j] = j;

    for (let i = 1; i <= m; i++) {
      for (let j = 1; j <= n; j++) {
        const cost = a[i - 1] === b[j - 1] ? 0 : 1;
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1,       // deletion
          dp[i][j - 1] + 1,       // insertion
          dp[i - 1][j - 1] + cost // substitution
        );
        // Transposition
        if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) {
          dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
        }
      }
    }
    return dp[m][n];
  }

  /**
   * Correct single word typo based on insurance vocabulary
   */
  static correctWordTypo(word) {
    const clean = word.toLowerCase().trim();
    if (clean.length <= 2) return clean;
    if (INSURANCE_LEXICON.includes(clean)) return clean;

    let bestMatch = clean;
    let minDistance = Infinity;
    const threshold = clean.length <= 4 ? 1 : clean.length <= 7 ? 2 : 3;

    for (const term of INSURANCE_LEXICON) {
      const dist = this.levenshteinDistance(clean, term);
      if (dist < minDistance && dist <= threshold) {
        minDistance = dist;
        bestMatch = term;
      }
    }

    return bestMatch;
  }

  /**
   * Check if query has typos and return corrected "Did you mean...?" query
   */
  static getDidYouMean(query) {
    const words = (query || '').toLowerCase().trim().split(/\s+/);
    let hasCorrection = false;
    const correctedWords = words.map((w) => {
      const cleaned = w.replace(/[^a-z0-9]/g, '');
      if (!cleaned) return w;
      const corrected = this.correctWordTypo(cleaned);
      if (corrected !== cleaned) {
        hasCorrection = true;
        return corrected;
      }
      return w;
    });

    if (hasCorrection) {
      return {
        hasCorrection: true,
        originalQuery: query,
        correctedQuery: correctedWords.join(' '),
      };
    }
    return { hasCorrection: false, originalQuery: query, correctedQuery: query };
  }

  /**
   * Expand query tokens with synonyms
   */
  static expandSynonyms(query) {
    const text = (query || '').toLowerCase().trim();
    const tokens = text.split(/\s+/).filter(t => !STOP_WORDS.has(t) && t.length > 1);
    const expandedTokens = new Set(tokens);
    const detectedCategories = new Set();
    const appliedSynonymMap = [];

    // Check category synonyms
    for (const [category, synList] of Object.entries(INSURANCE_SYNONYMS)) {
      for (const syn of synList) {
        if (text.includes(syn)) {
          detectedCategories.add(category);
          appliedSynonymMap.push({ from: syn, toCategory: category });
          syn.split(/\s+/).forEach(t => expandedTokens.add(t));
        }
      }
    }

    // Check general synonyms
    for (const [key, synList] of Object.entries(GENERAL_SYNONYMS)) {
      if (text.includes(key)) {
        synList.forEach(s => s.split(/\s+/).forEach(t => expandedTokens.add(t)));
        appliedSynonymMap.push({ from: key, synonyms: synList });
      }
    }

    return {
      tokens: Array.from(expandedTokens),
      detectedCategories: Array.from(detectedCategories),
      appliedSynonymMap,
    };
  }

  /**
   * AI Semantic Query Parser: extracts structured intent & constraints
   */
  static parseSemanticQuery(query) {
    const text = (query || '').toLowerCase().trim();
    const constraints = {
      category: null,
      maxBudget: null,
      minCoverage: null,
      age: null,
      conditions: [],
      riders: [],
      sortBy: null,
    };

    // Category detection
    for (const [cat, syns] of Object.entries(INSURANCE_SYNONYMS)) {
      if (syns.some(s => text.includes(s))) {
        constraints.category = cat;
        break;
      }
    }

    // Budget extraction (e.g. "under 15000", "below 20k", "budget 25,000", "< 30000")
    const budgetMatch = text.match(/(?:under|below|less than|within|budget of|max|upto|up to)\s*(?:rs\.?|₹)?\s*(\d+)(k|thousand|lakh|l)?/i) ||
                        text.match(/(?:rs\.?|₹)\s*(\d+)(k|thousand|lakh|l)?\s*(?:budget|or less)/i);
    if (budgetMatch) {
      let val = parseFloat(budgetMatch[1]);
      const unit = (budgetMatch[2] || '').toLowerCase();
      if (unit === 'k' || unit === 'thousand') val *= 1000;
      else if (unit === 'l' || unit === 'lakh') val *= 100000;
      constraints.maxBudget = val;
    }

    // Coverage extraction (e.g. "coverage of 10 lakh", "5l cover", "sum insured 1000000")
    const coverageMatch = text.match(/(?:coverage|cover|sum insured)\s*(?:of|is)?\s*(?:rs\.?|₹)?\s*(\d+)(k|thousand|lakh|l|cr)?/i);
    if (coverageMatch) {
      let cVal = parseFloat(coverageMatch[1]);
      const cUnit = (coverageMatch[2] || '').toLowerCase();
      if (cUnit === 'l' || cUnit === 'lakh') cVal *= 100000;
      else if (cUnit === 'cr') cVal *= 10000000;
      else if (cUnit === 'k' || cUnit === 'thousand') cVal *= 1000;
      constraints.minCoverage = cVal;
    }

    // Age extraction (e.g. "for 45 year old", "age 60", "senior citizen")
    const ageMatch = text.match(/(?:age\s*(\d+)|(\d+)\s*(?:years?|yrs?)(?:\s*old)?)/i);
    if (ageMatch) {
      constraints.age = parseInt(ageMatch[1] || ageMatch[2], 10);
    } else if (text.includes('senior citizen') || text.includes('elderly') || text.includes('parents')) {
      constraints.age = 65;
    }

    // Pre-existing conditions
    const commonConditions = ['diabetes', 'hypertension', 'blood pressure', 'bp', 'asthma', 'heart', 'thyroid', 'cancer'];
    for (const cond of commonConditions) {
      if (text.includes(cond)) constraints.conditions.push(cond);
    }

    // Riders / Features
    const commonRiders = [
      { key: 'zero dep', label: 'Zero Depreciation' },
      { key: 'cashless', label: 'Cashless Network' },
      { key: 'maternity', label: 'Maternity Cover' },
      { key: 'critical illness', label: 'Critical Illness Rider' },
      { key: 'roadside assistance', label: 'Roadside Assistance' },
      { key: 'no room rent capping', label: 'No Room Rent Capping' },
      { key: 'ncb', label: 'No Claim Bonus' },
    ];
    for (const rider of commonRiders) {
      if (text.includes(rider.key)) constraints.riders.push(rider.label);
    }

    // Sort preference
    if (text.includes('cheap') || text.includes('affordable') || text.includes('lowest') || text.includes('budget')) {
      constraints.sortBy = 'premium_asc';
    } else if (text.includes('highest coverage') || text.includes('maximum cover')) {
      constraints.sortBy = 'coverage_desc';
    }

    return constraints;
  }

  /**
   * Score policy relevance against search tokens and constraints
   */
  static scorePolicy(policy, searchTokens, constraints, originalQuery) {
    let score = 0;
    const matchReasons = [];
    const nameLower = (policy.name || '').toLowerCase();
    const descLower = (policy.description || '').toLowerCase();
    const providerLower = (policy.provider || '').toLowerCase();
    const catLower = (policy.category || '').toLowerCase();
    
    let featuresList = [];
    try {
      featuresList = typeof policy.features === 'string' ? JSON.parse(policy.features) : (policy.features || []);
    } catch (e) {
      featuresList = [];
    }
    const featuresLower = featuresList.map(f => String(f).toLowerCase()).join(' ');

    const combinedText = `${nameLower} ${catLower} ${providerLower} ${descLower} ${featuresLower}`;

    // Exact phrase match bonus
    const cleanOriginal = (originalQuery || '').toLowerCase().trim();
    if (cleanOriginal && nameLower.includes(cleanOriginal)) {
      score += 40;
      matchReasons.push(`Exact title match for "${originalQuery}"`);
    } else if (cleanOriginal && combinedText.includes(cleanOriginal)) {
      score += 25;
      matchReasons.push(`Direct phrase match in policy features`);
    }

    // Token frequency and field weighting
    for (const token of searchTokens) {
      if (!token || token.length < 2) continue;

      if (nameLower.includes(token)) {
        score += 15;
        matchReasons.push(`Title includes "${token}"`);
      }
      if (catLower.includes(token)) {
        score += 12;
      }
      if (providerLower.includes(token)) {
        score += 10;
        matchReasons.push(`Provided by ${policy.provider}`);
      }
      if (featuresLower.includes(token)) {
        score += 8;
      }
      if (descLower.includes(token)) {
        score += 4;
      }
    }

    // Constraint evaluation
    if (constraints.category) {
      if (policy.category === constraints.category) {
        score += 20;
        matchReasons.push(`Matches category: ${policy.category}`);
      } else {
        score -= 20; // Penalty for wrong category
      }
    }

    if (constraints.maxBudget) {
      if (policy.premium <= constraints.maxBudget) {
        score += 18;
        matchReasons.push(`Within requested budget (₹${policy.premium.toLocaleString('en-IN')}/yr $\\le$ ₹${constraints.maxBudget.toLocaleString('en-IN')})`);
      } else {
        const overage = (policy.premium - constraints.maxBudget) / constraints.maxBudget;
        score -= Math.min(30, Math.round(overage * 25));
      }
    }

    if (constraints.minCoverage) {
      if (policy.coverageAmount >= constraints.minCoverage) {
        score += 15;
        matchReasons.push(`Exceeds required sum insured (₹${(policy.coverageAmount / 100000).toFixed(1)}L $\\ge$ ₹${(constraints.minCoverage / 100000).toFixed(1)}L)`);
      } else {
        score -= 10;
      }
    }

    if (constraints.conditions && constraints.conditions.length > 0) {
      for (const cond of constraints.conditions) {
        if (combinedText.includes(cond) || descLower.includes('pre-existing') || descLower.includes('care')) {
          score += 12;
          matchReasons.push(`Offers coverage/riders for ${cond}`);
        }
      }
    }

    if (constraints.riders && constraints.riders.length > 0) {
      for (const rider of constraints.riders) {
        if (combinedText.includes(rider.toLowerCase())) {
          score += 10;
          matchReasons.push(`Includes ${rider}`);
        }
      }
    }

    const normalizedScore = Math.min(99, Math.max(10, Math.round(score)));
    return { score: normalizedScore, matchReasons: Array.from(new Set(matchReasons)) };
  }

  /**
   * Highlight query terms inside matching text with HTML mark tags
   */
  static highlightSnippet(text, tokens) {
    if (!text) return '';
    let result = text;
    for (const token of tokens) {
      if (!token || token.length < 2) continue;
      const regex = new RegExp(`(${token.replace(/[.*+?^${}()|[\\]\\\\]/g, '\\\\$&')})`, 'gi');
      result = result.replace(regex, '<mark class="search-highlight">$1</mark>');
    }
    return result;
  }

  /**
   * Main Search Execution Engine
   */
  static async executeSearch({
    query = '',
    category = null,
    minPremium = null,
    maxPremium = null,
    minCoverage = null,
    maxCoverage = null,
    sortBy = 'relevance',
    page = 1,
    limit = 20,
    userId = null,
    userAgent = null,
  }) {
    const startTime = Date.now();
    const cleanQuery = (query || '').trim();

    // 1. Fetch all active policies (using in-memory cache for <500ms SLA)
    let policies = await getCachedActivePolicies();
    if (category && category !== 'ALL') {
      policies = policies.filter(p => p.category === category);
    }
    if (minPremium !== null && minPremium !== undefined && minPremium !== '') {
      policies = policies.filter(p => p.premium >= Number(minPremium));
    }
    if (maxPremium !== null && maxPremium !== undefined && maxPremium !== '') {
      policies = policies.filter(p => p.premium <= Number(maxPremium));
    }
    if (minCoverage !== null && minCoverage !== undefined && minCoverage !== '') {
      policies = policies.filter(p => p.coverageAmount >= Number(minCoverage));
    }
    if (maxCoverage !== null && maxCoverage !== undefined && maxCoverage !== '') {
      policies = policies.filter(p => p.coverageAmount <= Number(maxCoverage));
    }
    const allPolicies = policies;

    // 2. Typo tolerance detection
    const typoAnalysis = this.getDidYouMean(cleanQuery);
    const effectiveQuery = typoAnalysis.hasCorrection ? typoAnalysis.correctedQuery : cleanQuery;

    // 3. Synonym expansion & Natural query entity parsing
    const synonymData = this.expandSynonyms(effectiveQuery || cleanQuery);
    const semanticConstraints = this.parseSemanticQuery(effectiveQuery || cleanQuery);

    // Combine tokens from query, corrected query, and synonyms
    const allTokens = Array.from(new Set([
      ...cleanQuery.toLowerCase().split(/\s+/).filter(t => !STOP_WORDS.has(t)),
      ...(typoAnalysis.hasCorrection ? typoAnalysis.correctedQuery.toLowerCase().split(/\s+/).filter(t => !STOP_WORDS.has(t)) : []),
      ...synonymData.tokens,
    ]));

    // 4. Rank and score policies
    let ranked = allPolicies.map((policy) => {
      const { score, matchReasons } = this.scorePolicy(policy, allTokens, semanticConstraints, effectiveQuery);
      
      let parsedFeatures = [];
      try {
        parsedFeatures = typeof policy.features === 'string' ? JSON.parse(policy.features) : (policy.features || []);
      } catch (e) {
        parsedFeatures = [];
      }

      return {
        id: policy.id,
        name: policy.name,
        nameHighlighted: this.highlightSnippet(policy.name, allTokens),
        provider: policy.provider,
        providerHighlighted: this.highlightSnippet(policy.provider, allTokens),
        category: policy.category,
        description: policy.description,
        descriptionHighlighted: this.highlightSnippet(policy.description, allTokens),
        coverageAmount: policy.coverageAmount,
        premium: policy.premium,
        duration: policy.duration,
        features: parsedFeatures,
        relevanceScore: score,
        semanticMatchScore: score,
        matchReasons,
      };
    });

    // If query was supplied, filter out irrelevant results (score >= 20)
    if (cleanQuery) {
      ranked = ranked.filter((p) => p.relevanceScore >= 20);
    }

    // 5. Apply sorting
    if (sortBy === 'premium_asc') {
      ranked.sort((a, b) => a.premium - b.premium);
    } else if (sortBy === 'premium_desc') {
      ranked.sort((a, b) => b.premium - a.premium);
    } else if (sortBy === 'coverage_desc') {
      ranked.sort((a, b) => b.coverageAmount - a.coverageAmount);
    } else {
      // Relevance descending default
      ranked.sort((a, b) => b.relevanceScore - a.relevanceScore);
    }

    // 6. Pagination
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.max(1, parseInt(limit, 10) || 20);
    const totalResults = ranked.length;
    const paginated = ranked.slice((pageNum - 1) * pageSize, pageNum * pageSize);

    // 7. Calculate category & provider facets
    const categoryFacets = {};
    const providerFacets = {};
    allPolicies.forEach((p) => {
      categoryFacets[p.category] = (categoryFacets[p.category] || 0) + 1;
      providerFacets[p.provider] = (providerFacets[p.provider] || 0) + 1;
    });

    const executionTimeMs = Date.now() - startTime;

    // 8. Asynchronously log search query for analytics
    if (cleanQuery) {
      prisma.searchQueryLog.create({
        data: {
          userId: userId || null,
          query: cleanQuery,
          cleanedQuery: typoAnalysis.correctedQuery,
          intent: semanticConstraints.category ? 'AI_SEMANTIC' : synonymData.appliedSynonymMap.length > 0 ? 'SYNONYM' : 'KEYWORD',
          matchedCategory: semanticConstraints.category || (synonymData.detectedCategories[0] || null),
          resultsCount: totalResults,
          executionMs: executionTimeMs,
          hasTypoCorrection: typoAnalysis.hasCorrection,
          correctedQuery: typoAnalysis.hasCorrection ? typoAnalysis.correctedQuery : null,
          userAgent: userAgent || null,
        },
      }).catch((logErr) => console.warn('Could not log search query:', logErr.message));
    }

    return {
      results: paginated,
      total: totalResults,
      executionTimeMs,
      metadata: {
        totalResults,
        page: pageNum,
        limit: pageSize,
        totalPages: Math.ceil(totalResults / pageSize),
        executionTimeMs,
        query: cleanQuery,
        didYouMean: typoAnalysis.hasCorrection ? typoAnalysis.correctedQuery : null,
        appliedSynonyms: synonymData.appliedSynonymMap,
        detectedCategory: semanticConstraints.category || synonymData.detectedCategories[0] || null,
        semanticConstraints,
      },
      facets: {
        categories: categoryFacets,
        providers: providerFacets,
      },
    };
  }

  /**
   * Fast Auto-Complete & Prefix Suggestions (<30ms)
   */
  static async getAutocompleteSuggestions(prefix, limit = 8) {
    const q = (prefix || '').toLowerCase().trim();
    if (!q || q.length < 1) {
      return {
        suggestions: [],
        categories: [],
        topPolicies: [],
      };
    }

    const policies = await getCachedActivePolicies();

    const suggestions = [];
    const matchedCategories = [];
    const matchedProviders = new Set();
    const topPolicies = [];

    // Match categories
    const allCategories = ['HEALTH', 'LIFE', 'MOTOR', 'TRAVEL', 'HOME'];
    for (const cat of allCategories) {
      if (cat.toLowerCase().includes(q) || (INSURANCE_SYNONYMS[cat] && INSURANCE_SYNONYMS[cat].some(s => s.startsWith(q)))) {
        matchedCategories.push({
          type: 'CATEGORY',
          label: `${cat.charAt(0) + cat.slice(1).toLowerCase()} Insurance`,
          value: cat,
        });
      }
    }

    // Match policy titles and providers
    for (const p of policies) {
      const nameLower = p.name.toLowerCase();
      const provLower = p.provider.toLowerCase();

      if (nameLower.includes(q)) {
        if (topPolicies.length < 3) {
          topPolicies.push(p);
        }
        suggestions.push({
          type: 'POLICY',
          id: p.id,
          title: p.name,
          category: p.category,
          provider: p.provider,
          premium: p.premium,
        });
      } else if (provLower.includes(q)) {
        matchedProviders.add(p.provider);
      }
    }

    // Add provider suggestions
    matchedProviders.forEach((prov) => {
      suggestions.push({
        type: 'PROVIDER',
        title: `Policies by ${prov}`,
        value: prov,
      });
    });

    // Check typo correction if few suggestions
    let didYouMean = null;
    if (suggestions.length === 0) {
      const correction = this.getDidYouMean(q);
      if (correction.hasCorrection) {
        didYouMean = correction.correctedQuery;
      }
    }

    return {
      query: prefix,
      didYouMean,
      suggestions: suggestions.slice(0, limit),
      categories: matchedCategories.slice(0, 3),
      topPolicies,
    };
  }

  /**
   * Get Platform-Wide Trending Insurance Searches
   */
  static async getTrendingSearches() {
    try {
      const logs = await prisma.searchQueryLog.findMany({
        take: 100,
        orderBy: { createdAt: 'desc' },
        select: { query: true, matchedCategory: true, resultsCount: true },
      });

      const frequencyMap = {};
      logs.forEach((item) => {
        const q = item.query.trim().toLowerCase();
        if (q.length > 2) {
          frequencyMap[q] = (frequencyMap[q] || 0) + 1;
        }
      });

      const sortedQueries = Object.entries(frequencyMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8)
        .map(([q]) => q);

      // Fallback default trending queries if new DB
      const defaultTrending = [
        'Family Health Mediclaim',
        'Zero Depreciation Car Insurance',
        'Term Life 1 Crore Cover',
        'Cashless Hospitalization Plans',
        'Critical Illness Cover',
        'International Travel Schengen',
        'Senior Citizen Health Under 25000',
        'Two Wheeler Bike Insurance'
      ];

      return {
        trending: sortedQueries.length >= 3 ? sortedQueries : defaultTrending,
        popularCategories: [
          { category: 'HEALTH', label: 'Health Insurance', badge: 'Most Popular' },
          { category: 'MOTOR', label: 'Car & Bike Motor', badge: 'Instant Issuance' },
          { category: 'LIFE', label: 'Term Life Insurance', badge: 'High Tax Benefit' },
          { category: 'TRAVEL', label: 'Overseas Travel', badge: 'Instant Visa Approval' },
        ],
      };
    } catch (e) {
      return {
        trending: [
          'Family Health Mediclaim',
          'Zero Depreciation Car Insurance',
          'Term Life 1 Crore Cover',
          'Cashless Hospitalization Plans',
        ],
        popularCategories: [],
      };
    }
  }

  /**
   * Return Insurance Synonym Mapping Dictionary
   */
  static getSynonymsDictionary() {
    return {
      categorySynonyms: INSURANCE_SYNONYMS,
      generalSynonyms: GENERAL_SYNONYMS,
    };
  }
}

module.exports = SearchService;
