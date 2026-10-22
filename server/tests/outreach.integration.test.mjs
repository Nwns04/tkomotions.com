import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

assert.equal(process.env.MONGODB_URI, process.env.TKO_BASELINE_OWNED_DB);
assert.match(process.env.MONGODB_URI || '', /^mongodb:\/\/127\.0\.0\.1:\d+\/tko_baseline\?replicaSet=tkoBaseline$/);
const { User } = await import('../models/User.js');
const { OutreachLead, OutreachSuppression, OutreachRate, OutreachLease } = await import('../models/Outreach.js');
const { default: routes, outreachPublicRouter } = await import('../routes/outreach.routes.js');
const { sendOutreach, handleOutreachEvent, processOutreachFollowups } = await import('../services/outreach.js');
const config = { live: true, from: 'TKO <sender@example.test>', replyTo: 'replies@example.test', origin: 'https://example.test', receiving: true, autoFollowupReady: true };
const fields = email => ({ email, company: 'Example Co', subject: 'Hello', message: 'First message', followup: 'Checking in', permissionBasis: 'Recipient requested information', delayDays: 3, autoFollowup: false });

test('Finance outreach authorization, sending, suppression and webhooks', { timeout: 300000 }, async t => {
  await mongoose.connect(process.env.MONGODB_URI);
  t.after(() => mongoose.disconnect());
  await Promise.all(Object.values(mongoose.models).map(model => model.init()));
  const password = 'Synthetic-test-password-42!';
  const passwordHash = await bcrypt.hash(password, 4);
  const [staff, other, publicUser] = await User.create([
    { email: 'staff@example.test', passwordHash, name: 'TKO staff' },
    { email: 'other@example.test', passwordHash, name: 'Other staff' },
    { email: 'customer@example.test', passwordHash, accountSource: 'public', emailVerifiedAt: new Date() },
  ]);
  const app = express(); app.set('trust proxy', 1);
  app.use('/api/finance/outreach', outreachPublicRouter);
  app.use(express.json());
  const store = new session.MemoryStore();
  app.use(session({ secret: process.env.SESSION_SECRET, resave: false, saveUninitialized: false, store }));
  app.use('/api/finance/auth', (await import('../routes/auth.routes.js')).default);
  app.use('/api/finance/outreach', routes);
  app.use((await import('../middleware/errors.js')).errorHandler);
  const server = app.listen(0, '127.0.0.1'); await new Promise(resolve => server.once('listening', resolve));
  t.after(async () => { store.clear(); await new Promise(resolve => server.close(resolve)); });
  const origin = `http://127.0.0.1:${server.address().port}/api/finance`;
  async function login(user) {
    const response = await fetch(origin + '/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: user.email, password }) });
    assert.equal(response.status, 200); const data = await response.json();
    return { cookie: response.headers.get('set-cookie').split(';')[0], token: data.csrfToken, user: data.user };
  }
  const credentials = await login(staff), otherCredentials = await login(other), publicCredentials = await login(publicUser);
  async function request(path, { method = 'GET', body, auth = credentials, token = auth?.token, status = 200 } = {}) {
    const response = await fetch(origin + '/outreach' + path, { method, headers: { 'Content-Type': 'application/json', ...(auth ? { Cookie: auth.cookie } : {}), ...(token ? { 'X-CSRF-Token': token } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
    const data = await response.json(); assert.equal(response.status, status, `${method} ${path}: ${JSON.stringify(data)}`); return data;
  }
  await t.test('real Finance sessions, staff capabilities, CSRF and anonymous denial', async () => {
    assert.equal(credentials.user.canUseOutreach, true); assert.equal(publicCredentials.user.canUseOutreach, false);
    await request('', { auth: null, status: 401 });
    await request('', { auth: publicCredentials, status: 403 });
    await request('/import', { method: 'POST', token: '', body: { rows: [fields('blocked@example.test')] }, status: 403 });
    await request('/import', { method: 'POST', token: 'forged', body: { rows: [fields('blocked@example.test')] }, status: 403 });
    await request('/import', { method: 'POST', auth: publicCredentials, body: { rows: [fields('blocked@example.test')] }, status: 403 });
    assert.equal(await OutreachLead.countDocuments(), 0);
  });
  let lead;
  await t.test('import validates and deduplicates; exports and reads isolate owners', async () => {
    const data = await request('/import', { method: 'POST', body: { rows: [fields('lead@example.test'), fields('LEAD@example.test'), { email: { $ne: null } }] }, status: 201 });
    assert.equal(data.added, 1); assert.equal(data.skipped.length, 2);
    const state = await request(''); lead = state.leads[0];
    assert.equal(state.stats.total, 1); assert.equal(lead.owner, undefined); assert.equal(lead.unsubscribeToken, undefined);
    assert.equal((await request('', { auth: otherCredentials })).leads.length, 0);
    assert.equal((await request('/export', { auth: otherCredentials })).leads.length, 0);
    const exported = await request('/export'); assert.equal(exported.leads.length, 1); assert.equal(exported.leads[0].unsubscribeToken, undefined);
    await request('/' + lead.publicId, { method: 'PATCH', auth: otherCredentials, body: fields('lead@example.test'), status: 404 });
    await request('/' + lead.publicId + '/send', { method: 'POST', auth: otherCredentials, body: { test: true }, status: 404 });
    await request('/' + lead.publicId + '/stop', { method: 'POST', auth: otherCredentials, body: { reason: 'replied' }, status: 404 });
  });
  await t.test('test sends do not consume a contact or schedule follow-ups; live sends fail closed', async () => {
    await request('/' + lead.publicId + '/send', { method: 'POST', body: { test: true } });
    const fresh = await OutreachLead.findOne({ publicId: lead.publicId });
    assert.equal(fresh.sentAt, null); assert.equal(fresh.initialState, 'pending'); assert.equal(fresh.followupDueAt, null);
    await request('/' + lead.publicId + '/send', { method: 'POST', body: { test: false }, status: 400 });
    await request('/' + lead.publicId + '/send', { method: 'POST', body: { test: false, confirmed: true }, status: 503 });
  });
  let payload, acceptedLead;
  await t.test('provider acceptance persists, attaches unsubscribe and allows only one initial send', async () => {
    await OutreachRate.deleteMany({});
    acceptedLead = await OutreachLead.create({ ...fields('accepted@example.test'), owner: staff._id, autoFollowup: true });
    let calls = 0;
    const transport = async (url, options) => { calls++; assert.equal(url, 'https://api.resend.com/emails'); payload = JSON.parse(options.body); assert.match(options.headers['Idempotency-Key'], /-initial$/); return { ok: true, json: async () => ({ id: 'accepted-initial' }) }; };
    const result = await sendOutreach(staff._id, acceptedLead.publicId, { config, transport });
    assert.equal(result.messageId, 'accepted-initial'); assert.match(payload.text, /To stop receiving/); assert.match(payload.headers['List-Unsubscribe'], /^<https:/);
    const fresh = await OutreachLead.findById(acceptedLead._id); assert.equal(fresh.initialState, 'accepted'); assert.equal(fresh.status, 'sent'); assert.ok(fresh.followupDueAt > fresh.sentAt);
    await assert.rejects(sendOutreach(staff._id, acceptedLead.publicId, { config, transport }), /already/); assert.equal(calls, 1);
    await request('/' + acceptedLead.publicId, { method: 'PATCH', body: fields('changed@example.test'), status: 409 });
  });
  await t.test('scheduled messages cannot be sent early and cross-campaign leases are atomic', async () => {
    const a = await OutreachLead.create({ ...fields('collision@example.test'), owner: staff._id, scheduledAt: new Date(Date.now() + 3600000) });
    const b = await OutreachLead.create({ ...fields('collision@example.test'), owner: staff._id });
    let calls = 0;
    const transport = async () => { calls++; return { ok: true, json: async () => ({ id: 'collision-id' }) }; };
    await assert.rejects(sendOutreach(staff._id, a.publicId, { config, transport }), /Unschedule/);
    assert.equal(calls, 0);
    const { reserveOutreachLead, releaseOutreachLead } = await import('../services/outreach.js');
    const [one, two] = await Promise.allSettled([reserveOutreachLead(a), reserveOutreachLead(b)]);
    assert.equal([one, two].filter(result => result.status === 'fulfilled').length, 1);
    const winner = one.status === 'fulfilled' ? a : b;
    const loser = winner._id.equals(a._id) ? b : a;
    await assert.rejects(reserveOutreachLead(loser), /reserved/);
    await releaseOutreachLead(winner);
    await reserveOutreachLead(loser);
    await releaseOutreachLead(loser);
  });
  await t.test('recipient GET does not unsubscribe; POST suppresses across staff owners', async () => {
    const token = await OutreachLead.findById(acceptedLead._id).select('+unsubscribeToken');
    const url = origin + '/outreach/unsubscribe/' + token.unsubscribeToken;
    const contact = await OutreachLead.create({ ...fields(acceptedLead.email), owner: other._id });
    assert.equal((await fetch(url)).status, 200); assert.equal(await OutreachSuppression.countDocuments({ email: contact.email }), 0);
    assert.equal((await fetch(url, { method: 'POST' })).status, 200);
    assert.equal(await OutreachSuppression.countDocuments({ email: contact.email }), 1);
    assert.equal((await OutreachLead.findById(contact._id)).stoppedReason, 'opted-out');
    await assert.rejects(sendOutreach(other._id, contact.publicId, { test: true }), /stopped/);
  });
  await t.test('reply and terminal delivery events stop follow-ups; late delivery cannot undo suppression', async () => {
    const reply = await OutreachLead.create({ ...fields('reply@example.test'), owner: staff._id, sentAt: new Date(), messageId: 'reply-id', status: 'sent', followupDueAt: new Date() });
    await handleOutreachEvent({ type: 'email.received', data: { from: reply.email, to: ['unrelated@example.test'] } }, config);
    assert.equal((await OutreachLead.findById(reply._id)).repliedAt, null);
    await handleOutreachEvent({ type: 'email.received', data: { from: 'Sender <' + reply.email + '>', to: [config.replyTo] } }, config);
    assert.equal((await OutreachLead.findById(reply._id)).status, 'replied'); assert.equal((await OutreachLead.findById(reply._id)).followupDueAt, null);
    const bounced = await OutreachLead.create({ ...fields('bounce@example.test'), owner: staff._id, sentAt: new Date(), messageId: 'bounce-id', status: 'sent' });
    await handleOutreachEvent({ type: 'email.bounced', data: { email_id: 'bounce-id' } }, config);
    await handleOutreachEvent({ type: 'email.delivered', data: { email_id: 'bounce-id' } }, config);
    assert.equal((await OutreachLead.findById(bounced._id)).status, 'bounced'); assert.ok(await OutreachSuppression.exists({ email: bounced.email }));
    await assert.rejects(sendOutreach(staff._id, reply.publicId, { followup: true, test: true }), /stopped/);
  });
  await t.test('ambiguous provider failures are held for review and never auto-retried', async () => {
    await OutreachRate.deleteMany({});
    const uncertain = await OutreachLead.create({ ...fields('uncertain@example.test'), owner: staff._id });
    let calls = 0; const transport = async () => { calls++; throw new Error('simulated connection loss'); };
    await assert.rejects(sendOutreach(staff._id, uncertain.publicId, { config, transport }), /review/);
    const fresh = await OutreachLead.findById(uncertain._id); assert.equal(fresh.initialState, 'review'); assert.equal(fresh.followupDueAt, null);
    await assert.rejects(sendOutreach(staff._id, uncertain.publicId, { config, transport })); assert.equal(calls, 1);
  });
  await t.test('a reply during transport cannot be overwritten by send completion', async () => {
    await OutreachRate.deleteMany({});
    const contact = await OutreachLead.create({ ...fields('race@example.test'), owner: staff._id, autoFollowup: true });
    const transport = async () => {
      await request('/' + contact.publicId + '/stop', { method: 'POST', body: { reason: 'replied' } });
      return { ok: true, json: async () => ({ id: 'race-id' }) };
    };
    await sendOutreach(staff._id, contact.publicId, { config, transport });
    const fresh = await OutreachLead.findById(contact._id); assert.equal(fresh.status, 'replied'); assert.equal(fresh.followupDueAt, null); assert.ok(fresh.sentAt);
  });
  await t.test('a terminal webhook arriving before provider-ID persistence still stops follow-ups', async () => {
    await OutreachRate.deleteMany({});
    const contact = await OutreachLead.create({ ...fields('early-bounce@example.test'), owner: staff._id, autoFollowup: true });
    const transport = async () => {
      await handleOutreachEvent({ type: 'email.bounced', data: { email_id: 'early-bounce-id', to: [contact.email] } }, config);
      return { ok: true, json: async () => ({ id: 'early-bounce-id' }) };
    };
    await sendOutreach(staff._id, contact.publicId, { config, transport });
    const fresh = await OutreachLead.findById(contact._id); assert.equal(fresh.status, 'bounced'); assert.equal(fresh.followupDueAt, null); assert.ok(await OutreachSuppression.exists({ email: contact.email }));
  });
  await t.test('scheduler picks persisted overdue work, sends once, and skips future or stopped contacts', async () => {
    await OutreachRate.deleteMany({});
    const due = await OutreachLead.create({ ...fields('due@example.test'), owner: staff._id, sentAt: new Date(Date.now() - 4 * 86400000), initialState: 'accepted', autoFollowup: true, followupDueAt: new Date(Date.now() - 1000), status: 'sent' });
    await OutreachLead.create({ ...fields('future@example.test'), owner: staff._id, sentAt: new Date(), initialState: 'accepted', autoFollowup: true, followupDueAt: new Date(Date.now() + 86400000), status: 'sent' });
    await OutreachLead.create({ ...fields('stopped@example.test'), owner: staff._id, sentAt: new Date(), initialState: 'accepted', autoFollowup: true, followupDueAt: new Date(Date.now() - 1000), status: 'failed', stoppedReason: 'failed' });
    let calls = 0;
    const transport = async (_url, options) => { calls++; const body = JSON.parse(options.body); assert.equal(body.to[0], due.email); assert.equal(body.subject, 'Re: Hello'); return { ok: true, json: async () => ({ id: 'automated-followup' }) }; };
    assert.equal(await processOutreachFollowups({ config: { ...config, autoFollowupReady: false }, transport }), 0);
    assert.equal(calls, 0);
    assert.equal(await processOutreachFollowups({ config, transport }), 1);
    const fresh = await OutreachLead.findById(due._id); assert.ok(fresh.followupSentAt); assert.equal(fresh.followupDueAt, null); assert.equal(fresh.followupState, 'accepted');
    assert.equal(await processOutreachFollowups({ config, transport }), 0); assert.equal(calls, 1);
  });
  await t.test('public webhook verifies the raw payload and rejects stale or forged requests', async () => {
    const secret = Buffer.from('local-webhook-signature-fixture');
    process.env.OUTREACH_WEBHOOK_SECRET = 'whsec_' + secret.toString('base64');
    const raw = '{ "type": "unknown", "data": {} }';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', secret).update(`event-fixture.${timestamp}.${raw}`).digest('base64');
    const headers = { 'Content-Type': 'application/json', 'svix-id': 'event-fixture', 'svix-timestamp': timestamp, 'svix-signature': 'v1,' + signature };
    assert.equal((await fetch(origin + '/outreach/webhook', { method: 'POST', headers, body: raw })).status, 200);
    assert.equal((await fetch(origin + '/outreach/webhook', { method: 'POST', headers, body: raw + ' ' })).status, 401);
    assert.equal((await fetch(origin + '/outreach/webhook', { method: 'POST', headers: { ...headers, 'svix-timestamp': 'NaN' }, body: raw })).status, 401);
    delete process.env.OUTREACH_WEBHOOK_SECRET;
  });
});