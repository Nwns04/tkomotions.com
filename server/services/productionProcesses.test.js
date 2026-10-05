import test from 'node:test';
import assert from 'node:assert/strict';
import { EventEmitter } from 'node:events';
import { startProductionProcesses } from './productionProcesses.js';
import { financeHealth } from './financeHealth.js';

function fixture(environment = { MONGODB_URI: 'mongodb://test.invalid/finance', SESSION_SECRET: 'test-secret' }) {
  const children = [];
  const stops = [];
  const spawn = (_executable, args, options) => {
    const child = new EventEmitter();
    child.args = args;
    child.options = options;
    child.kills = 0;
    child.kill = () => { child.kills++; child.emit('exit', 0); };
    children.push(child);
    return child;
  };
  return { children, stops, options: { spawn, executable: 'node', nextCli: 'next', cwd: '.', environment, onStop: code => stops.push(code) } };
}

test('missing backend settings prevent a falsely healthy frontend from starting', () => {
  const state = fixture({});
  assert.throws(() => startProductionProcesses(state.options), /MONGODB_URI, SESSION_SECRET/);
  assert.equal(state.children.length, 0);
});

test('an API crash stops the frontend with a failure exit so the host can recover', () => {
  const state = fixture();
  startProductionProcesses(state.options);
  state.children[1].emit('exit', 1);
  assert.deepEqual(state.stops, [1]);
  assert.deepEqual(state.children.map(child => child.kills), [1, 1]);
});

test('frontend failure also cleans up the API process', () => {
  const state = fixture();
  startProductionProcesses(state.options);
  state.children[0].emit('error', new Error('spawn failed'));
  assert.deepEqual(state.stops, [1]);
  assert.equal(state.children[1].kills, 1);
});

test('requested shutdown is successful and idempotent', () => {
  const state = fixture();
  const stop = startProductionProcesses(state.options);
  assert.equal(state.children[1].options.env.FINANCE_PORT, '4000');
  stop(); stop();
  assert.deepEqual(state.stops, [0]);
  assert.deepEqual(state.children.map(child => child.kills), [1, 1]);
});

test('health requires a real connected finance service and bypasses caches', async () => {
  const healthy = await financeHealth('http://internal:4000/', async (url, options) => {
    assert.equal(url, 'http://internal:4000/api/health');
    assert.equal(options.cache, 'no-store');
    assert.ok(options.signal);
    return Response.json({ service: 'tko-finance', database: 'connected' });
  });
  assert.deepEqual(healthy, { ok: true, finance: 'available' });
  for (const response of [
    Response.json({ service: 'tkomotions-web', ok: true }),
    Response.json({ service: 'tko-finance', database: 'unavailable' }),
    new Response('Internal Server Error', { status: 500 }),
  ]) assert.deepEqual(await financeHealth('http://internal:4000', async () => response), { ok: false, finance: 'unavailable' });
});

test('network errors and invalid responses mark the service unhealthy without leaking details', async () => {
  for (const fetchImpl of [
    async () => { throw new Error('sensitive database details'); },
    async () => new Response('invalid JSON'),
  ]) assert.deepEqual(await financeHealth('http://internal:4000', fetchImpl), { ok: false, finance: 'unavailable' });
});
