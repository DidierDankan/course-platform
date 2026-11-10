import rateLimit from "express-rate-limit";

// Limits abuse of the public auth routes, counting attempts per IP address (not per email or password).
// Login: one IP address gets 10 failed attempts every 15 minutes, which slows password guessing, whether against one account or many.
// Register: stops one address flooding the database with accounts at 5 attempts per hour.
// Attempts from many IP addresses are not stopped; that would need a per-account limit too.
// Shortcut: counters live in memory, so they reset on restart. With more than one server they would need a shared store such as Redis.

const MINUTE_MS = 60 * 1000;

const LOGIN_WINDOW_MS = 15 * MINUTE_MS;
const LOGIN_MAX_FAILED_ATTEMPTS = 10;
const REGISTER_WINDOW_MS = 60 * MINUTE_MS;
const REGISTER_MAX_ATTEMPTS = 5;

const createLimiter = ({ windowMs, limit, message, skipSuccessfulRequests = false }) =>
  rateLimit({
    windowMs,
    limit,
    skipSuccessfulRequests,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message },
  });

// Only failed logins count, so someone signing in and out normally is never blocked.
export const loginLimiter = createLimiter({
  windowMs: LOGIN_WINDOW_MS,
  limit: LOGIN_MAX_FAILED_ATTEMPTS,
  skipSuccessfulRequests: true,
  message: "Too many failed sign-in attempts. Please try again in 15 minutes.",
});

// Every attempt counts: the "email already registered" answer could otherwise be used to test which emails have accounts.
export const registerLimiter = createLimiter({
  windowMs: REGISTER_WINDOW_MS,
  limit: REGISTER_MAX_ATTEMPTS,
  message: "Too many registration attempts. Please try again in an hour.",
});
