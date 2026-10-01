import { Router } from 'express';
import mongoose from 'mongoose';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Receipt } from '../models/Receipt.js';
import { requireAuth } from '../middleware/auth.js';
import { requireCsrf } from '../middleware/csrf.js';
import { validate } from '../middleware/validate.js';
import { paymentSchema } from '../validation/schemas.js';
import { createDocumentNumber } from '../services/documentNumbers.js';

const router = Router();
router.use(requireAuth);

router.post('/', requireCsrf, validate(paymentSchema), async (req, res) => {
  const session = await mongoose.startSession();
  let payment;
  let invoice;
  let receipt = null;
  try {
    await session.withTransaction(async () => {
      invoice = await Invoice.findOne({ publicId: req.body.invoicePublicId, owner: req.user._id }).session(session);
      if (!invoice) throw Object.assign(new Error('Invoice not found.'), { status: 404 });
      if (['Draft', 'Cancelled'].includes(invoice.status)) throw Object.assign(new Error('Send the invoice before recording a payment.'), { status: 409 });
      const balance = invoice.total - invoice.amountPaid;
      if (req.body.amount > balance) throw Object.assign(new Error('Payment cannot be greater than the remaining balance.'), { status: 422 });

      [payment] = await Payment.create([{
        owner: req.user._id,
        invoice: invoice._id,
        amount: req.body.amount,
        paymentDate: req.body.paymentDate,
        method: req.body.method,
        reference: req.body.reference,
        notes: req.body.notes,
      }], { session });

      invoice.amountPaid += payment.amount;
      invoice.status = invoice.amountPaid >= invoice.total ? 'Paid' : 'Partially Paid';
      await invoice.save({ session });

      if (req.body.generateReceipt) {
        [receipt] = await Receipt.create([{
          owner: req.user._id,
          client: invoice.client,
          invoice: invoice._id,
          payment: payment._id,
          number: await createDocumentNumber(Receipt, 'R', payment.paymentDate),
          amount: payment.amount,
          currency: invoice.currency,
          paymentDate: payment.paymentDate,
          method: payment.method,
          reference: payment.reference,
          purpose: `Payment for ${invoice.number}`,
          notes: payment.notes,
          remainingBalance: Math.max(0, invoice.total - invoice.amountPaid),
        }], { session });
      }
    });
    return res.status(201).json({ payment, invoice, receipt });
  } finally {
    await session.endSession();
  }
});

export default router;
