// server/scripts/load.js
// Load test for a LOCAL server: requests/s, latency and error rate for the course list and for login.
//   1. start the server (npm start, not npm run dev: nodemon adds its own overhead)
//   2. npm run load            (optional: LOAD_URL=http://localhost:3001)
// Both targets only read, so the database is unchanged. Login needs DEMO_PASSWORD and the demo accounts (npm run seed:demo).
// Not part of npm test or CI: the numbers describe the machine, not the code. Never point it at Render or Aiven:
// their free plans would measure the plan's limits, and a flood could count as abuse.
import autocannon from "autocannon";
import config from "../config.js";
import { DEMO_STUDENT_EMAIL, ScriptStop, runScript } from "./lib.js";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);
const DURATION_SECONDS = 10;
const LIST_CONNECTIONS = 20;
// All load comes from one address, and the login limiter counts a login while it is in flight (a successful one is only
// taken back when it finishes). More than 10 parallel logins would measure the limiter, not the login.
const LOGIN_CONNECTIONS = 5;

function baseUrl() {
  const url = new URL(process.env.LOAD_URL || `http://localhost:${config.port}`);
  if (!LOCAL_HOSTS.has(url.hostname)) {
    throw new ScriptStop(`load: refusing ${url.origin}. Only a local server may be load-tested (localhost, 127.0.0.1, ::1).`);
  }
  return url.origin;
}

async function checkServer(base, loginBody) {
  try {
    await fetch(`${base}/`);
  } catch {
    throw new ScriptStop(`load: no server answers at ${base}. Start it first (npm start) and run this again.`);
  }
  if (!loginBody) return;
  // One real login first: if it fails, a flood of 401s would only fill up the login limit.
  const res = await fetch(`${base}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: loginBody });
  if (res.status !== 200) {
    throw new ScriptStop(`load: the demo login answered ${res.status}. Run npm run seed:demo, or check DEMO_PASSWORD in server/.env.`);
  }
}

const run = (options) =>
  new Promise((resolve, reject) => {
    autocannon({ duration: DURATION_SECONDS, ...options }, (err, result) => (err ? reject(err) : resolve(result)));
  });

// autocannon reports p50, p90, p97.5 and p99 (no p95), so the table shows p50 and p97.5.
function summary(name, result) {
  const failed = result.non2xx + result.errors + result.timeouts;
  const statuses = Object.entries(result.statusCodeStats ?? {}).map(([code, { count }]) => `${code}: ${count}`).join(", ");
  return {
    target: name,
    connections: result.connections,
    "requests/s": Math.round(result.requests.average),
    "p50 ms": result.latency.p50,
    "p97.5 ms": result.latency.p97_5,
    "max ms": result.latency.max,
    requests: result.requests.total,
    "error rate": `${((failed / Math.max(result.requests.total, 1)) * 100).toFixed(2)}%`,
    statuses,
  };
}

async function main() {
  const base = baseUrl();
  const password = process.env.DEMO_PASSWORD;
  const loginBody = password ? JSON.stringify({ email: DEMO_STUDENT_EMAIL, password }) : null;
  await checkServer(base, loginBody);

  const targets = [
    { name: "GET /api/courses/all", url: `${base}/api/courses/all?limit=12&sort=popular`, connections: LIST_CONNECTIONS },
  ];
  if (loginBody) {
    targets.push({
      name: "POST /api/auth/login",
      url: `${base}/api/auth/login`,
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: loginBody,
      connections: LOGIN_CONNECTIONS,
    });
  } else {
    console.log("load: DEMO_PASSWORD is not set, so the login target is skipped.");
  }

  const rows = [];
  for (const { name, ...options } of targets) {
    console.log(`load: ${name}, ${options.connections} connections for ${DURATION_SECONDS}s...`);
    rows.push(summary(name, await run(options)));
  }
  console.table(rows);
  console.log("These numbers describe this machine and its local MySQL, not the live site.");
}

runScript(main);
