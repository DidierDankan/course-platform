// server/index.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import db from './db/connection.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
  res.send('Server is running!');
});

// ✅ Connect to DB, then start server
(async () => {
  try {
    await db.connect();
    console.log('✅ Database connected!');

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1); // ⛔ Stop app if DB fails
  }
})();
