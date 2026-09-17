const SearchService = require('../services/search.service');

class SearchController {
  /**
   * GET /api/search
   * Execute full-text multi-criteria search with typo tolerance and synonym expansion
   */
  static async search(req, res) {
    try {
      const {
        q = '',
        category,
        minPremium,
        maxPremium,
        minCoverage,
        maxCoverage,
        sortBy = 'relevance',
        page = 1,
        limit = 20,
      } = req.query;

      const result = await SearchService.executeSearch({
        query: q,
        category,
        minPremium,
        maxPremium,
        minCoverage,
        maxCoverage,
        sortBy,
        page,
        limit,
        userId: req.user?.id || null,
        userAgent: req.headers['user-agent'] || null,
      });

      return res.status(200).json({
        success: true,
        data: result,
        ...result,
      });
    } catch (error) {
      console.error('SearchController.search error:', error);
      return res.status(500).json({
        success: false,
        message: 'Search execution encountered an error.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/search/autocomplete
   * Fast auto-complete and prefix suggestion endpoint (<30ms)
   */
  static async autocomplete(req, res) {
    try {
      const { q = '', limit = 8 } = req.query;
      const suggestions = await SearchService.getAutocompleteSuggestions(q, parseInt(limit, 10) || 8);

      return res.status(200).json({
        success: true,
        data: suggestions,
        ...suggestions,
      });
    } catch (error) {
      console.error('SearchController.autocomplete error:', error);
      return res.status(500).json({
        success: false,
        message: 'Autocomplete error.',
        error: error.message,
      });
    }
  }

  /**
   * POST /api/search/ai-semantic
   * Natural language AI query parser with entity constraint scoring
   */
  static async semanticSearch(req, res) {
    try {
      const { naturalQuery = '' } = req.body;
      if (!naturalQuery || naturalQuery.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Please provide a valid natural query for semantic analysis.',
        });
      }

      const searchResult = await SearchService.executeSearch({
        query: naturalQuery,
        userId: req.user?.id || null,
        userAgent: req.headers['user-agent'] || null,
      });

      return res.status(200).json({
        success: true,
        naturalQuery,
        constraints: searchResult.metadata.semanticConstraints,
        results: searchResult.results,
        totalMatches: searchResult.metadata.totalResults,
        executionTimeMs: searchResult.metadata.executionTimeMs,
      });
    } catch (error) {
      console.error('SearchController.semanticSearch error:', error);
      return res.status(500).json({
        success: false,
        message: 'AI semantic search encountered an error.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/search/trending
   * Top platform queries and popular categories
   */
  static async trending(req, res) {
    try {
      const trendingData = await SearchService.getTrendingSearches();
      return res.status(200).json({
        success: true,
        data: trendingData,
        ...trendingData,
      });
    } catch (error) {
      console.error('SearchController.trending error:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not fetch trending searches.',
        error: error.message,
      });
    }
  }

  /**
   * GET /api/search/synonyms
   * Returns domain synonyms dictionary
   */
  static async synonyms(req, res) {
    try {
      const dict = SearchService.getSynonymsDictionary();
      return res.status(200).json({
        success: true,
        ...dict,
      });
    } catch (error) {
      console.error('SearchController.synonyms error:', error);
      return res.status(500).json({
        success: false,
        message: 'Could not fetch synonyms dictionary.',
        error: error.message,
      });
    }
  }
}

module.exports = SearchController;
