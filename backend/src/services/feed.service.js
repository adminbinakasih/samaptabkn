const { Activity, User } = require('../models');

const getFeed = async (userId) => {
  const activities = await Activity.findAll({
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'class'] }],
    order: [['created_at', 'DESC']],
    limit: 30,
  });
  return activities;
};

module.exports = { getFeed };
