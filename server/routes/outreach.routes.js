import { listOutreachReplies, getOutreachReply, syncOutreachReplies, linkOutreachReply } from '../services/outreachReplies.js';
import express, { Router } from 'express';
import { randomUUID } from 'node:crypto';
import mongoose from 'mongoose';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { OutreachLead, OutreachCampaign, OutreachEvent, OutreachSuppression, OutreachWebhookEvent, OutreachLease } from '../models/Outreach.js';
import { fail, outreachConfig, outreachFields, verifyOutreachWebhook } from '../services/outreachPolicy.js';
import { sendOutreach, handleOutreachEvent, suppressOutreach, outreachLog, reserveOutreachLead, releaseOutreachLead } from '../services/outreach.js';

import { campaignCounts, describeCampaign, campaignSummary, updateCampaignStatus, deleteDraftCampaign } from '../services/outreachCampaigns.js';
import { runSchedulingTasks } from '../services/outreachScheduling.js';
import { outreachEligibility } from '../services/outreachEligibility.js';

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

const isCampaignId = value => typeof value === 'string' && /^[0-9a-f]{24}$/i.test(value) && mongoose.isValidObjectId(value);
const campaignResponse = campaign => ({ ...campaign.toJSON(), _id: String(campaign._id), id: String(campaign._id) });
const requireCampaignParam = (req, res, next) => {
  if (!isCampaignId(req.params.id)) return res.status(400).json({ message: 'Invalid campaign ID. Reopen the campaign from the dashboard.' });
  next();
};
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
  const eligibility = await outreachEligibility(req.user._id, leads);
  const campaignStats = await campaignCounts(req.user._id);
  res.json({ leads: leads.map(lead => ({ ...lead.toJSON(), scheduling: eligibility.get(lead.publicId) })), events, campaigns: campaigns.map(campaign => describeCampaign(campaign, campaignStats.get(String(campaign._id)))), stats: counts[0] || { total: 0, sent: 0, replied: 0, followups: 0 },
    config: { live: config.live, configured: config.configured, requestedLive: config.requestedLive, from: config.from, replyTo: config.replyTo, receiving: config.receiving, replyForwardTo: config.forwardTo, autoFollowupReady: config.autoFollowupReady } });
});

router.get('/replies', async (req, res) => res.json(await listOutreachReplies(req.user._id, req.query)));
router.get('/replies/:replyId', async (req, res) => res.json({ reply: await getOutreachReply(req.user._id, req.params.replyId) }));
router.post('/replies/sync', async (req, res) => {
  const input = z.object({ after: z.string().uuid().optional() }).strict().safeParse(req.body);
  if (!input.success) throw fail('Invalid reply import request.');
  res.json(await syncOutreachReplies(req.user._id, outreachConfig(), { after: input.data.after }));
});
router.post('/replies/:replyId/link', async (req, res) => {
  const input = z.object({ leadId: z.string().uuid() }).strict().safeParse(req.body);
  if (!input.success) throw fail('Select a contact for this reply.');
  res.json({ reply: await linkOutreachReply(req.user._id, req.params.replyId, input.data.leadId) });
});

router.post('/import-preview', async (req, res) => {
  const input = z.object({ campaignId: z.string().refine(isCampaignId), rows: z.array(z.unknown()).min(1).max(500) }).safeParse(req.body);
  if (!input.success) throw fail('Select a campaign and up to 500 CSV rows.');
  const campaign = await OutreachCampaign.exists({ _id: input.data.campaignId, owner: req.user._id });
  if (!campaign) throw fail('Campaign not found.', 404);
  const candidates = input.data.rows.map((row, index) => {
    const parsed = outreachFields.safeParse(row);
    return parsed.success ? { ...parsed.data, _id: new mongoose.Types.ObjectId(), publicId: String(index), initialState: 'pending' } : null;
  });
  const valid = candidates.filter(Boolean);
  const [eligibility, existing] = await Promise.all([
    outreachEligibility(req.user._id, valid),
    OutreachLead.find({ owner: req.user._id, campaignId: input.data.campaignId, email: { $in: valid.map(row => row.email) } }).select('email'),
  ]);
  const seen = new Set(existing.map(row => row.email));
  const rows = candidates.map((row, index) => {
    if (!row) return { row: index + 2, eligible: false, reason: 'Invalid contact fields; will be skipped' };
    const duplicate = seen.has(row.email); seen.add(row.email);
    return { row: index + 2, eligible: !duplicate && eligibility.get(row.publicId).eligible,
      reason: duplicate ? 'Duplicate in this campaign or CSV; will be skipped' : eligibility.get(row.publicId).reason || 'New eligible contact' };
  });
  res.json({ rows });
});

