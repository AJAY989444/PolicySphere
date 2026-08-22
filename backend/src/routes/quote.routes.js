const { Router } = require('express');
const QuoteController = require('../controllers/quote.controller');

const router = Router();

router.post('/calculate', QuoteController.calculateQuote);

module.exports = router;
