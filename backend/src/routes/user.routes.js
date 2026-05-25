const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getProfile } = require('../controllers/user.controller');

router.get('/profile', authenticate, getProfile);

module.exports = router;
