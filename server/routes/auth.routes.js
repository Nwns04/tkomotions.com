import { Router } from 'express';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { User } from '../models/User.js';
import { validate } from '../middleware/validate.js';
import { loginSchema } from '../validation/schemas.js';
import { ensureCsrfToken, requireCsrf } from '../middleware/csrf.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: { message: 'Too many login attempts. Please wait and try again.' },
});

router.get('/session', async (req, res) => {
  const csrfToken = ensureCsrfToken(req);
  if (!req.session.userId) return res.json({ authenticated: false, csrfToken });

  const user = await User.findById(req.session.userId);
  if (!user?.active) return res.json({ authenticated: false, csrfToken });
  return res.json({ authenticated: true, csrfToken, user: user.toJSON() });
});

router.post('/login', loginLimiter, validate(loginSchema), async (req, res) => {
  const user = await User.findOne({ email: req.body.email }).select('+passwordHash');
  const matches = user?.active && await bcrypt.compare(req.body.password, user.passwordHash);
  if (!matches) return res.status(401).json({ message: 'Email or password is incorrect.' });

  await new Promise((resolve, reject) => req.session.regenerate((error) => (error ? reject(error) : resolve())));
  req.session.userId = user._id.toString();
  const csrfToken = ensureCsrfToken(req);
  user.lastLoginAt = new Date();
  await user.save();
  return res.json({ authenticated: true, csrfToken, user: user.toJSON() });
});

router.post('/logout', requireAuth, requireCsrf, async (req, res) => {
  await new Promise((resolve, reject) => req.session.destroy((error) => (error ? reject(error) : resolve())));
  res.clearCookie('tko.sid');
  return res.status(204).end();
});

export default router;
