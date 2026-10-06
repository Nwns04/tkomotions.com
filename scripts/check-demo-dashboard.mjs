import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import ts from 'typescript';
const require = createRequire(import.meta.url);
const source = fs.readFileSync(new URL('../src/sales-engine/services/demo-dashboard-seed.ts', import.meta.url), 'utf8');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText, {
  exports: module.exports, module, Date, require: name => {
    if (name === '../db/models') return { Lead: {}, Appointment: {}, FollowUp: {} };
    if (name === './demo-business') return {};
    return require(name);
  },
});
const { seedDemoDashboard, sampleLeads } = module.exports;
const store = new Map();
const calls = [];
function fakeModel(kind) { return { updateOne: async (filter, update, options) => {
  calls.push({kind, filter, update, options});
  const key = kind + ':' + String(filter._id);
  if (!store.has(key)) store.set(key, { ...update.$setOnInsert, _id: filter._id });
} }; }
const models = { Lead: fakeModel('lead'), Appointment: fakeModel('appointment'), FollowUp: fakeModel('followup') };
const business = { _id: '507f1f77bcf86cd799439011', slug: 'tko-properties', isDemo: true };
await seedDemoDashboard(business, models, new Date('2026-10-06T08:00:00Z'));
assert.equal(sampleLeads.length, 6);
assert.equal([...store.keys()].filter(key => key.startsWith('lead:')).length, 6);
assert.equal([...store.keys()].filter(key => key.startsWith('appointment:')).length, 2);
assert.equal([...store.keys()].filter(key => key.startsWith('followup:')).length, 2);
assert.equal(store.size, 10);
const lead = [...store.entries()].find(([key]) => key.startsWith('lead:'));
lead[1].status = 'CONTACTED';
const firstCreated = lead[1].createdAt;
await seedDemoDashboard(business, models, new Date('2026-10-07T08:00:00Z'));
assert.equal(store.size, 10, 'repeat seed must not duplicate rows');
assert.equal(lead[1].status, 'CONTACTED', 'repeat seed must preserve sample edits');
assert.equal(lead[1].createdAt, firstCreated, 'repeat seed must preserve creation time');
for (const {kind, filter, update, options} of calls) {
  assert.equal(filter.businessId, business._id);
  assert.equal(update.$set, undefined, 'seed must never overwrite existing records');
  assert.equal(options.timestamps, false);
  assert.equal(options.upsert, true);
  assert.equal(update.$setOnInsert.isDemo, true);
  if (kind === 'lead') { assert.equal(update.$setOnInsert.source, 'Demo sample'); assert.equal(update.$setOnInsert.phone, ''); assert.equal(update.$setOnInsert.email, ''); }
  if (kind === 'appointment') assert.equal(update.$setOnInsert.status, 'REQUESTED');
}
const callCount = calls.length;
await assert.rejects(seedDemoDashboard({ ...business, isDemo: false }, models), /fictional demo business/);
assert.equal(calls.length, callCount, 'non-demo businesses must not be changed');
assert.equal(new Set(calls.map(call => String(call.filter._id))).size, 10);
console.log('PASS: six fictional leads, two viewing requests, two follow-ups; repeat safety, preserved edits, tenant isolation and no real contact details.');
