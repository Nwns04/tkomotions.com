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
  },
  { timestamps: true, toJSON: publicJson },
);

export const User = mongoose.model('User', userSchema);
