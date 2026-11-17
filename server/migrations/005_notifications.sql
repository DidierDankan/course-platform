-- 005_notifications.sql (Stage 4c)
-- Tells a seller about a new review or comment on one of their courses. Each row is written in the same transaction as
-- the review or comment it announces. source_id points at a review or a comment (no FK: two possible tables), so a
-- deleted comment leaves its notification, which still names the course. The client polls (no WebSockets: see TODO).

CREATE TABLE notifications (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,                       -- who is told: the course's seller
  type ENUM('review', 'comment') NOT NULL,
  course_id INT NOT NULL,
  source_id INT NOT NULL,                     -- reviews.id or comments.id, by type
  actor_id INT NULL,                          -- who wrote it (NULL once that account is deleted)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at TIMESTAMP NULL DEFAULT NULL,

  KEY idx_notification_unread (user_id, read_at),
  KEY idx_notification_list (user_id, created_at, id),
  CONSTRAINT fk_notification_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_notification_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
