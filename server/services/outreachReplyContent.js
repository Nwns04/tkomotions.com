import { createHmac, timingSafeEqual } from 'node:crypto';

const signature = (id, secret) => createHmac('sha256', secret).update('outreach-reply:' + id).digest('hex').slice(0, 24);
export const mailbox = value => String(value || '').match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0]?.toLowerCase() || '';
export function outreachReplyAddress(lead, config) {
  if (!config.receiving || !config.secret) return config.replyTo;
  const [local, domain] = config.replyTo.split('@');
  const alias = local + '+' + String(lead._id) + '.' + signature(String(lead._id), config.secret);
  return alias.length <= 64 ? alias + '@' + domain : config.replyTo;
}
export function receivingRecipients(to, config) {
  const base = mailbox(config.replyTo), [local, domain] = base.split('@');
  return (Array.isArray(to) ? to : []).map(mailbox).filter(address => {
    const [recipient, host] = address.split('@');
    return host === domain && (recipient === local || recipient?.startsWith(local + '+'));
  });
}
export function signedReplyLead(to, config) {
  if (!config.secret) return null;
  for (const address of receivingRecipients(to, config)) {
    const token = address.split('@')[0].split('+')[1];
    const match = token?.match(/^([a-f0-9]{24})\.([a-f0-9]{24})$/);
    if (match && timingSafeEqual(Buffer.from(match[2]), Buffer.from(signature(match[1], config.secret)))) return match[1];
  }
  return null;
}
export function htmlReplyText(html) {
  return String(html || '').slice(0, 1000000)
    .replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi, '')
    .replace(/<br\s*\/?\s*>|<\/(?:p|div|tr|li|blockquote)>/gi, '\n')
    .replace(/<[^<>]*>/g, '')
    .replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) => {
      const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
      return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '';
    })
    .replace(/&(nbsp|lt|gt|quot|apos|amp);/g, (_, name) => ({ nbsp: ' ', lt: '<', gt: '>', quot: '"', apos: "'", amp: '&' })[name])
    .replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n/g, '\n\n').trim();
}
export function quotedReplyTokens(content, config) {
  const escaped = new URL(config.origin).origin.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return [...new Set([...String(content).matchAll(new RegExp(escaped + '/api/finance/outreach/unsubscribe/([a-f0-9]{64})(?![a-f0-9])', 'g'))].map(match => match[1]))].slice(0, 8);
}
