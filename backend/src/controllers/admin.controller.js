const userService = require('../services/user.service');
const activityService = require('../services/activity.service');

const getAllUsers = async (req, res, next) => {
  try {
    const { class: filterClass } = req.query;
    let users = await userService.getAllUsers();
    if (filterClass) users = users.filter(u => u.class === filterClass);
    res.json(users);
  } catch (err) {
    next(err);
  }
};

const getAllActivities = async (req, res, next) => {
  try {
    const activities = await activityService.getAllActivities();
    res.json(activities);
  } catch (err) {
    next(err);
  }
};

const getInactiveStudents = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const students = await activityService.getInactiveStudents(days);
    res.json({ inactive_since_days: days, count: students.length, students });
  } catch (err) {
    next(err);
  }
};

module.exports = { getAllUsers, getAllActivities, getInactiveStudents };
