import express, { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { OutreachLead, OutreachCampaign, OutreachEvent, OutreachSuppression, OutreachWebhookEvent, OutreachLease } from '../models/Outreach.js';
import { fail, outreachConfig, outreachFields, verifyOutreachWebhook } from '../services/outreachPolicy.js';
import { sendOutreach, handleOutreachEvent, suppressOutreach, outreachLog, reserveOutreachLead, releaseOutreachLead } from '../services/outreach.js';

export const outreachPublicRouter = Router();
outreachPublicRouter.post('/webhook', express.raw({ type: 'application/json', limit: '256kb' }), async (req, res) => {
  if (!verifyOutreachWebhook(req.body, req.headers, outreachConfig().secret)) return res.status(401).json({ message: 'Invalid webhook signature.' });
  let event;
  try { event = JSON.parse(req.body.toString('utf8')); } catch { return res.status(400).json({ message: 'Invalid webhook payload.' }); }
  if (!event || typeof event.type !== 'string') return res.status(400).json({ message: 'Invalid webhook event.' });
  // Signed Svix message ids are stable across webhook retries.
  const eventId = req.headers['svix-id'];
  try { await OutreachWebhookEvent.create({ eventId }); }
  catch (error) {
    if (error.code === 11000) return res.json({ ok: true, duplicate: true });
    throw error;
  }
  try { await handleOutreachEvent(event); }
  catch (error) {
    // Failure must remain retryable. Don't acknowledge and lose the event.
    await OutreachWebhookEvent.deleteOne({ eventId });
    throw error;
  }
  return res.json({ ok: true });
});

const unsubscribeLimit = rateLimit({ windowMs: 60000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false });
function unsubscribePage(message, form = '') {
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>TKO Motions email preferences</title><body style="font:18px system-ui;max-width:560px;margin:12vh auto;padding:24px"><h1>Email preferences</h1><p>' + message + '</p>' + form + '</body></html>';
}
outreachPublicRouter.all('/unsubscribe/:token', unsubscribeLimit, async (req, res) => {
  res.set('Cache-Control', 'no-store').set('Referrer-Policy', 'no-referrer');
  if (!['GET', 'POST'].includes(req.method)) return res.status(405).end();
  if (!/^[a-f0-9]{64}$/.test(req.params.token)) return res.status(404).type('html').send(unsubscribePage('This link is not valid.'));
  const lead = await OutreachLead.findOne({ unsubscribeToken: req.params.token }).select('+owner');
  if (!lead) return res.status(404).type('html').send(unsubscribePage('This link is not valid.'));
  if (req.method === 'GET' && !lead.optedOutAt) return res.type('html').send(unsubscribePage('Confirm below to stop outreach emails from TKO Motions.', '<form method="post"><button type="submit">Unsubscribe</button></form>'));
  if (req.method === 'POST') { await suppressOutreach(lead.email, 'opted-out'); await outreachLog(lead, 'opted-out', 'Recipient unsubscribed.'); }
  return res.type('html').send(unsubscribePage('You have been unsubscribed. No further outreach emails will be sent to this address.'));
});

const router = Router();
router.use(requireAuth);
router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  if (req.user.accountSource === 'public') return res.status(403).json({ message: 'Email Outreach is restricted to TKO staff accounts.' });
  return next();
});
router.use((req, res, next) => ['GET', 'HEAD'].includes(req.method) ? next() : requireCsrf(req, res, next));
router.use(rateLimit({ windowMs: 60000, limit: 120, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Too many requests. Please wait a minute.' } }));

router.get('/', async (req, res) => {
  const config = outreachConfig();
  const [leads, events, counts, campaigns] = await Promise.all([
    OutreachLead.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(1000),
    OutreachEvent.find({ owner: req.user._id }).sort({ createdAt: -1 }).limit(50),
    OutreachLead.aggregate([{ $match: { owner: req.user._id } }, { $group: { _id: null, total: { $sum: 1 }, sent: { $sum: { $cond: ['$sentAt', 1, 0] } }, replied: { $sum: { $cond: ['$repliedAt', 1, 0] } }, followups: { $sum: { $cond: ['$followupSentAt', 1, 0] } } } }]),
    OutreachCampaign.find({ owner: req.user._id }).sort({ createdAt: -1 }),
  ]);
  res.json({ leads, events, campaigns, stats: counts[0] || { total: 0, sent: 0, replied: 0, followups: 0 },
    config: { live: config.live, configured: config.configured, requestedLive: config.requestedLive, from: config.from, replyTo: config.replyTo, receiving: config.receiving, autoFollowupReady: config.autoFollowupReady } });
});

router.post('/import', async (req, res) => {
  const input = z.object({ rows: z.array(z.unknown()).min(1).max(500), campaignId: z.string().optional() }).safeParse(req.body);
  if (!input.success) throw fail('Provide between 1 and 500 CSV rows.');
  let campaign = null;
  if (input.data.campaignId) {
    campaign = await OutreachCampaign.findOne({ owner: req.user._id, _id: input.data.campaignId });
    if (!campaign) throw fail('Campaign not found.', 404);
  }
  let added = 0; const skipped = [];
  for (const [index, row] of input.data.rows.entries()) {
    const parsed = outreachFields.safeParse(row);
    if (!parsed.success) { skipped.push({ row: index + 2, reason: parsed.error.issues[0].message }); continue; }
    if (await OutreachSuppression.exists({ email: parsed.data.email })) { skipped.push({ row: index + 2, reason: 'Address is suppressed.' }); continue; }
    try { await OutreachLead.create({ ...parsed.data, autoFollowup: false, owner: req.user._id, campaignId: campaign?._id || null }); added++; }
    catch (error) { if (error.code !== 11000) throw error; skipped.push({ row: index + 2, reason: 'Duplicate email address.' }); }
  }
  return res.status(201).json({ added, skipped });
});
const campaignInput = z.object({ name: z.string().trim().min(1).max(150) });
router.post('/campaigns', async (req, res) => {
  const parsed = campaignInput.safeParse(req.body);
  if (!parsed.success) throw fail('Enter a campaign name (1–150 characters).');
  const campaign = await OutreachCampaign.create({ ...parsed.data, owner: req.user._id });
  res.status(201).json({ campaign });
});
router.post('/campaigns/:id/status', async (req, res) => {
  if (!['draft', 'active', 'paused'].includes(req.body?.status)) throw fail('Invalid campaign status.');
  const campaign = await OutreachCampaign.findOneAndUpdate({ _id: req.params.id, owner: req.user._id }, { $set: { status: req.body.status } }, { new: true });
  if (!campaign) throw fail('Campaign not found.', 404);
  res.json({ campaign });
});
const scheduleInput = z.object({ ids: z.array(z.string()).min(1).max(500), startAt: z.string().datetime({ offset: true }), intervalMinutes: z.number().min(0).max(1440).default(0), autoFollowup: z.boolean().default(false) });

router.post('/review-contact-basis', async (req, res) => {
  const input = z.object({ ids: z.array(z.string()).min(1).max(500), permissionBasis: z.string().trim().min(12).max(500) }).safeParse(req.body);
  if (!input.success) throw fail('Select contacts and give a truthful contact basis of at least 12 characters.');
  const { ids, permissionBasis } = input.data;
  const count = await OutreachLead.updateMany({ owner: req.user._id, publicId: { $in: ids }, initialState: 'pending', sentAt: null, stoppedReason: '' }, { $set: { permissionBasis } });
  return res.json({ reviewed: count.modifiedCount });
});

router.post('/schedule', async (req, res) => {
  const parsed = scheduleInput.safeParse(req.body);
  if (!parsed.success) throw fail('Provide contact IDs, ISO date with timezone, and spacing in minutes.');
  const { ids, startAt, intervalMinutes, autoFollowup } = parsed.data;
  const start = new Date(startAt);
  if (start.getTime() <= Date.now() + 120000 || start.getTime() > Date.now() + 365 * 86400000) throw fail('Schedule between two minutes and one year in the future.');
  const leads = await OutreachLead.find({ owner: req.user._id, publicId: { $in: ids } }).select('+owner').sort({ createdAt: 1 });
  if (leads.length !== new Set(ids).size) throw fail('One or more contacts were not found.');
  if (new Set(leads.map(lead => lead.email)).size !== leads.length) throw fail('Selected contacts include the same email address across campaigns. Schedule only one active sequence per address.', 409);
  for (const lead of leads) {
    if (lead.initialState !== 'pending' || lead.sentAt || lead.stoppedReason || !lead.subject || !lead.message || !lead.permissionBasis) throw fail(`Contact ${lead.email} is not eligible for scheduling.`);
    if (await OutreachSuppression.exists({ email: lead.email })) throw fail(`Contact ${lead.email} is suppressed.`);
    if (await OutreachLead.exists({ owner: req.user._id, email: lead.email, _id: { $ne: lead._id },
      stoppedReason: '', $or: [
        { scheduledAt: { $ne: null } },
        { sentAt: { $gte: new Date(Date.now() - 14 * 86400000) } },
        { initialState: 'sending' }, { followupState: 'sending' }, { followup2State: 'sending' },
      ] })) throw fail(`Another campaign already has an active or recently sent sequence for ${lead.email}.`, 409);
    if (lead.campaignId) {
      const campaign = await OutreachCampaign.findOne({ _id: lead.campaignId, owner: req.user._id });
      if (!campaign) throw fail('Campaign missing.');
      if (campaign.status !== 'active') throw fail('Activate the campaign before scheduling emails.', 409);
    }
  }
  if (autoFollowup && !outreachConfig().autoFollowupReady) throw fail('Automatic follow-ups require verified receiving and webhook configuration.', 409);
  // Reserve every selected address atomically BEFORE writing any schedules.
  // If any address is unavailable, release new reservations and leave the batch untouched.
  const newlyReserved = [];
  try {
    for (const [index, lead] of leads.entries()) {
      const existing = await OutreachLease.findOne({ key: `${lead.owner}:${lead.email.toLowerCase()}` });
      const previouslyOurs = existing && String(existing.leadId) === String(lead._id);
      await reserveOutreachLead(lead);
      if (!previouslyOurs) newlyReserved.push(lead);
    }
  } catch (error) {
    for (const lead of newlyReserved) await releaseOutreachLead(lead);
    throw error;
  }
  // Compensating rollback: no half-success response and no orphaned reservations
  // if a write fails after some addresses have already been reserved. Initial
  // start is at least two minutes ahead, keeping the worker clear of this batch.
  const written = [];
  try {
    for (const [index, lead] of leads.entries()) {
      const at = new Date(start.getTime() + index * intervalMinutes * 60000);
      const change = await OutreachLead.updateOne({ _id: lead._id, owner: req.user._id,
        initialState: 'pending', stoppedReason: '', sentAt: null, scheduledAt: null },
      { $set: { scheduledAt: at, status: 'scheduled', autoFollowup: autoFollowup && !!lead.followup } });
      if (!change.modifiedCount) throw fail(`Contact ${lead.email} changed during scheduling. Retry the batch.`, 409);
      written.push(lead);
    }
  } catch (error) {
    for (const lead of written) {
      await OutreachLead.updateOne({ _id: lead._id, initialState: 'pending', sentAt: null },
        { $set: { scheduledAt: null, status: 'draft', autoFollowup: false } });
    }
    for (const lead of newlyReserved) await releaseOutreachLead(lead);
    throw error;
  }
  const scheduled = written.length;
  res.json({ scheduled });
});
router.post('/:publicId/unschedule', async (req, res) => {
  const lead = await OutreachLead.findOne({ owner: req.user._id, publicId: req.params.publicId }).select('+owner');
  if (!lead) throw fail('Scheduled contact not found.', 404);
  const change = await OutreachLead.updateOne({ _id: lead._id, initialState: 'pending', sentAt: null, scheduledAt: { $ne: null } }, { $set: { scheduledAt: null, status: 'draft', autoFollowup: false } });
  if (!change.modifiedCount) throw fail('Scheduled contact not found or already sending.', 409);
  await releaseOutreachLead(lead);
  res.json({ ok: true });
});


router.patch('/:publicId', async (req, res) => {
  const lead = await OutreachLead.findOne({ owner: req.user._id, publicId: req.params.publicId }).select('+owner');
  if (!lead) throw fail('Contact not found.', 404);
  const parsed = outreachFields.safeParse(req.body);
  if (!parsed.success) throw fail(parsed.error.issues.map(issue => issue.path.join('.') + ': ' + issue.message).join(' '));
  if (lead.initialState !== 'pending') throw fail('Messages are locked once live sending has been attempted. Use the stop or replied actions.', 409);
  // A conditional write prevents an edit racing with a send from changing its payload.
  const updated = await OutreachLead.findOneAndUpdate({ _id: lead._id, owner: req.user._id, initialState: 'pending' }, { $set: parsed.data }, { new: true, runValidators: true });
  if (!updated) throw fail('This contact is being sent. Reload to see its current status.', 409);
  return res.json({ lead: updated });
});

router.post('/:publicId/stop', async (req, res) => {
  const reason = req.body?.reason;
  if (!['replied', 'opted-out', 'paused'].includes(reason)) throw fail('Choose replied, opted-out, or paused.');
  const lead = await OutreachLead.findOne({ owner: req.user._id, publicId: req.params.publicId }).select('+owner');
  if (!lead) throw fail('Contact not found.', 404);
  if (reason === 'opted-out') await suppressOutreach(lead.email, reason);
  else await OutreachLead.updateOne({ _id: lead._id }, { $set: { status: reason, stoppedReason: reason, followupDueAt: null, followup2DueAt: null, ...(reason === 'replied' ? { repliedAt: new Date() } : {}) } });
  if (lead.initialState !== 'sending' && lead.followupState !== 'sending' && lead.followup2State !== 'sending') await releaseOutreachLead(lead);
  await outreachLog(lead, reason, 'Recorded by Finance staff.');
  return res.json({ ok: true });
});

router.post('/:publicId/send', rateLimit({ windowMs: 60000, limit: 15, standardHeaders: 'draft-7', legacyHeaders: false, message: { message: 'Please wait a minute before sending more emails.' } }), async (req, res) => {
  const input = z.object({ test: z.boolean(), followup: z.boolean().default(false), confirmed: z.boolean().default(false) }).safeParse(req.body);
  if (!input.success) throw fail('Specify whether this is a test send.');
  if (!input.data.test && !input.data.confirmed) throw fail('Confirm live sending first.');
  return res.json(await sendOutreach(req.user._id, req.params.publicId, input.data));
});

router.get('/export', async (req, res) => {
  const leads = await OutreachLead.find({ owner: req.user._id }).sort({ createdAt: -1 });
  res.attachment('tko-outreach.json').json({ exportedAt: new Date(), leads });
});

export default router;
