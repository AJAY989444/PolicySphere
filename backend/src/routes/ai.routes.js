const { Router } = require('express');
const AIController = require('../controllers/ai.controller');

const router = Router();

// Public / open access AI chat assistant endpoint
router.post('/chat', AIController.chat);

module.exports = router;
