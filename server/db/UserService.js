import db from './connection.js';
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
}

export default new UserService();
