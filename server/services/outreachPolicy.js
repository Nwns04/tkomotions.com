import { createHmac, timingSafeEqual } from 'node:crypto';
import { z } from 'zod';

export const emailSchema = z.string().trim().toLowerCase().email().max(254);
export const outreachFields = z.object({
  company: z.string().trim().max(150).default(''), name: z.string().trim().max(150).default(''),
  email: emailSchema, subject: z.string().trim().max(250).default(''),
  message: z.string().trim().max(12000).default(''), followup: z.string().trim().max(12000).default(''),
  followup2: z.string().trim().max(12000).default(''),
  followup2DelayDays: z.coerce.number().int().min(2).max(60).default(10),
  permissionBasis: z.string().trim().max(500).default(''),
  delayDays: z.coerce.number().int().min(1).max(30).default(3),
  autoFollowup: z.boolean().default(false),
});
export const fail = (message, status = 400) => Object.assign(new Error(message), { status });

export function outreachConfig(environment = process.env) {
  const from = environment.OUTREACH_FROM_EMAIL || environment.RESEND_FROM_EMAIL || '';
  const replyTo = environment.OUTREACH_REPLY_TO || '';
  const origin = environment.APP_ORIGIN || 'http://localhost:5173';
  let validOrigin = false;
  try { const url = new URL(origin); validOrigin = url.protocol === 'https:' && url.pathname === '/' && !url.search && !url.hash && !url.username && !url.password; } catch { /* Report via checklist. */ }
  const sender = from.match(/<([^<>]+)>$/)?.[1] || from;
  const configured = Boolean(environment.RESEND_API_KEY && emailSchema.safeParse(sender).success && emailSchema.safeParse(replyTo).success && validOrigin);
  const live = environment.OUTREACH_LIVE_ENABLED === 'true' && configured;
  const secret = environment.OUTREACH_WEBHOOK_SECRET || '';
  const receiving = environment.OUTREACH_RECEIVING_ENABLED === 'true' && Boolean(secret);
  return { from, replyTo, origin, live, configured, secret, receiving,
    autoFollowupReady: live && receiving && environment.OUTREACH_AUTO_FOLLOWUP_ENABLED === 'true',
    requestedLive: environment.OUTREACH_LIVE_ENABLED === 'true' };
}

export function verifyOutreachWebhook(raw, headers, secret, now = Date.now()) {
  if (!secret || !Buffer.isBuffer(raw)) return false;
  const id = headers['svix-id'], timestamp = headers['svix-timestamp'], signature = headers['svix-signature'];
  if (typeof id !== 'string' || typeof timestamp !== 'string' || !/^\d+$/.test(timestamp) || typeof signature !== 'string') return false;
  if (Math.abs(now / 1000 - Number(timestamp)) > 300) return false;
  const key = Buffer.from(secret.replace(/^whsec_/, ''), 'base64');
  if (!key.length) return false;
  const expected = createHmac('sha256', key).update(`${id}.${timestamp}.`).update(raw).digest();
  return signature.split(' ').some(item => {
    if (!item.startsWith('v1,')) return false;
    const supplied = Buffer.from(item.slice(3), 'base64');
    return supplied.length === expected.length && timingSafeEqual(supplied, expected);
  });
}

export function assertSendable(lead, followup = false) {
  if (lead.stoppedReason || lead.repliedAt || lead.optedOutAt) throw fail('Sending is stopped for this contact.', 409);
  if (!emailSchema.safeParse(lead.email).success || !lead.subject || !(followup ? lead.followup : lead.message)) throw fail('Recipient, subject, and message are required.');
  if (!lead.permissionBasis) throw fail('Record your permission or reason for contacting this recipient first.');
  if (followup ? !lead.sentAt || lead.followupSentAt || lead.followupState !== 'pending' : lead.sentAt || lead.initialState !== 'pending') throw fail('This email has already been sent or needs delivery review.', 409);
}
