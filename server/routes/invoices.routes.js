import { Router } from 'express';
import { Client } from '../models/Client.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Receipt } from '../models/Receipt.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { invoiceSchema } from '../validation/schemas.js';
import { createDocumentNumber } from '../services/documentNumbers.js';
import { renderDocumentPdf } from '../services/pdf.js';
import { businessDateKey } from '../services/invoiceMath.js';
import { env } from '../config/env.js';
import { bankAccountForCurrency } from '../services/paymentAccounts.js';
import { getDocumentSettings } from '../services/documentSettings.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 120);
  const status = String(req.query.status || '');
  const clientMatches = search
    ? await Client.find({ owner: req.user._id, $or: ['name', 'company', 'email'].map((field) => ({ [field]: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } })) }).distinct('_id')
    : [];
  const query = { owner: req.user._id };
  if (search) query.$or = [{ number: { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), $options: 'i' } }, { client: { $in: clientMatches } }];
  if (status === 'Overdue') {
    query.status = { $in: ['Sent', 'Partially Paid'] };
    query.dueDate = { $lt: new Date(`${businessDateKey(new Date(), env.BUSINESS_TIME_ZONE)}T00:00:00.000Z`) };
  } else if (status && ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Cancelled'].includes(status)) {
    query.status = status;
  }

  const invoices = await Invoice.find(query).populate('client').sort({ createdAt: -1 }).limit(250);
  res.json({ invoices });
});

router.post('/', requireCsrf, validate(invoiceSchema), async (req, res) => {
  const client = await Client.findOne({ publicId: req.body.clientPublicId, owner: req.user._id, archivedAt: null });
  if (!client) return res.status(422).json({ message: 'Please select a valid client.' });
  const number = await createDocumentNumber(Invoice, 'I', req.body.issueDate);
  const settings = await BusinessSettings.findOne({ owner: req.user._id });
  const { clientPublicId: _clientPublicId, ...data } = req.body;
  const invoice = await Invoice.create({ ...data, bankAccount: bankAccountForCurrency(settings, data.currency), number, client: client._id, owner: req.user._id });
  await invoice.populate('client');
  return res.status(201).json({ invoice });
});

router.get('/:publicId', async (req, res) => {
  const invoice = await Invoice.findOne({ publicId: req.params.publicId, owner: req.user._id }).populate('client');
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  const [payments, receipts] = await Promise.all([
    Payment.find({ invoice: invoice._id, owner: req.user._id }).sort({ paymentDate: -1 }),
    Receipt.find({ invoice: invoice._id, owner: req.user._id }).sort({ paymentDate: -1 }),
  ]);
  return res.json({ invoice, payments, receipts });
});

router.put('/:publicId', requireCsrf, validate(invoiceSchema), async (req, res) => {
  const invoice = await Invoice.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  if (invoice.status === 'Cancelled') return res.status(409).json({ message: 'Cancelled invoices cannot be edited. Duplicate it instead.' });
  if (invoice.amountPaid > 0) return res.status(409).json({ message: 'Invoices with payments are locked from structural editing.' });

  const client = await Client.findOne({ publicId: req.body.clientPublicId, owner: req.user._id, archivedAt: null });
  if (!client) return res.status(422).json({ message: 'Please select a valid client.' });
  const settings = await BusinessSettings.findOne({ owner: req.user._id });
  const { clientPublicId: _clientPublicId, ...data } = req.body;
  Object.assign(invoice, data, { bankAccount: bankAccountForCurrency(settings, data.currency), client: client._id });
  await invoice.save();
  await invoice.populate('client');
  return res.json({ invoice });
});

router.post('/:publicId/mark-sent', requireCsrf, async (req, res) => {
  const invoice = await Invoice.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  if (invoice.status !== 'Draft') return res.status(409).json({ message: 'Only draft invoices can be marked as sent.' });
  invoice.status = 'Sent';
  invoice.sentAt = new Date();
  await invoice.save();
  return res.json({ invoice });
});

router.post('/:publicId/cancel', requireCsrf, async (req, res) => {
  const invoice = await Invoice.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  if (invoice.amountPaid > 0) return res.status(409).json({ message: 'An invoice with recorded payments cannot be cancelled.' });
  invoice.status = 'Cancelled';
  invoice.cancelledAt = new Date();
  await invoice.save();
  return res.json({ invoice });
});

router.post('/:publicId/duplicate', requireCsrf, async (req, res) => {
  const source = await Invoice.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!source) return res.status(404).json({ message: 'Invoice not found.' });
  const issueDate = new Date();
  const dueDate = new Date(issueDate);
  dueDate.setDate(dueDate.getDate() + 14);
  const settings = await BusinessSettings.findOne({ owner: req.user._id });
  const duplicate = await Invoice.create({
    owner: req.user._id,
    client: source.client,
    number: await createDocumentNumber(Invoice, 'I', issueDate),
    issueDate,
    dueDate,
    currency: source.currency,
    bankAccount: bankAccountForCurrency(settings, source.currency),
    items: source.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
    discountType: source.discountType,
    discountValue: source.discountValue,
    taxEnabled: source.taxEnabled,
    taxRate: source.taxRate,
    notes: source.notes,
    paymentInstructions: source.paymentInstructions,
    terms: source.terms,
    status: 'Draft',
  });
  return res.status(201).json({ invoice: duplicate });
});

router.get('/:publicId/pdf', async (req, res) => {
  const invoice = await Invoice.findOne({ publicId: req.params.publicId, owner: req.user._id }).populate('client');
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  const settings = await getDocumentSettings(req.user._id);
  const pdf = await renderDocumentPdf('invoice', invoice.toJSON(), settings);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${invoice.number}.pdf"` });
  return res.send(pdf);
});

export default router;
