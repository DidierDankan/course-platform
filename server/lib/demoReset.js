// server/lib/demoReset.js
// Keeps the public demo fresh: once every DEMO_RESET_HOURS the server puts back what visitors changed with the demo
// accounts (DemoService.resetIfDue). Started by index.js, never by app.js, so tests and scripts don't run it.
//
// Why in the server and not a cron job: on Render's free plan the server sleeps and wakes all the time, so a check at
// start-up plus one every hour while awake is enough, and the database password stays on Render only. The time of the
// last reset lives in the database (demo_resets), so restarts and a second server don't reset twice.
import DemoService from "../db/DemoService.js";
import { logError } from "./logError.js";

const HOUR_MS = 60 * 60 * 1000;
export const CHECK_EVERY_MS = HOUR_MS; // a failed reset (say, a deadlock with a visitor's request) is retried within the hour

export async function runDemoResetCheck(resetHours, now = new Date()) {
  try {
    const result = await DemoService.resetIfDue({ now, maxAgeMs: resetHours * HOUR_MS });
    if (result.reset) console.log(`demo reset: done at ${now.toISOString()}`);
    return result;
  } catch (err) {
    logError("demo reset", err);
    return { reset: false, reason: "error" };
  }
}

// Returns a stop function. unref(): the timer never keeps the process alive on its own.
export function startDemoResets(resetHours) {
  runDemoResetCheck(resetHours);
  const timer = setInterval(() => runDemoResetCheck(resetHours), CHECK_EVERY_MS);
  timer.unref();
  return () => clearInterval(timer);
}
