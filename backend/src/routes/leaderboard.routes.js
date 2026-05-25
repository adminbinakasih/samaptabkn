const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getLeaderboard } = require('../controllers/leaderboard.controller');

router.get('/', authenticate, getLeaderboard);

module.exports = router;
