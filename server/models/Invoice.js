import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';
import { calculateInvoice, effectiveStatus } from '../services/invoiceMath.js';

const itemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    quantity: { type: Number, required: true, min: 0.01, max: 1_000_000 },
    unitPrice: { type: Number, required: true, min: 0, max: 9_000_000_000_00 },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: true, versionKey: false },
);

const invoiceSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    number: { type: String, required: true, unique: true, index: true, immutable: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    issueDate: { type: Date, required: true },
    dueDate: { type: Date, required: true },
    currency: { type: String, enum: ['NGN', 'USD', 'GBP'], default: 'NGN' },
    items: { type: [itemSchema], validate: [(items) => items.length > 0, 'At least one line item is required.'] },
    discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    discountValue: { type: Number, min: 0, default: 0 },
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    notes: { type: String, trim: true, maxlength: 5000, default: '' },
    paymentInstructions: { type: String, trim: true, maxlength: 5000, default: '' },
    terms: { type: String, trim: true, maxlength: 5000, default: '' },
    status: { type: String, enum: ['Draft', 'Sent', 'Partially Paid', 'Paid', 'Cancelled'], default: 'Draft' },
    subtotal: { type: Number, min: 0, required: true },
    discountAmount: { type: Number, min: 0, required: true },
    taxAmount: { type: Number, min: 0, required: true },
    total: { type: Number, min: 0, required: true },
    amountPaid: { type: Number, min: 0, default: 0 },
    bankAccount: {
      currency: { type: String, enum: ['NGN', 'USD', 'GBP'], default: 'NGN' },
      bankName: { type: String, trim: true, maxlength: 160, default: '' },
      accountName: { type: String, trim: true, maxlength: 160, default: '' },
      accountNumber: { type: String, trim: true, maxlength: 80, default: '' },
      ibanSwift: { type: String, trim: true, maxlength: 160, default: '' },
    },
    cancelledAt: { type: Date, default: null },
    sentAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: publicJson },
);

invoiceSchema.virtual('balance').get(function balance() {
  return Math.max(0, this.total - this.amountPaid);
});

invoiceSchema.virtual('displayStatus').get(function displayStatus() {
  return effectiveStatus(this);
});

invoiceSchema.pre('validate', function calculate(next) {
  this.items.forEach((item) => { item.amount = Math.round(item.quantity * item.unitPrice); });
  const totals = calculateInvoice(this);
  Object.assign(this, totals);
  next();
});

invoiceSchema.index({ owner: 1, createdAt: -1 });
invoiceSchema.index({ owner: 1, status: 1, dueDate: 1 });

export const Invoice = mongoose.model('Invoice', invoiceSchema);
