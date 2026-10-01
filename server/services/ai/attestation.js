import { createHmac, timingSafeEqual } from 'node:crypto';
import { env } from '../../config/env.js';

function signature(payload) {
  return createHmac('sha256', env.SESSION_SECRET).update(payload).digest('base64url');
}

export function createAiAttestation({ ownerId, provider, model, fallbackUsed }) {
  const payload = Buffer.from(JSON.stringify({
    ownerId: String(ownerId),
    provider,
    model,
    fallbackUsed: Boolean(fallbackUsed),
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  })).toString('base64url');
  return `${payload}.${signature(payload)}`;
}

export function verifyAiAttestation(value, ownerId) {
  try {
    const [payload, suppliedSignature] = String(value || '').split('.');
    if (!payload || !suppliedSignature) return null;
    const expectedSignature = signature(payload);
    const supplied = Buffer.from(suppliedSignature);
    const expected = Buffer.from(expectedSignature);
    if (supplied.length !== expected.length || !timingSafeEqual(supplied, expected)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    if (data.ownerId !== String(ownerId) || data.expiresAt < Date.now() || !['gemini', 'groq'].includes(data.provider)) return null;
    return { generated: true, provider: data.provider, model: String(data.model || '').slice(0, 200), fallbackUsed: Boolean(data.fallbackUsed) };
  } catch { return null; }
}
