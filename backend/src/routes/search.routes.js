const { Router } = require('express');
const SearchController = require('../controllers/search.controller');
const { optionalAuth } = require('../middleware/auth');

const router = Router();

// Full text multi-criteria search
router.get('/', optionalAuth, SearchController.search);

// Fast autocomplete prefix suggestions (<30ms)
router.get('/autocomplete', optionalAuth, SearchController.autocomplete);

// AI Semantic query parser
router.post('/ai-semantic', optionalAuth, SearchController.semanticSearch);

// Platform trending searches
router.get('/trending', SearchController.trending);

// Domain synonyms dictionary
router.get('/synonyms', SearchController.synonyms);

module.exports = router;
