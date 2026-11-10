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
    // 1️⃣ Normalize inputs
    const normalizedEmail = email.trim().toLowerCase();
    const normalizedRole = role.toLowerCase();

    // 2️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3️⃣ Insert user and return result
    const [result] = await db.query(
      "INSERT INTO users (email, password, role) VALUES (?, ?, ?)",
      [normalizedEmail, hashedPassword, normalizedRole]
    );

    // 4️⃣ Return the created user (so controller can send it)
    return {
      id: result.insertId,
      email: normalizedEmail,
      role: normalizedRole,
    };
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

  // The form always sends the whole list, so the list is replaced: anything removed there goes
  // away here too, in one transaction, so a failed insert keeps the old list.
  async replaceRows(deleteSql, userId, insertSql, rows) {
    const conn = await db.getConnection();
    try {
      await conn.beginTransaction();
      await conn.query(deleteSql, [userId]);
      if (rows.length) await conn.query(insertSql, [rows]);
      await conn.commit();
    } catch (err) {
      await conn.rollback();
      throw err;
    } finally {
      conn.release();
    }
  }

  async replaceUserSkills(userId, skills) {
    await this.replaceRows(
      "DELETE FROM user_skills WHERE user_id = ?",
      userId,
      "INSERT INTO user_skills (user_id, skill) VALUES ?",
      [...new Set(skills)].map((skill) => [userId, skill])
    );
  }

  async replaceUserQualifications(userId, qualifications) {
    await this.replaceRows(
      "DELETE FROM qualifications WHERE user_id = ?",
      userId,
      `INSERT INTO qualifications (user_id, title, institution, description, certificate_url, issued_at)
       VALUES ?
       ON DUPLICATE KEY UPDATE
         description = VALUES(description),
         certificate_url = VALUES(certificate_url),
         issued_at = VALUES(issued_at)`,
      qualifications.map((q) => [
        userId,
        q.title,
        q.institution,
        q.description,
        q.certificate_url,
        q.issued_at || null, // an empty date input sends ""
      ])
    );
  }

}

export default new UserService();
