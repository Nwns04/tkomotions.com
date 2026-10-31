import mongoose from 'mongoose';
import { randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';

const userSchema = new mongoose.Schema(
  {
    publicId: { type: String, default: () => randomUUID(), unique: true, index: true, immutable: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true, select: false },
    name: { type: String, default: 'TKO Administrator', trim: true, maxlength: 100 },
    active: { type: Boolean, default: true },
    lastLoginAt: Date,
    accountSource: { type: String, enum: ['legacy', 'public'], default: 'legacy', immutable: true, select: false },
  },
  { timestamps: true, toJSON: { ...publicJson, transform(document, value) {
    publicJson.transform(document, value); delete value.accountSource; return value;
  } } },
);

export const User = mongoose.model('User', userSchema);
