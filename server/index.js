// server/index.js
import config from './config.js';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';

import path from 'path';
import cookieParser from 'cookie-parser';

import db from './db/connection.js';

import authRoutes from './routes/authRoutes.js';
import profileRoutes from './routes/profileRoutes.js';
import courseRoutes from './routes/courseRoutes.js'
import enrollmentRoutes from "./routes/enrollmentRoutes.js"
import dashboardRoutes from "./routes/dashboardRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js"
import publicRoutes from "./routes/publicRoutes.js"
import favoriteRoutes from "./routes/favoriteRoutes.js"
import PaymentController from "./controllers/PaymentController.js"
import { protectVideos } from "./middleware/protectVideos.js";
import multer from "multer";
import { UploadError, MAX_FILE_SIZE_MB } from "./middleware/uploadMiddleware.js";



const app = express();
const PORT = config.port;
app.set('trust proxy', config.trustProxyHops);

// "same-site" lets the client on another localhost port load images and videos; the default "same-origin" would block them.
app.use(helmet({ crossOriginResourcePolicy: { policy: 'same-site' } }));


app.use(cookieParser());

app.post(
  "/api/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res) => PaymentController.webhook(req, res)
);

app.use(cors({
  origin: config.clientUrl,
  credentials: true,
}));

app.use(express.json());

// ✅ Mount your routes here
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/courses', courseRoutes);
app.use("/api/enrollments", enrollmentRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/payments", paymentRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/public", publicRoutes);
app.use('/uploads', protectVideos, express.static(path.join(process.cwd(), 'uploads')));


app.get('/', (req, res) => {
  res.send('Server is running!');
});

// Upload problems are the uploader's fault: answer 400 with a readable message, not a 500.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const message = err.code === 'LIMIT_FILE_SIZE'
      ? `File too large (max ${MAX_FILE_SIZE_MB} MB)`
      : err.message;
    return res.status(400).json({ message });
  }
  if (err instanceof UploadError) {
    return res.status(400).json({ message: err.message });
  }
  return next(err);
});

// ✅ Connect to DB, then start server
(async () => {
  try {
    const [rows] = await db.query('SELECT DATABASE() AS name');
    console.log(`✅ Connected to database: ${rows[0].name}`);

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1);
  }
})();
