import { OutreachLead, OutreachCampaign, OutreachEvent, OutreachSuppression, OutreachRate, OutreachLease } from '../models/Outreach.js';
import { User } from '../models/User.js';
import { assertSendable, emailSchema, fail, outreachConfig } from './outreachPolicy.js';

// One atomic lease per owner/address across campaigns. MongoDB's unique key
// ensures simultaneous requests cannot reserve separate campaigns for the same inbox.
export async function reserveOutreachLead(lead, until = new Date('9999-12-31T00:00:00.000Z')) {
  const key = `${lead.owner}:${lead.email.toLowerCase()}`;
  try {
    const existing = await OutreachLease.findOneAndUpdate(
      { key, $or: [{ leadId: lead._id }, { expiresAt: { $lte: new Date() } }] },
      { $set: { leadId: lead._id, expiresAt: until } }, { new: true });
    if (existing) return;
    await OutreachLease.create({ key, leadId: lead._id, expiresAt: until });
  } catch (error) {
    if (error.code === 11000) throw fail('This address is reserved by another outreach sequence.', 409);
    throw error;
  }
}
export async function releaseOutreachLead(lead) {
  await OutreachLease.deleteOne({ key: `${lead.owner}:${lead.email.toLowerCase()}`, leadId: lead._id });
}
// Provider acceptance is already persisted before this non-critical cleanup.
// A failed cleanup must not label an accepted message as an unknown send.
async function releaseFinishedSequence(lead) {
  try { await releaseOutreachLead(lead); }
  catch (error) { console.error('Outreach reservation cleanup failed; manual reconciliation required.', error); }
}


export async function outreachLog(lead, type, detail = '') {
  await OutreachEvent.create({ owner: lead.owner, leadId: lead.publicId, campaignId: lead.campaignId || null, company: lead.company || lead.name || lead.email, type, detail });
}

export async function suppressOutreach(email, reason) {
  await OutreachSuppression.updateOne({ email }, { $set: { reason } }, { upsert: true });
  const activeLeads = await OutreachLead.find({ email }).select('+owner');
  await OutreachLead.updateMany({ email }, { $set: { stoppedReason: reason, status: reason, followupDueAt: null, followup2DueAt: null,
    ...(reason === 'opted-out' ? { optedOutAt: new Date() } : {}) } });
  for (const lead of activeLeads) await releaseFinishedSequence(lead);
}

async function reserveSendSlot() {
  // Shared across API processes and the scheduler. Never rely on a browser timer.
  for (const [key, milliseconds] of [['sender', 2000]]) {
    try { await OutreachRate.updateOne({ key }, { $setOnInsert: { nextAt: new Date(0) } }, { upsert: true }); }
    catch (error) { if (error.code !== 11000) throw error; }
    const slot = await OutreachRate.findOneAndUpdate({ key, nextAt: { $lte: new Date() } }, { $set: { nextAt: new Date(Date.now() + milliseconds) } });
    if (!slot) throw fail('Please wait a few seconds before sending another email.', 429);
  }
}

