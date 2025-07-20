CREATE TABLE IF NOT EXISTS `tour_hotel` (
  `tour_id` int NOT NULL,
  `hotel_id` int NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tour_id`, `hotel_id`),
  KEY `tour_id` (`tour_id`),
  KEY `hotel_id` (`hotel_id`)
);

CREATE TABLE IF NOT EXISTS `tour_included_service` (
  `tour_id` int NOT NULL,
  `included_service_id` varchar(36) NOT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`tour_id`, `included_service_id`),
  KEY `tour_id` (`tour_id`),
  KEY `included_service_id` (`included_service_id`)
);
