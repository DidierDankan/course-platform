// server/index.js
import config from './config.js';
import { app } from './app.js';

import db from './db/connection.js';
import { startDemoResets } from './lib/demoReset.js';

const PORT = config.port;

// ✅ Connect to DB, then start server
(async () => {
  try {
    const [rows] = await db.query('SELECT DATABASE() AS name');
    console.log(`✅ Connected to database: ${rows[0].name}`);

    app.listen(PORT, () => {
      console.log(`🚀 Server listening on http://localhost:${PORT}`);
    });

    // The public demo's daily reset, only where DEMO_RESET_HOURS is set (the live server)
    if (config.demoResetHours) startDemoResets(config.demoResetHours);
  } catch (err) {
    console.error('❌ DB Connection Error:', err.message);
    process.exit(1);
  }
})();
