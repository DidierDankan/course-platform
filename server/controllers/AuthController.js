import jwt from 'jsonwebtoken';
import UserService from '../db/UserService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret';

class AuthController {
  async register(req, res) {
    const { email, password, role } = req.body;

    if (!email || !password || !role) {
      return res.status(400).json({ message: 'All fields are required.' });
    }

    if (role === 'admin') {
        return res.status(403).json({ message: 'Cannot assign admin role via registration.' });
    }

    try {
      const existingUser = await UserService.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({ message: 'Email already registered.' });
      }

      await UserService.createUser({ email, password, role });
      return res.status(201).json({ message: 'User registered successfully.' });
    } catch (err) {
      console.error('Register error:', err);
      return res.status(500).json({ message: 'Server error.' });
    }
  }

  async login(req, res) {
    const { email, password } = req.body;

    try {
      const user = await UserService.findByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const isValid = await UserService.verifyPassword(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '2h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.id,
          email: user.email,
          role: user.role,
        },
      });
    } catch (err) {
      console.error('Login error:', err);
      return res.status(500).json({ message: 'Server error.' });
    }
  }

  logout(req, res) {
    return res.status(200).json({ message: 'Logged out (token removed client-side)' });
  }
}

export default new AuthController();
