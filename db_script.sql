CREATE TABLE `captchas` (
   `id` varchar(64) NOT NULL,
   `text` varchar(10) NOT NULL,
   `is_used` tinyint(1) DEFAULT '0',
   `attempts` int DEFAULT '0',
   `expires_at` datetime NOT NULL,
   `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
   PRIMARY KEY (`id`)
 ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci