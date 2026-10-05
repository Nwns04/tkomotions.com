import 'dotenv/config';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { startProductionProcesses } from './services/productionProcesses.js';

const stop = startProductionProcesses({
  spawn,
  executable: process.execPath,
  nextCli: fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url)),
  cwd: fileURLToPath(new URL('../', import.meta.url)),
  environment: process.env,
  onStop: code => { process.exitCode = code; },
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
