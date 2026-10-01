import { randomBytes, timingSafeEqual } from 'node:crypto';

export function ensureCsrfToken(req) {
  if (!req.session.csrfToken) req.session.csrfToken = randomBytes(32).toString('hex');
  return req.session.csrfToken;
}

export function requireCsrf(req, res, next) {
  const supplied = req.get('x-csrf-token');
  const stored = req.session?.csrfToken;
  if (!supplied || !stored) return res.status(403).json({ message: 'Invalid security token.' });

  const suppliedBuffer = Buffer.from(supplied);
  const storedBuffer = Buffer.from(stored);
  if (suppliedBuffer.length !== storedBuffer.length || !timingSafeEqual(suppliedBuffer, storedBuffer)) {
    return res.status(403).json({ message: 'Invalid security token.' });
  }
  return next();
}