export async function sendOutreach(owner, publicId, { followup = false, step = null, test = false, automatic = false, transport = globalThis.fetch, config = outreachConfig() } = {}) {
  let lead = await OutreachLead.findOne({ owner, publicId }).select('+owner +unsubscribeToken');
  if (!lead) throw fail('Contact not found.', 404);
  const stageNumber = step === 2 ? 2 : followup ? 1 : 0;
  // An initial message that has an outstanding schedule must not be sent
  // through the manual endpoint early. Unscheduled draft sends remain allowed.
  if (!automatic && stageNumber === 0 && lead.scheduledAt)
    throw fail('This email is scheduled. Unschedule it before sending manually.', 409);
  if (stageNumber === 2) {
    if (lead.stoppedReason || lead.repliedAt || lead.optedOutAt || !lead.followup2 || !lead.followupSentAt || lead.followup2State !== 'pending' || lead.followup2SentAt) throw fail('Second follow-up is not eligible.', 409);
    if (!lead.subject) throw fail('Subject is required.');
  } else assertSendable(lead, stageNumber === 1);
  if (automatic && lead.campaignId) {
    const campaign = await OutreachCampaign.findOne({ _id: lead.campaignId, owner });
    if (!campaign || campaign.status !== 'active') throw fail('Campaign is paused or inactive.', 409);
  }
  if (await OutreachSuppression.exists({ email: lead.email })) throw fail('This address is on the suppression list. Sending is blocked.', 409);
  if (await OutreachLead.exists({ owner, email: lead.email, _id: { $ne: lead._id }, stoppedReason: '',
    $or: [{ scheduledAt: { $ne: null } }, { initialState: 'sending' }, { followupState: 'sending' },
      { followup2State: 'sending' }, { sentAt: { $gte: new Date(Date.now() - 14 * 86400000) } }] })) {
    throw fail('Another campaign has an active sequence for this address. Review duplicate campaigns.', 409);
  }
  if (stageNumber === 1 && !lead.followup) throw fail('First follow-up text is required.');
  if (test) {
    await outreachLog(lead, 'test', `${stageNumber ? 'Follow-up ' + stageNumber : 'Initial email'} simulated. No email sent.`);
    return { testMode: true };
  }
  if (!config.live) throw fail('Live sending is disabled or the server email configuration is incomplete.', 503);
  const staff = await User.findById(owner).select('+accountSource');
  if (!staff?.active || staff.accountSource === 'public') throw fail('Staff access is required.', 403);
  if (automatic && stageNumber && !config.autoFollowupReady) throw fail('Automatic follow-ups are not configured.', 503);
  await reserveSendSlot();
  if (stageNumber === 0 && !automatic) await reserveOutreachLead(lead);
  const stage = stageNumber === 2 ? 'followup2State' : stageNumber === 1 ? 'followupState' : 'initialState';
  const query = { owner, publicId, updatedAt: lead.updatedAt, stoppedReason: '', repliedAt: null, optedOutAt: null, [stage]: 'pending',
    ...(stageNumber === 2 ? { followupSentAt: { $ne: null }, followup2SentAt: null } : stageNumber === 1 ? { sentAt: { $ne: null }, followupSentAt: null } : { sentAt: null }),
    ...(automatic ? stageNumber === 2 ? { autoFollowup: true, followup2DueAt: { $lte: new Date() } } : stageNumber === 1 ? { autoFollowup: true, followupDueAt: { $lte: new Date() } } : { scheduledAt: { $lte: new Date(), $ne: null } } : {}) };
  lead = await OutreachLead.findOneAndUpdate(query, { $set: { [stage]: 'sending' } }, { new: true }).select('+owner +unsubscribeToken');
  if (!lead) throw fail('This email is already being processed or sending was stopped.', 409);
  // Once claimed, edits are locked. Ambiguous transport failures require human
  // review rather than an automatic retry after the provider idempotency expires.
  const unsubscribe = new URL('/api/finance/outreach/unsubscribe/' + lead.unsubscribeToken, config.origin).href;
  const payload = { from: config.from, to: [lead.email], reply_to: config.replyTo,
    subject: stageNumber ? 'Re: ' + lead.subject : lead.subject,
    text: (stageNumber === 2 ? lead.followup2 : stageNumber === 1 ? lead.followup : lead.message) + '\n\nTo stop receiving these emails: ' + unsubscribe,
    headers: { 'List-Unsubscribe': '<' + unsubscribe + '>' } };
  try {
    // Recheck suppression after the atomic claim and before the external action.
    const current = await OutreachLead.findOne({ _id: lead._id, stoppedReason: '', repliedAt: null, optedOutAt: null });
    if (!current || await OutreachSuppression.exists({ email: lead.email })) {
      await OutreachLead.updateOne({ _id: lead._id }, { $set: { [stage]: 'cancelled', followupDueAt: null, followup2DueAt: null } });
      throw fail('Sending was stopped for this contact.', 409);
    }
    const response = await transport('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json',
        'Idempotency-Key': 'tko-outreach-' + lead.publicId + (stageNumber ? '-followup-' + stageNumber : '-initial') },
      body: JSON.stringify(payload), signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok || typeof result.id !== 'string' || !result.id) throw fail('The email provider did not confirm acceptance. Check delivery before taking further action.', 502);
    const now = new Date();
    const fields = stageNumber === 2 ? { followup2SentAt: now, followup2MessageId: result.id, followup2DueAt: null }
      : stageNumber === 1 ? { followupSentAt: now, followupMessageId: result.id, followupDueAt: null, followup2DueAt: null }
      : { sentAt: now, messageId: result.id, scheduledAt: null };
    await OutreachLead.updateOne({ _id: lead._id }, { $set: { ...fields, [stage]: 'accepted' } });
    const schedule = lead.autoFollowup && config.autoFollowupReady;
    await OutreachLead.updateOne({ _id: lead._id, stoppedReason: '', repliedAt: null, optedOutAt: null }, {
      $set: { status: stageNumber === 2 ? 'followed-up-2' : stageNumber === 1 ? 'followed-up' : 'sent',
        ...(stageNumber === 0 ? { followupDueAt: schedule && lead.followup ? new Date(now.getTime() + lead.delayDays * 86400000) : null } : {}),
        ...(stageNumber === 1 ? { followup2DueAt: schedule && lead.followup2 ? new Date(new Date(lead.sentAt).getTime() + lead.followup2DelayDays * 86400000) : null } : {}) },
    });
    // Hold the recipient reservation only while a future follow-up is possible.
    // Follow-up 2 is the last step; release after it. No follow-ups => release now.
    const moreSteps = stageNumber === 0 ? (schedule && !!lead.followup)
      : stageNumber === 1 ? (schedule && !!lead.followup2) : false;
    if (!moreSteps) await releaseFinishedSequence(lead);
    await outreachLog(lead, stageNumber ? 'followup-' + stageNumber : 'sent', 'Accepted by Resend.');
    return { testMode: false, messageId: result.id };
  } catch (error) {
    await OutreachLead.updateOne({ _id: lead._id, [stage]: 'sending' }, {
      $set: { [stage]: 'review', status: 'needs-review', stoppedReason: 'needs-review', followupDueAt: null, followup2DueAt: null },
    });
    await outreachLog(lead, 'send-review', 'Sending did not complete normally. Check Resend before resending; automatic retries are disabled.');
    if (error.status) throw error;
    throw fail('Delivery needs review. Check Resend; this message will not be automatically retried.', 502);
  }
}

