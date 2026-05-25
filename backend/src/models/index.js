const sequelize = require('../config/database');
const User = require('./user.model');
const Activity = require('./activity.model');
const RoutePoint = require('./routePoint.model');

// Associations
User.hasMany(Activity, { foreignKey: 'user_id', as: 'activities' });
Activity.belongsTo(User, { foreignKey: 'user_id', as: 'user' });
Activity.hasMany(RoutePoint, { foreignKey: 'activity_id', as: 'routePoints' });
RoutePoint.belongsTo(Activity, { foreignKey: 'activity_id', as: 'activity' });

module.exports = { sequelize, User, Activity, RoutePoint };
