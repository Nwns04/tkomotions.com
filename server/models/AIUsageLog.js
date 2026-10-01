import mongoose from 'mongoose';
import { publicJson } from './modelOptions.js';

const aiUsageLogSchema = new mongoose.Schema(
  {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true, select: false },
    provider: { type: String, enum: ['gemini', 'groq'], required: true, index: true },
    model: { type: String, required: true, maxlength: 200 },
    requestType: { type: String, required: true, maxlength: 80 },
    success: { type: Boolean, required: true },
    latencyMs: { type: Number, min: 0, required: true },
    errorCategory: { type: String, maxlength: 80, default: '' },
    fallbackUsed: { type: Boolean, default: false },
    inputTokens: { type: Number, min: 0, default: null },
    outputTokens: { type: Number, min: 0, default: null },
    expiresAt: { type: Date, default: () => new Date(Date.now() + 180 * 24 * 60 * 60 * 1000) },
  },
  { timestamps: true, toJSON: publicJson },
);

aiUsageLogSchema.index({ owner: 1, createdAt: -1 });
aiUsageLogSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const AIUsageLog = mongoose.model('AIUsageLog', aiUsageLogSchema);