export async function handleOutreachEvent(event, config = outreachConfig()) {
  const data = event.data || {};
  if (event.type === 'email.received' && config.receiving) {
    const from = String(data.from || '').match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase();
    const recipients = (Array.isArray(data.to) ? data.to : []).map(value => String(value).toLowerCase());
    if (!from || !recipients.includes(config.replyTo.toLowerCase())) return;
    // Conservative matching: stop every active outreach to this sender at the
    // configured receiving address. We do not claim full inbox/thread support.
    const leads = await OutreachLead.find({ email: from, $or: [{ sentAt: { $ne: null } }, { initialState: 'sending' }], repliedAt: null }).select('+owner');
    for (const lead of leads) {
      const updated = await OutreachLead.updateOne({ _id: lead._id, repliedAt: null }, { $set: { repliedAt: new Date(), stoppedReason: 'replied', status: 'replied', followupDueAt: null, followup2DueAt: null } });
      if (updated.modifiedCount) { await releaseFinishedSequence(lead); await outreachLog(lead, 'reply', 'Reply recorded by receiving webhook.'); }
    }
    return;
  }
  if (!['email.delivered', 'email.bounced', 'email.failed', 'email.complained'].includes(event.type) || typeof data.email_id !== 'string') return;
  const lead = await OutreachLead.findOne({ $or: [{ messageId: data.email_id }, { followupMessageId: data.email_id }, { followup2MessageId: data.email_id }] }).select('+owner');
  const type = event.type.slice(6);
  const addresses = (Array.isArray(data.to) ? data.to : []).map(value => emailSchema.safeParse(value)).filter(value => value.success).map(value => value.data);
  if (['bounced', 'complained'].includes(type)) {
    // A terminal webhook can beat persistence of the provider's message ID.
    // Signed recipient metadata still allows immediate global suppression.
    for (const email of new Set([...addresses, ...(lead ? [lead.email] : [])])) await suppressOutreach(email, type);
    if (lead) await outreachLog(lead, type);
    return;
  }
  if (!lead) {
    if (type === 'failed' && addresses.length) await OutreachLead.updateMany({ email: { $in: addresses }, stoppedReason: '', $or: [{ initialState: 'sending' }, { followupState: 'sending' }] }, { $set: { status: 'failed', stoppedReason: 'failed', followupDueAt: null, followup2DueAt: null } });
    return;
  }
  if (type === 'failed') {
    await OutreachLead.updateOne({ _id: lead._id, stoppedReason: '' }, { $set: { status: 'failed', stoppedReason: 'failed', followupDueAt: null, followup2DueAt: null } });
    await releaseFinishedSequence(lead);
  }
  else await OutreachLead.updateOne({ _id: lead._id, status: 'sent', stoppedReason: '' }, { $set: { status: 'delivered' } });
  await outreachLog(lead, type);
}