router.post('/import', async (req, res) => {
  // All diagnostics go to the *server terminal*, not the browser.
  // Never log names, email addresses, CSV content, messages or credentials.
  const ref = randomUUID();
  const batchId = randomUUID();
  const addedIds = [];
  const startedAt = Date.now();
  let phase = 'validation', rowNumber = null, added = 0, skipped = [];
  const log = (level, event, extra = {}) => console[level]('[outreach-import]', JSON.stringify({
    at: new Date().toISOString(), ref, event, phase, rowNumber, added,
    skipped: skipped.length, elapsedMs: Date.now() - startedAt, ...extra,
  }));
  try {
    const input = z.object({ rows: z.array(z.unknown()).min(1).max(500), campaignId: z.string().optional(), sourceName: z.string().trim().max(160).optional() }).safeParse(req.body);
    if (!input.success) throw fail('Provide between 1 and 500 CSV rows.');
    log('info', 'request-received', { rowCount: input.data.rows.length, hasCampaign: !!input.data.campaignId });
    phase = 'campaign-lookup';
    let campaign = null;
    if (input.data.campaignId && !isCampaignId(input.data.campaignId)) {
      log('warn', 'invalid-campaign-id', { campaignIdProvided: true });
      throw fail('Invalid campaign ID. Reopen the campaign from the dashboard and retry.', 400);
    }
    if (input.data.campaignId) {
      campaign = await OutreachCampaign.findOne({ owner: req.user._id, _id: input.data.campaignId });
      if (!campaign) throw fail('Campaign not found.', 404);
      if (campaign.status === 'archived') throw fail('Restore this campaign before importing contacts.', 409);
    }
    phase = 'row-import';
    for (const [index, row] of input.data.rows.entries()) {
      rowNumber = index + 2;
      const parsed = outreachFields.safeParse(row);
      if (!parsed.success) { skipped.push({ row: rowNumber, reason: parsed.error.issues[0].message }); continue; }
      if (await OutreachSuppression.exists({ email: parsed.data.email })) { skipped.push({ row: rowNumber, reason: 'Address is suppressed.' }); continue; }
      try {
        const lead = await OutreachLead.create({ ...parsed.data, autoFollowup: false, owner: req.user._id, campaignId: campaign?._id || null, importBatchId: batchId, importName: input.data.sourceName || 'Added contacts' });
        addedIds.push(lead.publicId);
        added++;
      } catch (error) {
        if (error.code !== 11000) throw error;
        skipped.push({ row: rowNumber, reason: 'Duplicate email address.' });
      }
    }
    phase = 'complete'; rowNumber = null;
    log('info', 'import-complete');
    return res.status(201).json({ added, skipped, ref, batchId, addedIds });
  } catch (error) {
    const status = Number.isInteger(error.status) && error.status >= 400 && error.status < 500 ? error.status : 500;
    // Never serialize an exception or its MongoDB keyValue: these can contain user email addresses.
    log('error', 'import-failed', {
      httpStatus: status,
      errorName: String(error.name || 'Error').slice(0, 80),
      dbCode: typeof error.code === 'number' ? error.code : undefined,
      validationFieldPaths: error.errors ? Object.keys(error.errors).slice(0, 12) : undefined,
      keyPatternFields: error.keyPattern ? Object.keys(error.keyPattern) : undefined,
    });
    res.set('X-Outreach-Import-Ref', ref);
    return res.status(status).json({
      message: status === 500 ? 'CSV import failed on the server. Check the server terminal using the error reference. Some contacts may have been saved.' : error.message,
      ref, addedBeforeFailure: added,
    });
  }
});
const campaignInput = z.object({ name: z.string().trim().min(1).max(150) });
router.post('/campaigns', async (req, res) => {
  const parsed = campaignInput.safeParse(req.body);
  if (!parsed.success) throw fail('Enter a campaign name (1–150 characters).');
  const campaign = await OutreachCampaign.create({ ...parsed.data, owner: req.user._id });
  res.status(201).json({ campaign: campaignResponse(campaign), campaignId: String(campaign._id) });
});
const campaignSettingsInput = z.object({
  setupStep: z.number().int().min(0).max(4).optional(),
  name: z.string().trim().min(1).max(150).optional(),
  setupComplete: z.boolean().optional(),
  sendDate: z.union([z.literal(''), z.string().datetime({ local: true })]).optional(),
  spacing: z.number().int().min(0).max(1440).optional(),
  scheduleFollowups: z.boolean().optional(),
}).strict();
router.patch('/campaigns/:id/settings', requireCampaignParam, async (req, res) => {
  const parsed = campaignSettingsInput.safeParse(req.body);
  if (!parsed.success) throw fail('Invalid campaign settings.');
  const existing = await OutreachCampaign.findOne({ _id: req.params.id, owner: req.user._id });
  if (!existing) throw fail('Campaign not found.', 404);
  if (existing.status === 'archived') throw fail('Restore this campaign before editing its settings.', 409);
  const campaign = await OutreachCampaign.findOneAndUpdate(
    { _id: req.params.id, owner: req.user._id, status: { $ne: 'archived' } }, { $set: parsed.data }, { new: true, runValidators: true });
  if (!campaign) throw fail('Campaign not found.', 404);
  res.json({ campaign: campaignResponse(campaign) });
});
router.get('/campaigns/:id/summary', requireCampaignParam, async (req, res) => res.json({ campaign: await campaignSummary(req.user._id, req.params.id) }));
const campaignActionInput = z.object({ status: z.enum(['draft', 'active', 'paused', 'archived', 'restore']).optional(), confirmed: z.boolean().default(false), expectedUpdatedAt: z.string().datetime().optional() }).strict();
router.post('/campaigns/:id/status', requireCampaignParam, async (req, res) => {
  const input = campaignActionInput.safeParse(req.body);
  if (!input.success || !input.data.status) throw fail('Invalid campaign action.');
  res.json({ campaign: await updateCampaignStatus(req.user._id, req.params.id, input.data) });
});
router.delete('/campaigns/:id', requireCampaignParam, async (req, res) => {
  const input = campaignActionInput.omit({ status: true }).safeParse(req.body);
  if (!input.success) throw fail('Invalid delete confirmation.');
  res.json(await deleteDraftCampaign(req.user._id, req.params.id, input.data));
});
const scheduleInput = z.object({ ids: z.array(z.string()).min(1).max(500), startAt: z.string().datetime({ offset: true }), intervalMinutes: z.number().min(0).max(1440).default(0), autoFollowup: z.boolean().default(false), confirmCampaignId: z.string().refine(isCampaignId).optional(), sendDate: z.string().datetime({ local: true }).optional() });

