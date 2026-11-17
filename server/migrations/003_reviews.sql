-- 003_reviews.sql (Stage 4)
-- One review per student per course: a rating from 1 to 5 and an optional text. Only enrolled students who don't own
-- the course may write one (checked in the server); every average is computed from this table, never sent by a client.
-- The CHECK keeps the rating in range even for a write that skips the server's validator (MySQL 8.0.16+ enforces it).

CREATE TABLE reviews (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  user_id INT NOT NULL,
  rating TINYINT NOT NULL,
  body VARCHAR(1000) NULL DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT chk_review_rating CHECK (rating BETWEEN 1 AND 5),
  UNIQUE KEY uniq_review_user_course (user_id, course_id),
  KEY idx_review_course_created (course_id, created_at, id),
  CONSTRAINT fk_review_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_review_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
