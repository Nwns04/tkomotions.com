import app from './app.js';
import { connectDatabase, disconnectDatabase } from './config/database.js';
import { env } from './config/env.js';

await connectDatabase();
const server = app.listen(env.FINANCE_PORT, () => {
  console.log(`TKO Finance API listening on port ${env.FINANCE_PORT}`);
});

async function shutdown(signal) {
  console.log(`${signal} received; shutting down.`);
  server.close(async () => {
    await disconnectDatabase();
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
