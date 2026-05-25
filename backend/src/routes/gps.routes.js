const router = require('express').Router();
const { body, query } = require('express-validator');
const { authenticate } = require('../middleware/auth.middleware');
const GPSController = require('../controllers/gps.controller');

/**
 * POST /api/activity/:id/route-points
 * Save a single route point
 */
router.post('/:id/route-points', authenticate, [
  body('latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('altitude').optional({ nullable: true }).isFloat().withMessage('Altitude must be a number'),
  body('accuracy').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Accuracy must be a positive number'),
  body('speed').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Speed must be a positive number'),
  body('timestamp').optional().isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
], GPSController.saveRoutePoint);

/**
 * POST /api/activity/:id/route-points/batch
 * Save multiple route points in batch
 */
router.post('/:id/route-points/batch', authenticate, [
  body('points').isArray({ min: 1 }).withMessage('Points must be a non-empty array'),
  body('points.*.latitude')
    .isFloat({ min: -90, max: 90 })
    .withMessage('Latitude must be between -90 and 90'),
  body('points.*.longitude')
    .isFloat({ min: -180, max: 180 })
    .withMessage('Longitude must be between -180 and 180'),
  body('points.*.altitude').optional({ nullable: true }).isFloat().withMessage('Altitude must be a number'),
  body('points.*.accuracy').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Accuracy must be a positive number'),
  body('points.*.speed').optional({ nullable: true }).isFloat({ min: 0 }).withMessage('Speed must be a positive number'),
  body('points.*.timestamp').optional({ nullable: true }).isISO8601().withMessage('Timestamp must be a valid ISO 8601 date'),
], GPSController.saveRoutePointsBatch);

/**
 * GET /api/activity/:id/route-points
 * Get route points for an activity
 */
router.get('/:id/route-points', authenticate, [
  query('limit').optional().isInt({ min: 1, max: 1000 }).withMessage('Limit must be between 1 and 1000'),
  query('offset').optional().isInt({ min: 0 }).withMessage('Offset must be a non-negative integer'),
], GPSController.getRoutePoints);

/**
 * GET /api/activity/:id/route-stats
 * Get route statistics
 */
router.get('/:id/route-stats', authenticate, GPSController.getRouteStats);

/**
 * DELETE /api/activity/:id/route-points
 * Delete route points for an activity
 */
router.delete('/:id/route-points', authenticate, GPSController.deleteRoutePoints);

module.exports = router;
