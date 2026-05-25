-- BKN-Running Database Schema
-- Import file ini ke phpMyAdmin jika tidak menggunakan auto-sync Sequelize

CREATE DATABASE IF NOT EXISTS `bkn_running`
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `bkn_running`;

-- --------------------------------------------------------
-- Table: users
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `users` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `name`       VARCHAR(100) NOT NULL,
  `email`      VARCHAR(100) NOT NULL UNIQUE,
  `password`   VARCHAR(255) NOT NULL,
  `role`       ENUM('student','admin') NOT NULL DEFAULT 'student',
  `class`      VARCHAR(50)  DEFAULT NULL,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: activities
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `activities` (
  `id`         INT(11)    NOT NULL AUTO_INCREMENT,
  `user_id`    INT(11)    NOT NULL,
  `distance`   FLOAT      NOT NULL COMMENT 'Distance in KM',
  `duration`   FLOAT      NOT NULL COMMENT 'Duration in minutes',
  `pace`       FLOAT      NOT NULL COMMENT 'Pace in min/km (auto-calculated)',
  `type`       ENUM('running', 'pushup', 'pullup') NOT NULL DEFAULT 'running',
  `reps`       INT(11)    DEFAULT NULL COMMENT 'Repetitions for pushup/pullup',
  `created_at` DATETIME   NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  CONSTRAINT `fk_activities_user`
    FOREIGN KEY (`user_id`) REFERENCES `users` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Table: route_points
-- --------------------------------------------------------
CREATE TABLE IF NOT EXISTS `route_points` (
  `id`         INT(11)      NOT NULL AUTO_INCREMENT,
  `activity_id` INT(11)     NOT NULL,
  `latitude`   DECIMAL(10, 8) NOT NULL,
  `longitude`  DECIMAL(11, 8) NOT NULL,
  `altitude`   FLOAT        DEFAULT NULL COMMENT 'Altitude in meters',
  `accuracy`   FLOAT        DEFAULT NULL COMMENT 'GPS accuracy in meters',
  `speed`      FLOAT        DEFAULT NULL COMMENT 'Speed in m/s',
  `timestamp`  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `created_at` DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_activity_id` (`activity_id`),
  KEY `idx_timestamp` (`timestamp`),
  CONSTRAINT `fk_route_points_activity`
    FOREIGN KEY (`activity_id`) REFERENCES `activities` (`id`)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------
-- Sample admin account (password: admin123)
-- Ganti password setelah login pertama!
-- --------------------------------------------------------
INSERT INTO `users` (`name`, `email`, `password`, `role`, `class`) VALUES
(
  'Administrator',
  'admin@sekolah.id',
  '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
  'admin',
  NULL
);
