const { Activity, User } = require('../models');
const { sequelize } = require('../models');

const getLeaderboard = async () => {
  const results = await Activity.findAll({
    attributes: [
      'user_id',
      [sequelize.fn('SUM', sequelize.col('distance')), 'total_distance'],
      [sequelize.fn('COUNT', sequelize.col('Activity.id')), 'total_runs'],
    ],
    include: [{ model: User, as: 'user', attributes: ['id', 'name', 'class'] }],
    group: ['user_id', 'user.id'],
    order: [[sequelize.literal('total_distance'), 'DESC']],
  });

  return results.map((r, index) => ({
    rank: index + 1,
    user_id: r.user_id,
    name: r.user.name,
    class: r.user.class,
    total_distance: parseFloat(r.dataValues.total_distance).toFixed(2),
    total_runs: parseInt(r.dataValues.total_runs),
  }));
};

module.exports = { getLeaderboard };
