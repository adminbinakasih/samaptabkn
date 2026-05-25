const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoutePoint = sequelize.define('RoutePoint', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  activity_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  latitude: {
    type: DataTypes.DECIMAL(10, 8),
    allowNull: false,
  },
  longitude: {
    type: DataTypes.DECIMAL(11, 8),
    allowNull: false,
  },
  altitude: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  accuracy: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  speed: {
    type: DataTypes.FLOAT,
    allowNull: true,
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
  },
}, {
  tableName: 'route_points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [
    {
      fields: ['activity_id'],
    },
    {
      fields: ['timestamp'],
    },
  ],
});

module.exports = RoutePoint;
