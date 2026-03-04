import db from "./connection.js";

class PublicService {
  async getSellerPublic(sellerId) {
    const [[row]] = await db.query(
      `
      SELECT
        u.id,
        up.full_name,
        up.profile_image
      FROM users u
      LEFT JOIN user_profiles up ON up.user_id = u.id
      WHERE u.id = ? AND u.role IN ('seller','admin')
      LIMIT 1
      `,
      [sellerId]
    );

    return row || null;
  }

  async getSellerPrivate(sellerId) {
    const [[row]] = await db.query(
      `
      SELECT
        up.bio,
        up.website
      FROM user_profiles up
      WHERE up.user_id = ?
      LIMIT 1
      `,
      [sellerId]
    );

    // skills (private-ish)
    const [skillsRows] = await db.query(
      `SELECT skill FROM user_skills WHERE user_id = ? ORDER BY skill ASC`,
      [sellerId]
    );

    // qualifications (private-ish)
    const [qualRows] = await db.query(
      `
      SELECT title, institution, description, certificate_url, issued_at
      FROM qualifications
      WHERE user_id = ?
      ORDER BY issued_at DESC
      `,
      [sellerId]
    );

    return {
      bio: row?.bio || null,
      website: row?.website || null,
      skills: skillsRows.map((s) => s.skill),
      qualifications: qualRows,
    };
  }

  async getSellerCourses(sellerId) {
    const [rows] = await db.query(
      `
      SELECT
        c.id,
        c.title,
        c.description,
        c.price,
        c.created_at,
        MAX(CASE WHEN m.type = 'image' THEN m.url END) AS thumbnail_url,
        SUM(CASE WHEN m.type = 'video' THEN COALESCE(m.duration,0) ELSE 0 END) AS total_duration
      FROM courses c
      LEFT JOIN course_media m ON m.course_id = c.id
      WHERE c.seller_id = ?
      GROUP BY c.id
      ORDER BY c.created_at DESC
      `,
      [sellerId]
    );

    return rows;
  }
}

export default new PublicService();