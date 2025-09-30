// server/services/UserService.js
import db from '../db/connection.js';
import bcrypt from 'bcryptjs';
import path from 'path'
import { deleteFileIfExists } from '../utils/fileUtils.js';

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

  static async getProfileImage(userId) {
    const [rows] = await db.query(
      "SELECT profile_image FROM user_profiles WHERE user_id = ? LIMIT 1",
      [userId]
    );
    return rows.length ? rows[0].profile_image : null;
  }

  async deleteProfileImage(userId) {
    const oldImage = await UserService.getProfileImage(userId);
    if (!oldImage) return;

    const oldPath = path.join(process.cwd(), "uploads", oldImage);
    await deleteFileIfExists(oldPath);

    // Optionally clear DB column
    await db.query(
      "UPDATE user_profiles SET profile_image = NULL WHERE user_id = ?",
      [userId]
    );
  }

  async updateUserProfile(userId, updates) {
    if (!Object.keys(updates).length) return; // nothing to update

    const insertData = { user_id: userId, ...updates };

    const sql = `
      INSERT INTO user_profiles SET ?
      ON DUPLICATE KEY UPDATE ?
    `;

    await db.query(sql, [insertData, updates]);
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
  }

}

export default new UserService();
