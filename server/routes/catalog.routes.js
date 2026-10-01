import { Router } from 'express';
import { CatalogItem } from '../models/CatalogItem.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { catalogItemSchema } from '../validation/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const includeInactive = req.query.includeInactive === 'true';
  const items = await CatalogItem.find({ owner: req.user._id, ...(includeInactive ? {} : { active: true }) }).sort({ category: 1, name: 1 });
  res.json({ items });
});

router.post('/', requireCsrf, validate(catalogItemSchema), async (req, res) => {
  const item = await CatalogItem.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ item });
});

router.put('/:publicId', requireCsrf, validate(catalogItemSchema), async (req, res) => {
  const item = await CatalogItem.findOneAndUpdate(
    { publicId: req.params.publicId, owner: req.user._id },
    req.body,
    { new: true, runValidators: true },
  );
  if (!item) return res.status(404).json({ message: 'Catalog item not found.' });
  return res.json({ item });
});

router.delete('/:publicId', requireCsrf, async (req, res) => {
  const item = await CatalogItem.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!item) return res.status(404).json({ message: 'Catalog item not found.' });
  item.active = false;
  await item.save();
  return res.status(204).end();
});

export default router;
