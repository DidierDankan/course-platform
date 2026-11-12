import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config.js';

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
import { logError } from "./lib/logError.js";

export const app = express();
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
app.use('/uploads', protectVideos, express.static(config.uploadDir));


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

// Unknown routes answer JSON like every other API answer (Express's default is an HTML page).
app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

// Last stop for any error a route didn't answer itself. Express's built-in handler sends the stack trace (file paths,
// library internals) to the client whenever NODE_ENV isn't "production", so this one never depends on NODE_ENV.
// Client errors from body parsing (malformed JSON: 400, body too large: 413) are marked expose = true by http-errors:
// their short message is safe to show. Anything else is a bug: logged without data, answered with a generic 500.
// `next` is unused but must stay: Express only treats a function with 4 parameters as an error handler.
app.use((err, req, res, next) => {
  const status = Number.isInteger(err?.status) && err.status >= 400 && err.status < 500 ? err.status : 500;
  if (status < 500 && err.expose) {
    return res.status(status).json({ message: err.message });
  }
  logError(`Unhandled error on ${req.method} ${req.path}`, err);
  return res.status(500).json({ message: "Server error" });
});