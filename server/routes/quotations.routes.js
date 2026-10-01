import { Router } from 'express';
import mongoose from 'mongoose';
import { Client } from '../models/Client.js';
import { Quotation } from '../models/Quotation.js';
import { Invoice } from '../models/Invoice.js';
import { BusinessSettings } from '../models/BusinessSettings.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { quotationConversionSchema, quotationSchema } from '../validation/schemas.js';
import { createDocumentNumber } from '../services/documentNumbers.js';
import { renderDocumentPdf } from '../services/pdf.js';
import { businessDateKey } from '../services/invoiceMath.js';
import { bankAccountForCurrency } from '../services/paymentAccounts.js';
import { getDocumentSettings } from '../services/documentSettings.js';
import { env } from '../config/env.js';
import { verifyAiAttestation } from '../services/ai/attestation.js';

const router = Router();
router.use(requireAuth);

function safeRegex(value) { return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }

async function resolveClient(owner, publicId) {
  if (!publicId) return null;
  return Client.findOne({ publicId, owner, archivedAt: null });
}

router.get('/', async (req, res) => {
  const search = String(req.query.search || '').trim().slice(0, 120);
  const status = String(req.query.status || '');
  const query = { owner: req.user._id };
  if (status && ['Draft', 'Approved', 'Converted', 'Cancelled'].includes(status)) query.status = status;
  if (search) {
    const safe = safeRegex(search);
    const clientIds = await Client.find({ owner: req.user._id, $or: [{ name: { $regex: safe, $options: 'i' } }, { company: { $regex: safe, $options: 'i' } }] }).distinct('_id');
    query.$or = [{ number: { $regex: safe, $options: 'i' } }, { title: { $regex: safe, $options: 'i' } }, { prospectName: { $regex: safe, $options: 'i' } }, { client: { $in: clientIds } }];
  }
  const quotations = await Quotation.find(query).populate('client').populate('convertedInvoice').sort({ createdAt: -1 }).limit(250);
  res.json({ quotations });
});

router.post('/', requireCsrf, validate(quotationSchema), async (req, res) => {
  const client = await resolveClient(req.user._id, req.body.clientPublicId);
  if (req.body.clientPublicId && !client) return res.status(422).json({ message: 'Selected client was not found.' });
  const { clientPublicId: _clientPublicId, aiAttestation, ...payload } = req.body;
  const quotation = await Quotation.create({
    ...payload,
    ai: verifyAiAttestation(aiAttestation, req.user._id) || undefined,
    owner: req.user._id,
    client: client?._id || null,
    number: await createDocumentNumber(Quotation, 'Q', payload.issueDate),
  });
  await quotation.populate('client');
  res.status(201).json({ quotation });
});

router.get('/:publicId', async (req, res) => {
  const quotation = await Quotation.findOne({ publicId: req.params.publicId, owner: req.user._id }).populate('client').populate('convertedInvoice');
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
  res.json({ quotation });
});

router.put('/:publicId', requireCsrf, validate(quotationSchema), async (req, res) => {
  const quotation = await Quotation.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
  if (quotation.status !== 'Draft') return res.status(409).json({ message: 'Only draft quotations can be edited.' });
  const client = await resolveClient(req.user._id, req.body.clientPublicId);
  if (req.body.clientPublicId && !client) return res.status(422).json({ message: 'Selected client was not found.' });
  const { clientPublicId: _clientPublicId, aiAttestation, ...payload } = req.body;
  const verifiedAi = verifyAiAttestation(aiAttestation, req.user._id);
  Object.assign(quotation, payload, { client: client?._id || null, ...(verifiedAi ? { ai: verifiedAi } : {}) });
  await quotation.save();
  await quotation.populate('client');
  res.json({ quotation });
});

router.post('/:publicId/approve', requireCsrf, async (req, res) => {
  const quotation = await Quotation.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
  if (quotation.status !== 'Draft') return res.status(409).json({ message: 'Only draft quotations can be approved.' });
  if (quotation.validUntil.toISOString().slice(0, 10) < businessDateKey(new Date(), env.BUSINESS_TIME_ZONE)) {
    return res.status(409).json({ message: 'This quotation has expired. Update its validity date before approval.' });
  }
  quotation.status = 'Approved';
  quotation.approvedAt = new Date();
  await quotation.save();
  res.json({ quotation });
});

router.post('/:publicId/cancel', requireCsrf, async (req, res) => {
  const quotation = await Quotation.findOne({ publicId: req.params.publicId, owner: req.user._id });
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
  if (quotation.status === 'Converted') return res.status(409).json({ message: 'A converted quotation cannot be cancelled.' });
  if (quotation.status === 'Cancelled') return res.status(409).json({ message: 'Quotation is already cancelled.' });
  quotation.status = 'Cancelled';
  quotation.cancelledAt = new Date();
  await quotation.save();
  res.json({ quotation });
});

router.post('/:publicId/convert', requireCsrf, validate(quotationConversionSchema), async (req, res) => {
  const session = await mongoose.startSession();
  let invoice;
  let quotation;
  try {
    await session.withTransaction(async () => {
      quotation = await Quotation.findOne({ publicId: req.params.publicId, owner: req.user._id }).session(session);
      if (!quotation) throw Object.assign(new Error('Quotation not found.'), { status: 404 });
      if (quotation.status !== 'Approved') throw Object.assign(new Error('Approve the quotation before converting it.'), { status: 409 });
      if (quotation.validUntil.toISOString().slice(0, 10) < businessDateKey(new Date(), env.BUSINESS_TIME_ZONE)) {
        throw Object.assign(new Error('This quotation has expired and cannot be converted.'), { status: 409 });
      }
      const client = await Client.findOne({ publicId: req.body.clientPublicId, owner: req.user._id, archivedAt: null }).session(session);
      if (!client) throw Object.assign(new Error('A valid client is required for invoice conversion.'), { status: 422 });
      const settings = await BusinessSettings.findOne({ owner: req.user._id }).session(session);
      [invoice] = await Invoice.create([{
        owner: req.user._id,
        client: client._id,
        number: await createDocumentNumber(Invoice, 'I', req.body.issueDate),
        issueDate: req.body.issueDate,
        dueDate: req.body.dueDate,
        currency: quotation.currency,
        bankAccount: bankAccountForCurrency(settings, quotation.currency),
        items: quotation.items.map((item) => ({ description: item.description, quantity: item.quantity, unitPrice: item.unitPrice })),
        discountType: quotation.discountType,
        discountValue: quotation.discountValue,
        taxEnabled: quotation.taxEnabled,
        taxRate: quotation.taxRate,
        notes: quotation.summary,
        paymentInstructions: settings?.paymentInstructions || '',
        terms: quotation.paymentTerms || settings?.defaultTerms || '',
        status: 'Draft',
      }], { session });
      quotation.status = 'Converted';
      quotation.convertedAt = new Date();
      quotation.convertedInvoice = invoice._id;
      quotation.client = client._id;
      await quotation.save({ session });
    });
    return res.status(201).json({ quotation, invoice });
  } finally {
    await session.endSession();
  }
});

router.get('/:publicId/pdf', async (req, res) => {
  const quotation = await Quotation.findOne({ publicId: req.params.publicId, owner: req.user._id }).populate('client');
  if (!quotation) return res.status(404).json({ message: 'Quotation not found.' });
  const settings = await getDocumentSettings(req.user._id);
  const pdf = await renderDocumentPdf('quotation', quotation.toJSON(), settings);
  res.set({ 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename="${quotation.number}.pdf"` });
  res.send(pdf);
});

export default router;
