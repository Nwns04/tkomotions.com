import { OutreachCampaign, OutreachLead, OutreachEvent, OutreachLease } from '../models/Outreach.js';
import { fail } from './outreachPolicy.js';

const historyTypes = ['sent', 'followup-1', 'followup-2', 'send-review', 'reply', 'replied', 'delivered', 'bounced', 'failed', 'complained'];
const value = (field, fallback = null) => ({ $ifNull: ['$' + field, fallback] });
const present = field => ({ $ne: [value(field), null] });
const pending = field => ({ $eq: [value(field, 'pending'), 'pending'] });
const sending = { $or: ['initialState', 'followupState', 'followup2State'].map(field => ({ $eq: [value(field), 'sending'] })) };
const attempted = { $or: [
  ...['initialState', 'followupState', 'followup2State'].map(field => ({ $not: [pending(field)] })),
  ...['sentAt', 'followupSentAt', 'followup2SentAt', 'repliedAt', 'optedOutAt'].map(present),
  ...['messageId', 'followupMessageId', 'followup2MessageId'].map(field => ({ $ne: [value(field, ''), ''] })),
] };
const queued = { $or: ['scheduledAt', 'followupDueAt', 'followup2DueAt'].map(present) };
const allowed = { $and: [{ $eq: [value('stoppedReason', ''), ''] }, { $eq: [value('repliedAt'), null] }, { $eq: [value('optedOutAt'), null] }] };
const initialQueued = { $and: [allowed, present('scheduledAt'), pending('initialState'), { $eq: [value('sentAt'), null] }] };
const followupQueued = { $and: [allowed, { $eq: [value('autoFollowup', false), true] }, { $or: [
  { $and: [present('followupDueAt'), pending('followupState')] },
  { $and: [present('followup2DueAt'), pending('followup2State')] },
] }] };

export async function campaignCounts(owner, { campaignId, session = null } = {}) {
  const match = { owner, ...(campaignId ? { campaignId } : {}) };
  const now = new Date();
  const due = field => ({ $and: [present(field), { $lte: [value(field), now] }] });
  const overdue = { $or: [
    { $and: [initialQueued, due('scheduledAt')] },
    { $and: [followupQueued, { $or: [{ $and: [pending('followupState'), due('followupDueAt')] }, { $and: [pending('followup2State'), due('followup2DueAt')] }] }] },
  ] };
  const count = condition => ({ $sum: { $cond: [condition, 1, 0] } });
  const rows = await OutreachLead.aggregate([{ $match: match }, { $group: {
    _id: '$campaignId', contacts: { $sum: 1 }, sent: count(present('sentAt')), attempted: count(attempted),
    scheduled: count(initialQueued), followups: count(followupQueued), overdue: count(overdue), inFlight: count(sending), queued: count(queued),
  } }]).session(session);
  // Query the full history, rather than just the 50 activity rows shown in the UI.
  const events = await OutreachEvent.aggregate([{ $match: { owner, ...(campaignId ? { campaignId } : {}), type: { $in: historyTypes } } }, { $group: { _id: '$campaignId' } }]).session(session);
  const history = new Set(events.map(row => String(row._id)));
  const counts = new Map(rows.map(row => [String(row._id), { ...row, hasHistory: history.has(String(row._id)) }]));
  for (const id of history) if (!counts.has(id)) counts.set(id, { hasHistory: true });
  return counts;
}
export function describeCampaign(campaign, counts = {}) {
  const stats = { contacts: 0, sent: 0, attempted: 0, scheduled: 0, followups: 0, overdue: 0, inFlight: 0, queued: 0, hasHistory: false, ...counts };
  delete stats._id;
  return { ...campaign.toJSON(), _id: String(campaign._id), id: String(campaign._id), stats,
    canDelete: ['draft', 'archived'].includes(campaign.status) && !stats.attempted && !stats.queued && !stats.hasHistory };
}
export async function campaignSummary(owner, id) {
  const campaign = await OutreachCampaign.findOne({ _id: id, owner });
  if (!campaign) throw fail('Campaign not found.', 404);
  const counts = await campaignCounts(owner, { campaignId: campaign._id });
  return describeCampaign(campaign, counts.get(String(campaign._id)));
}

