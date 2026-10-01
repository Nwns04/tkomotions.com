import { Router } from 'express';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { logoUploadSchema, settingsSchema } from '../validation/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/logo', async (req, res) => {
  const settings = await BusinessSettings.findOne({ owner: req.user._id }).select('+logoData +logoContentType');
  if (!settings?.logoData || !settings.logoContentType) return res.status(404).end();
  res.set({ 'Content-Type': settings.logoContentType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  return res.send(settings.logoData);
});

router.post('/logo', requireCsrf, validate(logoUploadSchema), async (req, res) => {
  const [, contentType, encoded] = req.body.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  const image = Buffer.from(encoded, 'base64');
  const validSignature = contentType === 'image/png'
    ? image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : contentType === 'image/jpeg'
      ? image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
      : image.subarray(0, 4).toString() === 'RIFF' && image.subarray(8, 12).toString() === 'WEBP';
  if (image.length > 700 * 1024 || !validSignature) return res.status(422).json({ message: 'Choose a valid PNG, JPEG, or WebP image smaller than 700 KB.' });

  const settings = await BusinessSettings.findOneAndUpdate(
    { owner: req.user._id },
    { $set: { logoData: image, logoContentType: contentType, logoUrl: '/api/finance/settings/logo' }, $setOnInsert: { owner: req.user._id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return res.json({ logoUrl: settings.logoUrl });
});

router.delete('/logo', requireCsrf, async (req, res) => {
  await BusinessSettings.updateOne(
    { owner: req.user._id },
    { $unset: { logoData: 1, logoContentType: 1 }, $set: { logoUrl: '' } },
  );
  return res.status(204).end();
});

router.get('/signature', async (req, res) => {
  const settings = await BusinessSettings.findOne({ owner: req.user._id }).select('+signatureData +signatureContentType');
  if (!settings?.signatureData || !settings.signatureContentType) return res.status(404).end();
  res.set({ 'Content-Type': settings.signatureContentType, 'Cache-Control': 'private, no-store', 'X-Content-Type-Options': 'nosniff' });
  return res.send(settings.signatureData);
});

router.post('/signature', requireCsrf, validate(logoUploadSchema), async (req, res) => {
  const [, contentType, encoded] = req.body.dataUrl.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/]+={0,2})$/);
  const image = Buffer.from(encoded, 'base64');
  const validSignature = contentType === 'image/png'
    ? image.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
    : contentType === 'image/jpeg'
      ? image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff
      : image.subarray(0, 4).toString() === 'RIFF' && image.subarray(8, 12).toString() === 'WEBP';
  if (image.length > 700 * 1024 || !validSignature) return res.status(422).json({ message: 'Choose a valid PNG, JPEG, or WebP signature image smaller than 700 KB.' });

  const settings = await BusinessSettings.findOneAndUpdate(
    { owner: req.user._id },
    { $set: { signatureData: image, signatureContentType: contentType, signatureUrl: '/api/finance/settings/signature' }, $setOnInsert: { owner: req.user._id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  return res.json({ signatureUrl: settings.signatureUrl });
});

router.delete('/signature', requireCsrf, async (req, res) => {
  await BusinessSettings.updateOne(
    { owner: req.user._id },
    { $unset: { signatureData: 1, signatureContentType: 1 }, $set: { signatureUrl: '' } },
  );
  return res.status(204).end();
});

router.get('/', async (req, res) => {
  const settings = await BusinessSettings.findOneAndUpdate(
    { owner: req.user._id },
    { $setOnInsert: { owner: req.user._id } },
    { new: true, upsert: true, setDefaultsOnInsert: true },
  );
  res.json({ settings });
});

router.put('/', requireCsrf, validate(settingsSchema), async (req, res) => {
  const settings = await BusinessSettings.findOneAndUpdate(
    { owner: req.user._id },
    { $set: req.body, $setOnInsert: { owner: req.user._id } },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
  );
  res.json({ settings });
});

export default router;
