const router = require('express').Router();
const { authenticate } = require('../middleware/auth.middleware');
const { getWeeklyChart, getStreak, getAchievements } = require('../services/stats.service');

router.get('/weekly', authenticate, async (req, res, next) => {
  try { res.json(await getWeeklyChart(req.user.id)); } catch (err) { next(err); }
});

router.get('/streak', authenticate, async (req, res, next) => {
  try { res.json(await getStreak(req.user.id)); } catch (err) { next(err); }
});

router.get('/achievements', authenticate, async (req, res, next) => {
  try { res.json(await getAchievements(req.user.id)); } catch (err) { next(err); }
});

module.exports = router;
