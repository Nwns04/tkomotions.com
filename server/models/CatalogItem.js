import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';

const catalogItemSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 180 },
    category: { type: String, required: true, trim: true, maxlength: 120 },
    packageName: { type: String, trim: true, maxlength: 160, default: '' },
    description: { type: String, trim: true, maxlength: 1200, default: '' },
    currency: { type: String, enum: ['NGN', 'USD', 'GBP'], default: 'NGN' },
    unitPrice: { type: Number, required: true, min: 0, max: 9_000_000_000_00 },
    pricingNotes: { type: String, trim: true, maxlength: 1200, default: '' },
    includedFeatures: { type: [String], default: [] },
    active: { type: Boolean, default: true },
  },
  { timestamps: true, toJSON: publicJson },
);

catalogItemSchema.index({ owner: 1, category: 1, active: 1 });

export const CatalogItem = mongoose.model('CatalogItem', catalogItemSchema);
