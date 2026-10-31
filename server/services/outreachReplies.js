import { OutreachReply, OutreachLead, OutreachLease, OutreachEvent } from '../models/Outreach.js';
import { User } from '../models/User.js';
import { fail, emailSchema } from './outreachPolicy.js';
import { mailbox, receivingRecipients, signedReplyLead, htmlReplyText, quotedReplyTokens } from './outreachReplyContent.js';

const selectLead = query => OutreachLead.find(query).select('+owner');
function replyTime(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}
// Both automatic matching and manual linking must respect when the reply arrived.
const sentBefore = receivedAt => receivedAt ? { $or: [
  { sentAt: { $ne: null, $lte: receivedAt } },
  { sentAt: null, initialState: 'sending', updatedAt: { $lte: receivedAt } },
] } : { $expr: { $eq: [1, 0] } };
async function matchReply(data, text, config, receivedAt) {
  const eligible = sentBefore(receivedAt);
  const id = signedReplyLead(data.to, config);
  if (id) {
    const leads = await selectLead({ _id: id, ...eligible });
    if (leads.length) return { leads, method: 'reply-address' };
  }
  const tokens = quotedReplyTokens(text, config);
  if (tokens.length) {
    const leads = await selectLead({ unsubscribeToken: { $in: tokens }, ...eligible });
    // Multiple quoted messages are ambiguous; never guess by subject alone.
    if (leads.length === 1) return { leads, method: 'original-message' };
  }
  const leads = await selectLead({ email: mailbox(data.from), ...eligible });
  return { leads, method: leads.length ? 'sender' : 'unmatched' };
}
async function stopReplyLeads(leads, receivedAt) {
  for (const lead of leads) {
    const changed = await OutreachLead.updateOne({ _id: lead._id, repliedAt: null, ...sentBefore(receivedAt) }, { $set: {
      repliedAt: receivedAt, followupDueAt: null, followup2DueAt: null, autoFollowup: false,
      ...(lead.optedOutAt || ['bounced', 'complained', 'failed'].includes(lead.stoppedReason) ? {} : { stoppedReason: 'replied', status: 'replied' }),
    } });
    await OutreachLease.deleteOne({ key: String(lead.owner) + ':' + lead.email.toLowerCase(), leadId: lead._id });
    if (changed.modifiedCount) await OutreachEvent.create({ owner: lead.owner, leadId: lead.publicId, campaignId: lead.campaignId, company: lead.company || lead.email, type: 'reply', detail: 'Reply received; future follow-ups stopped.' });
  }
}
async function resendGet(path, transport) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const response = await transport('https://api.resend.com' + path, { headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY }, signal: AbortSignal.timeout(15000) });
    if (response.status === 429 && attempt < 3) { await new Promise(resolve => setTimeout(resolve, 1000)); continue; }
    if (!response.ok) throw fail('Resend could not retrieve replies. Check the API key has receiving access, then retry.', 502);
    return response.json();
  }
}
async function forwardReply(reply, config, transport) {
  const address = emailSchema.safeParse(config.forwardTo);
  if (!address.success || !config.from || !config.live || mailbox(config.forwardTo) === mailbox(config.replyTo)) return;
  // Never forward inbound copies back into the receiving domain (mail loops).
  if (mailbox(config.forwardTo).split('@')[1] === mailbox(config.replyTo).split('@')[1]) return;
  const claimed = await OutreachReply.findOneAndUpdate({ _id: reply._id, forwardState: 'pending' }, { $set: { forwardState: 'sending' } }, { new: true });
  if (!claimed) return;
  try {
    const attachments = reply.attachments.length ? '\nAttachments (view originals in Resend): ' + reply.attachments.map(a => a.filename).join(', ') : '';
    const response = await transport('https://api.resend.com/emails', {
      method: 'POST', headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'outreach-reply-' + reply.publicId },
      body: JSON.stringify({ from: config.from, to: [address.data], reply_to: mailbox(reply.from), subject: ('[Outreach reply] ' + reply.subject).slice(0, 250),
        text: 'Reply received from: ' + reply.from + '\nReceived: ' + (reply.receivedAt?.toISOString() || 'Time unavailable') + '\n\n' + reply.bodyText + attachments }),
      signal: AbortSignal.timeout(20000),
    });
    const result = await response.json();
    if (!response.ok || !result.id) throw Error('Forward not confirmed');
    await OutreachReply.updateOne({ _id: reply._id }, { $set: { forwardState: 'sent', forwardedAt: new Date(), forwardMessageId: result.id } });
  } catch {
    // A provider timeout may have accepted the forward. Hold for review, never
    // automatically resend it outside the provider's idempotency window.
    await OutreachReply.updateOne({ _id: reply._id, forwardState: 'sending' }, { $set: { forwardState: 'review' } });
  }
}
export async function receiveOutreachReply(metadata, config, { transport = globalThis.fetch, historical = false, ownerScope = null } = {}) {
  if (!config.receiving || !receivingRecipients(metadata.to, config).length || !mailbox(metadata.from)) return null;
  // Missing/invalid historical times must never be treated as a reply received now.
  const metadataTime = replyTime(metadata.created_at) || (!metadata.email_id && !historical ? new Date() : null);
  if (metadataTime) {
    const early = await matchReply(metadata, '', config, metadataTime);
    const known = early.leads.filter(lead => !ownerScope || String(lead.owner) === String(ownerScope));
    await stopReplyLeads(known, metadataTime);
  }
  if (!metadata.email_id) return null; // Compatibility with metadata-only fixtures.
  if (!/^[a-zA-Z0-9-]{1,100}$/.test(metadata.email_id)) throw fail('Invalid received email ID.');
  const data = await resendGet('/emails/receiving/' + encodeURIComponent(metadata.email_id) + '?html_format=cid', transport);
  if (!receivingRecipients(data.to, config).length) return null;
  const fullText = String(data.text || htmlReplyText(data.html));
  const receivedAt = replyTime(data.created_at) || replyTime(metadata.created_at);
  const match = await matchReply(data, fullText + '\n' + String(data.html || '').slice(0, 1000000), config, receivedAt);
  let leads = match.leads;
  if (ownerScope) leads = leads.filter(lead => String(lead.owner) === String(ownerScope));
  // A sync for another owner must not reassign their matched message as unmatched.
  if (ownerScope && match.leads.length && !leads.length) return null;
  await stopReplyLeads(leads, receivedAt);
  const owners = [...new Set(leads.map(lead => String(lead.owner)))];
  if (!owners.length) {
    let owner = await User.findOne({ email: config.replyOwnerEmail || config.forwardTo || '__not-configured__', active: true, accountSource: { $ne: 'public' } });
    if (!owner) {
      const staff = await User.find({ active: true, accountSource: { $ne: 'public' } }).limit(2);
      if (staff.length === 1) owner = staff[0];
    }
    if (!owner) throw fail('Unmatched reply could not be assigned. Set OUTREACH_REPLY_OWNER_EMAIL to an active Finance staff email, then import replies again.', 503);
    if (!ownerScope || String(owner._id) === String(ownerScope)) owners.push(String(owner._id));
  }
  let saved = null;
  for (const owner of owners) {
    const links = leads.filter(lead => String(lead.owner) === owner).map(lead => ({ leadId: lead.publicId, campaignId: lead.campaignId, company: lead.company || lead.email }));
    const fields = { from: String(data.from || metadata.from).slice(0, 500), to: (data.to || []).map(String), subject: String(data.subject || '(No subject)').slice(0, 1000), receivedAt,
      bodyText: fullText.slice(0, 200000), truncated: fullText.length > 200000,
      attachments: (data.attachments || []).slice(0, 50).map(a => ({ filename: String(a.filename || 'Attachment').slice(0, 300), size: Math.max(0, Number(a.size) || 0) })),
      links, matchMethod: links.length ? match.method : 'unmatched',
    };
    // Retry-safe upsert; already linked records cannot be replaced by a weaker match.
    let reply;
    try {
      reply = await OutreachReply.findOneAndUpdate({ owner, providerId: metadata.email_id }, { $setOnInsert: { ...fields, forwardState: historical ? 'historical' : 'pending' } }, { upsert: true, new: true }).select('+bodyText');
    } catch (error) { if (error.code !== 11000) throw error; reply = await OutreachReply.findOne({ owner, providerId: metadata.email_id }).select('+bodyText'); }
    if (!historical) {
      if (reply.forwardState === 'historical') await OutreachReply.updateOne({ _id: reply._id, forwardState: 'historical' }, { $set: { forwardState: 'pending' } });
      await forwardReply(reply, config, transport);
    }
    saved = reply;
  }
  return saved;
}
export async function listOutreachReplies(owner, { campaignId, before } = {}) {
  const query = { owner };
  if (campaignId) {
    if (!/^[a-f0-9]{24}$/i.test(campaignId)) throw fail('Invalid campaign.');
    query['links.campaignId'] = campaignId;
  }
  if (before) {
    const cursor = await OutreachReply.findOne({ owner, publicId: before }).select('receivedAt _id');
    if (!cursor) throw fail('Invalid replies page.');
    query.$or = [{ receivedAt: { $lt: cursor.receivedAt } }, { receivedAt: cursor.receivedAt, _id: { $lt: cursor._id } }];
  }
  const replies = await OutreachReply.find(query).sort({ receivedAt: -1, _id: -1 }).limit(51);
  const hasMore = replies.length > 50;
  return { replies: replies.slice(0, 50), hasMore, nextCursor: hasMore ? replies[49].publicId : null };
}
export async function getOutreachReply(owner, publicId) {
  const reply = await OutreachReply.findOne({ owner, publicId }).select('+bodyText');
  if (!reply) throw fail('Reply not found.', 404);
  return reply;
}
export async function linkOutreachReply(owner, publicId, leadId) {
  return OutreachReply.db.transaction(async session => {
    const reply = await OutreachReply.findOne({ owner, publicId }).select('+bodyText').session(session);
    if (!reply) throw fail('Reply not found.', 404);
    if (reply.links.length) throw fail('This reply is already linked. Refresh the inbox.', 409);
    const lead = await OutreachLead.findOne({ owner, publicId: leadId, ...sentBefore(reply.receivedAt) }).select('+owner').session(session);
    if (!lead) throw fail('Select a contact whose email was sent before this reply arrived.', 404);
    reply.links = [{ leadId: lead.publicId, campaignId: lead.campaignId, company: lead.company || lead.email }];
    reply.matchMethod = 'manual';
    await reply.save({ session });
    const changed = await OutreachLead.updateOne({ _id: lead._id, repliedAt: null }, { $set: {
      repliedAt: reply.receivedAt, followupDueAt: null, followup2DueAt: null, autoFollowup: false,
      ...(lead.optedOutAt || ['bounced', 'complained', 'failed'].includes(lead.stoppedReason) ? {} : { status: 'replied', stoppedReason: 'replied' }),
    } }, { session });
    await OutreachLease.deleteOne({ key: String(lead.owner) + ':' + lead.email.toLowerCase(), leadId: lead._id }, { session });
    if (changed.modifiedCount) await OutreachEvent.create([{ owner, leadId, campaignId: lead.campaignId, company: lead.company || lead.email, type: 'reply', detail: 'Incoming reply manually linked; future follow-ups stopped.' }], { session });
    return reply;
  });
}
export async function syncOutreachReplies(owner, config, { transport = globalThis.fetch, after } = {}) {
  if (!config.receiving) throw fail('Incoming reply tracking is not configured.', 409);
  const page = await resendGet('/emails/receiving?limit=25' + (after ? '&after=' + encodeURIComponent(after) : ''), transport);
  let imported = 0, lastSeen = null;
  const deadline = Date.now() + 60000;
  for (const message of page.data || []) {
    if (Date.now() > deadline) return { imported, nextCursor: lastSeen || after || null };
    lastSeen = message.id;
    if (!receivingRecipients(message.to, config).length) continue;
    if (await OutreachReply.exists({ owner, providerId: message.id })) continue;
    const reply = await receiveOutreachReply({ ...message, email_id: message.id }, config, { transport, historical: true, ownerScope: owner });
    if (reply) imported++;
    await new Promise(resolve => setTimeout(resolve, 600));
  }
  return { imported, nextCursor: page.has_more ? page.data?.at(-1)?.id : null };
}
