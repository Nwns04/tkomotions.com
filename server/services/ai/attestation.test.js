import test from 'node:test';
import assert from 'node:assert/strict';

process.env.MONGODB_URI = 'mongodb://127.0.0.1:27017/tko_finance_test';
process.env.SESSION_SECRET = 'test-session-secret-with-at-least-32-characters';

const { createAiAttestation, verifyAiAttestation } = await import('./attestation.js');

test('accepts an authentic AI attestation for the same owner', () => {
  const token = createAiAttestation({ ownerId: 'owner-a', provider: 'gemini', model: 'gemini-test', fallbackUsed: false });
  assert.deepEqual(verifyAiAttestation(token, 'owner-a'), {
    generated: true,
    provider: 'gemini',
    model: 'gemini-test',
    fallbackUsed: false,
  });
});

test('rejects tampered and cross-owner AI attestations', () => {
  const token = createAiAttestation({ ownerId: 'owner-a', provider: 'groq', model: 'groq-test', fallbackUsed: true });
  assert.equal(verifyAiAttestation(`${token}x`, 'owner-a'), null);
  assert.equal(verifyAiAttestation(token, 'owner-b'), null);
});
