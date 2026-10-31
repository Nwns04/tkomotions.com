import { createHash } from 'node:crypto';
import { OutreachReply, OutreachConversationMessage } from '../models/Outreach.js';
import { fail } from './outreachPolicy.js';
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 5;
const extensions = /\.(pdf|docx?|xlsx?|pptx?|png|jpe?g|gif|webp|txt|csv|zip)$/i;
// Check the alphabet and padding without repeating regex groups over multi-megabyte input.
function validBase64(value) {
  if (value.length % 4 !== 0) return false;
  const padding = value.endsWith('==') ? 2 : value.endsWith('=') ? 1 : 0;
  const body = value.slice(0, value.length - padding);
  return !/[^A-Za-z0-9+/]/.test(body) && !value.slice(value.length - padding).replace(/=/g, '');
}
export function normalizeResponseAttachments(value = []) {
  if (!Array.isArray(value) || value.length > MAX_ATTACHMENTS) throw fail('Attach up to 5 files, with a combined size of 5 MB.');
  let total = 0;
  return value.map(item => {
    if (!item || typeof item.filename !== 'string' || item.filename.length > 180 || /[\p{Cc}/\\]/u.test(item.filename) || !extensions.test(item.filename)) throw fail('Use a PDF, Office document, image, text, CSV or ZIP file with a valid filename.');
    if (typeof item.content !== 'string' || item.content.length > Math.ceil(MAX_ATTACHMENT_BYTES / 3) * 4 || !validBase64(item.content)) throw fail('An attachment could not be read. Select the file again.');
    const bytes = Buffer.from(item.content, 'base64'); total += bytes.length;
    if (total > MAX_ATTACHMENT_BYTES) throw fail('Attachments must total 5 MB or less.');
    return { filename: item.filename, content: item.content, size: bytes.length, sha256: createHash('sha256').update(bytes).digest('hex') };
  });
}
export const attachmentMetadata = files => files.map(({ filename, size, sha256 }) => ({ filename, size, sha256 }));
export async function getConversationAttachment(owner, threadId, messageId, index, { transport = globalThis.fetch } = {}) {
  if (!/^(?:lead|unmatched):[a-f0-9-]{36}$/i.test(threadId) || !/^(?:in|out):[a-f0-9-]{36}$/i.test(messageId) || !/^\d{1,2}$/.test(String(index))) throw fail('Invalid attachment.');
  const [kind, id] = messageId.split(':'), [threadKind, leadId] = threadId.split(':');
  const record = kind === 'in'
    ? await OutreachReply.findOne({ owner, publicId: id, ...(threadKind === 'lead' ? { 'links.leadId': leadId } : { publicId: leadId, 'links.0': { $exists: false } }) })
    : threadKind === 'lead' ? await OutreachConversationMessage.findOne({ owner, publicId: id, leadId, state: 'sent' }) : null;
  // An unmatched URL must refer to that exact message, not just another owned record.
  if (!record || (threadKind === 'unmatched' && id !== leadId)) throw fail('Attachment not found.', 404);
  const attachment = record.attachments?.[Number(index)];
  if (!attachment || !record.providerId) throw fail('Attachment not found.', 404);
  const endpoint = 'https://api.resend.com/emails/' + (kind === 'in' ? 'receiving/' : '') + encodeURIComponent(record.providerId) + '/attachments';
  const options = { headers: { Authorization: 'Bearer ' + process.env.RESEND_API_KEY }, signal: AbortSignal.timeout(15000) };
  let metadata;
  if (attachment.providerId) {
    const response = await transport(endpoint + '/' + encodeURIComponent(attachment.providerId), options);
    if (!response.ok) throw fail('The attachment is temporarily unavailable. Try again.', 502);
    metadata = await response.json();
  } else {
    // Older saved replies did not retain provider attachment IDs. Match their metadata.
    const response = await transport(endpoint + '?limit=100', options);
    if (!response.ok) throw fail('The attachment is temporarily unavailable. Try again.', 502);
    const data = await response.json();
    const matches = (data.data || []).filter(item => item.filename === attachment.filename && (!attachment.size || item.size === attachment.size));
    if (matches.length > 1 && matches.length <= MAX_ATTACHMENTS && kind === 'out' && attachment.sha256) {
      // Filenames and sizes can be identical. Compare saved content digests, never list order.
      for (const candidate of matches) {
        const bytes = await downloadProviderAttachment(candidate, transport, MAX_ATTACHMENT_BYTES);
        if (createHash('sha256').update(bytes).digest('hex') !== attachment.sha256) continue;
        if (candidate.id) await OutreachConversationMessage.updateOne({ owner, publicId: id, [`attachments.${Number(index)}.sha256`]: attachment.sha256 }, { $set: { [`attachments.${Number(index)}.providerId`]: String(candidate.id) } });
        return { filename: downloadFilename(attachment.filename), bytes };
      }
      throw fail('The original attachment could not be verified. Try again or check Resend.', 409);
    }
    if (matches.length !== 1) throw fail('This attachment could not be identified. Check the original email in Resend.', 409);
    metadata = matches[0];
  }
  const bytes = await downloadProviderAttachment(metadata, transport);
  return { filename: downloadFilename(attachment.filename), bytes };
}
const downloadFilename = value => String(value || 'Attachment').replace(/[\p{Cc}/\\]/gu, '_').slice(0, 180);
async function downloadProviderAttachment(metadata, transport, maximum = 40 * 1024 * 1024) {
  let url;
  try { url = new URL(metadata.download_url); } catch { throw fail('The attachment download is unavailable.', 502); }
  if (url.protocol !== 'https:' || url.username || url.password || url.port || !url.hostname.endsWith('.resend.com')) throw fail('The attachment download is unavailable.', 502);
  if (metadata.size > maximum) throw fail('This file is too large to download here. Open the original in Resend.', 413);
  // Never send the API key to the CDN or follow redirects to an unverified host.
  const response = await transport(url.href, { signal: AbortSignal.timeout(30000), redirect: 'error' });
  if (!response.ok || !response.body) throw fail('The attachment could not be downloaded. Try again.', 502);
  const chunks = []; let size = 0;
  const reader = response.body.getReader();
  try {
    while (true) { const { done, value } = await reader.read(); if (done) break; size += value.byteLength; if (size > maximum) { await reader.cancel(); throw fail('This file is too large to download here.', 413); } chunks.push(Buffer.from(value)); }
  } finally { reader.releaseLock(); }
  return Buffer.concat(chunks);
}
