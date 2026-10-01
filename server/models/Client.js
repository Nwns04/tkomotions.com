import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';

const clientSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    company: { type: String, trim: true, maxlength: 160, default: '' },
    email: { type: String, trim: true, lowercase: true, maxlength: 254, default: '' },
    phone: { type: String, trim: true, maxlength: 40, default: '' },
    address: { type: String, trim: true, maxlength: 1000, default: '' },
    notes: { type: String, trim: true, maxlength: 3000, default: '' },
    archivedAt: { type: Date, default: null },
  },
  { timestamps: true, toJSON: publicJson },
);

clientSchema.index({ owner: 1, name: 1 });
clientSchema.index({ owner: 1, email: 1 });

export const Client = mongoose.model('Client', clientSchema);
