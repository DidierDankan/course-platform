import dotenv from "dotenv";
import os from "node:os";
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

// Optional: TLS to the database (hosted MySQL requires it). The server's certificate is ALWAYS verified: encryption
// without verification would let anyone on the path pretend to be the database. Against what:
//   DB_CA_CERT set   -> that CA only (a provider with its own CA, e.g. Aiven's ca.pem). The whole PEM text; line
//                       breaks written as the two characters \n also work, for dashboards that keep one line.
//   DB_CA_CERT unset -> the public certificate authorities Node trusts (a provider whose certificate is publicly
//                       signed, e.g. TiDB Cloud).
// Unset DB_SSL = no TLS, which is what a local MySQL wants.
const dbSslFrom = () => {
  const flag = (process.env.DB_SSL || "").trim().toLowerCase();
  if (flag === "" || flag === "false") return null;
  if (flag !== "true") fail("DB_SSL must be true, false, or unset.");
  const ca = (process.env.DB_CA_CERT || "").replace(/\\n/g, "\n").trim();
  if (!ca) return { rejectUnauthorized: true }; // Node's trusted public roots
  if (!ca.includes("-----BEGIN CERTIFICATE-----") || !ca.includes("-----END CERTIFICATE-----")) {
    fail("DB_CA_CERT must be the whole CA certificate (ca.pem), BEGIN and END lines included, or unset.");
  }
  return { ca, rejectUnauthorized: true };
};

// Optional: Supabase Storage for uploads (the live site; Render's disk is wiped on every deploy). Both variables or
// neither: unset = files stay in the local uploads folder, which is what dev and the tests use.
const supabaseFrom = () => {
  const url = process.env.SUPABASE_URL || "";
  const secretKey = process.env.SUPABASE_SECRET_KEY || "";
  if (!url && !secretKey) return null;
  if (!url || !secretKey) fail("set both SUPABASE_URL and SUPABASE_SECRET_KEY, or neither.");
  if (!/^https:\/\/[^/\s]+$/.test(url.replace(/\/$/, ""))) fail("SUPABASE_URL must look like https://<project>.supabase.co");
  const raw = process.env.SIGNED_URL_TTL_SECONDS;
  const ttl = raw ? Number(raw) : 900;
  if (!Number.isInteger(ttl) || ttl < 60 || ttl > 86400) fail("SIGNED_URL_TTL_SECONDS must be a whole number from 60 to 86400.");
  return { url: url.replace(/\/$/, ""), secretKey, signedUrlTtlSeconds: ttl };
};

const config = Object.freeze({
  port: portFrom("PORT", 3001),
  trustProxyHops: proxyHopsFrom("TRUST_PROXY_HOPS"),
  demoResetHours: demoResetHoursFrom("DEMO_RESET_HOURS"),
  isProduction: process.env.NODE_ENV === "production",
  clientUrl: process.env.CLIENT_URL,
  // Where uploaded files are stored. A relative UPLOAD_DIR is read from server/, never from the folder the process started in.
  uploadDir: path.resolve(SERVER_DIR, process.env.UPLOAD_DIR || "uploads"),
  // With Supabase on, multer writes each upload here first; the server sends it on and removes it (lib/storage.js).
  uploadTempDir: path.join(os.tmpdir(), "lumen-upload-temp"),
  supabase: supabaseFrom(),
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
    ssl: dbSslFrom(), // null = plain connection (local MySQL)
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
  },
});

export default config;
