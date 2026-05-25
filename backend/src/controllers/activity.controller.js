const { validationResult } = require('express-validator');
const activityService = require('../services/activity.service');

const create = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const activity = await activityService.createActivity(req.user.id, req.body);
    res.status(201).json({ message: 'Activity recorded', activity });
  } catch (err) { next(err); }
};

const getMyActivities = async (req, res, next) => {
  try {
    const activities = await activityService.getUserActivities(req.user.id);
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

const getActivityById = async (req, res, next) => {
  try {
    const activity = await activityService.getActivityById(req.params.id, req.user.id);
    res.json(activity);
  } catch (err) {
    next(err);
  }
};

const updateActivity = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(422).json({ errors: errors.array() });
  try {
    const activity = await activityService.updateActivity(req.params.id, req.user.id, req.body);
    res.json({ message: 'Activity updated', activity });
  } catch (err) {
    next(err);
  }
};

module.exports = { create, getMyActivities, getActivityById, updateActivity };
