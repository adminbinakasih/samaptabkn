-- Create route_points table for GPS tracking
USE bkn_running;

CREATE TABLE IF NOT EXISTS `route_points` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `activity_id` INT(11) NOT NULL,
  `latitude` DECIMAL(10, 8) NOT NULL,
  `longitude` DECIMAL(11, 8) NOT NULL,
  `altitude` FLOAT DEFAULT NULL,
  `accuracy` FLOAT DEFAULT NULL,
  `speed` FLOAT DEFAULT NULL,
  `timestamp` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_id` (`activity_id`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_route_points_activity`
    FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add type and reps columns to activities table if they don't exist
ALTER TABLE `activities` ADD COLUMN `type` ENUM('running', 'pushup', 'pullup') NOT NULL DEFAULT 'running' AFTER `pace`;
ALTER TABLE `activities` ADD COLUMN `reps` INT(11) DEFAULT NULL AFTER `type`;

-- Verify tables
SHOW TABLES;
DESCRIBE route_points;
DESCRIBE activities;
