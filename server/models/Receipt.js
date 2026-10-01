import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';

const receiptSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    number: { type: String, required: true, unique: true, index: true, immutable: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true, index: true },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', default: null, index: true },
    payment: { type: mongoose.Schema.Types.ObjectId, ref: 'Payment', default: null, unique: true, sparse: true },
    amount: { type: Number, required: true, min: 1 },
    currency: { type: String, enum: ['NGN', 'USD', 'GBP'], required: true, default: 'NGN' },
    paymentDate: { type: Date, required: true },
    method: { type: String, enum: ['Bank Transfer', 'Cash', 'Card', 'Crypto', 'Other'], required: true },
    reference: { type: String, trim: true, maxlength: 200, default: '' },
    purpose: { type: String, trim: true, required: true, maxlength: 1000 },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
    remainingBalance: { type: Number, min: 0, default: null },
    status: { type: String, enum: ['Valid', 'Cancelled'], default: 'Valid' },
    cancelledAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: publicJson },
);

receiptSchema.index({ owner: 1, createdAt: -1 });

export const Receipt = mongoose.model('Receipt', receiptSchema);
