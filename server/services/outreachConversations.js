import mongoose from 'mongoose';
import { normalizeResponseAttachments, attachmentMetadata } from './outreachAttachments.js';
import { OutreachReply, OutreachLead, OutreachCampaign, OutreachSuppression, OutreachConversationMessage } from '../models/Outreach.js';
import { User } from '../models/User.js';
import { reserveSendSlot } from './outreach.js';
import { fail, outreachConfig } from './outreachPolicy.js';
import { mailbox, outreachReplyAddress } from './outreachReplyContent.js';

const uuid = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;
function parseThread(id) {
  const [kind, publicId, extra] = String(id).split(':');
  if (!['lead', 'unmatched'].includes(kind) || !uuid.test(publicId || '') || extra) throw fail('Invalid conversation.');
  return { kind, publicId };
}
const encode = row => Buffer.from(JSON.stringify({ time: row.sortAt, id: row.id })).toString('base64url');
function cursor(value) {
  if (!value) return null;
  try {
    if (typeof value !== 'string' || value.length > 400) throw Error();
    const data = JSON.parse(Buffer.from(value, 'base64url').toString());
    const date = new Date(data.time);
    if (!data.time || !Number.isFinite(date.getTime()) || typeof data.id !== 'string' || data.id.length > 100) throw Error();
    return { date, id: data.id };
  } catch { throw fail('Invalid conversation page.'); }
}
function pageFilter(value) {
  const before = cursor(value);
  return before ? [{ $match: { $or: [{ sortAt: { $lt: before.date } }, { sortAt: before.date, id: { $lt: before.id } }] } }] : [];
}
export async function listOutreachConversations(owner, { campaignId, before } = {}) {
  const match = { owner };
  if (campaignId) {
    if (!/^[a-f0-9]{24}$/i.test(campaignId)) throw fail('Invalid campaign.');
    match['links.campaignId'] = new mongoose.Types.ObjectId(campaignId);
  }
  const rows = await OutreachReply.aggregate([
    { $match: match }, { $unwind: { path: '$links', preserveNullAndEmptyArrays: true } },
    ...(campaignId ? [{ $match: { 'links.campaignId': new mongoose.Types.ObjectId(campaignId) } }] : []),
    { $sort: { receivedAt: -1, createdAt: -1, _id: -1 } },
    { $group: {
      _id: { $cond: ['$links.leadId', { $concat: ['lead:', '$links.leadId'] }, { $concat: ['unmatched:', '$publicId'] }] },
      leadId: { $first: '$links.leadId' }, campaignId: { $first: '$links.campaignId' }, company: { $first: '$links.company' },
      from: { $first: '$from' }, subject: { $first: '$subject' }, replyId: { $first: '$publicId' },
      sortAt: { $max: { $ifNull: ['$receivedAt', '$createdAt'] } },
      unread: { $sum: { $cond: [{ $eq: [{ $ifNull: ['$readAt', null] }, null] }, 1, 0] } },
    } },
    { $lookup: { from: OutreachConversationMessage.collection.name, let: { lead: '$leadId' }, pipeline: [
      { $match: { owner, $expr: { $eq: ['$leadId', '$$lead'] } } }, { $sort: { createdAt: -1 } }, { $limit: 1 }, { $project: { activityAt: { $ifNull: ['$sentAt', '$createdAt'] } } },
    ], as: 'outgoing' } },
    { $set: { sortAt: { $max: ['$sortAt', { $arrayElemAt: ['$outgoing.activityAt', 0] }] }, id: '$_id' } },
    ...pageFilter(before), { $sort: { sortAt: -1, id: -1 } }, { $limit: 51 }, { $project: { _id: 0, outgoing: 0 } },
  ]);
  return { conversations: rows.slice(0, 50), nextCursor: rows.length > 50 ? encode(rows[49]) : null };
}
async function context(owner, id, config) {
  const thread = parseThread(id);
  if (thread.kind === 'unmatched') {
    const reply = await OutreachReply.findOne({ owner, publicId: thread.publicId, 'links.0': { $exists: false } });
    if (!reply) throw fail('Conversation changed or was not found. Refresh the inbox.', 404);
    return { thread, reply, lead: null, campaign: null, canSend: false, blockedReason: 'Link this reply to a sent contact before responding.' };
  }
  const lead = await OutreachLead.findOne({ owner, publicId: thread.publicId });
  if (!lead || !await OutreachReply.exists({ owner, 'links.leadId': lead.publicId })) throw fail('Conversation not found.', 404);
  const campaign = lead.campaignId ? await OutreachCampaign.findOne({ owner, _id: lead.campaignId }).select('name status') : null;
  const reply = await OutreachReply.findOne({ owner, 'links.leadId': lead.publicId }).sort({ receivedAt: -1, createdAt: -1 });
  const pending = await OutreachConversationMessage.exists({ owner, leadId: lead.publicId, state: { $in: ['sending', 'review'] } });
  const suppressed = await OutreachSuppression.exists({ email: { $in: [lead.email, mailbox(reply.from)] } });
  let blockedReason = '';
  if (pending) blockedReason = 'An earlier reply is sending or needs delivery review. Check delivery before sending another message.';
  else if (!config.live || !config.receiving) blockedReason = 'Live sending and incoming reply tracking must be configured before responding.';
  else if (!lead.sentAt) blockedReason = 'Wait for the original email to finish sending before responding.';
  else if (lead.campaignId && (!campaign || campaign.status === 'archived')) blockedReason = 'Restore this campaign before sending a response.';
  else if (suppressed || lead.optedOutAt || ['opted-out', 'bounced', 'complained', 'failed'].includes(lead.stoppedReason)) blockedReason = 'Sending is blocked because this contact is suppressed or delivery failed.';
  return { thread, lead, reply, campaign, canSend: !blockedReason, blockedReason };
}
export async function getOutreachConversation(owner, id, { before, config = outreachConfig() } = {}) {
  const info = await context(owner, id, config);
  const incomingMatch = { owner, ...(info.lead ? { 'links.leadId': info.lead.publicId } : { publicId: info.reply.publicId }) };
  const pipeline = [{ $match: incomingMatch }, { $project: {
    _id: 0, id: { $concat: ['in:', '$publicId'] }, replyId: '$publicId', direction: { $literal: 'incoming' }, kind: { $literal: 'reply' },
    body: '$bodyText', from: 1, at: '$receivedAt', sortAt: { $ifNull: ['$receivedAt', '$createdAt'] }, attachments: 1, readAt: 1, truncated: 1,
  } }];
  if (info.lead) {
    pipeline.push({ $unionWith: { coll: OutreachConversationMessage.collection.name, pipeline: [
      { $match: { owner, leadId: info.lead.publicId } }, { $project: { _id: 0, id: { $concat: ['out:', '$publicId'] }, direction: { $literal: 'outgoing' }, kind: { $literal: 'response' }, attachments: 1, body: '$bodyText', from: 1, to: 1, state: 1, deliveryStatus: 1, at: { $ifNull: ['$sentAt', '$createdAt'] }, sortAt: { $ifNull: ['$sentAt', '$createdAt'] } } },
    ] } });
    pipeline.push({ $unionWith: { coll: OutreachLead.collection.name, pipeline: [
      { $match: { owner, publicId: info.lead.publicId } }, { $project: { messages: [
        { id: { $concat: ['initial:', '$publicId'] }, at: '$sentAt', sortAt: '$sentAt', body: '$message', kind: 'initial', direction: 'outgoing', state: 'sent', to: '$email' },
        { id: { $concat: ['followup1:', '$publicId'] }, at: '$followupSentAt', sortAt: '$followupSentAt', body: '$followup', kind: 'followup', direction: 'outgoing', state: 'sent', to: '$email' },
        { id: { $concat: ['followup2:', '$publicId'] }, at: '$followup2SentAt', sortAt: '$followup2SentAt', body: '$followup2', kind: 'followup', direction: 'outgoing', state: 'sent', to: '$email' },
      ] } }, { $unwind: '$messages' }, { $replaceRoot: { newRoot: '$messages' } }, { $match: { at: { $ne: null } } },
    ] } });
  }
  pipeline.push(...pageFilter(before), { $sort: { sortAt: -1, id: -1 } }, { $limit: 101 });
  const rows = await OutreachReply.aggregate(pipeline);
  return { id, lead: info.lead ? { publicId: info.lead.publicId, company: info.lead.company, email: info.lead.email, status: info.lead.status } : null,
    campaign: info.campaign ? { name: info.campaign.name, status: info.campaign.status } : null,
    receivedAt: info.reply.receivedAt, subject: info.reply.subject, recipient: mailbox(info.reply.from), replyId: info.reply.publicId,
    canSend: info.canSend, blockedReason: info.blockedReason, messages: rows.slice(0, 100).reverse(), nextCursor: rows.length > 100 ? encode(rows[99]) : null };
}
export async function markConversationRead(owner, id, replyIds) {
  const thread = parseThread(id);
  if (!Array.isArray(replyIds) || replyIds.length > 100 || replyIds.some(value => !uuid.test(value))) throw fail('Invalid read receipt.');
  const filter = thread.kind === 'lead' ? { 'links.leadId': thread.publicId } : { publicId: thread.publicId, 'links.0': { $exists: false } };
  await OutreachReply.updateMany({ owner, ...filter, publicId: { $in: replyIds, ...(thread.kind === 'unmatched' ? { $eq: thread.publicId } : {}) }, readAt: null }, { $set: { readAt: new Date() } });
  return { ok: true };
}
const safeMessageId = value => /^<[^<>\r\n]{1,900}>$/.test(String(value || '')) ? String(value) : '';
export async function sendConversationResponse(owner, id, { body, replyId, requestId, attachments = [] }, { config = outreachConfig(), transport = globalThis.fetch } = {}) {
  if (!uuid.test(replyId || '') || !uuid.test(requestId || '') || typeof body !== 'string' || !body.trim() || body.length > 12000) throw fail('Enter a response of up to 12,000 characters.');
  const files = normalizeResponseAttachments(attachments), metadata = attachmentMetadata(files);
  const staff = await User.findById(owner).select('+accountSource');
  if (!staff?.active || staff.accountSource === 'public') throw fail('Staff access is required.', 403);
  const thread = parseThread(id);
  if (thread.kind !== 'lead') throw fail('Link this reply to a contact before responding.', 409);
  const previous = await OutreachConversationMessage.findOne({ owner, requestId });
  if (previous) {
    if (previous.leadId !== thread.publicId || previous.replyId !== replyId || previous.bodyText !== body.trim() || JSON.stringify(attachmentMetadata(previous.attachments || [])) !== JSON.stringify(metadata)) throw fail('This send request already belongs to another response.', 409);
    if (previous.state === 'sent') return { message: previous, duplicate: true };
    throw fail('This response is already being processed or needs delivery review. Check delivery before sending again.', 409);
  }
  const info = await context(owner, id, config);
  if (!info.canSend) throw fail(info.blockedReason, 409);
  const parent = await OutreachReply.findOne({ owner, publicId: replyId, 'links.leadId': info.lead.publicId }).select('+internetMessageId +references');
  if (!parent) throw fail('Reply not found in this conversation.', 404);
  // The displayed latest sender is the recipient; never accept a client-supplied address.
  if (parent.publicId !== info.reply.publicId) throw Object.assign(fail('A newer reply arrived. Review the latest reply and recipient before sending again.', 409), { code: 'OUTREACH_REPLY_CHANGED' });
  let messageId = safeMessageId(parent.internetMessageId);
  if (!messageId) {
    const response = await transport('https://api.resend.com/emails/receiving/' + encodeURIComponent(parent.providerId) + '?html_format=cid', { headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY }, signal: AbortSignal.timeout(15000) });
    if (!response.ok) throw fail('The original email thread could not be retrieved. Refresh and try again.', 502);
    const data = await response.json(); messageId = safeMessageId(data.message_id);
    if (!messageId) throw fail('The original email is missing its threading ID. Check the message in Resend before responding.', 409);
    await OutreachReply.updateOne({ _id: parent._id }, { $set: { internetMessageId: messageId } });
  }
  await reserveSendSlot();
  let sent;
  try {
    sent = await OutreachConversationMessage.create({ owner, leadId: info.lead.publicId, campaignId: info.lead.campaignId, requestId, replyId,
      attachments: metadata, bodyText: body.trim(), from: config.from, to: mailbox(parent.from), subject: ('Re: ' + String(parent.subject || '').replace(/^(?:re:\s*)+/i, '').replace(/[\r\n]/g, ' ')).slice(0, 250) });
  } catch (error) { if (error.code === 11000) throw fail('Another response is being processed. Refresh before sending again.', 409); throw error; }
  const currentLead = await OutreachLead.findOne({ owner, publicId: info.lead.publicId });
  const stopped = !currentLead || currentLead.optedOutAt || ['opted-out', 'bounced', 'complained', 'failed'].includes(currentLead.stoppedReason)
    || await OutreachSuppression.exists({ email: { $in: [info.lead.email, sent.to] } })
    || (currentLead.campaignId && !await OutreachCampaign.exists({ owner, _id: currentLead.campaignId, status: { $ne: 'archived' } }));
  if (stopped) {
    await OutreachConversationMessage.updateOne({ _id: sent._id }, { $set: { state: 'cancelled' } });
    throw fail('Sending stopped before this response was sent. Review the contact and campaign.', 409);
  }
  try {
    const references = (String(parent.references || '').replace(/[\r\n]/g, ' ').slice(-1000) + ' ' + messageId).trim();
    const response = await transport('https://api.resend.com/emails', { method: 'POST',
      headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json', 'Idempotency-Key': 'tko-conversation-' + sent.publicId },
      body: JSON.stringify({ from: config.from, to: [sent.to], reply_to: outreachReplyAddress(info.lead, config), subject: sent.subject, text: sent.bodyText,
        ...(files.length ? { attachments: files.map(({ filename, content }) => ({ filename, content })) } : {}),
        headers: { 'In-Reply-To': messageId, References: references } }), signal: AbortSignal.timeout(20000) });
    const result = await response.json();
    if (!response.ok || typeof result.id !== 'string' || !result.id) throw Error('Acceptance not confirmed');
    sent = await OutreachConversationMessage.findOneAndUpdate({ _id: sent._id }, { $set: { state: 'sent', sentAt: new Date(), providerId: result.id, deliveryStatus: 'accepted' } }, { new: true });
    return { message: sent };
  } catch {
    await OutreachConversationMessage.updateOne({ _id: sent._id, state: 'sending' }, { $set: { state: 'review' } });
    throw fail('Delivery could not be confirmed. Check Resend before sending another response; this message will not be automatically retried.', 502);
  }
}
