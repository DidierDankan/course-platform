// server/db/SeoService.js
// What the sitemap lists: every course (Browse shows them all; there is no draft state) and every instructor who has
// at least one course (an instructor page without courses has nothing for a search engine).
import db from "./connection.js";

// The sitemap protocol allows 50,000 URLs per file; far beyond this project, but the query stays bounded.
export const SITEMAP_MAX_ROWS = 50000;

class SeoService {
  async sitemapEntries() {
    const [courses] = await db.query("SELECT id FROM courses ORDER BY id LIMIT ?", [SITEMAP_MAX_ROWS]);
    const [sellers] = await db.query(
      `SELECT DISTINCT c.seller_id AS id
         FROM courses c
         JOIN users u ON u.id = c.seller_id AND u.role IN ('seller', 'admin')
        ORDER BY c.seller_id
        LIMIT ?`,
      [SITEMAP_MAX_ROWS]
    );
    return { courseIds: courses.map((c) => c.id), sellerIds: sellers.map((s) => s.id) };
  }
}

export default new SeoService();
