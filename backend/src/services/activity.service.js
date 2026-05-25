const { Activity, User } = require('../models');
const { Op } = require('sequelize');

const createActivity = async (userId, { distance, duration, type, reps }) => {
  // Running activity — allow empty creation for GPS session start
  if (!type || type === 'running') {
    // If distance/duration not provided, create empty GPS session
    if (distance === undefined && duration === undefined) {
      return await Activity.create({ user_id: userId, distance: 0, duration: 0, pace: 0, type: 'running', reps: null });
    }
    if (distance <= 0 || duration <= 0) throw { status: 400, message: 'Distance and duration must be positive' };
    const pace = duration / distance;
    return await Activity.create({ user_id: userId, distance, duration, pace, type: 'running', reps: null });
  }
  // Push up / Pull up / Chinning / Sit up
  if (type === 'pushup' || type === 'pullup' || type === 'chinning' || type === 'situp') {
    if (!reps || reps <= 0) throw { status: 400, message: 'Reps must be positive' };
    return await Activity.create({ user_id: userId, distance: 0, duration: duration || 0, pace: 0, type, reps });
  }
  throw { status: 400, message: 'Invalid activity type' };
};

const getUserActivities = async (userId) => {
  return await Activity.findAll({
    where: { user_id: userId },
    order: [['created_at', 'DESC']],
  });
};

const getActivityById = async (id, userId) => {
  const activity = await Activity.findOne({ where: { id, user_id: userId } });
  if (!activity) throw { status: 404, message: 'Activity not found' };
  return activity;
};

const updateActivity = async (id, userId, { distance, duration, pace, type, reps }) => {
  const activity = await Activity.findOne({ where: { id, user_id: userId } });
  if (!activity) throw { status: 404, message: 'Activity not found' };

  const updateData = {};
  if (distance !== undefined) updateData.distance = distance;
  if (duration !== undefined) updateData.duration = duration;
  if (pace !== undefined) updateData.pace = pace;
  if (type !== undefined) updateData.type = type;
  if (reps !== undefined) updateData.reps = reps;

  await activity.update(updateData);
  return activity;
};

const getAllActivities = async () => {
  return await Activity.findAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'email', 'class'] }],
    order: [['created_at', 'DESC']],
  });
};

const getInactiveStudents = async (days = 7) => {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const activeUserIds = (await Activity.findAll({
    where: { created_at: { [Op.gte]: cutoff } },
    attributes: ['user_id'],
    group: ['user_id'],
  })).map(a => a.user_id);

  return await User.findAll({
    where: {
      role: 'student',
      id: { [Op.notIn]: activeUserIds.length ? activeUserIds : [0] },
    },
    attributes: ['id', 'name', 'email', 'class', 'created_at'],
  });
};

module.exports = { createActivity, getUserActivities, getActivityById, updateActivity, getAllActivities, getInactiveStudents };
