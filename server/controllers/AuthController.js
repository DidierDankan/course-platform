import jwt from 'jsonwebtoken';
import UserService from '../db/UserService.js';
import dotenv from 'dotenv';

dotenv.config();

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
        { expiresIn: '7d' }
      );

      res.cookie('token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production', // only HTTPS in production
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 1 week
      });

      return res.json({
        message: 'Login successful',
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
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
    });
    
    return res.status(200).json({ message: 'Logged out successfully' });
  }

  me(req, res) {
    try {
      const token = req.cookies.token;
      if (!token) return res.status(401).json({ message: 'No token' });

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      return res.json({ user: decoded }); // You could re-fetch from DB here if needed
    } catch (err) {
      return res.status(401).json({ message: 'Invalid token' });
    }
  }
}

export default new AuthController();