export async function processOutreachFollowups({ config = outreachConfig(), transport = globalThis.fetch } = {}) {
  if (!config.autoFollowupReady) return 0;
  const leads = await OutreachLead.find({ autoFollowup: true, followupDueAt: { $ne: null, $lte: new Date() },
    stoppedReason: '', repliedAt: null, optedOutAt: null, followupState: 'pending', followupSentAt: null }).select('+owner').limit(10);
  let accepted = 0;
  for (const lead of leads) {
    try {
      await sendOutreach(lead.owner, lead.publicId, { followup: true, automatic: true, config, transport });
      accepted++;
    } catch (error) {
      if (![403, 409, 429, 503].includes(error.status)) console.error('Outreach follow-up needs review.');
    }
    await new Promise(resolve => setTimeout(resolve, 2100));
  }
  const second = await OutreachLead.find({ autoFollowup: true, followup2DueAt: { $ne: null, $lte: new Date() }, stoppedReason: '', repliedAt: null, optedOutAt: null, followup2State: 'pending', followup2SentAt: null }).select('+owner').limit(10);
  for (const lead of second) {
    try { await sendOutreach(lead.owner, lead.publicId, { step: 2, automatic: true, config, transport }); accepted++; }
    catch (error) { if (![403, 409, 429, 503].includes(error.status)) console.error('Second follow-up needs review.'); }
    await new Promise(resolve => setTimeout(resolve, 2100));
  }
  return accepted;
}

export async function processScheduledOutreach({ config = outreachConfig(), transport = globalThis.fetch } = {}) {
  if (!config.live) return 0;
  const due = await OutreachLead.find({ scheduledAt: { $ne: null, $lte: new Date() }, initialState: 'pending', sentAt: null, stoppedReason: '', repliedAt: null, optedOutAt: null }).select('+owner').sort({ scheduledAt: 1 }).limit(10);
  let accepted = 0;
  for (const lead of due) {
    try { await sendOutreach(lead.owner, lead.publicId, { automatic: true, config, transport }); accepted++; }
    catch (error) { if (![403, 409, 429, 503].includes(error.status)) console.error('Scheduled initial send needs review.'); }
    await new Promise(resolve => setTimeout(resolve, 2100));
  }
  return accepted;
}

export function startOutreachScheduler() {
  let busy = false;
  const timer = setInterval(async () => {
    if (busy) return;
    busy = true;
    try { await processScheduledOutreach(); await processOutreachFollowups(); }
    catch { console.error('Outreach scheduler could not complete its database check.'); }
    finally { busy = false; }
  }, 30000);
  timer.unref();
  return () => clearInterval(timer);
}
