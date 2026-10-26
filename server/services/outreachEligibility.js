import { OutreachLead, OutreachSuppression, OutreachLease } from '../models/Outreach.js';

// Shared by the dashboard and scheduling preflight. Query beyond the dashboard's
// loaded page so a sequence in an older campaign still blocks duplicates.
export async function outreachEligibility(owner, leads) {
  const emails = [...new Set(leads.map(lead => lead.email))];
  const [related, suppressed, leases] = await Promise.all([
    OutreachLead.find({ owner, email: { $in: emails }, stoppedReason: '', $or: [
      { scheduledAt: { $ne: null } }, { sentAt: { $gte: new Date(Date.now() - 14 * 86400000) } },
      { initialState: 'sending' }, { followupState: 'sending' }, { followup2State: 'sending' },
      { followupDueAt: { $ne: null } }, { followup2DueAt: { $ne: null } },
    ] }).select('email campaignId publicId'),
    OutreachSuppression.find({ email: { $in: emails } }).select('email'),
    OutreachLease.find({ key: { $in: emails.map(email => String(owner) + ':' + email) }, expiresAt: { $gt: new Date() } }).select('key leadId'),
  ]);
  const blocked = new Set(suppressed.map(item => item.email));
  const byEmail = new Map();
  for (const row of related) { const rows = byEmail.get(row.email) || []; rows.push(row); byEmail.set(row.email, rows); }
  const reserved = new Map(leases.map(row => [row.key, String(row.leadId)]));
  return new Map(leads.map(lead => {
    let reason = '';
    if (lead.repliedAt) reason = 'Already replied';
    else if (lead.optedOutAt || blocked.has(lead.email)) reason = 'Address suppressed or opted out';
    else if (lead.stoppedReason) reason = 'Stopped: ' + lead.stoppedReason;
    else if (lead.sentAt) reason = 'Already sent';
    else if (lead.scheduledAt) reason = 'Already scheduled';
    else if (lead.initialState !== 'pending') reason = 'Sending attempted; review delivery';
    else if (!lead.subject || !lead.message) reason = 'Add a subject and initial message';
    else if ((byEmail.get(lead.email) || []).some(row => row.publicId !== lead.publicId)) reason = 'Another campaign has a scheduled, active or recently sent sequence';
    else if (reserved.has(String(owner) + ':' + lead.email) && reserved.get(String(owner) + ':' + lead.email) !== String(lead._id)) reason = 'Address reserved by another sequence';
    return [lead.publicId, { eligible: !reason, reason }];
  }));
}
