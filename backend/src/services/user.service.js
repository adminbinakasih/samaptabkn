const { User, Activity } = require('../models');
const { sequelize } = require('../models');

const getProfile = async (userId) => {
  const user = await User.findByPk(userId, {
    attributes: ['id', 'name', 'email', 'role', 'class', 'created_at'],
  });
  if (!user) throw { status: 404, message: 'User not found' };

  const stats = await Activity.findOne({
    where: { user_id: userId },
    attributes: [
      [sequelize.fn('SUM', sequelize.col('distance')), 'total_distance'],
      [sequelize.fn('COUNT', sequelize.col('id')), 'total_runs'],
    ],
  });

  return {
    ...user.toJSON(),
    total_distance: parseFloat(stats.dataValues.total_distance || 0).toFixed(2),
    total_runs: parseInt(stats.dataValues.total_runs || 0),
  };
};

const getAllUsers = async () => {
  return await User.findAll({
    where: { role: 'student' },
    attributes: ['id', 'name', 'email', 'class', 'created_at'],
    order: [['name', 'ASC']],
  });
};

module.exports = { getProfile, getAllUsers };
