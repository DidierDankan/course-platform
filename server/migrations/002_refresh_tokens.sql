-- 002_refresh_tokens.sql (Stage 3)
-- Refresh tokens become server-side state, so they can be revoked: each row is one token, stored as the SHA-256 hash
-- of the 32 random bytes in the cookie (a stolen database copy can't be replayed as cookies; a high-entropy token needs
-- no slow hash like bcrypt). Every refresh revokes the row and adds its replacement in the same family (one family per
-- login); a revoked token presented again revokes the whole family. Logout revokes the family.

CREATE TABLE refresh_tokens (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  token_hash CHAR(64) NOT NULL,           -- hex SHA-256 of the cookie value
  family_id CHAR(32) NOT NULL,            -- 16 random bytes, hex: the same for every token of one login
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL DEFAULT NULL,
  replaced_by_id INT NULL DEFAULT NULL,   -- set when a refresh replaced this token (NULL when logout revoked it)
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  UNIQUE KEY uniq_refresh_token_hash (token_hash),
  KEY idx_refresh_family (family_id),
  KEY idx_refresh_user_expires (user_id, expires_at),
  CONSTRAINT fk_refresh_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT fk_refresh_replaced_by FOREIGN KEY (replaced_by_id) REFERENCES refresh_tokens(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
