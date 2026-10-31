import test from 'node:test';
import { outreachSendBody } from '../middleware/outreachSendBody.js';
import assert from 'node:assert/strict';
import { createHmac, randomUUID } from 'node:crypto';
import express from 'express';
import session from 'express-session';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

assert.equal(process.env.MONGODB_URI, process.env.TKO_BASELINE_OWNED_DB);
assert.match(process.env.MONGODB_URI || '', /^mongodb:\/\/127\.0\.0\.1:\d+\/tko_baseline\?replicaSet=tkoBaseline$/);
const { User } = await import('../models/User.js');
const { OutreachLead, OutreachCampaign, OutreachSuppression, OutreachRate, OutreachLease, OutreachEvent, OutreachReply, OutreachWebhookEvent, OutreachConversationMessage } = await import('../models/Outreach.js');
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
  app.use('/api/finance/outreach/conversations/:threadId/send', ...outreachSendBody);
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
    const { campaign } = await request('/campaigns', { method: 'POST', body: { name: 'Import deduplication fixture' }, status: 201 });
    const data = await request('/import', { method: 'POST', body: { campaignId: campaign._id, rows: [fields('lead@example.test'), fields('LEAD@example.test'), { email: { $ne: null } }] }, status: 201 });
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
  await t.test('CSV batches, first confirmation and mixed scheduling preserve existing queues', async () => {
    const { campaign } = await request('/campaigns', { method: 'POST', body: { name: 'Batch workflow' }, status: 201 });
    const campaignId = campaign._id;
    const first = await request('/import', { method: 'POST', body: { campaignId, sourceName: 'first.csv', rows: [fields('batch-first@example.test')] }, status: 201 });
    assert.equal(first.addedIds.length, 1); assert.ok(first.batchId);
    let saved = await OutreachLead.findOne({ publicId: first.addedIds[0] });
    assert.equal(saved.importName, 'first.csv'); assert.equal(saved.scheduledAt, null);
    const startAt = new Date(Date.now() + 3600000).toISOString();
    const confirmation = { ids: first.addedIds, startAt, intervalMinutes: 5, autoFollowup: false, confirmCampaignId: campaignId, sendDate: '2026-10-26T10:00' };
    await request('/schedule', { method: 'POST', body: { ...confirmation, autoFollowup: true }, status: 409 });
    assert.equal((await OutreachCampaign.findById(campaignId)).status, 'draft');
    assert.equal((await OutreachLead.findById(saved._id)).scheduledAt, null);
    const confirmed = await request('/schedule', { method: 'POST', body: confirmation });
    assert.equal(confirmed.scheduled, 1);
    const complete = await OutreachCampaign.findById(campaignId);
    assert.equal(complete.status, 'active'); assert.equal(complete.setupComplete, true);
    const originalTime = (await OutreachLead.findById(saved._id)).scheduledAt.toISOString();
    await request('/schedule', { method: 'POST', body: confirmation, status: 409 });
    const { campaign: elsewhere } = await request('/campaigns', { method: 'POST', body: { name: 'Other scheduled campaign' }, status: 201 });
    const blocked = await OutreachLead.create({ ...fields('batch-blocked@example.test'), owner: staff._id, campaignId: elsewhere._id, scheduledAt: new Date(startAt), status: 'scheduled' });
    const rows = [fields('batch-first@example.test'), fields('batch-new@example.test'), fields(blocked.email), fields('batch-new@example.test')];
    const preview = await request('/import-preview', { method: 'POST', body: { campaignId, rows } });
    assert.deepEqual(preview.rows.map(row => row.eligible), [false, true, false, false]);
    const second = await request('/import', { method: 'POST', body: { campaignId, sourceName: 'second.csv', rows }, status: 201 });
    assert.equal(second.added, 2); assert.equal(second.skipped.length, 2); assert.notEqual(second.batchId, first.batchId);
    const state = await request('/');
    const members = state.leads.filter(row => row.campaignId === campaignId);
    assert.equal(members.filter(row => row.scheduling.eligible).length, 1);
    assert.match(members.find(row => row.email === blocked.email).scheduling.reason, /Another campaign/);
    const scheduled = await request('/schedule', { method: 'POST', body: { ids: members.map(row => row.publicId), startAt: new Date(Date.now() + 7200000).toISOString(), intervalMinutes: 5 } });
    assert.equal(scheduled.scheduled, 1); assert.equal(scheduled.skipped.length, 2);
    saved = await OutreachLead.findById(saved._id);
    assert.equal(saved.scheduledAt.toISOString(), originalTime);
    assert.equal((await OutreachLead.findById(blocked._id)).scheduledAt.toISOString(), startAt);
    assert.equal(await OutreachLead.countDocuments({ campaignId, sentAt: { $ne: null } }), 0);
    await request('/import-preview', { method: 'POST', auth: otherCredentials, body: { campaignId, rows }, status: 404 });
  });


  await t.test('parallel scheduling settles writes before rolling back a changed contact', async () => {
    const campaign = await OutreachCampaign.create({ owner: staff._id, name: 'Rollback fixture', status: 'active', setupComplete: true });
    const members = await OutreachLead.create(Array.from({ length: 7 }, (_, index) => ({ ...fields('rollback-' + index + '@example.test'), owner: staff._id, campaignId: campaign._id })));
    const ownedIds = new Set(members.map(lead => String(lead._id)));
    const originalUpdate = OutreachLead.updateOne;
    let active = 0, peak = 0;
    OutreachLead.updateOne = async function(filter, update, ...options) {
      if (update?.$set?.status !== 'scheduled' || !ownedIds.has(String(filter._id))) return originalUpdate.call(this, filter, update, ...options);
      active++; peak = Math.max(peak, active);
      try {
        if (String(filter._id) === String(members[0]._id)) { await new Promise(resolve => setTimeout(resolve, 5)); return { modifiedCount: 0 }; }
        await new Promise(resolve => setTimeout(resolve, 25));
        return await originalUpdate.call(this, filter, update, ...options);
      } finally { active--; }
    };
    try {
      await request('/schedule', { method: 'POST', body: { ids: members.map(lead => lead.publicId), startAt: new Date(Date.now() + 3600000).toISOString(), intervalMinutes: 5 }, status: 409 });
    } finally { OutreachLead.updateOne = originalUpdate; }
    assert.equal(active, 0); assert.ok(peak > 1 && peak <= 6);
    assert.equal(await OutreachLead.countDocuments({ campaignId: campaign._id, scheduledAt: { $ne: null } }), 0);
    assert.equal(await OutreachLease.countDocuments({ leadId: { $in: members.map(lead => lead._id) } }), 0);
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
  await t.test('optional notes allow draft import, confirmed scheduling, and initial/follow-up sends', async () => {
    const { campaign } = await request('/campaigns', { method: 'POST', body: { name: 'Optional note campaign' }, status: 201 });
    const id = campaign._id;
    await request('/import', { method: 'POST', body: { campaignId: id, rows: [{ email: 'optional-note@example.test', subject: 'Hello', message: 'A requested introduction.', followup: 'Checking in.', followup2: 'Final check-in.' }] }, status: 201 });
    let contact = await OutreachLead.findOne({ campaignId: id });
    assert.equal(contact.permissionBasis, ''); assert.equal(contact.scheduledAt, null);
    const startAt = new Date(Date.now() + 3600000).toISOString();
    await request('/campaigns/' + id + '/settings', { method: 'PATCH', body: { sendDate: startAt.slice(0, 16), setupComplete: true } });
    assert.equal((await OutreachLead.findById(contact._id)).scheduledAt, null, 'Saving defaults must not queue email');
    await request('/campaigns/' + id + '/status', { method: 'POST', body: { status: 'active' } });
    await request('/schedule', { method: 'POST', body: { ids: [contact.publicId], startAt, intervalMinutes: 5, autoFollowup: false } });
    contact = await OutreachLead.findById(contact._id); assert.equal(contact.status, 'scheduled'); assert.equal(contact.scheduledAt.toISOString(), startAt);
    await request('/' + contact.publicId + '/unschedule', { method: 'POST' });
    await OutreachRate.deleteMany({});
    let calls = 0;
    const transport = async () => ({ ok: true, json: async () => ({ id: 'optional-note-' + (++calls) }) });
    await sendOutreach(staff._id, contact.publicId, { config, transport });
    await OutreachRate.deleteMany({});
    await sendOutreach(staff._id, contact.publicId, { config, followup: true, transport });
    await OutreachRate.deleteMany({});
    await sendOutreach(staff._id, contact.publicId, { config, step: 2, transport });
    assert.equal(calls, 3);
    contact = await OutreachLead.findById(contact._id); assert.ok(contact.sentAt); assert.ok(contact.followupSentAt); assert.ok(contact.followup2SentAt); assert.equal(contact.permissionBasis, '');
    assert.equal((await OutreachCampaign.findById(id)).status, 'active');
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

  await t.test('campaign actions enforce ownership, preserve schedules and require overdue confirmation', async () => {
    const campaign = await OutreachCampaign.create({ owner: staff._id, name: 'Lifecycle', status: 'active', setupComplete: true });
    const contact = await OutreachLead.create({ ...fields('lifecycle@example.test'), owner: staff._id, campaignId: campaign._id, status: 'scheduled', scheduledAt: new Date(Date.now()-60000) });
    const path = '/campaigns/' + campaign._id;
    await request(path+'/summary', { auth: otherCredentials, status:404 });
    await request(path, { method:'DELETE', token:'', body:{confirmed:true}, status:403 });
    await request(path+'/status', {method:'POST',auth:otherCredentials,body:{status:'paused'},status:404});
    await request(path+'/settings', {method:'PATCH',body:{name:'Renamed lifecycle',spacing:12}});
    assert.equal((await OutreachLead.findById(contact._id)).scheduledAt.getTime(),contact.scheduledAt.getTime());
    const paused = await request(path+'/status',{method:'POST',body:{status:'paused'}});
    assert.equal(paused.campaign.stats.scheduled,1); assert.equal(paused.campaign.stats.overdue,1);
    await request(path+'/status',{method:'POST',body:{status:'active'},status:409});
    await request(path+'/status',{method:'POST',body:{status:'active',confirmed:true,expectedUpdatedAt:paused.campaign.updatedAt}});
    await request(path+'/status',{method:'POST',body:{status:'paused',expectedUpdatedAt:paused.campaign.updatedAt},status:409});
    await request(path,{method:'DELETE',body:{confirmed:true},status:409});
    await OutreachCampaign.updateOne({_id:campaign._id},{$set:{status:'paused'}});
  });
  await t.test('archive cancels future work and leases while retaining history; restore stays paused', async () => {
    const campaign=await OutreachCampaign.create({owner:staff._id,name:'Archive history',status:'active',setupComplete:true});
    const initial=await OutreachLead.create({...fields('archive-initial@example.test'),owner:staff._id,campaignId:campaign._id,status:'scheduled',scheduledAt:new Date(Date.now()+3600000)});
    const sent=await OutreachLead.create({...fields('archive-sent@example.test'),owner:staff._id,campaignId:campaign._id,status:'sent',initialState:'accepted',sentAt:new Date(),messageId:'archive-id',autoFollowup:true,followupDueAt:new Date(Date.now()+3600000)});
    await OutreachLease.create({key:'archive-fixture',leadId:initial._id,expiresAt:new Date(Date.now()+3600000)});
    await OutreachEvent.create({owner:staff._id,campaignId:campaign._id,leadId:sent.publicId,type:'sent'});
    const path='/campaigns/'+campaign._id;
    await request(path+'/status',{method:'POST',body:{status:'archived'},status:409});
    const archived=await request(path+'/status',{method:'POST',body:{status:'archived',confirmed:true}});
    assert.equal(archived.campaign.stats.queued,0); assert.equal(archived.campaign.stats.sent,1); assert.equal(archived.campaign.canDelete,false);
    for(const lead of await OutreachLead.find({campaignId:campaign._id})) { assert.equal(lead.scheduledAt,null);assert.equal(lead.followupDueAt,null);assert.equal(lead.autoFollowup,false); }
    assert.equal(await OutreachLease.countDocuments({leadId:initial._id}),0);assert.equal(await OutreachEvent.countDocuments({campaignId:campaign._id}),1);
    await request(path+'/settings',{method:'PATCH',body:{name:'No change'},status:409});
    await request(path,{method:'DELETE',body:{confirmed:true},status:409});
    const restored=await request(path+'/status',{method:'POST',body:{status:'restore',confirmed:true}});
    assert.equal(restored.campaign.status,'paused'); assert.equal(restored.campaign.stats.queued,0);
  });
  await t.test('only unscheduled unattempted drafts can be deleted; suppressions are retained',async()=>{
    const campaign=await OutreachCampaign.create({owner:staff._id,name:'Disposable draft'});
    const contact=await OutreachLead.create({...fields('delete-draft@example.test'),owner:staff._id,campaignId:campaign._id});
    const path='/campaigns/'+campaign._id;
    await OutreachSuppression.create({email:contact.email,reason:'opted-out'});
    await OutreachEvent.create({owner:staff._id,campaignId:campaign._id,leadId:contact.publicId,type:'test'});
    assert.equal((await request(path+'/summary')).campaign.canDelete,true);
    await request(path,{method:'DELETE',body:{},status:409});
    await OutreachLead.updateOne({_id:contact._id},{$set:{scheduledAt:new Date()}});
    await request(path,{method:'DELETE',body:{confirmed:true},status:409});
    await OutreachLead.updateOne({_id:contact._id},{$set:{scheduledAt:null,initialState:'review'}});
    await request(path,{method:'DELETE',body:{confirmed:true},status:409});
    await OutreachLead.updateOne({_id:contact._id},{$set:{initialState:'pending'}});
    await OutreachEvent.create({owner:staff._id,campaignId:campaign._id,type:'delivered'});
    await request(path,{method:'DELETE',body:{confirmed:true},status:409});
    await OutreachEvent.deleteOne({campaignId:campaign._id,type:'delivered'});
    await request(path,{method:'DELETE',body:{confirmed:true}});
    assert.equal(await OutreachLead.countDocuments({campaignId:campaign._id}),0);assert.equal(await OutreachEvent.countDocuments({campaignId:campaign._id}),0);
    assert.equal(await OutreachCampaign.countDocuments({_id:campaign._id}),0);assert.ok(await OutreachSuppression.exists({email:contact.email}));
  });
  await t.test('archive during provider acceptance cannot re-arm follow-ups; inactive campaigns cannot send',async()=>{
    await OutreachRate.deleteMany({});
    const campaign=await OutreachCampaign.create({owner:staff._id,name:'In-flight archive',status:'active'});
    const contact=await OutreachLead.create({...fields('archive-race@example.test'),owner:staff._id,campaignId:campaign._id,autoFollowup:true});
    const {updateCampaignStatus}=await import('../services/outreachCampaigns.js');
    let calls=0;
    await sendOutreach(staff._id,contact.publicId,{config,transport:async()=>{
      calls++;await updateCampaignStatus(staff._id,campaign._id,{status:'archived',confirmed:true});
      return {ok:true,json:async()=>({id:'archive-race-id'})};
    }});
    const fresh=await OutreachLead.findById(contact._id);assert.ok(fresh.sentAt);assert.equal(fresh.autoFollowup,false);assert.equal(fresh.followupDueAt,null);
    assert.equal(await OutreachLease.countDocuments({leadId:contact._id}),0);
    const draft=await OutreachCampaign.create({owner:staff._id,name:'Inactive send'});
    const unsent=await OutreachLead.create({...fields('inactive-send@example.test'),owner:staff._id,campaignId:draft._id});
    await assert.rejects(sendOutreach(staff._id,unsent.publicId,{config,transport:async()=>{calls++;}}),/Activate or resume/);
    assert.equal(calls,1);
  });


  await t.test('received content is matched from quoted original, stored privately and forwarded once', async () => {
    const { receiveOutreachReply } = await import('../services/outreachReplies.js');
    const campaign = await OutreachCampaign.create({owner:staff._id,name:'Reply inbox fixture',status:'active'});
    const lead = await OutreachLead.create({...fields('original-address@example.test'),owner:staff._id,campaignId:campaign._id,sentAt:new Date(),initialState:'accepted',autoFollowup:true,followup2DueAt:new Date(Date.now()+86400000)});
    const secret = await OutreachLead.findById(lead._id).select('+unsubscribeToken');
    const incoming={email_id:'fixture-received-one',from:'different-address@example.test',to:[config.replyTo],subject:'Re: Hello'};
    let forwards=0;
    const replyConfig={...config,forwardTo: 'notifications@example-mail.test',replyOwnerEmail:staff.email};
    const transport=async(url,options)=>{
      if(options.method==='POST'){
        forwards++; const payload=JSON.parse(options.body);assert.deepEqual(payload.to,[replyConfig.forwardTo]);assert.equal(payload.reply_to,incoming.from);assert.match(payload.text,/Ok. Go ahead/);assert.ok(options.headers['Idempotency-Key']);
        return {ok:true,json:async()=>({id:'forward-one'})};
      }
      assert.ok(url.startsWith('https://api.resend.com/emails/receiving/'));
      return {ok:true,json:async()=>({...incoming,id:incoming.email_id,created_at:new Date().toISOString(),text:null,html:'<p>Ok. Go ahead.</p><script>bad()</script><p>'+config.origin+'/api/finance/outreach/unsubscribe/'+secret.unsubscribeToken+'</p>',attachments:[{filename:'outline.pdf',size:200}]})};
    };
    const saved=await receiveOutreachReply(incoming,replyConfig,{transport});
    await receiveOutreachReply(incoming,replyConfig,{transport});
    assert.equal(forwards,1);assert.equal(await OutreachReply.countDocuments({providerId:incoming.email_id}),1);
    const fresh=await OutreachLead.findById(lead._id);assert.ok(fresh.repliedAt);assert.equal(fresh.followup2DueAt,null);assert.equal(fresh.autoFollowup,false);
    const inbox=await request('/replies');const item=inbox.replies.find(r=>r.publicId===saved.publicId);assert.ok(item);assert.equal(item.bodyText,undefined);assert.equal(item.owner,undefined);
    const detail=await request('/replies/'+saved.publicId);assert.match(detail.reply.bodyText,/Ok. Go ahead/);assert.ok(!detail.reply.bodyText.includes('bad()'));assert.equal(detail.reply.matchMethod,'original-message');assert.equal(detail.reply.forwardState,'sent');
    await request('/replies/'+saved.publicId,{auth:otherCredentials,status:404});await request('/replies',{auth:publicCredentials,status:403});
    assert.equal((await request('/replies',{auth:otherCredentials})).replies.length,0);
    assert.equal((await request('/replies?campaignId='+campaign._id)).replies.length,1);
  });
  await t.test('signed alias matches changed sender without quoted text; a forged alias never links',async()=>{
    const {receiveOutreachReply}=await import('../services/outreachReplies.js');
    const {outreachReplyAddress}=await import('../services/outreachReplyContent.js');
    const lead=await OutreachLead.create({...fields('alias-original@example.test'),owner:staff._id,sentAt:new Date(),initialState:'accepted'});
    const replyConfig={...config,secret:'fixture-signing-key',replyOwnerEmail:staff.email};
    const address=outreachReplyAddress(lead,replyConfig);
    const incoming={email_id:'fixture-alias-reply',from:'alias-other@example.test',to:[address],subject:'Different subject'};
    const transport=async()=>({ok:true,json:async()=>({...incoming,created_at:new Date().toISOString(),text:'Yes, please share.'})});
    const saved=await receiveOutreachReply(incoming,replyConfig,{transport});assert.equal(saved.matchMethod,'reply-address');assert.ok((await OutreachLead.findById(lead._id)).repliedAt);
    const unrelated=await OutreachLead.create({...fields('unrelated@example.test'),owner:staff._id,sentAt:new Date(),initialState:'accepted'});
    const forged={...incoming,email_id:'fixture-forged-reply',to:[address.replace(String(lead._id),String(unrelated._id))]};
    const unmatched=await receiveOutreachReply(forged,replyConfig,{transport:async()=>({ok:true,json:async()=>({...forged,text:'Hello',created_at:new Date().toISOString()})})});
    assert.equal(unmatched.links.length,0);assert.equal((await OutreachLead.findById(unrelated._id)).repliedAt,null);
    await request('/replies/'+unmatched.publicId+'/link',{method:'POST',token:'',body:{leadId:unrelated.publicId},status:403});
    await request('/replies/'+unmatched.publicId+'/link',{method:'POST',auth:otherCredentials,body:{leadId:unrelated.publicId},status:404});
    const linked=await request('/replies/'+unmatched.publicId+'/link',{method:'POST',body:{leadId:unrelated.publicId}});assert.equal(linked.reply.matchMethod,'manual');
    assert.ok((await OutreachLead.findById(unrelated._id)).repliedAt);
    await request('/replies/'+unmatched.publicId+'/link',{method:'POST',body:{leadId:unrelated.publicId},status:409});
  });
  await t.test('historical import is repeatable without forwarding; failures leave content readable',async()=>{
    const {receiveOutreachReply,syncOutreachReplies}=await import('../services/outreachReplies.js');
    const replyConfig={...config,forwardTo: 'notifications@example-mail.test',replyOwnerEmail:staff.email};
    const incoming={id:'fixture-history-one',email_id:'fixture-history-one',to:[config.replyTo],from:'unknown@example.test',subject:'A previous reply',created_at:new Date().toISOString(),text:'Original content'};
    let posts=0;
    const transport=async(url,options)=>{
      if(options.method==='POST'){posts++;throw Error('Simulated connection loss');}
      return {ok:true,json:async()=>url.includes('?limit=')?{data:[incoming],has_more:false}:incoming};
    };
    assert.equal((await syncOutreachReplies(staff._id,replyConfig,{transport})).imported,1);
    assert.equal((await syncOutreachReplies(staff._id,replyConfig,{transport})).imported,0);assert.equal(posts,0);
    const fresh={...incoming,email_id:'fixture-forward-failure'};
    const saved=await receiveOutreachReply(fresh,replyConfig,{transport});
    assert.equal((await OutreachReply.findById(saved._id)).forwardState,'review');
    await receiveOutreachReply(fresh,replyConfig,{transport});assert.equal(posts,1);
    assert.match((await request('/replies/'+saved.publicId)).reply.bodyText,/Original content/);
    const before=await OutreachReply.countDocuments();
    await assert.rejects(receiveOutreachReply({...fresh,email_id:'fixture-fetch-failure'},replyConfig,{transport:async()=>({ok:false,status:403})}),/receiving access/);
    assert.equal(await OutreachReply.countDocuments(),before);
  });


  await t.test('historical replies cannot stop later campaigns or be manually linked to later sends', async () => {
    const { receiveOutreachReply } = await import('../services/outreachReplies.js');
    const { outreachReplyAddress } = await import('../services/outreachReplyContent.js');
    const [oldCampaign, newCampaign] = await OutreachCampaign.create([
      { owner: staff._id, name: 'Original historical sequence', status: 'active' },
      { owner: staff._id, name: 'Later sequence', status: 'active' },
    ]);
    const base = { ...fields('history-cutoff@example.test'), owner: staff._id, status: 'sent', initialState: 'accepted', autoFollowup: true };
    const older = await OutreachLead.create({ ...base, campaignId: oldCampaign._id, sentAt: new Date('2026-10-20T10:00:00Z') });
    const due = new Date('2026-11-02T10:00:00Z');
    const newer = await OutreachLead.create({ ...base, campaignId: newCampaign._id, sentAt: new Date('2026-10-30T10:00:00Z'), followupDueAt: due });
    await OutreachLease.create({ key: String(staff._id) + ':' + newer.email, leadId: newer._id, expiresAt: due });
    const replyConfig = { ...config, secret: 'historical-signing-fixture', replyOwnerEmail: staff.email };
    const incoming = { email_id: 'historical-cutoff', from: base.email, to: [config.replyTo], created_at: '2026-10-22T10:00:00Z', text: 'Reply to the original message.' };
    const transport = body => async () => ({ ok: true, json: async () => body });
    const reply = await receiveOutreachReply(incoming, replyConfig, { historical: true, ownerScope: staff._id, transport: transport(incoming) });
    assert.deepEqual(reply.links.map(link => link.leadId), [older.publicId]);
    const oldSaved = await OutreachLead.findById(older._id); assert.equal(oldSaved.repliedAt.toISOString(), incoming.created_at.replace('Z', '.000Z'));
    const assertLaterUnchanged = async () => {
      const fresh = await OutreachLead.findById(newer._id);
      assert.equal(fresh.repliedAt, null); assert.equal(fresh.status, 'sent'); assert.equal(fresh.autoFollowup, true); assert.equal(fresh.followupDueAt.toISOString(), due.toISOString());
      assert.ok(await OutreachLease.exists({ leadId: newer._id }));
    };
    await assertLaterUnchanged();
    // Strong references are still rejected if their contact was sent after the reply.
    const token = await OutreachLead.findById(newer._id).select('+unsubscribeToken');
    for (const mode of ['alias', 'quoted-link']) {
      const data = { ...incoming, email_id: 'historical-future-' + mode, from: 'history-other@example.test', to: [mode === 'alias' ? outreachReplyAddress(newer, replyConfig) : config.replyTo], text: mode === 'quoted-link' ? config.origin + '/api/finance/outreach/unsubscribe/' + token.unsubscribeToken : 'Earlier message' };
      const unmatched = await receiveOutreachReply(data, replyConfig, { historical: true, transport: transport(data) });
      assert.equal(unmatched.links.length, 0);
      await request('/replies/' + unmatched.publicId + '/link', { method: 'POST', body: { leadId: newer.publicId }, status: 404 });
      await assertLaterUnchanged();
    }
    // Unknown historical dates stay unlinked instead of borrowing the import time.
    for (const date of ['', 'invalid-time']) {
      const data = { ...incoming, email_id: date ? 'historical-invalid-time' : 'historical-missing-time', created_at: date };
      const unknown = await receiveOutreachReply(data, replyConfig, { historical: true, transport: transport(data) });
      assert.equal(unknown.links.length, 0); assert.equal(unknown.receivedAt, null);
      await assertLaterUnchanged();
    }
  });
  await t.test('unresolved inbox owner fails without acknowledgement and the same webhook succeeds after correction', async () => {
    const originalFetch = globalThis.fetch;
    const keys = ['OUTREACH_RECEIVING_ENABLED', 'OUTREACH_REPLY_TO', 'OUTREACH_REPLY_OWNER_EMAIL', 'OUTREACH_REPLY_FORWARD_TO', 'OUTREACH_WEBHOOK_SECRET', 'APP_ORIGIN'];
    const originalEnv = Object.fromEntries(keys.map(key => [key, process.env[key]]));
    const signingKey = Buffer.from('unmatched-retry-signature-fixture');
    const incoming = { email_id: 'owner-retry-fixture', from: 'unmatched-retry@example.test', to: [config.replyTo], created_at: new Date().toISOString(), text: 'Keep this unmatched reply.' };
    const raw = JSON.stringify({ type: 'email.received', data: incoming });
    const eventId = 'unmatched-owner-retry-fixture';
    const timestamp = String(Math.floor(Date.now() / 1000));
    const signature = createHmac('sha256', signingKey).update(eventId + '.' + timestamp + '.' + raw).digest('base64');
    const headers = { 'Content-Type': 'application/json', 'svix-id': eventId, 'svix-timestamp': timestamp, 'svix-signature': 'v1,' + signature };
    let reads = 0;
    try {
      Object.assign(process.env, { OUTREACH_RECEIVING_ENABLED: 'true', OUTREACH_REPLY_TO: config.replyTo, OUTREACH_REPLY_OWNER_EMAIL: 'missing-owner@example.test', OUTREACH_REPLY_FORWARD_TO: '', OUTREACH_WEBHOOK_SECRET: 'whsec_' + signingKey.toString('base64'), APP_ORIGIN: config.origin });
      globalThis.fetch = async (url, options) => {
        if (String(url).startsWith('https://api.resend.com/')) { reads++; return { ok: true, json: async () => incoming }; }
        return originalFetch(url, options);
      };
      const attempt = () => originalFetch(origin + '/outreach/webhook', { method: 'POST', headers, body: raw });
      const failed = await attempt(); assert.equal(failed.status, 503); assert.match((await failed.json()).message, /OUTREACH_REPLY_OWNER_EMAIL/);
      assert.equal(await OutreachWebhookEvent.countDocuments({ eventId }), 0); assert.equal(await OutreachReply.countDocuments({ providerId: incoming.email_id }), 0);
      process.env.OUTREACH_REPLY_OWNER_EMAIL = staff.email;
      assert.equal((await attempt()).status, 200);
      assert.equal(await OutreachReply.countDocuments({ owner: staff._id, providerId: incoming.email_id }), 1);
      assert.equal(await OutreachWebhookEvent.countDocuments({ eventId }), 1);
      const saved = await OutreachReply.findOne({ owner: staff._id, providerId: incoming.email_id }).select('+bodyText'); assert.equal(saved.links.length, 0); assert.match(saved.bodyText, /Keep this unmatched reply/);
      assert.equal((await attempt()).status, 200); assert.equal(reads, 2);
    } finally {
      globalThis.fetch = originalFetch;
      for (const key of keys) { if (originalEnv[key] === undefined) delete process.env[key]; else process.env[key] = originalEnv[key]; }
    }
  });


  let chatLead, chatCampaign, chatReply;
  await t.test('conversation timeline joins our outreach and follow-ups with replies; read receipts are scoped', async () => {
    chatCampaign = await OutreachCampaign.create({ owner: staff._id, name: 'Chat fixture campaign', status: 'active' });
    chatLead = await OutreachLead.create({ ...fields('chat-original@example.test'), owner: staff._id, campaignId: chatCampaign._id, initialState: 'accepted', status: 'replied', stoppedReason: 'replied', repliedAt: new Date(), sentAt: new Date('2026-10-20T10:00:00Z'), followupSentAt: new Date('2026-10-22T10:00:00Z'), followup2SentAt: new Date('2026-10-24T10:00:00Z'), followup2: 'Our second follow-up', autoFollowup: false });
    const links = [{ leadId: chatLead.publicId, campaignId: chatCampaign._id, company: 'Chat company' }];
    const first = await OutreachReply.create({ owner: staff._id, providerId: 'chat-incoming-1', from: 'chat-respondent@example.test', subject: 'Re: Practical outline', receivedAt: new Date('2026-10-26T10:00:00Z'), bodyText: 'Please share your outline.', links });
    chatReply = await OutreachReply.create({ owner: staff._id, providerId: 'chat-incoming-2', from: 'chat-respondent@example.test', subject: 'Re: Practical outline', receivedAt: new Date('2026-10-28T10:00:00Z'), bodyText: 'Also include the expected timeline.', links });
    const id = 'lead:' + chatLead.publicId;
    const list = await request('/conversations?campaignId=' + chatCampaign._id);
    assert.equal(list.conversations.length, 1); assert.equal(list.conversations[0].unread, 2); assert.equal(list.conversations[0].bodyText, undefined);
    const timeline = await request('/conversations/' + id);
    assert.deepEqual(timeline.messages.map(m => m.kind), ['initial', 'followup', 'followup', 'reply', 'reply']);
    assert.equal(timeline.messages[0].body, chatLead.message); assert.equal(timeline.messages.at(-1).body, chatReply.bodyText);
    assert.equal(timeline.recipient, 'chat-respondent@example.test');
    await request('/conversations/' + id, { auth: otherCredentials, status: 404 });
    await request('/conversations', { auth: publicCredentials, status: 403 });
    const newest = await OutreachReply.create({ owner: staff._id, providerId: 'chat-incoming-3', from: 'chat-respondent@example.test', subject: 'Re: Practical outline', receivedAt: new Date(), bodyText: 'One more detail.', links });
    await request('/conversations/' + id + '/read', { method: 'POST', body: { replyIds: [first.publicId, chatReply.publicId] } });
    assert.equal((await OutreachReply.findById(newest._id)).readAt, null);
    assert.equal((await request('/conversations?campaignId=' + chatCampaign._id)).conversations[0].unread, 1);
    const stale = { body: 'Keep this draft for the newest reply.', replyId: chatReply.publicId, requestId: randomUUID(), confirmed: true };
    chatReply = newest;
    const settings = { RESEND_API_KEY: 'synthetic-no-network', OUTREACH_FROM_EMAIL: 'sender@example.test', OUTREACH_REPLY_TO: 'replies@example.test', APP_ORIGIN: 'https://example.test', OUTREACH_LIVE_ENABLED: 'true', OUTREACH_RECEIVING_ENABLED: 'true', OUTREACH_WEBHOOK_SECRET: 'synthetic-signing-secret' };
    const previousSettings = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]]));
    try {
      Object.assign(process.env, settings);
      const rejected = await request('/conversations/' + id + '/send', { method: 'POST', body: stale, status: 409 });
      assert.equal(rejected.code, 'OUTREACH_REPLY_CHANGED');
      assert.equal(await OutreachConversationMessage.countDocuments({ owner: staff._id, requestId: stale.requestId }), 0);
    } finally {
      for (const key of Object.keys(settings)) { if (previousSettings[key] === undefined) delete process.env[key]; else process.env[key] = previousSettings[key]; }
    }
    const send = { body: 'Our response', replyId: chatReply.publicId, requestId: randomUUID(), confirmed: true };
    await request('/conversations/' + id + '/send', { method: 'POST', token: '', body: send, status: 403 });
    await request('/conversations/' + id + '/send', { method: 'POST', auth: publicCredentials, body: send, status: 403 });
    await request('/conversations/' + id + '/send', { method: 'POST', auth: otherCredentials, body: send, status: 404 });
  });
  await t.test('chat responses preserve email threading and recipient, record once and obey sending policies', async () => {
    const { sendConversationResponse } = await import('../services/outreachConversations.js');
    const replyConfig = { ...config, secret: 'chat-signing-key' };
    const id = 'lead:' + chatLead.publicId, requestId = randomUUID(), input = { body: 'Here is our proposed outline.', replyId: chatReply.publicId, requestId };
    let posts = 0, gets = 0, payload;
    const transport = async (_url, options) => {
      if (!options.method) { gets++; return { ok: true, json: async () => ({ message_id: '<original-reply@example.test>' }) }; }
      posts++; payload = JSON.parse(options.body); assert.ok(options.headers['Idempotency-Key']);
      return { ok: true, json: async () => ({ id: 'chat-accepted' }) };
    };
    await OutreachCampaign.updateOne({ _id: chatCampaign._id }, { $set: { status: 'archived' } });
    await assert.rejects(sendConversationResponse(staff._id, id, input, { config: replyConfig, transport }), /Restore this campaign/);
    await OutreachCampaign.updateOne({ _id: chatCampaign._id }, { $set: { status: 'paused' } });
    await OutreachSuppression.create({ email: 'chat-respondent@example.test', reason: 'opted-out' });
    await assert.rejects(sendConversationResponse(staff._id, id, input, { config: replyConfig, transport }), /suppressed/);
    await OutreachSuppression.deleteOne({ email: 'chat-respondent@example.test' });
    await OutreachRate.deleteMany({});
    const result = await sendConversationResponse(staff._id, id, input, { config: replyConfig, transport });
    assert.equal(posts, 1); assert.equal(gets, 1); assert.equal(result.message.state, 'sent');
    const listed = await request('/conversations?campaignId=' + chatCampaign._id); assert.equal(listed.conversations[0].sortAt, result.message.sentAt.toISOString());
    assert.deepEqual(payload.to, ['chat-respondent@example.test']); assert.equal(payload.headers['In-Reply-To'], '<original-reply@example.test>'); assert.match(payload.headers.References, /original-reply/);
    assert.notEqual(payload.reply_to, config.replyTo); assert.equal(payload.text, input.body); assert.equal(payload.subject, 'Re: Practical outline');
    assert.equal((await OutreachLead.findById(chatLead._id)).autoFollowup, false);
    assert.equal((await sendConversationResponse(staff._id, id, input, { config: { ...replyConfig, live: false }, transport })).duplicate, true);
    await assert.rejects(sendConversationResponse(staff._id, id, { ...input, body: 'Changed body' }, { config: replyConfig, transport }), /another response/);
    assert.equal(posts, 1);
    const timeline = await request('/conversations/' + id); assert.ok(timeline.messages.some(m => m.kind === 'response' && m.body === input.body));
    await handleOutreachEvent({ type: 'email.bounced', data: { email_id: 'chat-accepted', to: ['chat-respondent@example.test'] } }, config);
    await handleOutreachEvent({ type: 'email.delivered', data: { email_id: 'chat-accepted' } }, config);
    assert.equal((await OutreachConversationMessage.findById(result.message._id)).deliveryStatus, 'bounced');
    await OutreachSuppression.deleteOne({ email: 'chat-respondent@example.test' });
  });
  await t.test('ambiguous or concurrent conversation sends cannot duplicate an email', async () => {
    const { sendConversationResponse } = await import('../services/outreachConversations.js');
    const replyConfig = { ...config, secret: 'chat-signing-key' }, id = 'lead:' + chatLead.publicId;
    const input = { body: 'A further detail.', replyId: chatReply.publicId, requestId: randomUUID() };
    await OutreachRate.deleteMany({});
    let release, entered, posts = 0;
    const started = new Promise(resolve => { entered = resolve; });
    const gate = new Promise(resolve => { release = resolve; });
    const transport = async () => { posts++; entered(); await gate; return { ok: true, json: async () => ({ id: 'chat-concurrent' }) }; };
    const first = sendConversationResponse(staff._id, id, input, { config: replyConfig, transport });
    await started;
    try {
      await assert.rejects(sendConversationResponse(staff._id, id, { ...input, requestId: randomUUID() }, { config: replyConfig, transport }), /sending or needs delivery review/);
    } finally { release(); }
    await first; assert.equal(posts, 1);
    await OutreachRate.deleteMany({});
    const uncertain = { ...input, requestId: randomUUID(), body: 'A response with an interrupted connection.' };
    const failing = async () => { posts++; throw Error('Connection lost'); };
    await assert.rejects(sendConversationResponse(staff._id, id, uncertain, { config: replyConfig, transport: failing }), /Delivery could not be confirmed/);
    await assert.rejects(sendConversationResponse(staff._id, id, uncertain, { config: replyConfig, transport: failing }), /delivery review/);
    assert.equal(posts, 2);
    assert.equal((await request('/conversations/' + id)).canSend, false);
  });
  await t.test('a stop during original-thread retrieval cancels the response before transport', async () => {
    const { sendConversationResponse } = await import('../services/outreachConversations.js');
    const campaign = await OutreachCampaign.create({ owner: staff._id, name: 'Stop-before-response', status: 'active' });
    const lead = await OutreachLead.create({ ...fields('chat-stop@example.test'), owner: staff._id, campaignId: campaign._id, sentAt: new Date('2026-10-20T10:00:00Z'), initialState: 'accepted' });
    const reply = await OutreachReply.create({ owner: staff._id, providerId: 'chat-stop-parent', from: lead.email, receivedAt: new Date(), subject: 'Re: Stop fixture', links: [{ leadId: lead.publicId, campaignId: campaign._id }], bodyText: 'A reply' });
    let posts = 0;
    await OutreachRate.deleteMany({});
    await assert.rejects(sendConversationResponse(staff._id, 'lead:' + lead.publicId, { body: 'Must not be sent', replyId: reply.publicId, requestId: randomUUID() }, { config, transport: async (_url, options) => {
      if (options.method) { posts++; throw Error('Unexpected send'); }
      await OutreachCampaign.updateOne({ _id: campaign._id }, { $set: { status: 'archived' } });
      return { ok: true, json: async () => ({ message_id: '<stop-parent@example.test>' }) };
    } }), /Sending stopped before/);
    assert.equal(posts, 0); assert.equal((await OutreachConversationMessage.findOne({ owner: staff._id, leadId: lead.publicId })).state, 'cancelled');
  });
  await t.test('conversation pagination preserves the complete timeline and account boundaries', async () => {
    const campaign = await OutreachCampaign.create({ owner: staff._id, name: 'Long conversation', status: 'active' });
    const lead = await OutreachLead.create({ ...fields('long-chat@example.test'), owner: staff._id, campaignId: campaign._id, sentAt: new Date('2026-10-01T00:00:00Z'), initialState: 'accepted' });
    await OutreachReply.insertMany(Array.from({ length: 105 }, (_, index) => ({ owner: staff._id, providerId: 'long-chat-' + index, from: lead.email, subject: 'Long thread', receivedAt: new Date(Date.UTC(2026, 9, 2) + index * 60000), bodyText: 'Message ' + index, links: [{ leadId: lead.publicId, campaignId: campaign._id }] })));
    const path = '/conversations/lead:' + lead.publicId;
    const first = await request(path); assert.equal(first.messages.length, 100); assert.ok(first.nextCursor);
    const older = await request(path + '?before=' + encodeURIComponent(first.nextCursor));
    assert.equal(older.messages.length, 6); assert.equal(older.messages[0].kind, 'initial');
    assert.equal(new Set([...older.messages, ...first.messages].map(m => m.id)).size, 106);
    await OutreachReply.insertMany(Array.from({ length: 52 }, (_, index) => ({ owner: staff._id, providerId: 'unmatched-page-' + index, from: 'unmatched-' + index + '@example.test', subject: 'Unmatched', receivedAt: new Date(Date.UTC(2026, 9, 31) + index * 60000), bodyText: 'Private reply', links: [] })));
    const conversations = await request('/conversations'); assert.equal(conversations.conversations.length, 50); assert.ok(conversations.nextCursor);
    const next = await request('/conversations?before=' + encodeURIComponent(conversations.nextCursor));
    assert.ok(next.conversations.length); assert.ok(!next.conversations.some(item => conversations.conversations.some(previous => previous.id === item.id)));
    assert.equal((await request('/conversations', { auth: otherCredentials })).conversations.length, 0);
  });

  await t.test('attachments send once with their reply and downloads stay within the owning conversation', async () => {
    const { getConversationAttachment, normalizeResponseAttachments } = await import('../services/outreachAttachments.js');
    const campaign = await OutreachCampaign.create({ owner: staff._id, name: 'Attachment fixture', status: 'active' });
    const lead = await OutreachLead.create({ ...fields('attachments@example.test'), owner: staff._id, campaignId: campaign._id, sentAt: new Date('2026-10-20T10:00:00Z'), initialState: 'accepted', status: 'replied', stoppedReason: 'replied' });
    const attachmentId = randomUUID(), thread = 'lead:' + lead.publicId;
    const reply = await OutreachReply.create({ owner: staff._id, providerId: 'attachment-incoming', from: 'attachments@example.test', subject: 'Re: Files', receivedAt: new Date(), bodyText: 'Please see the file.', internetMessageId: '<incoming-file@example.test>', attachments: [{ filename: 'received.pdf', size: 8, providerId: attachmentId }, { filename: 'legacy.txt', size: 8 }], links: [{ leadId: lead.publicId, campaignId: campaign._id }] });
    const bytes = Buffer.alloc(5 * 1024 * 1024, 65), body = { body: 'Here is our proposal.', replyId: reply.publicId, requestId: randomUUID(), confirmed: true, attachments: [{ filename: 'proposal.pdf', content: bytes.toString('base64') }] };
    const settings = { RESEND_API_KEY: 'synthetic-no-network', OUTREACH_FROM_EMAIL: 'sender@example.test', OUTREACH_REPLY_TO: 'replies@example.test', APP_ORIGIN: 'https://example.test', OUTREACH_LIVE_ENABLED: 'true', OUTREACH_RECEIVING_ENABLED: 'true', OUTREACH_WEBHOOK_SECRET: 'synthetic-signing-secret' };
    const previous = Object.fromEntries(Object.keys(settings).map(key => [key, process.env[key]])), originalFetch = globalThis.fetch;
    let posts = 0, downloads = 0, payload;
    globalThis.fetch = async (url, options) => {
      if (String(url).startsWith('http://127.0.0.1:')) return originalFetch(url, options);
      if (String(url) === 'https://api.resend.com/emails') { posts++; payload = JSON.parse(options.body); return Response.json({ id: 'attachment-sent' }); }
      if (String(url).startsWith('https://api.resend.com/emails/')) {
        const metadata = { id: attachmentId, filename: String(url).includes('attachment-sent') ? 'proposal.pdf' : 'received.pdf', size: String(url).includes('attachment-sent') ? bytes.length : 8, download_url: 'https://inbound-cdn.resend.com/fixture' };
        return Response.json(String(url).includes('?limit=') ? { data: [{ ...metadata, filename: String(url).includes('attachment-sent') ? 'proposal.pdf' : 'legacy.txt' }] } : metadata);
      }
      assert.equal(String(url), 'https://inbound-cdn.resend.com/fixture'); assert.equal(options.headers, undefined); assert.equal(options.redirect, 'error'); downloads++;
      return new Response(Buffer.from('filedata'));
    };
    try {
      Object.assign(process.env, settings); await OutreachRate.deleteMany({});
      const sent = await request('/conversations/' + thread + '/send', { method: 'POST', body });
      assert.equal(posts, 1); assert.deepEqual(Buffer.from(payload.attachments[0].content, 'base64'), bytes);
      assert.deepEqual(payload.attachments.map(a => a.filename), ['proposal.pdf']);
      assert.equal(sent.message.attachments[0].size, bytes.length); assert.equal(sent.message.attachments[0].content, undefined); assert.match(sent.message.attachments[0].sha256, /^[a-f0-9]{64}$/);
      await request('/conversations/' + thread + '/send', { method: 'POST', body }); assert.equal(posts, 1);
      await request('/conversations/' + thread + '/send', { method: 'POST', body: { ...body, attachments: [{ filename: 'proposal.pdf', content: Buffer.from('different').toString('base64') }] }, status: 409 }); assert.equal(posts, 1);
      const timeline = await request('/conversations/' + thread); assert.equal(timeline.messages.find(m => m.id === 'out:' + sent.message.publicId).attachments[0].filename, 'proposal.pdf');
      const path = '/outreach/conversations/' + thread + '/attachments/in:' + reply.publicId + '/0';
      const response = await originalFetch(origin + path, { headers: { Cookie: credentials.cookie } }); assert.equal(response.status, 200); assert.match(response.headers.get('content-disposition'), /^attachment;.*received.pdf/); assert.equal(response.headers.get('x-content-type-options'), 'nosniff'); assert.equal(await response.text(), 'filedata');
      assert.equal((await getConversationAttachment(staff._id, thread, 'in:' + reply.publicId, '1')).bytes.toString(), 'filedata');
      assert.equal((await getConversationAttachment(staff._id, thread, 'out:' + sent.message.publicId, '0')).bytes.toString(), 'filedata');
      const beforeDenied = downloads;
      await request('/conversations/' + thread + '/attachments/in:' + reply.publicId + '/0', { auth: otherCredentials, status: 404 });
      await request('/conversations/' + thread + '/attachments/in:' + reply.publicId + '/0', { auth: publicCredentials, status: 403 });
      await assert.rejects(getConversationAttachment(staff._id, 'lead:' + randomUUID(), 'in:' + reply.publicId, '0'), /not found/);
      await assert.rejects(getConversationAttachment(staff._id, thread, 'in:' + reply.publicId, '99'), /not found/); assert.equal(downloads, beforeDenied);
      await assert.rejects(getConversationAttachment(staff._id, thread, 'in:' + reply.publicId, '0', { transport: async () => Response.json({ download_url: 'https://127.0.0.1/private' }) }), /unavailable/);
      await assert.rejects(getConversationAttachment(staff._id, thread, 'in:' + reply.publicId, '0', { transport: async () => Response.json({ size: 41 * 1024 * 1024, download_url: 'https://inbound-cdn.resend.com/fixture' }) }), /too large/);
      assert.throws(() => normalizeResponseAttachments([{ filename: '../file.pdf', content: 'Zg==' }]), /valid filename/);
      assert.throws(() => normalizeResponseAttachments([{ filename: 'bad.exe', content: 'Zg==' }]), /valid filename/);
      assert.throws(() => normalizeResponseAttachments([{ filename: 'bad.pdf', content: 'not base64!' }]), /could not be read/);
      assert.throws(() => normalizeResponseAttachments(Array(6).fill({ filename: 'file.pdf', content: 'Zg==' })), /up to 5/);
      assert.throws(() => normalizeResponseAttachments(Array(5).fill(body.attachments[0])), /5 MB or less/);
      await request('/conversations/' + thread + '/send', { method: 'POST', body: { ...body, requestId: randomUUID(), attachments: [{ filename: 'bad.exe', content: 'Zg==' }] }, status: 400 });
      const oversized = await originalFetch(origin + '/outreach/conversations/' + thread + '/send', { method: 'POST', headers: { Cookie: credentials.cookie, 'Content-Type': 'application/json', 'X-CSRF-Token': credentials.token }, body: JSON.stringify({ ...body, body: 'x'.repeat(8 * 1024 * 1024) }) }); assert.equal(oversized.status, 413); assert.match((await oversized.json()).message, /5 MB/);
    } finally {
      globalThis.fetch = originalFetch;
      for (const key of Object.keys(settings)) { if (previous[key] === undefined) delete process.env[key]; else process.env[key] = previous[key]; }
    }
  });

  await t.test('same-name same-size response attachments download by content and retain provider IDs', async () => {
    const { sendConversationResponse } = await import('../services/outreachConversations.js');
    const { getConversationAttachment } = await import('../services/outreachAttachments.js');
    const campaign = await OutreachCampaign.create({ owner: staff._id, name: 'Identical filenames', status: 'active' });
    const lead = await OutreachLead.create({ ...fields('duplicate-files@example.test'), owner: staff._id, campaignId: campaign._id, sentAt: new Date('2026-10-20T10:00:00Z'), initialState: 'accepted', status: 'replied', stoppedReason: 'replied' });
    const reply = await OutreachReply.create({ owner: staff._id, providerId: 'duplicate-incoming', from: lead.email, subject: 'Re: Files', receivedAt: new Date(), internetMessageId: '<duplicate-files@example.test>', links: [{ leadId: lead.publicId, campaignId: campaign._id }] });
    const input = { body: 'Here are both files.', replyId: reply.publicId, requestId: randomUUID(), attachments: ['first', 'other'].map(text => ({ filename: 'proposal.pdf', content: Buffer.from(text).toString('base64') })) };
    await OutreachRate.deleteMany({});
    let posts = 0, listings = 0, mismatch = false;
    const transport = async (url, options) => {
      if (options.method === 'POST') { posts++; assert.equal(JSON.parse(options.body).attachments.length, 2); return Response.json({ id: 'same-name-sent' }); }
      if (String(url).includes('?limit=')) { listings++; return Response.json({ data: ['other', 'first'].map(text => ({ id: text, filename: 'proposal.pdf', size: 5, download_url: 'https://inbound-cdn.resend.com/' + text })) }); }
      if (String(url).startsWith('https://api.resend.com/')) { const id = String(url).split('/').at(-1); return Response.json({ id, size: 5, download_url: 'https://inbound-cdn.resend.com/' + id }); }
      assert.equal(options.headers, undefined);
      return new Response(Buffer.from(mismatch ? 'wrong' : String(url).split('/').at(-1)));
    };
    const thread = 'lead:' + lead.publicId;
    const sent = await sendConversationResponse(staff._id, thread, input, { config, transport });
    const message = 'out:' + sent.message.publicId;
    assert.equal((await getConversationAttachment(staff._id, thread, message, '0', { transport })).bytes.toString(), 'first');
    assert.equal((await getConversationAttachment(staff._id, thread, message, '1', { transport })).bytes.toString(), 'other');
    const stored = await OutreachConversationMessage.findById(sent.message._id);
    assert.deepEqual(stored.attachments.map(item => item.providerId), ['first', 'other']);
    assert.equal(listings, 2);
    assert.equal((await getConversationAttachment(staff._id, thread, message, '0', { transport })).bytes.toString(), 'first'); assert.equal(listings, 2);
    assert.equal((await sendConversationResponse(staff._id, thread, input, { config, transport })).duplicate, true); assert.equal(posts, 1);
    await OutreachConversationMessage.updateOne({ _id: stored._id }, { $unset: { 'attachments.0.providerId': '' } });
    mismatch = true;
    await assert.rejects(getConversationAttachment(staff._id, thread, message, '0', { transport }), /could not be verified/);
    assert.equal((await OutreachConversationMessage.findById(stored._id)).attachments[0].providerId, undefined);
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
