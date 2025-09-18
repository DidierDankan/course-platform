// server/services/UserService.js
import db from '../db/connection.js';
import bcrypt from 'bcryptjs';

class UserService {
  async findByEmail(email) {
    const [rows] = await db.query('SELECT * FROM users WHERE email = ?', [email]);
    return rows[0] || null;
  }

  async createUser({ email, password, role }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    await db.query(
      'INSERT INTO users (email, password, role) VALUES (?, ?, ?)',
      [email, hashedPassword, role]
    );
  }

  async verifyPassword(inputPassword, hashedPassword) {
    return await bcrypt.compare(inputPassword, hashedPassword);
  }

  async getUserProfile(userId) {
    const [[user]] = await db.query(
      `SELECT 
          users.id, 
          users.email, 
          users.role,
          user_profiles.full_name,
          user_profiles.bio,
          user_profiles.phone,
          user_profiles.website,
          user_profiles.profile_image
      FROM users
      LEFT JOIN user_profiles ON user_profiles.user_id = users.id
      WHERE users.id = ?`,
      [userId]
    );

    if (!user) return null;

    const [skills] = await db.query('SELECT skill FROM user_skills WHERE user_id = ?', [userId]);
    const [qualifications] = await db.query(
      'SELECT title, institution, description, certificate_url, issued_at FROM qualifications WHERE user_id = ?',
      [userId]
    );

    return {
      ...user,
      skills: skills.map((s) => s.skill),
      qualifications: qualifications.map((q) => ({
        title: q.title,
        institution: q.institution,
        description: q.description,
        certificate_url: q.certificate_url,
        issued_at: q.issued_at,
      })),
    };
  }

  async updateUserProfile(userId, updates) {
    const insertData = { user_id: userId, ...updates };

    const sql = `
      INSERT INTO user_profiles SET ?
      ON DUPLICATE KEY UPDATE ?
    `;

    const [result] = await db.query(sql, [insertData, updates]);
    console.log("UPSERT RESULT USER PROFILE:", result);
  }

  async insertUserSkills(userId, skills) {
    if (!Array.isArray(skills) || skills.length === 0) return;

    const skillValues = skills.map(skill => [userId, skill]);

    const sql = `
      INSERT INTO user_skills (user_id, skill)
      VALUES ?
      ON DUPLICATE KEY UPDATE skill = VALUES(skill)
    `;

    const [result] = await db.query(sql, [skillValues]);
    console.log("UPSERT RESULT SKILLS:", result);
  }

  async insertUserQualifications(userId, qualifications) {
    if (!Array.isArray(qualifications) || qualifications.length === 0) return;

    const values = qualifications.map(q => [
      userId,
      q.title,
      q.institution,
      q.description,
      q.certificate_url,
      q.issued_at,
    ]);

    const sql = `
      INSERT INTO qualifications (user_id, title, institution, description, certificate_url, issued_at)
      VALUES ?
      ON DUPLICATE KEY UPDATE
        description = VALUES(description),
        certificate_url = VALUES(certificate_url),
        issued_at = VALUES(issued_at)
    `;

    const [result] = await db.query(sql, [values]);
    console.log("UPSERT RESULT QUALIFICATIONS:", result);
  }

}

export default new UserService();
