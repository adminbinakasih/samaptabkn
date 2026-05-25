const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getFeed } = require('../services/feed.service');

router.get('/', authenticate, async (req, res, next) => {
  try {
    const feed = await getFeed(req.user.id);
    res.json(feed);
  } catch (err) { next(err); }
});

module.exports = router;
