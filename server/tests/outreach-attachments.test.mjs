import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeResponseAttachments, MAX_ATTACHMENT_BYTES } from '../services/outreachAttachments.js';
const file = (size, content = Buffer.alloc(size, 65).toString('base64')) => ({ filename: 'proposal.pdf', content });
test('valid attachments at 4 MB and the 5 MB boundary validate without overflowing', () => {
  for (const size of [4 * 1024 * 1024, MAX_ATTACHMENT_BYTES]) assert.equal(normalizeResponseAttachments([file(size)])[0].size, size);
  const half = MAX_ATTACHMENT_BYTES / 2;
  assert.equal(normalizeResponseAttachments([file(half), file(half)]).reduce((total, item) => total + item.size, 0), MAX_ATTACHMENT_BYTES);
});
test('oversized and malformed Base64 attachments fail with a controlled validation error', () => {
  assert.throws(() => normalizeResponseAttachments([file(MAX_ATTACHMENT_BYTES + 1)]), error => error.status === 400);
  assert.throws(() => normalizeResponseAttachments([file(MAX_ATTACHMENT_BYTES), file(1)]), error => error.status === 400 && /5 MB/.test(error.message));
  for (const content of ['Zg', 'Zg=', 'Z===', '====', 'Z=g=', 'Zg==\n', '!!!!', 'A'.repeat(4 * 1024 * 1024) + '!===']) {
    assert.throws(() => normalizeResponseAttachments([file(0, content)]), error => error.status === 400);
  }
  for (const content of ['', 'Zg==', 'Zm8=', 'Zm9v']) assert.equal(normalizeResponseAttachments([file(0, content)])[0].size, Buffer.from(content, 'base64').length);
});
