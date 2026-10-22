import mongoose from 'mongoose';
import { randomBytes, randomUUID } from 'node:crypto';
import { publicJson } from './modelOptions.js';

const campaignSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, select: false },
  name: { type: String, required: true, trim: true, maxlength: 150 },
  status: { type: String, enum: ['draft', 'active', 'paused'], default: 'draft' },
  timezone: { type: String, default: 'Africa/Lagos' },
  setupStep: { type: Number, min: 1, max: 4, default: 1 },
  setupComplete: { type: Boolean, default: false },
  sendDate: { type: String, default: '', maxlength: 32 },
  spacing: { type: Number, min: 0, max: 1440, default: 5 },
  scheduleFollowups: { type: Boolean, default: true },
}, { timestamps: true, toJSON: publicJson });
campaignSchema.index({ owner: 1, createdAt: -1 });

const leadSchema = new mongoose.Schema({
  publicId: { type: String, default: randomUUID, unique: true, immutable: true },
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, select: false },
  campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'OutreachCampaign', default: null },
  scheduledAt: { type: Date, default: null },
  followup2: { type: String, trim: true, maxlength: 12000, default: '' },
  followup2DelayDays: { type: Number, min: 2, max: 60, default: 10 },
  followup2DueAt: { type: Date, default: null },
  followup2SentAt: { type: Date, default: null },
  followup2MessageId: { type: String, default: '' },
  followup2State: { type: String, default: 'pending' },
  company: { type: String, trim: true, maxlength: 150, default: '' },
  name: { type: String, trim: true, maxlength: 150, default: '' },
  email: { type: String, lowercase: true, trim: true, required: true, maxlength: 254 },
  subject: { type: String, trim: true, maxlength: 250, default: '' },
  message: { type: String, trim: true, maxlength: 12000, default: '' },
  followup: { type: String, trim: true, maxlength: 12000, default: '' },
  permissionBasis: { type: String, trim: true, maxlength: 500, default: '' },
  delayDays: { type: Number, min: 1, max: 30, default: 3 },
  autoFollowup: { type: Boolean, default: false },
  status: { type: String, default: 'draft' },
  stoppedReason: { type: String, default: '' },
  repliedAt: { type: Date, default: null },
  optedOutAt: { type: Date, default: null },
  sentAt: { type: Date, default: null },
  followupDueAt: { type: Date, default: null },
  followupSentAt: { type: Date, default: null },
  initialState: { type: String, default: 'pending' },
  followupState: { type: String, default: 'pending' },
  messageId: { type: String, default: '' },
  followupMessageId: { type: String, default: '' },
  unsubscribeToken: { type: String, default: () => randomBytes(32).toString('hex'), select: false },
}, { timestamps: true, toJSON: { ...publicJson, transform(document, value) {
  publicJson.transform(document, value); delete value.unsubscribeToken; return value;
} } });
leadSchema.index({ owner: 1, campaignId: 1, email: 1 }, { unique: true, partialFilterExpression: { campaignId: { $type: 'objectId' } } });
leadSchema.index({ owner: 1, email: 1 });
leadSchema.index({ scheduledAt: 1, initialState: 1 });
leadSchema.index({ followup2DueAt: 1 });
leadSchema.index({ autoFollowup: 1, followupDueAt: 1 });
leadSchema.index({ messageId: 1 });
leadSchema.index({ followupMessageId: 1 });
leadSchema.index({ followup2MessageId: 1 });
leadSchema.index({ unsubscribeToken: 1 }, { unique: true });

const eventSchema = new mongoose.Schema({
  owner: { type: mongoose.Schema.Types.ObjectId, required: true, select: false },
  leadId: String, campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'OutreachCampaign', default: null }, company: String, type: String, detail: String,
}, { timestamps: true, toJSON: publicJson });
eventSchema.index({ owner: 1, createdAt: -1 });
eventSchema.index({ owner: 1, campaignId: 1, createdAt: -1 });

const suppressionSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true }, reason: String,
}, { timestamps: true });

const leaseSchema = new mongoose.Schema({
  key: { type: String, unique: true, required: true },
  leadId: { type: mongoose.Schema.Types.ObjectId, required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });
leaseSchema.index({ expiresAt: 1 }); // Expiry is checked atomically on acquisition, not by TTL cleanup.
const webhookEventSchema = new mongoose.Schema({
  eventId: { type: String, unique: true, required: true },
  receivedAt: { type: Date, default: Date.now },
});
webhookEventSchema.index({ receivedAt: 1 }, { expireAfterSeconds: 90 * 86400 });
export const OutreachLease = mongoose.models.OutreachLease || mongoose.model('OutreachLease', leaseSchema);
export const OutreachWebhookEvent = mongoose.models.OutreachWebhookEvent || mongoose.model('OutreachWebhookEvent', webhookEventSchema);

export const OutreachCampaign = mongoose.models.OutreachCampaign || mongoose.model('OutreachCampaign', campaignSchema);
export const OutreachLead = mongoose.models.OutreachLead || mongoose.model('OutreachLead', leadSchema);
export const OutreachEvent = mongoose.models.OutreachEvent || mongoose.model('OutreachEvent', eventSchema);
export const OutreachSuppression = mongoose.models.OutreachSuppression || mongoose.model('OutreachSuppression', suppressionSchema);

const rateSchema = new mongoose.Schema({ key: { type: String, unique: true }, nextAt: Date });
export const OutreachRate = mongoose.models.OutreachRate || mongoose.model('OutreachRate', rateSchema);
