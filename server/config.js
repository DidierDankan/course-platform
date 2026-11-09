import dotenv from "dotenv";

// Every other file gets its settings from here, so .env is loaded once, before anything reads it.
dotenv.config();

const REQUIRED = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_SECRET",
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

const config = Object.freeze({
  port: portFrom("PORT", 3001),
  isProduction: process.env.NODE_ENV === "production",
  clientUrl: process.env.CLIENT_URL,
  db: {
    host: process.env.DB_HOST,
    port: portFrom("DB_PORT", 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASS ?? "", // WAMP's root user has no password
    name: process.env.DB_NAME,
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});

export default config;
