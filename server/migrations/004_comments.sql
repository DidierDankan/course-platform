-- 004_comments.sql (Stage 4b)
-- An open discussion per course, shown under the video on the watch page. Enrolled students, the course's owner and
-- admins may post (checked in the server); the author, the owner or an admin may delete. No editing, so no updated_at.

CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  course_id INT NOT NULL,
  user_id INT NOT NULL,
  body VARCHAR(2000) NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  KEY idx_comment_course_created (course_id, created_at, id),
  CONSTRAINT fk_comment_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE,
  CONSTRAINT fk_comment_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
