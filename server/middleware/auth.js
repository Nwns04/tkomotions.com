import { User } from '../models/User.js';

export async function requireAuth(req, res, next) {
  if (!req.session?.userId) return res.status(401).json({ message: 'Authentication required.' });

  const user = await User.findById(req.session.userId);
  if (!user?.active) {
    req.session.destroy(() => {});
    return res.status(401).json({ message: 'Authentication required.' });
  }

  req.user = user;
  return next();
}