router.post('/review-contact-basis', async (req, res) => {
  const input = z.object({ ids: z.array(z.string()).min(1).max(500), permissionBasis: z.string().trim().max(500) }).safeParse(req.body);
  if (!input.success) throw fail('Select contacts and keep the optional contact note within 500 characters.');
  const { ids, permissionBasis } = input.data;
  const count = await OutreachLead.updateMany({ owner: req.user._id, publicId: { $in: ids }, initialState: 'pending', sentAt: null, stoppedReason: '' }, { $set: { permissionBasis } });
  return res.json({ reviewed: count.modifiedCount });
});

router.post('/schedule', async (req, res) => {
  const parsed = scheduleInput.safeParse(req.body);
  if (!parsed.success) throw fail('Provide contact IDs, ISO date with timezone, and spacing in minutes.');
  const { ids, startAt, intervalMinutes, autoFollowup, confirmCampaignId, sendDate } = parsed.data;
  const ref = randomUUID(), startedAt = Date.now();
  res.set('X-Outreach-Schedule-Ref', ref);
  console.info('[outreach-schedule]', JSON.stringify({ ref, event: 'started', requested: ids.length }));
  try {
    const start = new Date(startAt);
    if (start.getTime() <= Date.now() + 120000 || start.getTime() > Date.now() + 365 * 86400000) throw fail('Schedule between two minutes and one year in the future.');
    let leads = await OutreachLead.find({ owner: req.user._id, publicId: { $in: ids } }).select('+owner').sort({ createdAt: 1, _id: 1 });
    if (leads.length !== new Set(ids).size) throw fail('One or more contacts were not found.');
    const eligibility = await outreachEligibility(req.user._id, leads);
    const skipped = [], seen = new Set();
    leads = leads.filter(lead => {
      const reason = eligibility.get(lead.publicId).reason || (seen.has(lead.email) ? 'Duplicate address in selection' : '');
      if (reason) { skipped.push({ publicId: lead.publicId, reason }); return false; }
      seen.add(lead.email); return true;
    });
    if (!leads.length) throw fail('No eligible contacts remain. Refresh the campaign to review the reasons.', 409);
    let confirmingCampaign = null;
    if (confirmCampaignId) {
      confirmingCampaign = await OutreachCampaign.findOne({ _id: confirmCampaignId, owner: req.user._id });
      if (!confirmingCampaign) throw fail('Campaign not found.', 404);
      if (confirmingCampaign.setupComplete || confirmingCampaign.status !== 'draft') throw fail('Setup has changed. Reopen the campaign before scheduling.', 409);
      if (leads.some(lead => String(lead.campaignId) !== confirmCampaignId)) throw fail('Select only contacts belonging to this campaign.');
    }
    const campaignIds = [...new Set(leads.filter(lead => lead.campaignId && String(lead.campaignId) !== confirmCampaignId).map(lead => String(lead.campaignId)))];
    const activeCampaigns = await OutreachCampaign.find({ _id: { $in: campaignIds }, owner: req.user._id, status: 'active' }).select('_id');
    if (activeCampaigns.length !== campaignIds.length) throw fail('Activate the campaign before scheduling emails.', 409);
    if (autoFollowup && !outreachConfig().autoFollowupReady) throw fail('Automatic follow-ups require verified receiving and webhook configuration.', 409);
    // Reserve every selected address atomically BEFORE writing any schedules.
    // If any address is unavailable, release new reservations and leave the batch untouched.
    const newlyReserved = [];
    try {
      await runSchedulingTasks(leads, async lead => {
        const existing = await OutreachLease.findOne({ key: `${lead.owner}:${lead.email.toLowerCase()}` });
        const previouslyOurs = existing && String(existing.leadId) === String(lead._id);
        await reserveOutreachLead(lead);
        if (!previouslyOurs) newlyReserved.push(lead);
      });
    } catch (error) {
      for (const lead of newlyReserved) {
        // Another request may have queued this same lead after our snapshot.
        const queued = await OutreachLead.exists({ _id: lead._id, $or: [{ scheduledAt: { $ne: null } }, { sentAt: { $ne: null } }, { initialState: 'sending' }] });
        if (!queued) await releaseOutreachLead(lead);
      }
      throw error;
    }
    // Compensating rollback: no half-success response and no orphaned reservations
    // if a write fails after some addresses have already been reserved. Initial
    // start is at least two minutes ahead, keeping the worker clear of this batch.
    const written = [];
    try {
      await runSchedulingTasks(leads, async (lead, index) => {
        const at = new Date(start.getTime() + index * intervalMinutes * 60000);
        const change = await OutreachLead.updateOne({ _id: lead._id, owner: req.user._id,
          initialState: 'pending', stoppedReason: '', sentAt: null, repliedAt: null, optedOutAt: null, scheduledAt: null, updatedAt: lead.updatedAt },
        { $set: { scheduledAt: at, status: 'scheduled', autoFollowup: autoFollowup && !!lead.followup } });
        if (!change.modifiedCount) throw fail(`Contact ${lead.email} changed during scheduling. Retry the batch.`, 409);
        written.push({ lead, at });
      });
      if (confirmingCampaign) {
        const changed = await OutreachCampaign.updateOne({ _id: confirmingCampaign._id, owner: req.user._id, status: 'draft', setupComplete: false, updatedAt: confirmingCampaign.updatedAt },
          { $set: { status: 'active', setupComplete: true, setupStep: 4, ...(sendDate ? { sendDate } : {}), spacing: intervalMinutes, scheduleFollowups: autoFollowup } });
        if (!changed.modifiedCount) throw fail('Campaign changed during confirmation. Reopen it and retry.', 409);
      }
    } catch (error) {
      for (const { lead, at } of written) {
        await OutreachLead.updateOne({ _id: lead._id, initialState: 'pending', sentAt: null, scheduledAt: at, stoppedReason: '', repliedAt: null, optedOutAt: null },
          { $set: { scheduledAt: null, status: 'draft', autoFollowup: false } });
      }
      for (const lead of newlyReserved) {
        // Another request may have queued this same lead after our snapshot.
        const queued = await OutreachLead.exists({ _id: lead._id, $or: [{ scheduledAt: { $ne: null } }, { sentAt: { $ne: null } }, { initialState: 'sending' }] });
        if (!queued) await releaseOutreachLead(lead);
      }
      throw error;
    }
    const scheduled = written.length;
    console.info('[outreach-schedule]', JSON.stringify({ ref, event: 'complete', scheduled, skipped: skipped.length, elapsedMs: Date.now() - startedAt }));
    res.json({ scheduled, skipped });
  } catch (error) {
    console.warn('[outreach-schedule]', JSON.stringify({ ref, event: 'failed', status: error.status || 500, elapsedMs: Date.now() - startedAt }));
    throw error;
  }
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
  if (lead.campaignId && await OutreachCampaign.exists({ _id: lead.campaignId, owner: req.user._id, status: 'archived' })) throw fail('Restore this campaign before editing contacts.', 409);
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
