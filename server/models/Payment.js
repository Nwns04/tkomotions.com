import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';

const paymentSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: 'Invoice', required: true, index: true },
    amount: { type: Number, required: true, min: 1 },
    paymentDate: { type: Date, required: true },
    method: { type: String, enum: ['Bank Transfer', 'Cash', 'Card', 'Crypto', 'Other'], required: true },
    reference: { type: String, trim: true, maxlength: 200, default: '' },
    notes: { type: String, trim: true, maxlength: 2000, default: '' },
  },
  { timestamps: true, toJSON: publicJson },
);

paymentSchema.index({ owner: 1, invoice: 1, paymentDate: -1 });

export const Payment = mongoose.model('Payment', paymentSchema);
