import { Router } from 'express';
import { Invoice } from '../models/Invoice.js';
import { Payment } from '../models/Payment.js';
import { Receipt } from '../models/Receipt.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();
router.use(requireAuth);

router.get('/', async (req, res) => {
  const [invoiceTotals, paymentTotals, standaloneReceiptTotals, unpaidCount, recentInvoices, recentReceipts] = await Promise.all([
    Invoice.aggregate([
      { $match: { owner: req.user._id, status: { $ne: 'Cancelled' } } },
      { $group: { _id: '$currency', invoiced: { $sum: '$total' }, outstanding: { $sum: { $subtract: ['$total', '$amountPaid'] } } } },
    ]),
    Payment.aggregate([
      { $match: { owner: req.user._id } },
      { $lookup: { from: 'invoices', localField: 'invoice', foreignField: '_id', as: 'invoiceRecord' } },
      { $unwind: '$invoiceRecord' },
      { $group: { _id: '$invoiceRecord.currency', received: { $sum: '$amount' } } },
    ]),
    Receipt.aggregate([
      { $match: { owner: req.user._id, invoice: null, status: 'Valid' } },
      { $group: { _id: '$currency', received: { $sum: '$amount' } } },
    ]),
    Invoice.countDocuments({ owner: req.user._id, status: { $in: ['Sent', 'Partially Paid'] } }),
    Invoice.find({ owner: req.user._id }).populate('client').sort({ createdAt: -1 }).limit(6),
    Receipt.find({ owner: req.user._id }).populate('client').sort({ createdAt: -1 }).limit(5),
  ]);

  const receivedByCurrency = {};
  [...paymentTotals, ...standaloneReceiptTotals].forEach((item) => {
    receivedByCurrency[item._id] = (receivedByCurrency[item._id] || 0) + item.received;
  });
  const currencies = new Set([...invoiceTotals.map((item) => item._id), ...Object.keys(receivedByCurrency)]);
  const invoiceByCurrency = Object.fromEntries(invoiceTotals.map((item) => [item._id, item]));
  const metrics = [...currencies].sort().map((currency) => ({
    currency,
    invoiced: invoiceByCurrency[currency]?.invoiced || 0,
    received: receivedByCurrency[currency] || 0,
    outstanding: invoiceByCurrency[currency]?.outstanding || 0,
  }));
  return res.json({ metrics, unpaidCount, recentInvoices, recentReceipts });
});

export default router;
