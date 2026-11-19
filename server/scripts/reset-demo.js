// server/scripts/reset-demo.js
// Resets the public demo now, without waiting for the server's daily reset (lib/demoReset.js): what visitors did with
// the demo accounts goes, the seeded purchases, reviews, comments and notifications come back. Courses, lessons and
// files are not touched (they come from seed:demo). Handy right before showing the site to someone.
//
//   npm run reset:demo            (NODE_ENV=production also needs --force)
//
// Needs seed:demo to have run on this database; otherwise it changes nothing and says so.
import db from "../db/connection.js";
import DemoService from "../db/DemoService.js";
import { ScriptStop, refuseProductionUnlessForced, runScript } from "./lib.js";

const SCRIPT = "reset-demo";

async function main() {
  refuseProductionUnlessForced(SCRIPT);
  const result = await DemoService.resetIfDue({ maxAgeMs: 0 });
  if (!result.reset) {
    throw new ScriptStop(`${SCRIPT}: no demo data on this database (run npm run seed:demo first). Nothing was changed.`);
  }
  console.log(`${SCRIPT}: done. The demo is back to its seeded state.`);
}

runScript(main, db);
