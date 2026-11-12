import dotenv from "dotenv";

// Every other file gets its settings from here, so .env is loaded once, before anything reads it.
dotenv.config();

const REQUIRED = [
  "DB_HOST",
  "DB_USER",
  "DB_NAME",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
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
if (process.env.JWT_ACCESS_SECRET === process.env.JWT_REFRESH_SECRET) {
  fail("JWT_ACCESS_SECRET and JWT_REFRESH_SECRET must be different.");
}


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

const config = Object.freeze({
  port: portFrom("PORT", 3001),
  trustProxyHops: proxyHopsFrom("TRUST_PROXY_HOPS"),
  isProduction: process.env.NODE_ENV === "production",
  clientUrl: process.env.CLIENT_URL,
  jwt: {
    accessSecret: process.env.JWT_ACCESS_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
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
