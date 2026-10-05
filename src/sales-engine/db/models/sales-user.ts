import mongoose, { Schema, type Model, type Types } from 'mongoose';
import { baseSchemaOptions } from '../model-options';
import { USER_ROLES, type UserRole } from '../../domain';

export type SalesUserDocument = {
  _id: Types.ObjectId;
  businessId: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
};

const salesUserSchema = new Schema<SalesUserDocument>(
  {
    businessId: { type: Schema.Types.ObjectId, ref: 'SalesBusiness', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 160 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 254 },
    // `select: false` keeps the hash out of every query that does not explicitly ask for it.
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: USER_ROLES, default: 'STAFF' },
  },
  baseSchemaOptions,
);

salesUserSchema.index({ email: 1 }, { unique: true });

export const SalesUser: Model<SalesUserDocument> =
  (mongoose.models.SalesUser as Model<SalesUserDocument>) ||
  mongoose.model<SalesUserDocument>('SalesUser', salesUserSchema, 'sales_users');
