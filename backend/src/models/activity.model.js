const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Activity = sequelize.define('Activity', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  user_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  distance: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Distance in KM',
  },
  duration: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Duration in minutes',
  },
  pace: {
    type: DataTypes.FLOAT,
    allowNull: false,
    comment: 'Pace in min/km (auto-calculated)',
  },
  type: {
    type: DataTypes.ENUM('running', 'pushup', 'pullup', 'chinning', 'situp'),
    defaultValue: 'running',
  },
  reps: {
    type: DataTypes.INTEGER,
    allowNull: true,
    comment: 'Repetitions for pushup/pullup',
  },
}, {
  tableName: 'activities',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
});

module.exports = Activity;
