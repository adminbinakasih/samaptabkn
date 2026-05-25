const { RoutePoint, Activity } = require('../models');

class GPSService {
  /**
   * Calculate distance between two coordinates using Haversine formula
   * @param {number} lat1 - Latitude of first point
   * @param {number} lon1 - Longitude of first point
   * @param {number} lat2 - Latitude of second point
   * @param {number} lon2 - Longitude of second point
   * @returns {number} Distance in kilometers
   */
  static calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) *
        Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate total distance from array of points
   * @param {Array} points - Array of points with latitude and longitude
   * @returns {number} Total distance in kilometers
   */
  static calculateTotalDistance(points) {
    if (!points || points.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < points.length - 1; i++) {
      const distance = this.calculateDistance(
        parseFloat(points[i].latitude),
        parseFloat(points[i].longitude),
        parseFloat(points[i + 1].latitude),
        parseFloat(points[i + 1].longitude)
      );
      totalDistance += distance;
    }
    return totalDistance;
  }

  /**
   * Save a single route point
   * @param {number} activityId - Activity ID
   * @param {Object} pointData - Point data
   * @returns {Promise<Object>} Saved route point
   */
  static async saveRoutePoint(activityId, pointData) {
    try {
      // Verify activity exists
      const activity = await Activity.findByPk(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const routePoint = await RoutePoint.create({
        activity_id: activityId,
        latitude: pointData.latitude,
        longitude: pointData.longitude,
        altitude: pointData.altitude || null,
        accuracy: pointData.accuracy || null,
        speed: pointData.speed || null,
        timestamp: pointData.timestamp || new Date(),
      });

      return routePoint;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Save multiple route points in batch
   * @param {number} activityId - Activity ID
   * @param {Array} points - Array of point data
   * @returns {Promise<Array>} Array of saved route points
   */
  static async saveRoutePointsBatch(activityId, points) {
    try {
      // Verify activity exists
      const activity = await Activity.findByPk(activityId);
      if (!activity) {
        throw new Error('Activity not found');
      }

      const routePoints = await RoutePoint.bulkCreate(
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

      return routePoints;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all route points for an activity
   * @param {number} activityId - Activity ID
   * @returns {Promise<Array>} Array of route points
   */
  static async getRoutePoints(activityId) {
    try {
      const routePoints = await RoutePoint.findAll({
        where: { activity_id: activityId },
        order: [['timestamp', 'ASC']],
      });

      return routePoints;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get paginated route points
   * @param {number} activityId - Activity ID
   * @param {number} limit - Number of points per page
   * @param {number} offset - Pagination offset
   * @returns {Promise<Object>} Paginated route points
   */
  static async getRoutePointsPaginated(activityId, limit = 100, offset = 0) {
    try {
      const { count, rows } = await RoutePoint.findAndCountAll({
        where: { activity_id: activityId },
        order: [['timestamp', 'ASC']],
        limit,
        offset,
      });

      return {
        total: count,
        limit,
        offset,
        data: rows,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Calculate route statistics
   * @param {number} activityId - Activity ID
   * @returns {Promise<Object>} Route statistics
   */
  static async calculateRouteStats(activityId) {
    try {
      const routePoints = await this.getRoutePoints(activityId);

      if (routePoints.length === 0) {
        return {
          totalDistance: 0,
          pointCount: 0,
          avgSpeed: 0,
          maxSpeed: 0,
          avgAltitude: 0,
          maxAltitude: 0,
          minAltitude: 0,
        };
      }

      const totalDistance = this.calculateTotalDistance(routePoints);
      const speeds = routePoints
        .filter(p => p.speed !== null)
        .map(p => parseFloat(p.speed));
      const altitudes = routePoints
        .filter(p => p.altitude !== null)
        .map(p => parseFloat(p.altitude));

      const avgSpeed = speeds.length > 0 ? speeds.reduce((a, b) => a + b, 0) / speeds.length : 0;
      const maxSpeed = speeds.length > 0 ? Math.max(...speeds) : 0;
      const avgAltitude = altitudes.length > 0 ? altitudes.reduce((a, b) => a + b, 0) / altitudes.length : 0;
      const maxAltitude = altitudes.length > 0 ? Math.max(...altitudes) : 0;
      const minAltitude = altitudes.length > 0 ? Math.min(...altitudes) : 0;

      return {
        totalDistance,
        pointCount: routePoints.length,
        avgSpeed,
        maxSpeed,
        avgAltitude,
        maxAltitude,
        minAltitude,
      };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete all route points for an activity
   * @param {number} activityId - Activity ID
   * @returns {Promise<number>} Number of deleted points
   */
  static async deleteRoutePoints(activityId) {
    try {
      const deletedCount = await RoutePoint.destroy({
        where: { activity_id: activityId },
      });

      return deletedCount;
    } catch (error) {
      throw error;
    }
  }
}

module.exports = GPSService;
