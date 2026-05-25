#!/bin/bash

# Deploy GPS Tracking Backend Files
# Run this script on VPS: bash DEPLOY_BACKEND_SIMPLE.sh

cd /var/www/bkn-running/backend/src

echo "=== Creating routePoint.model.js ==="
cat > models/routePoint.model.js << 'MODELEOF'
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RoutePoint = sequelize.define('RoutePoint', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  activity_id: { type: DataTypes.INTEGER, allowNull: false },
  latitude: { type: DataTypes.DECIMAL(10, 8), allowNull: false },
  longitude: { type: DataTypes.DECIMAL(11, 8), allowNull: false },
  altitude: { type: DataTypes.FLOAT, allowNull: true },
  accuracy: { type: DataTypes.FLOAT, allowNull: true },
  speed: { type: DataTypes.FLOAT, allowNull: true },
  timestamp: { type: DataTypes.DATE, allowNull: false },
}, {
  tableName: 'route_points',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false,
  indexes: [{ fields: ['activity_id'] }, { fields: ['timestamp'] }],
});

module.exports = RoutePoint;
MODELEOF

echo "✓ routePoint.model.js created"

echo "=== Creating gps.service.js ==="
cat > services/gps.service.js << 'SERVICEEOF'
const { RoutePoint, Activity } = require('../models');

class GPSService {
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  static calculateTotalDistance(points) {
    if (!points || points.length < 2) return 0;
    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const distance = this.calculateDistance(
        parseFloat(points[i].latitude), parseFloat(points[i].longitude),
        parseFloat(points[i + 1].latitude), parseFloat(points[i + 1].longitude)
      );
      totalDistance += distance;
    }
    return totalDistance;
  }

  static async saveRoutePoint(activityId, pointData) {
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new Error('Activity not found');
    return await RoutePoint.create({
      activity_id: activityId,
      latitude: pointData.latitude,
      longitude: pointData.longitude,
      altitude: pointData.altitude || null,
      accuracy: pointData.accuracy || null,
      speed: pointData.speed || null,
      timestamp: pointData.timestamp || new Date(),
    });
  }

  static async saveRoutePointsBatch(activityId, points) {
    const activity = await Activity.findByPk(activityId);
    if (!activity) throw new Error('Activity not found');
    return await RoutePoint.bulkCreate(
      points.map(point => ({
        activity_id: activityId,
        latitude: point.latitude,
        longitude: point.longitude,
        altitude: point.altitude || null,
        accuracy: point.accuracy || null,
        speed: point.speed || null,
        timestamp: point.timestamp || new Date(),
      }))
    );
  }

  static async getRoutePoints(activityId) {
    return await RoutePoint.findAll({
      where: { activity_id: activityId },
      order: [['timestamp', 'ASC']],
    });
  }

  static async getRoutePointsPaginated(activityId, limit = 100, offset = 0) {
    const { count, rows } = await RoutePoint.findAndCountAll({
      where: { activity_id: activityId },
      order: [['timestamp', 'ASC']],
      limit, offset,
    });
    return { total: count, limit, offset, data: rows };
  }

  static async calculateRouteStats(activityId) {
    const routePoints = await this.getRoutePoints(activityId);
    if (routePoints.length === 0) {
      return { totalDistance: 0, pointCount: 0, avgSpeed: 0, maxSpeed: 0, avgAltitude: 0, maxAltitude: 0, minAltitude: 0 };
    }
    const totalDistance = this.calculateTotalDistance(routePoints);
    const speeds = routePoints.filter(p => p.speed !== null).map(p => parseFloat(p.speed));
    const altitudes = routePoints.filter(p => p.altitude !== null).map(p => parseFloat(p.altitude));
    return {
      totalDistance,
      pointCount: routePoints.length,
      avgSpeed: speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0,
      maxSpeed: speeds.length > 0 ? Math.max(...speeds) : 0,
      avgAltitude: altitudes.length > 0 ? altitudes.reduce((a, b) => a + b, 0) / altitudes.length : 0,
      maxAltitude: altitudes.length > 0 ? Math.max(...altitudes) : 0,
      minAltitude: altitudes.length > 0 ? Math.min(...altitudes) : 0,
    };
  }

  static async deleteRoutePoints(activityId) {
    return await RoutePoint.destroy({ where: { activity_id: activityId } });
  }
}

module.exports = GPSService;
SERVICEEOF

echo "✓ gps.service.js created"