export async function updateCampaignStatus(owner, id, { status, confirmed = false, expectedUpdatedAt } = {}) {
  return OutreachCampaign.db.transaction(async session => {
    const campaign = await OutreachCampaign.findOne({ _id: id, owner }).session(session);
    if (!campaign) throw fail('Campaign not found.', 404);
    if (expectedUpdatedAt && campaign.updatedAt.toISOString() !== expectedUpdatedAt) throw fail('Campaign changed. Reopen its action to review the latest details.', 409);
    const counts = await campaignCounts(owner, { campaignId: campaign._id, session });
    const stats = describeCampaign(campaign, counts.get(String(campaign._id))).stats;
    if (campaign.status === status) return describeCampaign(campaign, stats);
    if (status === 'restore') {
      if (campaign.status !== 'archived') throw fail('Only archived campaigns can be restored.', 409);
      if (!confirmed) throw fail('Confirm restoring this campaign first.', 409);
      campaign.status = campaign.archivedFromStatus === 'draft' ? 'draft' : 'paused';
      campaign.archivedAt = null; campaign.archivedFromStatus = null;
    } else if (status === 'archived') {
      if (!confirmed) throw fail('Confirm archive first. Queued sends and follow-ups will be cancelled.', 409);
      campaign.archivedFromStatus = campaign.status; campaign.archivedAt = new Date(); campaign.status = 'archived';
      await OutreachLead.updateMany({ owner, campaignId: campaign._id, status: 'scheduled', initialState: 'pending', sentAt: null, stoppedReason: '' }, { $set: { status: 'draft' } }, { session });
      await OutreachLead.updateMany({ owner, campaignId: campaign._id }, { $set: { scheduledAt: null, followupDueAt: null, followup2DueAt: null, autoFollowup: false } }, { session });
      const idle = await OutreachLead.find({ owner, campaignId: campaign._id, initialState: { $ne: 'sending' }, followupState: { $ne: 'sending' }, followup2State: { $ne: 'sending' } }).select('_id').session(session);
      await OutreachLease.deleteMany({ leadId: { $in: idle.map(lead => lead._id) } }, { session });
    } else {
      if (!['draft', 'active', 'paused'].includes(status)) throw fail('Invalid campaign status.');
      if (campaign.status === 'archived') throw fail('Restore the archived campaign before changing its status.', 409);
      if (status === 'draft' && campaign.status !== 'draft') throw fail('Use Pause or Archive; an activated campaign cannot become a new draft.', 409);
      if (status === 'active' && stats.overdue && !confirmed) throw fail('Confirm activation: ' + stats.overdue + ' contact(s) have overdue sends or follow-ups that may be processed immediately.', 409);
      campaign.status = status;
    }
    await campaign.save({ session });
    const latest = await campaignCounts(owner, { campaignId: campaign._id, session });
    return describeCampaign(campaign, latest.get(String(campaign._id)));
  });
}

export async function deleteDraftCampaign(owner, id, { confirmed = false, expectedUpdatedAt } = {}) {
  if (!confirmed) throw fail('Confirm permanent deletion of this draft first.', 409);
  return OutreachCampaign.db.transaction(async session => {
    const campaign = await OutreachCampaign.findOne({ _id: id, owner }).session(session);
    if (!campaign) throw fail('Campaign not found.', 404);
    if (expectedUpdatedAt && campaign.updatedAt.toISOString() !== expectedUpdatedAt) throw fail('Campaign changed. Review it again before deleting.', 409);
    const counts = await campaignCounts(owner, { campaignId: campaign._id, session });
    if (!describeCampaign(campaign, counts.get(String(campaign._id))).canDelete) throw fail('Only unscheduled drafts without send attempts or delivery/reply history can be deleted. Archive this campaign instead.', 409);
    const leads = await OutreachLead.find({ owner, campaignId: campaign._id }).select('_id').session(session);
    await OutreachCampaign.deleteOne({ _id: campaign._id, owner, updatedAt: campaign.updatedAt }, { session });
    await OutreachLease.deleteMany({ leadId: { $in: leads.map(lead => lead._id) } }, { session });
    await OutreachEvent.deleteMany({ owner, campaignId: campaign._id }, { session });
    await OutreachLead.deleteMany({ owner, campaignId: campaign._id }, { session });
    return { deleted: true };
  });
}
