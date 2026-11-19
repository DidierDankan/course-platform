-- Demo accounts (seed:demo) have a public password, so the server refuses the writes that would break the demo for the
-- next visitor (courses, lessons, profile), and a daily reset puts back what visitors may change (purchases, reviews,
-- comments...). is_demo marks those accounts; only the seed sets it.
ALTER TABLE users ADD COLUMN is_demo TINYINT(1) NOT NULL DEFAULT 0;

-- When the demo was last reset. One row (id = 1), locked during a reset so two servers never reset at once.
CREATE TABLE demo_resets (
  id TINYINT NOT NULL PRIMARY KEY,
  last_reset_at DATETIME NOT NULL,
  CONSTRAINT demo_resets_one_row CHECK (id = 1)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
