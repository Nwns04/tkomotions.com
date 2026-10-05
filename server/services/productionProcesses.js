export function startProductionProcesses({ spawn, executable, nextCli, cwd, environment, onStop }) {
  const missing = ['MONGODB_URI', 'SESSION_SECRET'].filter(key => !environment[key]?.trim());
  if (missing.length) throw new Error(`Cannot start Finance API. Missing required env vars: ${missing.join(', ')}`);
  let stopping = false;
  const children = [];
  const stop = (code = 0) => {
    if (stopping) return;
    stopping = true;
    for (const child of children) child.kill();
    onStop(code);
  };
  try {
    const nextProcess = spawn(executable, [nextCli, 'start', '-p', environment.PORT || '3000'], { cwd, env: environment, stdio: 'inherit' });
    children.push(nextProcess);
    const apiProcess = spawn(executable, ['server/server.js'], { cwd, env: { ...environment, FINANCE_PORT: environment.FINANCE_PORT || '4000' }, stdio: 'inherit' });
    children.push(apiProcess);
    for (const [service, child] of [['Website', nextProcess], ['Finance API', apiProcess]]) {
      child.on('error', () => { console.error(`${service} process failed to start.`); stop(1); });
      child.on('exit', () => {
        if (!stopping) {
          console.error(`${service} process exited unexpectedly. Stopping the service so the host can recover it.`);
          stop(1);
        }
      });
    }
  } catch (error) { stop(1); throw error; }
  return stop;
}
