const router = require('express').Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const { create, getMyActivities, getActivityById, updateActivity } = require('../controllers/activity.controller');

router.post('/', authenticate, [
  body('type').optional().isIn(['running', 'pushup', 'pullup', 'chinning', 'situp']).withMessage('Invalid type'),
], create);

router.get('/', authenticate, getMyActivities);
router.get('/:id', authenticate, getActivityById);
router.put('/:id', authenticate, [
  body('distance').optional().isFloat({ min: 0 }).withMessage('Distance must be non-negative'),
  body('duration').optional().isFloat({ min: 0 }).withMessage('Duration must be non-negative'),
  body('pace').optional().isFloat({ min: 0 }).withMessage('Pace must be non-negative'),
  body('type').optional().isIn(['running', 'pushup', 'pullup', 'chinning', 'situp']).withMessage('Invalid type'),
  body('reps').optional().isInt({ min: 0 }).withMessage('Reps must be non-negative'),
], updateActivity);

router.delete('/:id', authenticate, async (req, res, next) => {
  try {
    const { Activity } = require('../models');
    const activity = await Activity.findOne({ where: { id: req.params.id, user_id: req.user.id } });
    if (!activity) return res.status(404).json({ message: 'Activity not found' });
    await activity.destroy();
    res.json({ message: 'Activity deleted' });
  } catch (err) { next(err); }
});

module.exports = router;
