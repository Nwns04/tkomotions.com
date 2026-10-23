import test from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { assertSendable, outreachConfig, outreachFields, verifyOutreachWebhook } from '../services/outreachPolicy.js';
import { exampleOutreachCsv, parseOutreachCsv } from '../../src/finance/utils/outreachCsv.js';

test('live sending and automation require explicit, complete configuration', () => {
  const env = { RESEND_API_KEY: 'synthetic', RESEND_FROM_EMAIL: 'TKO <hello@example.test>', OUTREACH_REPLY_TO: 'replies@example.test', APP_ORIGIN: 'https://example.test' };
  assert.equal(outreachConfig(env).configured, true);
  assert.equal(outreachConfig(env).live, false);
  assert.equal(outreachConfig({ ...env, OUTREACH_LIVE_ENABLED: 'true' }).live, true);
  assert.equal(outreachConfig({ ...env, OUTREACH_LIVE_ENABLED: 'true', APP_ORIGIN: 'http://example.test' }).live, false);
  assert.equal(outreachConfig({ ...env, OUTREACH_LIVE_ENABLED: 'true', APP_ORIGIN: 'https://example.test/path' }).live, false);
  assert.equal(outreachConfig({ ...env, OUTREACH_LIVE_ENABLED: 'true', OUTREACH_AUTO_FOLLOWUP_ENABLED: 'true' }).autoFollowupReady, false);
  assert.equal(outreachConfig({ ...env, OUTREACH_LIVE_ENABLED: 'true', OUTREACH_AUTO_FOLLOWUP_ENABLED: 'true', OUTREACH_RECEIVING_ENABLED: 'true', OUTREACH_WEBHOOK_SECRET: 'synthetic' }).autoFollowupReady, true);
});

test('webhooks require an exact raw body, signed finite timestamp and valid version', () => {
  const raw = Buffer.from('{"type":"email.received"}'), key = Buffer.from('local-synthetic-signing-key');
  const now = Date.now(), timestamp = String(Math.floor(now / 1000));
  const signature = createHmac('sha256', key).update(`fixture.${timestamp}.`).update(raw).digest('base64');
  const headers = { 'svix-id': 'fixture', 'svix-timestamp': timestamp, 'svix-signature': 'v1,' + signature };
  const secret = 'whsec_' + key.toString('base64');
  assert.equal(verifyOutreachWebhook(raw, headers, secret, now), true);
  assert.equal(verifyOutreachWebhook(Buffer.from(raw.toString() + ' '), headers, secret, now), false);
  assert.equal(verifyOutreachWebhook(raw, headers, '', now), false);
  assert.equal(verifyOutreachWebhook(raw, { ...headers, 'svix-timestamp': 'NaN' }, secret, now), false);
  assert.equal(verifyOutreachWebhook(raw, { ...headers, 'svix-signature': 'v2,' + signature }, secret, now), false);
  assert.equal(verifyOutreachWebhook(raw, headers, secret, now + 301000), false);
});

test('send rules block duplicate, replied, opted-out, failed and uncertain messages', () => {
  const lead = { email: 'hello@example.test', subject: 'Hello', message: 'First', followup: 'Follow up', permissionBasis: 'Requested information', initialState: 'pending', followupState: 'pending' };
  assert.doesNotThrow(() => assertSendable(lead));
  assert.doesNotThrow(() => assertSendable({ ...lead, permissionBasis: '' }));
  assert.doesNotThrow(() => assertSendable({ ...lead, permissionBasis: undefined, sentAt: new Date() }, true));
  for (const change of [{ stoppedReason: 'failed' }, { stoppedReason: 'complained' }, { repliedAt: new Date() }, { optedOutAt: new Date() }, { initialState: 'sending' }, { initialState: 'review' }, { sentAt: new Date() }]) assert.throws(() => assertSendable({ ...lead, ...change }));
  assert.throws(() => assertSendable(lead, true));
  assert.doesNotThrow(() => assertSendable({ ...lead, sentAt: new Date() }, true));
  assert.throws(() => assertSendable({ ...lead, sentAt: new Date(), followupSentAt: new Date() }, true));
});

test('CSV supports multiline fields, quoted commas, escaped quotes and BOM', () => {
  const text = '\uFEFFcompany,email,message,delayDays\r\n"Company, Inc",hello@example.test,"Hello\nA ""quoted"" line",3\r\n';
  const [row] = parseOutreachCsv(text);
  assert.equal(row.company, 'Company, Inc'); assert.equal(row.message, 'Hello\nA "quoted" line'); assert.equal(row.delayDays, 3);
  assert.equal(parseOutreachCsv(exampleOutreachCsv())[0].message, 'Hello,\nI wanted to introduce TKO Motions.');
  assert.throws(() => parseOutreachCsv('company\nHello'), /email column/);
  assert.throws(() => parseOutreachCsv('email\n"unclosed'), /unclosed/);
  assert.throws(() => parseOutreachCsv('email\n' + 'hello@example.test\n'.repeat(501)), /500/);
});

test('field validation limits input, normalizes addresses and rejects unsafe types', () => {
  assert.equal(outreachFields.parse({ email: ' USER@EXAMPLE.TEST ' }).email, 'user@example.test');
  assert.equal(outreachFields.parse({ email: 'a@example.test' }).permissionBasis, '');
  assert.equal(parseOutreachCsv('email,permissionBasis\na@example.test,Requested introduction')[0].permissionBasis, 'Requested introduction');
  assert.equal(outreachFields.safeParse({ email: 'invalid' }).success, false);
  assert.equal(outreachFields.safeParse({ email: 'a@example.test', delayDays: 0 }).success, false);
  assert.equal(outreachFields.safeParse({ email: 'a@example.test', subject: 'a'.repeat(251) }).success, false);
  assert.equal(outreachFields.safeParse({ email: { $ne: null } }).success, false);
  assert.equal(outreachFields.parse({ email: 'a@example.test', owner: 'forged' }).owner, undefined);
});