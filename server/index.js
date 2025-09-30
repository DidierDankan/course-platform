// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import cookieParser from 'cookie-parser';

import db from './db/connection.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import courseRoutes from './routes/courseRoutes.js'

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
app.use(cookieParser());

app.use(cors({
  origin: 'http://localhost:5173', // your Vite frontend
  credentials: true               // ✅ Allow cookies
}));
app.use(express.json());

// ✅ Mount your routes here
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/courses', courseRoutes);
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// ✅ Connect to DB, then start server
(async () => {
  try {
    await db.connect();
    console.log('✅ Database connected!');
    const [rows] = await db.query('SELECT DATABASE() AS name');
    console.log(`✅ Connected to database: ${rows[0].name}`);

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1); // ⛔ Stop app if DB fails
  }
})();
