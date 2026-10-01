import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';
import { calculateInvoice } from '../services/invoiceMath.js';

const quotationItemSchema = new mongoose.Schema(
  {
    description: { type: String, required: true, trim: true, maxlength: 600 },
    quantity: { type: Number, required: true, min: 0.01, max: 1_000_000 },
    unitPrice: { type: Number, required: true, min: 0, max: 9_000_000_000_00 },
    amount: { type: Number, required: true, min: 0 },
    sourceCatalogPublicId: { type: String, default: '', maxlength: 80 },
  },
  { _id: true, versionKey: false },
);

const quotationSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    number: { type: String, required: true, unique: true, index: true, immutable: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', default: null, index: true },
    prospectName: { type: String, trim: true, maxlength: 180, default: '' },
    title: { type: String, required: true, trim: true, maxlength: 220 },
    summary: { type: String, trim: true, maxlength: 4000, default: '' },
    serviceCategory: { type: String, trim: true, maxlength: 160, default: '' },
    detectedPackage: { type: String, trim: true, maxlength: 160, default: '' },
    issueDate: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    currency: { type: String, enum: ['NGN', 'USD', 'GBP'], default: 'NGN' },
    items: { type: [quotationItemSchema], validate: [(items) => items.length > 0, 'At least one line item is required.'] },
    discountType: { type: String, enum: ['fixed', 'percentage'], default: 'fixed' },
    discountValue: { type: Number, min: 0, default: 0 },
    taxEnabled: { type: Boolean, default: false },
    taxRate: { type: Number, min: 0, max: 100, default: 0 },
    subtotal: { type: Number, min: 0, required: true },
    discountAmount: { type: Number, min: 0, required: true },
    taxAmount: { type: Number, min: 0, required: true },
    total: { type: Number, min: 0, required: true },
    includedFeatures: { type: [String], default: [] },
    excludedFeatures: { type: [String], default: [] },
    assumptions: { type: [String], default: [] },
    optionalAdditions: { type: [String], default: [] },
    internalWarnings: { type: [String], default: [] },
    paymentTerms: { type: String, trim: true, maxlength: 4000, default: '' },
    formalCopy: { type: String, trim: true, maxlength: 10000, default: '' },
    whatsAppCopy: { type: String, trim: true, maxlength: 4000, default: '' },
    status: { type: String, enum: ['Draft', 'Approved', 'Converted', 'Cancelled'], default: 'Draft' },
    ai: {
      generated: { type: Boolean, default: false },
      provider: { type: String, enum: ['', 'gemini', 'groq'], default: '' },
      model: { type: String, default: '', maxlength: 200 },
      fallbackUsed: { type: Boolean, default: false },
    },
    approvedAt: { type: Date, default: null },
    convertedAt: { type: Date, default: null },
    convertedInvoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: publicJson },
);

quotationSchema.pre('validate', function calculate(next) {
  this.items.forEach((item) => { item.amount = Math.round(item.quantity * item.unitPrice); });
  Object.assign(this, calculateInvoice(this));
  next();
});

quotationSchema.index({ owner: 1, createdAt: -1 });
quotationSchema.index({ owner: 1, status: 1 });

export const Quotation = mongoose.model('Quotation', quotationSchema);
