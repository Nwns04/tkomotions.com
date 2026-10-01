import { Router } from 'express';
import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Receipt } from '../models/Receipt.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { receiptSchema } from '../validation/schemas.js';
import { createDocumentNumber } from '../services/documentNumbers.js';
import { renderDocumentPdf } from '../services/pdf.js';
import { getDocumentSettings } from '../services/documentSettings.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 120);
  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;
  const safe = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const clientMatches = search
    ? await Client.find({ owner: req.user._id, $or: [{ name: { $regex: safe, $options: 'i' } }, { company: { $regex: safe, $options: 'i' } }] }).distinct('_id')
    : [];
  const query = { owner: req.user._id };
  if (search) query.$or = [{ number: { $regex: safe, $options: 'i' } }, { reference: { $regex: safe, $options: 'i' } }, { client: { $in: clientMatches } }];
  if (from || to) query.paymentDate = { ...(from && { $gte: from }), ...(to && { $lte: to }) };
  const receipts = await Receipt.find(query).populate('client').populate('invoice').sort({ paymentDate: -1 }).limit(250);
  return res.json({ receipts });
});

router.post('/', requireCsrf, validate(receiptSchema), async (req, res) => {
  const session = await mongoose.startSession();
  let receipt;
  try {
    await session.withTransaction(async () => {
      const client = await Client.findOne({ publicId: req.body.clientPublicId, owner: req.user._id, archivedAt: null }).session(session);
      if (!client) throw Object.assign(new Error('Please select a valid client.'), { status: 422 });

      let invoice = null;
      let payment = null;
      if (req.body.invoicePublicId) {
        invoice = await Invoice.findOne({ publicId: req.body.invoicePublicId, owner: req.user._id, client: client._id }).session(session);
        if (!invoice) throw Object.assign(new Error('The linked invoice is invalid for this client.'), { status: 422 });
        if (['Draft', 'Cancelled'].includes(invoice.status)) throw Object.assign(new Error('Send the invoice before issuing a linked receipt.'), { status: 409 });
        if (req.body.amount > invoice.total - invoice.amountPaid) throw Object.assign(new Error('Receipt amount cannot be greater than the invoice balance.'), { status: 422 });

        [payment] = await Payment.create([{
          owner: req.user._id,
          invoice: invoice._id,
          amount: req.body.amount,
          paymentDate: req.body.paymentDate,
          method: req.body.method,
          reference: req.body.reference,
          notes: req.body.notes,
        }], { session });
        invoice.amountPaid += req.body.amount;
        invoice.status = invoice.amountPaid >= invoice.total ? 'Paid' : 'Partially Paid';
        await invoice.save({ session });
      }

      [receipt] = await Receipt.create([{
        owner: req.user._id,
        client: client._id,
        invoice: invoice?._id || null,
        payment: payment?._id || null,
        number: await createDocumentNumber(Receipt, 'R', req.body.paymentDate),
        amount: req.body.amount,
        currency: invoice?.currency || req.body.currency,
        paymentDate: req.body.paymentDate,
        method: req.body.method,
        reference: req.body.reference,
        purpose: req.body.purpose,
        notes: req.body.notes,
        remainingBalance: invoice ? Math.max(0, invoice.total - invoice.amountPaid) : null,
      }], { session });
    });
    await receipt.populate(['client', 'invoice']);
    return res.status(201).json({ receipt });
  } finally {
    await session.endSession();
  }
});

router.get('/:publicId', async (req, res) => {
  const receipt = await Receipt.findOne({ publicId: req.params.publicId, owner: req.user._id }).populate('client').populate('invoice');
  if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
  return res.json({ receipt });
});

router.post('/:publicId/cancel', requireCsrf, async (req, res) => {
  const receipt = await Receipt.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
  if (receipt.status === 'Cancelled') return res.status(409).json({ message: 'Receipt is already cancelled.' });
  receipt.status = 'Cancelled';
  receipt.cancelledAt = new Date();
  await receipt.save();
  return res.json({ receipt });
});

router.get('/:publicId/pdf', async (req, res) => {
  const receipt = await Receipt.findOne({ publicId: req.params.publicId, owner: req.user._id }).populate('client').populate('invoice');
  if (!receipt) return res.status(404).json({ message: 'Receipt not found.' });
  const settings = await getDocumentSettings(req.user._id);
  const pdf = await renderDocumentPdf('receipt', receipt.toJSON(), settings);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${receipt.number}.pdf"` });
  return res.send(pdf);
});

export default router;
