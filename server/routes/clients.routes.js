import { Router } from 'express';
import { Client } from '../models/Client.js';
import { Invoice } from '../models/Invoice.js';
import { Receipt } from '../models/Receipt.js';
import { Quotation } from '../models/Quotation.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { clientSchema } from '../validation/schemas.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 120);
  const query = { owner: req.user._id, archivedAt: null };
  if (search) {
    const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    query.$or = ['name', 'company', 'email'].map((field) => ({ [field]: { $regex: safe, $options: 'i' } }));
  }
  const clients = await Client.find(query).sort({ name: 1 }).limit(250);
  res.json({ clients });
});

router.post('/', requireCsrf, validate(clientSchema), async (req, res) => {
  const client = await Client.create({ ...req.body, owner: req.user._id });
  res.status(201).json({ client });
});

router.get('/:publicId', async (req, res) => {
  const client = await Client.findOne({ publicId: req.params.publicId, owner: req.user._id, archivedAt: null });
  if (!client) return res.status(404).json({ message: 'Client not found.' });

  const [invoices, receipts] = await Promise.all([
    Invoice.find({ client: client._id, owner: req.user._id }).sort({ issueDate: -1 }),
    Receipt.find({ client: client._id, owner: req.user._id }).sort({ paymentDate: -1 }),
  ]);
  const metrics = Object.values(invoices.filter((invoice) => invoice.status !== 'Cancelled').reduce((result, invoice) => {
    const current = result[invoice.currency] || { currency: invoice.currency, invoiced: 0, paid: 0, outstanding: 0 };
    current.invoiced += invoice.total;
    current.paid += invoice.amountPaid;
    current.outstanding += Math.max(0, invoice.total - invoice.amountPaid);
    result[invoice.currency] = current;
    return result;
  }, {}));
  return res.json({ client, metrics, invoices, receipts });
});

router.put('/:publicId', requireCsrf, validate(clientSchema), async (req, res) => {
  const client = await Client.findOneAndUpdate(
    { publicId: req.params.publicId, owner: req.user._id, archivedAt: null },
    req.body,
    { new: true, runValidators: true },
  );
  if (!client) return res.status(404).json({ message: 'Client not found.' });
  return res.json({ client });
});

router.delete('/:publicId', requireCsrf, async (req, res) => {
  const client = await Client.findOne({ publicId: req.params.publicId, owner: req.user._id, archivedAt: null });
  if (!client) return res.status(404).json({ message: 'Client not found.' });
  const documentChecks = await Promise.all([
    Invoice.exists({ client: client._id, owner: req.user._id }),
    Receipt.exists({ client: client._id, owner: req.user._id }),
    Quotation.exists({ client: client._id, owner: req.user._id }),
  ]);
  const hasDocuments = documentChecks.some(Boolean);
  if (hasDocuments) return res.status(409).json({ message: 'This client has financial history and cannot be archived.' });
  client.archivedAt = new Date();
  await client.save();
  return res.status(204).end();
});

export default router;
