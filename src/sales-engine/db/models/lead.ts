import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';
import {
  LEAD_CLASSIFICATIONS,
  LEAD_STATUSES,
  type LeadClassification,
  type LeadStatus,
} from '../../domain';

export type LeadDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  conversationId?: Types.ObjectId | null;
  name: string;
  phone: string;
  email: string;
  source: string;
  status: LeadStatus;
  score: number;
  classification: LeadClassification;
  requirements: string;
  interest: string;
  propertyType: string;
  location: string;
  budget: string;
  timeline: string;
  intent: string;
  inspectionRequested: boolean;
  scoreFlags: Record<string, boolean>;
  isDemo: boolean;
  notifiedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

const leadSchema = new Schema<LeadDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    conversationId: { type: Schema.Types.ObjectId, ref: 'SalesConversation', default: null, index: true },
    name: { type: String, default: '', trim: true, maxlength: 160 },
    phone: { type: String, default: '', trim: true, maxlength: 60 },
    email: { type: String, default: '', trim: true, maxlength: 254 },
    source: { type: String, default: 'Website', trim: true, maxlength: 80 },
    status: { type: String, enum: LEAD_STATUSES, default: 'NEW', index: true },
    score: { type: Number, default: 0, min: 0, max: 100 },
    classification: { type: String, enum: LEAD_CLASSIFICATIONS, default: 'COLD', index: true },
    requirements: { type: String, default: '', trim: true, maxlength: 4000 },
    interest: { type: String, default: '', trim: true, maxlength: 300 },
    propertyType: { type: String, default: '', trim: true, maxlength: 200 },
    location: { type: String, default: '', trim: true, maxlength: 120 },
    budget: { type: String, default: '', trim: true, maxlength: 80 },
    timeline: { type: String, default: '', trim: true, maxlength: 120 },
    intent: { type: String, default: '', trim: true, maxlength: 40 },
    inspectionRequested: { type: Boolean, default: false },
    scoreFlags: { type: Schema.Types.Mixed, default: {} },
    isDemo: { type: Boolean, default: false, index: true },
    // Guards against sending duplicate notifications for the same lead.
    notifiedAt: { type: Date, default: null },
  },
  baseSchemaOptions,
);

// Primary dashboard query: newest leads for one tenant.
leadSchema.index({ businessId: 1, createdAt: -1 });

export const Lead: Model<LeadDocument> =
  (mongoose.models.SalesLead as Model<LeadDocument>) ||
  mongoose.model<LeadDocument>('SalesLead', leadSchema, 'sales_leads');
