const { validationResult } = require('express-validator');
const GPSService = require('../services/gps.service');

class GPSController {
  /**
   * Save a single route point
   * POST /api/activity/:id/route-points
   */
  static async saveRoutePoint(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { id: activityId } = req.params;
      const { latitude, longitude, altitude, accuracy, speed, timestamp } = req.body;

      const routePoint = await GPSService.saveRoutePoint(activityId, {
        latitude,
        longitude,
        altitude,
        accuracy,
        speed,
        timestamp: timestamp ? new Date(timestamp) : new Date(),
      });

      res.status(201).json({
        success: true,
        message: 'Route point saved successfully',
        data: routePoint,
      });
    } catch (error) {
      console.error('Error saving route point:', error);
      res.status(error.message === 'Activity not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to save route point',
      });
    }
  }

  /**
   * Save multiple route points in batch
   * POST /api/activity/:id/route-points/batch
   */
  static async saveRoutePointsBatch(req, res) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation error',
          errors: errors.array(),
        });
      }

      const { id: activityId } = req.params;
      const { points } = req.body;

      if (!Array.isArray(points) || points.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Points must be a non-empty array',
        });
      }

      const routePoints = await GPSService.saveRoutePointsBatch(
        activityId,
        points.map(p => ({
          latitude: p.latitude,
          longitude: p.longitude,
          altitude: p.altitude,
          accuracy: p.accuracy,
          speed: p.speed,
          timestamp: p.timestamp ? new Date(p.timestamp) : new Date(),
        }))
      );

      res.status(201).json({
        success: true,
        message: `${routePoints.length} route points saved successfully`,
        data: {
          count: routePoints.length,
          points: routePoints,
        },
      });
    } catch (error) {
      console.error('Error saving route points batch:', error);
      res.status(error.message === 'Activity not found' ? 404 : 500).json({
        success: false,
        message: error.message || 'Failed to save route points',
      });
    }
  }

  /**
   * Get route points for an activity
   * GET /api/activity/:id/route-points
   */
  static async getRoutePoints(req, res) {
    try {
      const { id: activityId } = req.params;
      const { limit = 100, offset = 0 } = req.query;

      const limitNum = Math.min(Math.max(parseInt(limit) || 100, 1), 1000);
      const offsetNum = Math.max(parseInt(offset) || 0, 0);

      const result = await GPSService.getRoutePointsPaginated(
        activityId,
        limitNum,
        offsetNum
      );

      res.status(200).json({
        success: true,
        message: 'Route points retrieved successfully',
        data: result,
      });
    } catch (error) {
      console.error('Error retrieving route points:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route points',
      });
    }
  }

  /**
   * Get route statistics
   * GET /api/activity/:id/route-stats
   */
  static async getRouteStats(req, res) {
    try {
      const { id: activityId } = req.params;

      const stats = await GPSService.calculateRouteStats(activityId);

      res.status(200).json({
        success: true,
        message: 'Route statistics retrieved successfully',
        data: stats,
      });
    } catch (error) {
      console.error('Error retrieving route statistics:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to retrieve route statistics',
      });
    }
  }

  /**
   * Delete route points for an activity
   * DELETE /api/activity/:id/route-points
   */
  static async deleteRoutePoints(req, res) {
    try {
      const { id: activityId } = req.params;

      const deletedCount = await GPSService.deleteRoutePoints(activityId);

      res.status(200).json({
        success: true,
        message: `${deletedCount} route points deleted successfully`,
        data: {
          deletedCount,
        },
      });
    } catch (error) {
      console.error('Error deleting route points:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to delete route points',
      });
    }
  }
}

module.exports = GPSController;
