const { Router } = require('express');
const UserController = require('../controllers/user.controller');
const { requireAuth } = require('../middleware/auth');

const router = Router();

// All user routes require authentication
router.use(requireAuth);

router.get('/profile', UserController.getProfile);
router.put('/profile', UserController.updateProfile);

module.exports = router;
