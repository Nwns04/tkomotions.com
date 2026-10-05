import { getResendClient } from '@/lib/resend';

type BusinessNotification = { isDemo: boolean; notificationEmail?: string; name: string; leadNotifyThreshold: number };
type LeadNotification = { name: string; interest: string; budget: string; intent: string; inspectionRequested: boolean; score: number; classification: string; notifiedAt?: Date | null; save: () => Promise<unknown> };

export async function notifyQualifiedLead(business: BusinessNotification, lead: LeadNotification) {
  if (lead.notifiedAt || lead.score < business.leadNotifyThreshold) return { sent: false, reason: 'Lead does not meet notification criteria.' };
  // Demo traffic only ever goes to a TKO-controlled address set by deployment,
  // never to visitor-supplied addresses.
  const recipient = business.isDemo ? process.env.DEMO_NOTIFICATION_EMAIL : business.notificationEmail;
  const resend = getResendClient();
  const from = process.env.RESEND_FROM_EMAIL;
  if (!recipient || !resend || !from) return { sent: false, reason: 'Notification email is not configured.' };

  await resend.emails.send({
    from,
    to: recipient,
    subject: `🔥 New Qualified Lead — ${business.name}`,
    text: `${lead.name || 'A visitor'} is interested in ${lead.interest || 'a sales enquiry'}.

Budget: ${lead.budget || 'Not provided'}
Intent: ${lead.intent || 'Not provided'}
Inspection: ${lead.inspectionRequested ? 'Requested' : 'Not requested'}
Lead score: ${lead.score} — ${lead.classification}`,
  });
  lead.notifiedAt = new Date();
  await lead.save();
  return { sent: true, reason: 'Qualified lead notification sent.' };
}
