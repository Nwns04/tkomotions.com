import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';

export type BusinessDocument = {
  _id: Types.ObjectId;
  slug: string;
  name: string;
  industry: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  logoUrl: string;
  isDemo: boolean;
  notificationEmail: string;
  businessHours: string;
  aiPersona: string;
  leadNotifyThreshold: number;
  createdAt: Date;
  updatedAt: Date;
};

const businessSchema = new Schema<BusinessDocument>(
  {
    // Stable public handle used to resolve the tenant from a request.
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true, maxlength: 80 },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    industry: { type: String, default: '', trim: true, maxlength: 120 },
    description: { type: String, default: '', trim: true, maxlength: 4000 },
    email: { type: String, default: '', trim: true, maxlength: 254 },
    phone: { type: String, default: '', trim: true, maxlength: 60 },
    website: { type: String, default: '', trim: true, maxlength: 254 },
    logoUrl: { type: String, default: '', trim: true, maxlength: 512 },
    // Demo tenants never trigger outbound email to arbitrary addresses.
    isDemo: { type: Boolean, default: false, index: true },
    notificationEmail: { type: String, default: '', trim: true, maxlength: 254 },
    businessHours: { type: String, default: '', trim: true, maxlength: 500 },
    aiPersona: { type: String, default: '', trim: true, maxlength: 2000 },
    // Minimum lead score that triggers a business notification.
    leadNotifyThreshold: { type: Number, default: 50, min: 0, max: 100 },
  },
  baseSchemaOptions,
);

export const Business: Model<BusinessDocument> =
  (mongoose.models.SalesBusiness as Model<BusinessDocument>) ||
  mongoose.model<BusinessDocument>('SalesBusiness', businessSchema, 'sales_businesses');
