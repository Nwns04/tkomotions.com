import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const nextCli = fileURLToPath(new URL('../node_modules/next/dist/bin/next', import.meta.url));
const nextProcess = spawn(process.execPath, [nextCli, 'start', '-p', process.env.PORT || '3000'], {
  cwd: projectRoot,
  env: process.env,
  stdio: 'inherit',
});
const missingApiEnv = ['MONGODB_URI', 'SESSION_SECRET'].filter((key) => !process.env[key]);
const apiProcess = missingApiEnv.length
  ? null
  : spawn(process.execPath, ['server/server.js'], {
      cwd: projectRoot,
      env: { ...process.env, FINANCE_PORT: process.env.FINANCE_PORT || '4000' },
      stdio: 'inherit',
    });

if (missingApiEnv.length) {
  console.warn(`Finance API disabled. Missing required env vars: ${missingApiEnv.join(', ')}`);
}

let stopping = false;
function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  nextProcess.kill();
  apiProcess?.kill();
  process.exitCode = code;
}

nextProcess.on('error', () => stop(1));
apiProcess?.on('error', (error) => {
  console.error('Finance API process failed to start.', error);
});
nextProcess.on('exit', (code) => stop(code ?? 1));
apiProcess?.on('exit', (code) => {
  if (!stopping) {
    console.error(`Finance API exited with code ${code ?? 1}. Frontend remains online.`);
  }
});
process.on('SIGINT', () => stop());
process.on('SIGTERM', () => stop());
