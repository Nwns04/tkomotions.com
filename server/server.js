import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

import { startOutreachScheduler } from './services/outreach.js';
await connectDatabase();
const stopOutreach = startOutreachScheduler();
const server = app.listen(env.FINANCE_PORT, () => {
  console.log(`TKO Finance API listening on port ${env.FINANCE_PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  stopOutreach();
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
