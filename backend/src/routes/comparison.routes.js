const { Router } = require('express');
const ComparisonController = require('../controllers/comparison.controller');

const router = Router();

// POST /api/policies/compare - Compare up to 4 policies
router.post('/compare', ComparisonController.compare);

module.exports = router;
