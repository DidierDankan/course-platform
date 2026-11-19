import dotenv from "dotenv";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SERVER_DIR = path.dirname(fileURLToPath(import.meta.url));

// Every other file gets its settings from here, so .env is loaded once, before anything reads it.
dotenv.config();

const REQUIRED = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_ACCESS_SECRET",
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "CLIENT_URL",
];

// Only ever prints variable names, never their values.
const fail = (message) => {
  console.error(`Config error: ${message}`);
  process.exit(1);
};

const missing = REQUIRED.filter((name) => !process.env[name]);
if (missing.length) fail(`missing ${missing.join(", ")}. Add them to server/.env.`);


const portFrom = (name, fallback) => {
  const raw = process.env[name];
  if (!raw) return fallback;
  const port = Number(raw);
  if (!Number.isInteger(port) || port < 1 || port > 65535) fail(`${name} must be a port number.`);
  return port;
};

const proxyHopsFrom = (name) => {
  const hops = Number(process.env[name] ?? 0);
  if (!Number.isInteger(hops) || hops < 0) fail(`${name} must be a whole number, 0 or more.`);
  return hops;
};

// Optional: how often the server resets the public demo (DemoService.resetIfDue). Unset = never, which is what a local
// database wants (a reset removes reviews and comments on the demo courses). The live server sets 24.
const demoResetHoursFrom = (name) => {
  const raw = process.env[name];
  if (!raw) return null;
  const hours = Number(raw);
  if (!Number.isFinite(hours) || hours <= 0) fail(`${name} must be a number of hours above 0, or unset.`);
  return hours;
};

const config = Object.freeze({
  port: portFrom("PORT", 3001),
  trustProxyHops: proxyHopsFrom("TRUST_PROXY_HOPS"),
  demoResetHours: demoResetHoursFrom("DEMO_RESET_HOURS"),
  isProduction: process.env.NODE_ENV === "production",
  clientUrl: process.env.CLIENT_URL,
  // Where uploaded files are stored. A relative UPLOAD_DIR is read from server/, never from the folder the process started in.
  uploadDir: path.resolve(SERVER_DIR, process.env.UPLOAD_DIR || "uploads"),
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
  },
  db: {
    host: process.env.DB_HOST,
    port: portFrom("DB_PORT", 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS ?? "", // WAMP's root user has no password
    name: process.env.DB_NAME,
    sqlMode: process.env.DB_SQL_MODE || null, // optional: pins the SQL mode (tests use strict; production can match Aiven)
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});

export default config;