echo "=== Creating gps.controller.js ==="
cat > controllers/gps.controller.js << 'CONTROLLEREOF'
const { validationResult } = require('express-validator');
const GPSService = require('../services/gps.service');

class GPSController {
  static async saveRoutePoint(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
      const { id: activityId } = req.params;
      const { latitude, longitude, altitude, accuracy, speed, timestamp } = req.body;
      const routePoint = await GPSService.saveRoutePoint(activityId, { latitude, longitude, altitude, accuracy, speed, timestamp: timestamp ? new Date(timestamp) : new Date() });
      res.status(201).json({ success: true, message: 'Route point saved successfully', data: routePoint });
    } catch (error) {
      res.status(error.message === 'Activity not found' ? 404 : 500).json({ success: false, message: error.message || 'Failed to save route point' });
    }
  }

  static async saveRoutePointsBatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) return res.status(400).json({ success: false, message: 'Validation error', errors: errors.array() });
      const { id: activityId } = req.params;
      const { points } = req.body;
      if (!Array.isArray(points) || points.length === 0) return res.status(400).json({ success: false, message: 'Points must be a non-empty array' });
      const routePoints = await GPSService.saveRoutePointsBatch(activityId, points.map(p => ({ latitude: p.latitude, longitude: p.longitude, altitude: p.altitude, accuracy: p.accuracy, speed: p.speed, timestamp: p.timestamp ? new Date(p.timestamp) : new Date() })));
      res.status(201).json({ success: true, message: `${routePoints.length} route points saved successfully`, data: { count: routePoints.length, points: routePoints } });
    } catch (error) {
      res.status(error.message === 'Activity not found' ? 404 : 500).json({ success: false, message: error.message || 'Failed to save route points' });
    }
  }

  static async getRoutePoints(req, res) {
    try {
      const { id: activityId } = req.params;
      const { limit = 100, offset = 0 } = req.query;
      const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
      const offsetNum = Math.max(parseInt(offset) || 0, 0);
      const result = await GPSService.getRoutePointsPaginated(activityId, limitNum, offsetNum);
      res.status(200).json({ success: true, message: 'Route points retrieved successfully', data: result });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve route points' });
    }
  }

  static async getRouteStats(req, res) {
    try {
      const { id: activityId } = req.params;
      const stats = await GPSService.calculateRouteStats(activityId);
      res.status(200).json({ success: true, message: 'Route statistics retrieved successfully', data: stats });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to retrieve route statistics' });
    }
  }

  static async deleteRoutePoints(req, res) {
    try {
      const { id: activityId } = req.params;
      const deletedCount = await GPSService.deleteRoutePoints(activityId);
      res.status(200).json({ success: true, message: `${deletedCount} route points deleted successfully`, data: { deletedCount } });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message || 'Failed to delete route points' });
    }
  }
}

module.exports = GPSController;
CONTROLLEREOF

echo "✓ gps.controller.js created"

echo "=== Creating gps.routes.js ==="
cat > routes/gps.routes.js << 'ROUTESEOF'
const router = require('express').Router();
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const GPSController = require('../controllers/gps.controller');

router.post('/activity/:id/route-points', authenticate, [
  body('latitude').isFloat({ min: -90, max: 90 }).withMessage('Latitude must be between -90 and 90'),
  body('longitude').isFloat({ min: -180, max: 180 }).withMessage('Longitude must be between -180 and 180'),
], GPSController.saveRoutePoint);

router.post('/activity/:id/route-points/batch', authenticate, [
  body('points').isArray({ min: 1 }).withMessage('Points must be a non-empty array'),
], GPSController.saveRoutePointsBatch);

router.get('/activity/:id/route-points', authenticate, GPSController.getRoutePoints);
router.get('/activity/:id/route-stats', authenticate, GPSController.getRouteStats);
router.delete('/activity/:id/route-points', authenticate, GPSController.deleteRoutePoints);

module.exports = router;
ROUTESEOF

echo "✓ gps.routes.js created"

echo ""
echo "=== All backend files created successfully! ==="
echo ""
echo "Next steps:"
echo "1. Verify files were created:"
echo "   ls -la models/routePoint.model.js"
echo "   ls -la services/gps.service.js"
echo "   ls -la controllers/gps.controller.js"
echo "   ls -la routes/gps.routes.js"
echo ""
echo "2. Restart backend:"
echo "   cd /var/www/bkn-running"
echo "   pm2 restart bkn-backend"
echo ""
echo "3. Check status:"
echo "   pm2 status"
echo "   pm2 logs bkn-backend --lines 20"
